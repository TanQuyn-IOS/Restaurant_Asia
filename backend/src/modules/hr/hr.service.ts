import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

export class HrService {
  // === NHÂN VIÊN (EMPLOYEES) ===
  async getAllEmployees(status?: any) {
    return prisma.employee.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, username: true, role: true, isActive: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getEmployeeById(id: string) {
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        schedules: {
          orderBy: { shiftDate: 'desc' },
          take: 30,
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!emp) throw new NotFoundError('Không tìm thấy nhân viên');
    return emp;
  }

  async createEmployee(data: any) {
    if (data.salaryRate !== undefined) {
      data.salaryRate = new Decimal(data.salaryRate);
    }
    return prisma.employee.create({
      data,
      include: { user: true },
    });
  }

  async updateEmployee(id: string, data: any) {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundError('Không tìm thấy nhân viên');
    if (data.salaryRate !== undefined) {
      data.salaryRate = new Decimal(data.salaryRate);
    }
    return prisma.employee.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  // === LỊCH LÀM VIỆC & PHÁT HIỆN XUNG ĐỘT CA TRỰC (SCHEDULE & CONFLICT DETECTION) ===
  async getSchedules(startDate?: string, endDate?: string, employeeId?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) where.shiftDate.gte = new Date(startDate);
      if (endDate) where.shiftDate.lte = new Date(endDate);
    }

    return prisma.employeeSchedule.findMany({
      where,
      include: { employee: true },
      orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createSchedule(data: {
    employeeId: string;
    shiftDate: string;
    shiftName: string;
    startTime: string;
    endTime: string;
  }) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const shiftDate = new Date(data.shiftDate);

    if (end <= start) {
      throw new BadRequestError('Thời gian kết thúc ca phải sau thời gian bắt đầu');
    }

    // Kiểm tra xung đột ca làm việc (Shift Conflict Detection)
    const conflict = await prisma.employeeSchedule.findFirst({
      where: {
        employeeId: data.employeeId,
        shiftDate,
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
      include: { employee: true },
    });

    if (conflict) {
      throw new ConflictError(
        `Trùng ca trực! Nhân viên "${conflict.employee.name}" đã có ca "${conflict.shiftName}" vào thời gian này.`
      );
    }

    return prisma.employeeSchedule.create({
      data: {
        employeeId: data.employeeId,
        shiftDate,
        shiftName: data.shiftName,
        startTime: start,
        endTime: end,
      },
      include: { employee: true },
    });
  }

  async checkAttendance(scheduleId: string, type: 'CHECK_IN' | 'CHECK_OUT') {
    const sched = await prisma.employeeSchedule.findUnique({ where: { id: scheduleId } });
    if (!sched) throw new NotFoundError('Không tìm thấy lịch làm việc');

    const now = new Date();
    if (type === 'CHECK_IN') {
      return prisma.employeeSchedule.update({
        where: { id: scheduleId },
        data: {
          isAttended: true,
          checkInAt: now,
        },
      });
    } else {
      return prisma.employeeSchedule.update({
        where: { id: scheduleId },
        data: {
          checkOutAt: now,
        },
      });
    }
  }

  // === ĐƠN NGHỈ PHÉP (LEAVE REQUESTS) ===
  async getLeaveRequests(employeeId?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
        approvedBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    leaveType: any;
    reason: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new BadRequestError('Ngày kết thúc nghỉ phép phải sau ngày bắt đầu');
    }

    return prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        startDate: start,
        endDate: end,
        leaveType: data.leaveType,
        reason: data.reason,
        status: 'UPCOMING',
      },
      include: { employee: true },
    });
  }

  async approveLeaveRequest(id: string, status: any, approverUserId: string) {
    const req = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundError('Không tìm thấy đơn xin nghỉ phép');

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById: approverUserId,
      },
      include: { employee: true, approvedBy: true },
    });
  }
}
