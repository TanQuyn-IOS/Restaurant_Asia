import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

export class SupplierService {
  // === QUẢN LÝ NHÀ CUNG CẤP ===
  async getAllSuppliers() {
    return prisma.supplier.findMany({
      include: {
        _count: { select: { goodsReceipts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        goodsReceipts: {
          orderBy: { receivedDate: 'desc' },
          include: { items: { include: { ingredient: true } } },
        },
        supplierPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });
    if (!supplier) throw new NotFoundError('Không tìm thấy nhà cung cấp');
    return supplier;
  }

  async createSupplier(data: any) {
    return prisma.supplier.create({ data });
  }

  async updateSupplier(id: string, data: any) {
    const sup = await prisma.supplier.findUnique({ where: { id } });
    if (!sup) throw new NotFoundError('Không tìm thấy nhà cung cấp');
    return prisma.supplier.update({ where: { id }, data });
  }

  // === NHẬP KHO NGUYÊN LIỆU (GOODS RECEIPT) & TÍNH ĐƠN GIÁ BÌNH QUÂN GIA QUYỀN WAC ===
  async createGoodsReceipt(
    data: {
      supplierId: string;
      items: Array<{ ingredientId: string; quantity: number; unit: string; unitPrice: number }>;
      paymentMethod: any;
      paidAmount: number;
      notes?: string;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      if (!supplier) throw new NotFoundError('Không tìm thấy nhà cung cấp');

      const receiptCode = `GR-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 1. Tính tổng giá trị phiếu nhập
      let totalAmount = new Decimal(0);
      for (const item of data.items) {
        totalAmount = totalAmount.plus(new Decimal(item.quantity).times(new Decimal(item.unitPrice)));
      }

      const paidAmount = new Decimal(data.paidAmount || 0);
      let paymentStatus = 'unpaid';
      if (paidAmount.gte(totalAmount)) {
        paymentStatus = 'paid';
      } else if (paidAmount.gt(0)) {
        paymentStatus = 'partially_paid';
      }

      // 2. Tạo bản ghi GoodsReceipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptCode,
          supplierId: data.supplierId,
          totalAmount,
          paidAmount,
          paymentStatus,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          createdById: userId,
        },
      });

      // 3. Xử lý từng nguyên liệu nhập kho & cập nhật giá WAC
      for (const item of data.items) {
        const ing = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
          include: { unitConversions: true },
        });
        if (!ing) throw new NotFoundError(`Không tìm thấy nguyên liệu #${item.ingredientId}`);

        // Xử lý quy đổi đơn vị (nếu đơn vị nhập khác baseUnit)
        let convertedQty = new Decimal(item.quantity);
        let unitCostInBaseUnit = new Decimal(item.unitPrice);

        if (item.unit !== ing.baseUnit) {
          const conv = ing.unitConversions.find((c) => c.fromUnit === item.unit);
          if (conv) {
            const rate = new Decimal(conv.conversionRate);
            convertedQty = convertedQty.times(rate);
            unitCostInBaseUnit = unitCostInBaseUnit.dividedBy(rate);
          }
        }

        const currentStock = new Decimal(ing.currentStock);
        const currentCost = new Decimal(ing.costPerUnit);
        const incomingStock = convertedQty;
        const incomingPrice = unitCostInBaseUnit;

        const newStock = currentStock.plus(incomingStock);

        // Công thức WAC (Weighted Average Cost):
        // WAC = [(Tồn hiện tại * Giá cũ) + (Nhập mới * Giá mới)] / Tồn mới
        let newWacCost = currentCost;
        if (newStock.gt(0)) {
          const totalValBefore = currentStock.gt(0) ? currentStock.times(currentCost) : new Decimal(0);
          const incomingVal = incomingStock.times(incomingPrice);
          newWacCost = totalValBefore.plus(incomingVal).dividedBy(newStock);
        } else {
          newWacCost = incomingPrice;
        }

        // Tạo dòng GoodsReceiptItem
        const lineItem = await tx.goodsReceiptItem.create({
          data: {
            receiptId: receipt.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: new Decimal(item.quantity).times(new Decimal(item.unitPrice)),
          },
        });

        // Ghi nhận sổ cái kho StockTransaction
        const idempotencyKey = `GR-${receipt.id}-LINE-${lineItem.id}`;
        await tx.stockTransaction.create({
          data: {
            ingredientId: item.ingredientId,
            transactionType: 'GOODS_RECEIPT',
            quantity: incomingStock,
            balanceAfter: newStock,
            costPerUnit: incomingPrice,
            totalCost: incomingStock.times(incomingPrice),
            sourceType: 'GOODS_RECEIPT_ITEM',
            sourceId: receipt.id,
            sourceLineId: lineItem.id,
            idempotencyKey,
            notes: `[Nhập kho] Nhập từ NCC ${supplier.name} theo phiếu #${receipt.receiptCode}`,
            createdById: userId,
          },
        });

        // Cập nhật số dư kho và đơn vị giá vốn mới WAC
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: {
            currentStock: newStock,
            costPerUnit: newWacCost,
          },
        });
      }

      // 4. Nếu có trả tiền ngay khi nhập hàng -> Tạo SupplierPayment và CashFlowRecord OUTFLOW
      if (paidAmount.gt(0)) {
        const payCode = `SPAY-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const supPay = await tx.supplierPayment.create({
          data: {
            paymentCode: payCode,
            receiptId: receipt.id,
            supplierId: data.supplierId,
            amount: paidAmount,
            paymentMethod: data.paymentMethod,
            notes: `Thanh toán nhập kho #${receipt.receiptCode}`,
            processedById: userId,
            idempotencyKey: `SUPPAY-${receipt.id}-${Date.now()}`,
          },
        });

