import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';

export class TableService {
  // === KHU VỰC (AREAS) ===
  async getAllAreas() {
    return prisma.tableArea.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { tables: true } },
      },
    });
  }

  async createArea(data: { name: string; description?: string; displayOrder?: number }) {
    const existing = await prisma.tableArea.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError(`Khu vực "${data.name}" đã tồn tại`);
    }
    return prisma.tableArea.create({ data });
  }

  async updateArea(id: string, data: { name?: string; description?: string; displayOrder?: number }) {
    const area = await prisma.tableArea.findUnique({ where: { id } });
    if (!area) throw new NotFoundError('Không tìm thấy khu vực');
    return prisma.tableArea.update({ where: { id }, data });
  }

  async deleteArea(id: string) {
    const area = await prisma.tableArea.findUnique({
      where: { id },
      include: { _count: { select: { tables: true } } },
    });
    if (!area) throw new NotFoundError('Không tìm thấy khu vực');
    if (area._count.tables > 0) {
      throw new BadRequestError('Không thể xóa khu vực đang chứa bàn ăn. Vui lòng chuyển hoặc xóa bàn trước.');
    }
    return prisma.tableArea.delete({ where: { id } });
  }

  // === BÀN ĂN (TABLES) ===
  async getAllTables(areaId?: string) {
    return prisma.restaurantTable.findMany({
      where: areaId ? { areaId } : undefined,
      include: {
        area: true,
        orders: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            code: true,
            customerName: true,
            customerPhone: true,
            customerCount: true,
            finalTotal: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                status: true,
              },
            },
          },
        },
        serviceCalls: {
          where: { status: { in: ['PENDING', 'ATTENDING'] } },
        },
      },
      orderBy: [{ area: { displayOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async getTableById(id: string) {
    const table = await prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        area: true,
        orders: {
          where: { status: 'ACTIVE' },
          include: {
            items: true,
          },
        },
        serviceCalls: {
          where: { status: { in: ['PENDING', 'ATTENDING'] } },
        },
      },
    });
    if (!table) throw new NotFoundError('Không tìm thấy bàn ăn');
    return table;
  }

  async createTable(data: any) {
    return prisma.restaurantTable.create({
      data,
      include: { area: true },
    });
  }

  async updateTable(id: string, data: any) {
    const current = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!current) throw new NotFoundError('Không tìm thấy bàn ăn');

    if (data.version !== undefined && data.version !== current.version) {
      throw new ConflictError('Dữ liệu bàn đã bị thay đổi bởi người khác. Vui lòng tải lại trang.');
    }

    const { version, ...updateFields } = data;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.restaurantTable.update({
        where: { id },
        data: {
          ...updateFields,
          version: { increment: 1 },
        },
        include: { area: true },
      });

      await createOutboxEvent(tx, 'TABLE', id, 'table.updated', updated);
      return updated;
    });
  }

  async deleteTable(id: string) {
    const table = await prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        orders: { where: { status: 'ACTIVE' } },
      },
    });
    if (!table) throw new NotFoundError('Không tìm thấy bàn ăn');
    if (table.orders.length > 0) {
      throw new BadRequestError('Không thể xóa bàn đang có đơn hàng hoạt động');
    }

    return prisma.restaurantTable.delete({ where: { id } });
  }

  async updatePositions(positions: Array<{ id: string; posX: number; posY: number; width?: number; height?: number }>) {
    return prisma.$transaction(async (tx) => {
      for (const pos of positions) {
        await tx.restaurantTable.update({
          where: { id: pos.id },
          data: {
            posX: pos.posX,
            posY: pos.posY,
            width: pos.width !== undefined ? pos.width : undefined,
            height: pos.height !== undefined ? pos.height : undefined,
            version: { increment: 1 },
          },
        });
      }
      await createOutboxEvent(tx, 'TABLE', 'FLOOR_PLAN', 'table.layout_updated', { count: positions.length });
      return { success: true, count: positions.length };
    });
  }

  // === CHUYỂN BÀN VỚI KHÓA LẠC QUAN (OCC) ===
  async transferTable(
    sourceTableId: string,
    targetTableId: string,
    orderId: string,
    sourceVersion: number,
    targetVersion: number,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Kiểm tra bàn nguồn
      const source = await tx.restaurantTable.findUnique({ where: { id: sourceTableId } });
      if (!source) throw new NotFoundError('Không tìm thấy bàn nguồn');
      if (source.version !== sourceVersion) {
        throw new ConflictError('Trạng thái bàn nguồn đã thay đổi. Vui lòng tải lại giao diện.');
      }
      if (source.status !== 'OCCUPIED') {
        throw new BadRequestError('Bàn nguồn không ở trạng thái đang phục vụ (OCCUPIED)');
      }

      // 2. Kiểm tra bàn đích
      const target = await tx.restaurantTable.findUnique({ where: { id: targetTableId } });
      if (!target) throw new NotFoundError('Không tìm thấy bàn đích');
      if (target.version !== targetVersion) {
        throw new ConflictError('Trạng thái bàn đích đã thay đổi. Vui lòng tải lại giao diện.');
      }
      if (target.status !== 'AVAILABLE') {
        throw new BadRequestError('Bàn đích không còn trống');
      }

      // 3. Kiểm tra đơn hàng cần chuyển
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.tableId !== sourceTableId || order.status !== 'ACTIVE') {
        throw new BadRequestError('Đơn hàng không hợp lệ hoặc không thuộc bàn nguồn');
      }

      // 4. Cập nhật đơn hàng sang bàn đích
      await tx.order.update({
        where: { id: orderId },
        data: {
          tableId: targetTableId,
          version: { increment: 1 },
        },
      });

      // 5. Cập nhật trạng thái bàn nguồn -> AVAILABLE
      const updatedSource = await tx.restaurantTable.update({
        where: { id: sourceTableId },
        data: {
          status: 'AVAILABLE',
          occupiedSince: null,
          customerType: null,
          version: { increment: 1 },
        },
      });

      // 6. Cập nhật trạng thái bàn đích -> OCCUPIED
      const updatedTarget = await tx.restaurantTable.update({
        where: { id: targetTableId },
        data: {
          status: 'OCCUPIED',
          occupiedSince: source.occupiedSince || new Date(),
          customerType: order.customerType,
          version: { increment: 1 },
        },
      });

      // 7. Ghi nhận Outbox Event
      await createOutboxEvent(tx, 'TABLE', sourceTableId, 'table.transferred', {
        sourceTableId,
        targetTableId,
        orderId,
        performedBy: userId,
      });

      return {
        sourceTable: updatedSource,
        targetTable: updatedTarget,
        orderId,
      };
    });
  }
}
