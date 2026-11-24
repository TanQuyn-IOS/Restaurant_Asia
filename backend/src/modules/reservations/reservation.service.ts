import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';

export class ReservationService {
  async getReservations(query: { date?: string; tableId?: string; status?: any }) {
    const where: any = {};
    if (query.tableId) where.tableId = query.tableId;
    if (query.status) where.status = query.status;
    if (query.date) {
      const d = new Date(query.date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    return prisma.reservation.findMany({
      where,
      include: {
        table: true,
        customer: true,
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createReservation(
    data: {
      tableId: string;
      customerName: string;
      phone: string;
      guestCount: number;
      startTime: string;
      endTime: string;
      customerType?: any;
      notes?: string;
    },
    userId: string
  ) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      throw new BadRequestError('Thời gian kết thúc đặt bàn phải sau thời gian bắt đầu');
    }

    return prisma.$transaction(async (tx) => {
      const table = await tx.restaurantTable.findUnique({ where: { id: data.tableId } });
      if (!table) throw new NotFoundError('Không tìm thấy bàn ăn');

      // Kiểm tra trùng lịch đặt bàn (Overlap Check)
      const conflict = await tx.reservation.findFirst({
        where: {
          tableId: data.tableId,
          status: 'CONFIRMED',
          OR: [
            {
              AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
            },
            {
              AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
            },
            {
              AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
            },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError(
          `Bàn "${table.name}" đã có khách đặt lịch (${conflict.customerName} - ${conflict.phone}) vào khoảng thời gian này!`
        );
      }

      // Tìm hoặc tạo khách hàng nếu có SĐT
      let customer = await tx.customer.findUnique({ where: { phone: data.phone } });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            phone: data.phone,
            fullName: data.customerName,
            customerType: data.customerType || 'REGULAR',
          },
        });
      }

      const reservation = await tx.reservation.create({
        data: {
          tableId: data.tableId,
          customerId: customer.id,
          customerName: data.customerName,
          phone: data.phone,
          guestCount: data.guestCount,
          startTime: start,
          endTime: end,
          customerType: data.customerType || 'REGULAR',
          notes: data.notes,
          createdById: userId,
          status: 'CONFIRMED',
        },
        include: { table: true },
      });

      // Nếu lịch đặt gần hiện tại (trong vòng 30 phút), cập nhật bàn sang RESERVED
      const diffMinutes = (start.getTime() - Date.now()) / (1000 * 60);
      if (diffMinutes >= -30 && diffMinutes <= 60 && table.status === 'AVAILABLE') {
        await tx.restaurantTable.update({
          where: { id: data.tableId },
          data: { status: 'RESERVED', version: { increment: 1 } },
        });
      }

      await createOutboxEvent(tx, 'TABLE', data.tableId, 'reservation.created', reservation);

      return reservation;
    });
  }

  async updateStatus(id: string, status: 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW') {
    return prisma.$transaction(async (tx) => {
      const res = await tx.reservation.findUnique({
        where: { id },
        include: { table: true },
      });
      if (!res) throw new NotFoundError('Không tìm thấy thông tin đặt bàn');

      const updated = await tx.reservation.update({
        where: { id },
        data: { status },
      });

      if (status === 'SEATED') {
        await tx.restaurantTable.update({
          where: { id: res.tableId },
          data: {
            status: 'OCCUPIED',
            occupiedSince: new Date(),
            customerType: res.customerType,
            version: { increment: 1 },
          },
        });
      } else if (status === 'CANCELLED' || status === 'NO_SHOW') {
        if (res.table.status === 'RESERVED') {
          await tx.restaurantTable.update({
            where: { id: res.tableId },
            data: { status: 'AVAILABLE', version: { increment: 1 } },
          });
        }
      }

      await createOutboxEvent(tx, 'TABLE', res.tableId, 'reservation.status_updated', updated);

      return updated;
    });
  }
}
