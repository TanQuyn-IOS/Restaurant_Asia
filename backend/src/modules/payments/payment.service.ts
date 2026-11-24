import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

export class PaymentService {
  // === LẤY DANH SÁCH THANH TOÁN ===
  async getPayments(query: { orderId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query.orderId) where.orderId = query.orderId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return prisma.payment.findMany({
      where,
      include: {
        order: {
          select: { id: true, code: true, table: { select: { id: true, name: true } } },
        },
        processedBy: {
          select: { id: true, fullName: true, username: true },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // === TẠO GIAO DỊCH THANH TOÁN HÓA ĐƠN ===
  async createPayment(
    data: {
      orderId: string;
      amount: number;
      paymentMethod: any;
      receivedAmount?: number;
      referenceCode?: string;
      idempotencyKey?: string;
    },
    userId: string
  ) {
    const payIdempotency = data.idempotencyKey || `PAY-${data.orderId}-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Kiểm tra đơn hàng
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { payments: { where: { paymentStatus: 'COMPLETED' } } },
      });
      if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');

      if (order.status === 'COMPLETED' && order.paymentStatus === 'PAID') {
        throw new BadRequestError('Đơn hàng này đã được thanh toán hoàn tất trước đó');
      }

      // Tính tổng đã thanh toán trước đó
      let alreadyPaid = new Decimal(0);
      for (const p of order.payments) {
        alreadyPaid = alreadyPaid.plus(p.amount).minus(p.refundedAmount);
      }

      const payAmount = new Decimal(data.amount);
      const orderTotal = new Decimal(order.finalTotal);
      const remainingNeed = orderTotal.minus(alreadyPaid);

      if (payAmount.gt(remainingNeed) && data.paymentMethod !== 'CASH') {
        throw new BadRequestError(
          `Số tiền thanh toán (${payAmount.toString()}) vượt quá số tiền còn lại (${remainingNeed.toString()})`
        );
      }

      // Xử lý tiền thừa (cho tiền mặt)
      let receivedAmount = data.receivedAmount ? new Decimal(data.receivedAmount) : payAmount;
      if (receivedAmount.lt(payAmount)) {
        throw new BadRequestError('Tiền khách đưa không đủ so với số tiền cần thanh toán');
      }
      const changeAmount = receivedAmount.minus(payAmount);

      const paymentCode = `PAY-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 2. Tạo bản ghi Payment
      const payment = await tx.payment.create({
        data: {
          orderId: data.orderId,
          paymentCode,
          amount: payAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'COMPLETED',
          receivedAmount,
          changeAmount,
          referenceCode: data.referenceCode,
          idempotencyKey: payIdempotency,
          processedById: userId,
          paidAt: new Date(),
        },
      });

      // 3. Tự động ghi nhận Sổ quỹ dòng tiền (CashFlowRecord - INFLOW)
      await tx.cashFlowRecord.create({
        data: {
          type: 'INFLOW',
          category: 'REVENUE_ORDER',
          title: `Thu tiền đơn hàng #${order.code}`,
          amount: payAmount,
          method: data.paymentMethod,
          paymentId: payment.id,
          referenceCode: payment.paymentCode,
          notes: `Thanh toán ${data.paymentMethod} cho đơn #${order.code}`,
          createdById: userId,
        },
      });

      // 4. Cập nhật trạng thái đơn hàng và giải phóng bàn
      const newTotalPaid = alreadyPaid.plus(payAmount);
      const isFullyPaid = newTotalPaid.gte(orderTotal);

      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          status: isFullyPaid ? 'COMPLETED' : 'ACTIVE',
          completedAt: isFullyPaid ? new Date() : null,
          version: { increment: 1 },
        },
      });

      // 5. Nếu đơn hàng thanh toán xong toàn bộ -> Chuyển bàn sang CLEANING
      if (isFullyPaid) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: {
            status: 'CLEANING',
            occupiedSince: null,
            customerType: null,
            version: { increment: 1 },
          },
        });

        // Tích điểm thành viên nếu có thông tin khách hàng
        if (order.customerId) {
          const pointsEarned = Math.floor(payAmount.dividedBy(10000).toNumber());
          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              totalSpent: { increment: payAmount },
              loyaltyPoints: { increment: pointsEarned },
            },
          });
        }
      }

      // 6. Ghi nhận Outbox Event
      await createOutboxEvent(tx, 'PAYMENT', payment.id, 'payment.completed', {
        paymentId: payment.id,
        orderId: data.orderId,
        amount: payAmount.toNumber(),
        isFullyPaid,
        tableId: order.tableId,
      });

      return {
        payment,
        order: updatedOrder,
        changeAmount: changeAmount.toNumber(),
      };
    });
  }

  // === HOÀN TIỀN (REFUND) ===
  async refundPayment(
    data: {
      paymentId: string;
      amount: number;
      reason: string;
      refundMethod: any;
      referenceCode?: string;
      idempotencyKey?: string;
    },
    userId: string
  ) {
    const refundIdempotency = data.idempotencyKey || `REF-${data.paymentId}-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: data.paymentId },
        include: { order: true },
      });
      if (!payment) throw new NotFoundError('Không tìm thấy giao dịch thanh toán');

      const refundAmount = new Decimal(data.amount);
      const remainingRefundable = new Decimal(payment.amount).minus(new Decimal(payment.refundedAmount));

      if (refundAmount.gt(remainingRefundable)) {
        throw new BadRequestError(
          `Số tiền yêu cầu hoàn (${refundAmount.toString()}) vượt quá số tiền có thể hoàn (${remainingRefundable.toString()})`
        );
      }

      const refundCode = `REF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 1. Tạo PaymentRefund
      const refund = await tx.paymentRefund.create({
        data: {
          refundCode,
          paymentId: data.paymentId,
          orderId: payment.orderId,
          amount: refundAmount,
          reason: data.reason,
          refundMethod: data.refundMethod,
          refundStatus: 'COMPLETED',
          processedById: userId,
          referenceCode: data.referenceCode,
          idempotencyKey: refundIdempotency,
          completedAt: new Date(),
        },
      });

      // 2. Ghi nhận Sổ quỹ dòng tiền chi hoàn (OUTFLOW)
      await tx.cashFlowRecord.create({
        data: {
          type: 'OUTFLOW',
          category: 'REFUND',
          title: `Hoàn tiền giao dịch #${payment.paymentCode}`,
          amount: refundAmount,
          method: data.refundMethod,
          refundId: refund.id,
          referenceCode: refundCode,
          notes: `Lý do hoàn: ${data.reason}`,
          createdById: userId,
        },
      });

      // 3. Cập nhật Payment
      const newRefundedTotal = new Decimal(payment.refundedAmount).plus(refundAmount);
      const isTotalRefunded = newRefundedTotal.gte(new Decimal(payment.amount));

      await tx.payment.update({
        where: { id: data.paymentId },
        data: {
          refundedAmount: newRefundedTotal,
          paymentStatus: isTotalRefunded ? 'REFUNDED' : 'COMPLETED',
        },
      });

      // 4. Cập nhật Order paymentStatus
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: isTotalRefunded ? 'REFUNDED' : 'PARTIALLY_PAID',
          version: { increment: 1 },
        },
      });

      // 5. Ghi nhận Outbox Event
      await createOutboxEvent(tx, 'PAYMENT', refund.id, 'payment.refunded', {
        refundId: refund.id,
        paymentId: data.paymentId,
        orderId: payment.orderId,
        amount: refundAmount.toNumber(),
      });

      return refund;
    });
  }

  // === TẠO CHUỖI / LINK VIETQR TĨNH CHO ĐƠN HÀNG ===
  async generateVietQR(orderId: string, bankBin: string, accountNo: string, accountName: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });
    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');

    const amount = new Decimal(order.finalTotal).toNumber();
    const memo = `THANHTOAN ${order.code}`;
    const qrImageUrl = `https://api.vietqr.io/image/${bankBin}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(
      memo
    )}&accountName=${encodeURIComponent(accountName)}`;

    return {
      orderId: order.id,
      orderCode: order.code,
      tableName: order.table.name,
      amount,
      bankBin,
      accountNo,
      accountName,
      memo,
      qrImageUrl,
    };
  }
}
