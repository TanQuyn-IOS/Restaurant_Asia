import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

export class InventoryService {
  // === NGUYÊN LIỆU (INGREDIENTS) ===
  async getAllIngredients(query: { category?: string; isLowStock?: boolean; search?: string }) {
    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }
    if (query.search) {
      where.name = { contains: query.search };
    }

    const items = await prisma.ingredient.findMany({
      where,
      include: {
        unitConversions: true,
      },
      orderBy: { name: 'asc' },
    });

    if (query.isLowStock) {
      return items.filter((item) => new Decimal(item.currentStock).lte(new Decimal(item.minStockLevel)));
    }

    return items;
  }

  async getIngredientById(id: string) {
    const item = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        unitConversions: true,
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            createdBy: {
              select: { id: true, fullName: true, username: true },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundError('Không tìm thấy nguyên liệu');
    return item;
  }

  async createIngredient(data: any) {
    const existing = await prisma.ingredient.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError(`Nguyên liệu "${data.name}" đã tồn tại`);
    return prisma.ingredient.create({ data });
  }

  async updateIngredient(id: string, data: any) {
    const ing = await prisma.ingredient.findUnique({ where: { id } });
    if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');
    return prisma.ingredient.update({ where: { id }, data });
  }

  async deleteIngredient(id: string) {
    const ing = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        recipes: true,
        receiptItems: true,
      },
    });
    if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');
    if (ing.recipes.length > 0 || ing.receiptItems.length > 0) {
      throw new BadRequestError('Không thể xóa nguyên liệu đã có phát sinh định mức hoặc nhập kho');
    }
    return prisma.ingredient.delete({ where: { id } });
  }

  // === KIỂM KÊ CÂN ĐỐI KHO (STOCK TAKE ADJUSTMENT) ===
  async adjustStock(ingredientId: string, actualStock: number, notes: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');

      const current = new Decimal(ing.currentStock);
      const target = new Decimal(actualStock);
      const delta = target.minus(current);

      if (delta.isZero()) {
        return { message: 'Tồn kho thực tế trùng khớp với sổ sách, không cần điều chỉnh', ingredient: ing };
      }

      const totalCost = delta.times(new Decimal(ing.costPerUnit));
      const idempotencyKey = `ADJ-${ingredientId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      // Ghi nhận bút toán sổ cái kho
      const stockTx = await tx.stockTransaction.create({
        data: {
          ingredientId,
          transactionType: 'STOCK_TAKE_ADJUSTMENT',
          quantity: delta,
          balanceAfter: target,
          costPerUnit: ing.costPerUnit,
          totalCost,
          sourceType: 'MANUAL_ADJUSTMENT',
          sourceId: `STAKE-${Date.now()}`,
          sourceLineId: 'NONE',
          idempotencyKey,
          notes: `[Kiểm kê kho] ${notes}. Chênh lệch: ${delta.toNumber() > 0 ? '+' : ''}${delta.toString()} ${ing.baseUnit}`,
          createdById: userId,
        },
      });

      // Cập nhật số dư dự phóng (Projection cache)
      const updatedIng = await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: target },
      });

      await createOutboxEvent(tx, 'INVENTORY', ingredientId, 'inventory.stock_adjusted', {
        ingredientId,
        delta: delta.toNumber(),
        newStock: target.toNumber(),
        stockTxId: stockTx.id,
      });

      return { ingredient: updatedIng, transaction: stockTx };
    });
  }

  // === GHI NHẬN HỎNG HÓC / HAO HỤT (WASTE & DAMAGE) ===
  async recordWaste(ingredientId: string, quantity: number, notes: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');

      const wasteQty = new Decimal(quantity);
      const current = new Decimal(ing.currentStock);
      const newStock = current.minus(wasteQty);

      if (!ing.allowNegativeStock && newStock.isNegative()) {
        throw new BadRequestError(`Tồn kho không đủ để xuất hủy. Tồn hiện tại: ${current.toString()} ${ing.baseUnit}`);
      }

      const totalCost = wasteQty.times(new Decimal(ing.costPerUnit));
      const idempotencyKey = `WASTE-${ingredientId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      // 1. Ghi nhận StockTransaction trừ kho
      const stockTx = await tx.stockTransaction.create({
        data: {
          ingredientId,
          transactionType: 'WASTE_DAMAGE',
          quantity: wasteQty.negated(),
          balanceAfter: newStock,
          costPerUnit: ing.costPerUnit,
          totalCost: totalCost.negated(),
          sourceType: 'WASTE_DAMAGE',
          sourceId: `WASTE-${Date.now()}`,
          sourceLineId: 'NONE',
          idempotencyKey,
          notes: `[Xuất hủy/hỏng] ${notes}`,
          createdById: userId,
        },
      });

      // 2. Cập nhật số dư kho
      const updatedIng = await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      });

      // 3. Ghi nhận dòng tiền hao hụt / chi phí hỏng (nếu cần quản lý chi phí)
      await createOutboxEvent(tx, 'INVENTORY', ingredientId, 'inventory.waste_recorded', {
        ingredientId,
        quantity: wasteQty.toNumber(),
        totalCost: totalCost.toNumber(),
        newStock: newStock.toNumber(),
      });

      return { ingredient: updatedIng, transaction: stockTx };
    });
  }

  // === ĐỐI CHIẾU SỔ CÁI VỚI BẢNG DỰ PHÓNG (RECONCILIATION) ===
  async reconcileLedger(ingredientId: string) {
    const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');

    // Tính tổng lịch sử giao dịch kho
    const txAgg = await prisma.stockTransaction.aggregate({
      where: { ingredientId },
      _sum: { quantity: true },
    });

    const ledgerTotal = new Decimal(txAgg._sum.quantity || 0);
    const projectionStock = new Decimal(ing.currentStock);
    const discrepancy = projectionStock.minus(ledgerTotal);

    return {
      ingredientId,
      name: ing.name,
      baseUnit: ing.baseUnit,
      projectionStock: projectionStock.toNumber(),
      ledgerTotal: ledgerTotal.toNumber(),
      discrepancy: discrepancy.toNumber(),
      isConsistent: discrepancy.isZero(),
    };
  }

  // === QUY ĐỔI ĐƠN VỊ (UNIT CONVERSION) ===
  async setUnitConversion(ingredientId: string, data: { fromUnit: string; toUnit: string; conversionRate: number }) {
    const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ing) throw new NotFoundError('Không tìm thấy nguyên liệu');

    return prisma.unitConversion.upsert({
      where: {
        ingredientId_fromUnit: {
          ingredientId,
          fromUnit: data.fromUnit,
        },
      },
      create: {
        ingredientId,
        fromUnit: data.fromUnit,
        toUnit: data.toUnit,
        conversionRate: data.conversionRate,
      },
      update: {
        toUnit: data.toUnit,
        conversionRate: data.conversionRate,
      },
    });
  }
}
