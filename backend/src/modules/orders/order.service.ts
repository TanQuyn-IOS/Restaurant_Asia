import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

export class OrderService {
  // === LẤY DANH SÁCH ĐƠN HÀNG ===
  async getOrders(query: {
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
    tableId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.tableId) where.tableId = query.tableId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          table: true,
          servedBy: true,
          items: {
            include: { menuItem: true },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        servedBy: true,
        items: {
          include: {
            menuItem: {
              include: { recipes: { include: { ingredient: true } } },
            },
          },
        },
        payments: {
          include: { processedBy: true },
        },
        refunds: true,
        splitOrders: true,
      },
    });
    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
    return order;
  }

  async getActiveOrderByTable(tableId: string) {
    return prisma.order.findFirst({
      where: {
        tableId,
        status: 'ACTIVE',
      },
      include: {
        table: true,
        customer: true,
        servedBy: true,
        items: {
          include: { menuItem: true },
        },
        payments: true,
      },
    });
  }

  // === TẠO ĐƠN HÀNG MỚI (MỞ BÀN) ===
  async createOrder(
    data: {
      tableId: string;
      customerName?: string;
      customerPhone?: string;
      customerType?: any;
      customerCount?: number;
      notes?: string;
      items?: Array<{ menuItemId: string; quantity: number; note?: string }>;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Kiểm tra bàn
      const table = await tx.restaurantTable.findUnique({ where: { id: data.tableId } });
      if (!table) throw new NotFoundError('Không tìm thấy bàn ăn');

      // Kiểm tra xem bàn đã có đơn ACTIVE chưa
      const existingOrder = await tx.order.findFirst({
        where: { tableId: data.tableId, status: 'ACTIVE' },
      });
      if (existingOrder) {
        throw new ConflictError(`Bàn "${table.name}" đang có đơn hàng hoạt động #${existingOrder.code}`);
      }

      // 2. Tìm hoặc liên kết khách hàng nếu có số điện thoại
      let customerId: string | null = null;
      if (data.customerPhone) {
        let cust = await tx.customer.findUnique({ where: { phone: data.customerPhone } });
        if (!cust) {
          cust = await tx.customer.create({
            data: {
              phone: data.customerPhone,
              fullName: data.customerName || `Khách hàng ${data.customerPhone}`,
              customerType: data.customerType || 'WALK_IN',
            },
          });
        }
        customerId = cust.id;
      }

      // 3. Tìm nhân viên phục vụ từ userId (nếu có)
      const emp = await tx.employee.findUnique({ where: { userId } });

      // Lấy thuế suất mặc định
      const defaultTax = await tx.taxConfig.findFirst({
        where: { isDefault: true },
      });
      const defaultTaxRate = defaultTax ? defaultTax.rate : new Decimal(8);

      // 4. Tạo mã đơn hàng duy nhất
      const orderCode = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 5. Tạo đơn hàng
      const order = await tx.order.create({
        data: {
          code: orderCode,
          tableId: data.tableId,
          customerId,
          servedById: emp?.id || null,
          customerName: data.customerName || (customerId ? undefined : 'Khách vãng lai'),
          customerPhone: data.customerPhone,
          customerType: data.customerType || 'WALK_IN',
          customerCount: data.customerCount || 2,
          notes: data.notes,
          taxPercent: defaultTaxRate,
        },
      });

      // 6. Cập nhật trạng thái bàn sang OCCUPIED
      await tx.restaurantTable.update({
        where: { id: data.tableId },
        data: {
          status: 'OCCUPIED',
          occupiedSince: new Date(),
          customerType: data.customerType || 'WALK_IN',
          version: { increment: 1 },
        },
      });

      // 7. Thêm các món ăn ban đầu (nếu có)
      if (data.items && data.items.length > 0) {
        await this.addItemsInternal(tx, order.id, data.items, defaultTaxRate);
      }

      // 8. Tính toán lại tổng tiền đơn hàng
      const updatedOrder = await this.recalculateOrderTotals(tx, order.id);

      // 9. Ghi nhận Outbox Event
      await createOutboxEvent(tx, 'ORDER', order.id, 'order.created', updatedOrder);

      return updatedOrder;
    });
  }

  // === THÊM MÓN VÀO ĐƠN HÀNG (SMART MERGE) ===
  async addItemsToOrder(orderId: string, items: Array<{ menuItemId: string; quantity: number; note?: string }>) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'ACTIVE') {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã đóng');
      }

      const defaultTaxRate = new Decimal(order.taxPercent);
      await this.addItemsInternal(tx, orderId, items, defaultTaxRate);
      const updatedOrder = await this.recalculateOrderTotals(tx, orderId);

      await createOutboxEvent(tx, 'ORDER', orderId, 'order.item_added', {
        orderId,
        itemsAdded: items,
      });

      return updatedOrder;
    });
  }

  private async addItemsInternal(
    tx: any,
    orderId: string,
    items: Array<{ menuItemId: string; quantity: number; note?: string }>,
    defaultTaxRate: Decimal
  ) {
    for (const item of items) {
      const menuItem = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem || menuItem.isDeleted) {
        throw new BadRequestError(`Món ăn không tồn tại hoặc đã bị xóa`);
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestError(`Món "${menuItem.name}" hiện đang tạm ngừng phục vụ`);
      }

      // Snapshot thuế suất cho món này
      const taxRate = menuItem.taxRateOverride !== null ? new Decimal(menuItem.taxRateOverride) : defaultTaxRate;
      const price = new Decimal(menuItem.price);
      const taxAmount = price.times(taxRate).dividedBy(100);

      // Smart merge: Kiểm tra xem cùng món, cùng note, trạng thái PENDING đã có trong đơn chưa
      const existingLine = await tx.orderItem.findFirst({
        where: {
          orderId,
          menuItemId: item.menuItemId,
          note: item.note || null,
          status: 'PENDING',
        },
      });

      if (existingLine) {
        await tx.orderItem.update({
          where: { id: existingLine.id },
          data: {
            quantity: existingLine.quantity + item.quantity,
          },
        });
      } else {
        await tx.orderItem.create({
          data: {
            orderId,
            menuItemId: item.menuItemId,
            name: menuItem.name,
            unit: menuItem.unit,
            price: menuItem.price,
            quantity: item.quantity,
            taxRate,
            taxAmount,
            note: item.note || null,
            status: 'PENDING',
          },
        });
      }
    }
  }

  // === HỦY MÓN ĂN TRƯỚC KHI NẤU ===
  async cancelOrderItem(orderItemId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true },
      });
      if (!item) throw new NotFoundError('Không tìm thấy món trong đơn');

      if (item.status !== 'PENDING') {
        throw new BadRequestError(`Không thể hủy món ở trạng thái ${item.status}. Vui lòng hủy qua quy trình KDS Bếp.`);
      }

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          status: 'CANCELLED',
          note: reason ? `[Hủy: ${reason}] ${item.note || ''}` : item.note,
        },
      });

      const updatedOrder = await this.recalculateOrderTotals(tx, item.orderId);

      await createOutboxEvent(tx, 'ORDER', item.orderId, 'order.item_cancelled', {
        orderItemId,
        orderId: item.orderId,
        name: item.name,
        reason,
      });

      return updatedOrder;
    });
  }

  // === ÁP DỤNG GIẢM GIÁ ===
  async applyDiscount(orderId: string, discount: { discountPercent?: number; discountAmount?: number }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'ACTIVE') {
        throw new BadRequestError('Đơn hàng không hợp lệ');
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          discountPercent: discount.discountPercent !== undefined ? discount.discountPercent : undefined,
          discountAmount: discount.discountAmount !== undefined ? discount.discountAmount : undefined,
        },
      });

      const updated = await this.recalculateOrderTotals(tx, orderId);
      await createOutboxEvent(tx, 'ORDER', orderId, 'order.discount_applied', updated);
      return updated;
    });
  }

  // === TÁCH BILL (SPLIT BILL) NGUYÊN TỬ ===
  async splitOrder(
    sourceOrderId: string,
    splits: Array<{ orderItemId: string; quantity: number }>,
    targetTableId?: string,
    userId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const sourceOrder = await tx.order.findUnique({
        where: { id: sourceOrderId },
        include: { items: true },
      });
      if (!sourceOrder || sourceOrder.status !== 'ACTIVE') {
        throw new BadRequestError('Đơn hàng nguồn không hợp lệ hoặc đã hoàn tất');
      }

      const destTableId = targetTableId || sourceOrder.tableId;
      const orderCode = `SPLIT-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 1. Tạo đơn mới tách từ đơn nguồn
      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          tableId: destTableId,
          customerId: sourceOrder.customerId,
          servedById: sourceOrder.servedById,
          customerName: sourceOrder.customerName ? `${sourceOrder.customerName} (Tách)` : 'Khách tách bill',
          customerPhone: sourceOrder.customerPhone,
          customerType: sourceOrder.customerType,
          customerCount: 1,
          parentOrderId: sourceOrder.id,
          taxPercent: sourceOrder.taxPercent,
        },
      });

      // 2. Chuyển hoặc tách từng dòng món
      for (const sp of splits) {
        const item = sourceOrder.items.find((i) => i.id === sp.orderItemId);
        if (!item || item.status === 'CANCELLED') {
          throw new BadRequestError(`Món #${sp.orderItemId} không hợp lệ để tách`);
        }
        if (sp.quantity > item.quantity) {
          throw new BadRequestError(`Số lượng tách (${sp.quantity}) vượt quá số lượng hiện có (${item.quantity})`);
        }

        if (sp.quantity === item.quantity) {
          // Re-parent toàn bộ item sang newOrder
          await tx.orderItem.update({
            where: { id: item.id },
            data: { orderId: newOrder.id },
          });
        } else {
          // Giảm số lượng ở source item, tạo row mới ở newOrder
          await tx.orderItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - sp.quantity },
          });

          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              menuItemId: item.menuItemId,
              name: item.name,
              unit: item.unit,
              price: item.price,
              quantity: sp.quantity,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              note: item.note,
              status: item.status,
              isStockDeducted: item.isStockDeducted,
              stockDeductedAt: item.stockDeductedAt,
            },
          });
        }
      }

      // 3. Tính toán lại tổng tiền của cả 2 đơn
      const updatedSource = await this.recalculateOrderTotals(tx, sourceOrderId);
      const updatedNew = await this.recalculateOrderTotals(tx, newOrder.id);

      await createOutboxEvent(tx, 'ORDER', sourceOrderId, 'order.split', {
        sourceOrderId,
        newOrderId: newOrder.id,
      });

      return { sourceOrder: updatedSource, newOrder: updatedNew };
    });
  }

  // === TÍNH TOÁN LẠI TỔNG TIỀN ĐƠN HÀNG ===
  private async recalculateOrderTotals(tx: any, orderId: string) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });
    if (!order) return null;

    let subtotal = new Decimal(0);
    let totalTax = new Decimal(0);

    for (const item of order.items) {
      const itemPrice = new Decimal(item.price);
      const qty = new Decimal(item.quantity);
      const itemSubtotal = itemPrice.times(qty);
      subtotal = subtotal.plus(itemSubtotal);

      const taxPerUnit = new Decimal(item.taxAmount);
      totalTax = totalTax.plus(taxPerUnit.times(qty));
    }

    // Giảm giá
    let discountAmount = new Decimal(0);
    if (order.discountPercent && !new Decimal(order.discountPercent).isZero()) {
      discountAmount = subtotal.times(new Decimal(order.discountPercent)).dividedBy(100);
    } else if (order.discountAmount) {
      discountAmount = new Decimal(order.discountAmount);
    }

    let finalTotal = subtotal.minus(discountAmount).plus(totalTax);
    if (finalTotal.isNegative()) finalTotal = new Decimal(0);

    return tx.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        discountAmount,
        taxAmount: totalTax,
        finalTotal,
        version: { increment: 1 },
      },
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
        payments: true,
      },
    });
  }
}
