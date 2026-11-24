import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

export class KitchenService {
  // === LẤY DANH SÁCH MÓN ĐANG CHỜ BẾP (KDS QUEUE) ===
  async getKdsQueue() {
    return prisma.orderItem.findMany({
      where: {
        status: { in: ['PENDING', 'COOKING', 'READY'] },
        order: { status: 'ACTIVE' },
      },
      include: {
        order: {
          select: {
            id: true,
            code: true,
            table: { select: { id: true, name: true } },
            createdAt: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            prepTimeMinutes: true,
            image: true,
            spicyLevel: true,
            recipes: {
              include: {
                ingredient: { select: { id: true, name: true, baseUnit: true, currentStock: true } },
              },
            },
          },
        },
      },
      orderBy: [{ orderedAt: 'asc' }],
    });
  }

  // === BẮT ĐẦU NẤU & TRỪ KHO ĐỊNH MỨC NGUYÊN LIỆU BOM (ATOMIC CHECK-AND-SET) ===
  async startCooking(orderItemId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Thực hiện Atomic Check-and-Set: Chỉ cập nhật nếu trạng thái là PENDING và chưa trừ kho
      const updateResult: number = await tx.$executeRawUnsafe(
        `UPDATE order_items 
         SET status = 'COOKING', is_stock_deducted = true, stock_deducted_at = NOW() 
         WHERE id = ? AND status = 'PENDING' AND is_stock_deducted = false`,
        orderItemId
      );

      if (updateResult === 0) {
        // Kiểm tra xem món đang ở trạng thái nào để báo lỗi chi tiết
        const currentItem = await tx.orderItem.findUnique({ where: { id: orderItemId } });
        if (!currentItem) throw new NotFoundError('Không tìm thấy món ăn trong đơn');
        if (currentItem.status === 'COOKING') {
          throw new ConflictError('Món ăn đã được bếp khác nhận nấu');
        }
        if (currentItem.isStockDeducted) {
          throw new ConflictError('Món ăn đã được trừ kho trước đó');
        }
        throw new BadRequestError(`Không thể nấu món ở trạng thái ${currentItem.status}`);
      }

      // 2. Lấy chi tiết món ăn và định mức nguyên liệu (BOM)
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { id: true, code: true, tableId: true } },
          menuItem: {
            include: {
              recipes: {
                include: { ingredient: true },
              },
            },
          },
        },
      });

      if (!item) throw new NotFoundError('Không tìm thấy thông tin món ăn');

      const stockTransactions: any[] = [];

      // 3. Trừ kho từng nguyên liệu trong công thức BOM
      for (const recipe of item.menuItem.recipes) {
        const requiredPerPortion = new Decimal(recipe.quantityRequired);
        const itemQuantity = new Decimal(item.quantity);
        const totalDeduct = requiredPerPortion.times(itemQuantity);

        const ingredient = await tx.ingredient.findUnique({
          where: { id: recipe.ingredientId },
        });

        if (!ingredient) {
          throw new NotFoundError(`Không tìm thấy nguyên liệu #${recipe.ingredientId}`);
        }

        const currentStock = new Decimal(ingredient.currentStock);
        const newStock = currentStock.minus(totalDeduct);

        if (!ingredient.allowNegativeStock && newStock.isNegative()) {
          throw new BadRequestError(
            `Kho không đủ nguyên liệu "${ingredient.name}" để nấu món "${item.name}". ` +
              `Yêu cầu: ${totalDeduct.toString()} ${ingredient.baseUnit}, còn tồn: ${currentStock.toString()} ${ingredient.baseUnit}`
          );
        }

        // Khóa tất định chống trừ trùng (SHA-256 64 ký tự an toàn vừa vặn VarChar(100))
        const rawKey = `BOM:${item.orderId}:${item.id}:${recipe.ingredientId}`;
        const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');
        const totalCost = totalDeduct.times(new Decimal(ingredient.costPerUnit));

        // Bút toán sổ cái kho
        const stx = await tx.stockTransaction.create({
          data: {
            ingredientId: recipe.ingredientId,
            transactionType: 'ORDER_CONSUMPTION',
            quantity: totalDeduct.negated(),
            balanceAfter: newStock,
            costPerUnit: ingredient.costPerUnit,
            totalCost: totalCost.negated(),
            sourceType: 'ORDER_ITEM',
            sourceId: item.orderId,
            sourceLineId: item.id,
            idempotencyKey,
            notes: `[BOM KDS] Nấu món ${item.name} x${item.quantity} cho đơn #${item.order.code}`,
            createdById: userId,
          },
        });
        stockTransactions.push(stx);

        // Cập nhật số dư kho tức thời
        await tx.ingredient.update({
          where: { id: recipe.ingredientId },
          data: { currentStock: newStock },
        });
      }

      // 4. Phát Outbox Event cho KDS và Waiter
      await createOutboxEvent(tx, 'KITCHEN', orderItemId, 'kitchen.item_cooking', {
        orderItemId,
        orderId: item.orderId,
        tableId: item.order.tableId,
        itemName: item.name,
        quantity: item.quantity,
        status: 'COOKING',
      });

      return {
        orderItem: item,
        stockTransactions,
      };
    });
  }

  // === NẤU XONG (READY) ===
  async markReady(orderItemId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { id: true, code: true, tableId: true } },
        },
      });
      if (!item) throw new NotFoundError('Không tìm thấy món ăn');

      if (item.status !== 'COOKING') {
        throw new BadRequestError(`Chỉ món đang nấu (COOKING) mới có thể chuyển sang READY. Hiện tại: ${item.status}`);
      }

      const updated = await tx.orderItem.update({
        where: { id: orderItemId },
        data: { status: 'READY' },
      });

      await createOutboxEvent(tx, 'KITCHEN', orderItemId, 'kitchen.item_ready', {
        orderItemId,
        orderId: item.orderId,
        tableId: item.order.tableId,
        itemName: item.name,
        quantity: item.quantity,
        status: 'READY',
      });

      return updated;
    });
  }

  // === HỦY MÓN SAU KHI ĐÃ NẤU (POST-COOKING WASTE: GHI NHẬN TỔN THẤT, KHÔNG TRỪ KHO LẦN 2) ===
  async cancelCookedItem(orderItemId: string, reason: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { id: true, code: true } },
          menuItem: true,
        },
      });
      if (!item) throw new NotFoundError('Không tìm thấy món ăn');

      if (item.status === 'CANCELLED' || item.status === 'SERVED') {
        throw new BadRequestError(`Không thể hủy món ở trạng thái ${item.status}`);
      }

      // Cập nhật trạng thái món thành CANCELLED
      const updated = await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          status: 'CANCELLED',
          note: `[Hủy sau nấu: ${reason}] ${item.note || ''}`,
        },
      });

      // Nếu món đã nấu và đã trừ kho (isStockDeducted = true), nguyên liệu đã biến thành thành phẩm hỏng.
      // Tuyệt đối KHÔNG trừ kho lần hai và KHÔNG hoàn nguyên liệu thô về kho!
      // Ghi nhận sự kiện tổn thất thành phẩm vào Outbox
      await createOutboxEvent(tx, 'KITCHEN', orderItemId, 'kitchen.post_cooking_waste', {
        orderItemId,
        orderId: item.orderId,
        itemName: item.name,
        quantity: item.quantity,
        reason,
        costPrice: item.menuItem.costPrice,
        financialLoss: new Decimal(item.menuItem.costPrice).times(item.quantity).toNumber(),
        cancelledBy: userId,
      });

      return updated;
    });
  }
}