        await tx.cashFlowRecord.create({
          data: {
            type: 'OUTFLOW',
            category: 'GOODS_PURCHASE',
            title: `Chi trả tiền hàng NCC ${supplier.name}`,
            amount: paidAmount,
            method: data.paymentMethod,
            supplierPaymentId: supPay.id,
            referenceCode: payCode,
            notes: `Thanh toán phiếu nhập #${receipt.receiptCode}`,
            createdById: userId,
          },
        });
      }

      await createOutboxEvent(tx, 'INVENTORY', receipt.id, 'inventory.goods_received', {
        receiptId: receipt.id,
        receiptCode: receipt.receiptCode,
        totalAmount: totalAmount.toNumber(),
      });

      return receipt;
    });
  }

  // === THANH TOÁN CÔNG NỢ NHÀ CUNG CẤP (SUPPLIER PAYMENT) ===
  async createSupplierPayment(
    data: {
      receiptId: string;
      amount: number;
      paymentMethod: any;
      referenceCode?: string;
      notes?: string;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id: data.receiptId },
        include: { supplier: true },
      });
      if (!receipt) throw new NotFoundError('Không tìm thấy phiếu nhập');

      const payAmount = new Decimal(data.amount);
      const remainingDebt = new Decimal(receipt.totalAmount).minus(new Decimal(receipt.paidAmount));

      if (payAmount.gt(remainingDebt)) {
        throw new BadRequestError(
          `Số tiền chi trả (${payAmount.toString()}) vượt quá số nợ còn lại (${remainingDebt.toString()})`
        );
      }

      const payCode = `SPAY-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 1. Tạo bản ghi thanh toán
      const supPay = await tx.supplierPayment.create({
        data: {
          paymentCode: payCode,
          receiptId: data.receiptId,
          supplierId: receipt.supplierId,
          amount: payAmount,
          paymentMethod: data.paymentMethod,
          referenceCode: data.referenceCode,
          notes: data.notes,
          processedById: userId,
          idempotencyKey: `SUPPAY-${data.receiptId}-${Date.now()}`,
        },
      });

      // 2. Ghi nhận Sổ quỹ dòng tiền OUTFLOW
      await tx.cashFlowRecord.create({
        data: {
          type: 'OUTFLOW',
          category: 'GOODS_PURCHASE',
          title: `Trả công nợ NCC ${receipt.supplier.name}`,
          amount: payAmount,
          method: data.paymentMethod,
          supplierPaymentId: supPay.id,
          referenceCode: payCode,
          notes: data.notes,
          createdById: userId,
        },
      });

      // 3. Cập nhật số tiền đã trả trên phiếu nhập
      const newPaid = new Decimal(receipt.paidAmount).plus(payAmount);
      const isFull = newPaid.gte(new Decimal(receipt.totalAmount));

      await tx.goodsReceipt.update({
        where: { id: data.receiptId },
        data: {
          paidAmount: newPaid,
          paymentStatus: isFull ? 'paid' : 'partially_paid',
        },
      });

      return supPay;
    });
  }

  // === LẤY DANH SÁCH PHIẾU NHẬP ===
  async getGoodsReceipts(query: { supplierId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.startDate || query.endDate) {
      where.receivedDate = {};
      if (query.startDate) where.receivedDate.gte = new Date(query.startDate);
      if (query.endDate) where.receivedDate.lte = new Date(query.endDate);
    }

    return prisma.goodsReceipt.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
        payments: true,
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { receivedDate: 'desc' },
    });
  }
}
