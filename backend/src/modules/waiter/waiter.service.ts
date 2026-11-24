import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';

export class WaiterService {
  // === XÁC NHẬN ĐÃ PHỤC VỤ MÓN RA BÀN (SERVED) ===
  async markServed(orderItemId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { id: true, code: true, tableId: true } },
        },
      });
      if (!item) throw new NotFoundError('Không tìm thấy món ăn');

      if (item.status !== 'READY') {
        throw new BadRequestError(`Chỉ món ở trạng thái READY mới có thể xác nhận phục vụ. Hiện tại: ${item.status}`);
      }

      // Cập nhật trạng thái SERVED
      const updated = await tx.orderItem.update({
        where: { id: orderItemId },
        data: { status: 'SERVED' },
      });

      // Tăng số lượng phục vụ của nhân viên
      const emp = await tx.employee.findUnique({ where: { userId } });
      if (emp) {
        await tx.employee.update({
          where: { id: emp.id },
          data: { ordersHandled: { increment: 1 } },
        });
      }

      await createOutboxEvent(tx, 'WAITER', orderItemId, 'waiter.item_served', {
        orderItemId,
        orderId: item.orderId,
        tableId: item.order.tableId,
        itemName: item.name,
        quantity: item.quantity,
        servedByUserId: userId,
      });

      return updated;
    });
  }

  // === CHUÔNG GỌI PHỤC VỤ (SERVICE CALLS) ===
  async getServiceRequests(status?: any, tableId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;

    return prisma.serviceRequest.findMany({
      where,
      include: {
        table: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createServiceRequest(data: {
    tableId: string;
    type: any;
    title: string;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const table = await tx.restaurantTable.findUnique({ where: { id: data.tableId } });
      if (!table) throw new NotFoundError('Không tìm thấy bàn ăn');

      const request = await tx.serviceRequest.create({
        data,
        include: { table: true },
      });

      await createOutboxEvent(tx, 'WAITER', request.id, 'waiter.service_call_created', request);

      return request;
    });
  }

  async updateServiceRequest(
    id: string,
    data: { status: 'PENDING' | 'ATTENDING' | 'RESOLVED'; assignedToId?: string },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.findUnique({ where: { id } });
      if (!req) throw new NotFoundError('Không tìm thấy yêu cầu phục vụ');

      // Nếu không truyền assignedToId nhưng nhân viên nhận gọi, tự gán nhân viên đó
      let assignedId = data.assignedToId;
      if (!assignedId && data.status === 'ATTENDING') {
        const emp = await tx.employee.findUnique({ where: { userId } });
        if (emp) assignedId = emp.id;
      }

      const updated = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: data.status,
          assignedToId: assignedId || undefined,
          resolvedAt: data.status === 'RESOLVED' ? new Date() : null,
        },
        include: { table: true, assignedTo: true },
      });

      await createOutboxEvent(tx, 'WAITER', id, 'waiter.service_call_updated', updated);

      return updated;
    });
  }
}
