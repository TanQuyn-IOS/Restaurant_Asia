import { z } from 'zod';

export const createEmployeeSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1, 'Họ tên không được để trống').max(100),
  phone: z.string().min(1, 'Số điện thoại không được để trống').max(20),
  email: z.string().email().optional().or(z.literal('')),
  roleTitle: z.string().min(1, 'Chức danh không được để trống').max(50),
  shiftDefault: z.string().max(50).optional(),
  salaryRate: z.number().min(0).default(0),
  salaryType: z.enum(['MONTHLY', 'HOURLY']).default('MONTHLY'),
  status: z.enum(['ACTIVE', 'ON_BREAK', 'OFF']).default('ACTIVE'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const createScheduleSchema = z.object({
  employeeId: z.string().uuid(),
  shiftDate: z.string().min(1, 'Ngày trực không được để trống'), // YYYY-MM-DD
  shiftName: z.string().min(1).max(50),
  startTime: z.string().min(1), // ISO or HH:mm
  endTime: z.string().min(1),
});

export const attendanceCheckSchema = z.object({
  type: z.enum(['CHECK_IN', 'CHECK_OUT']),
});

export const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  leaveType: z.enum(['ANNUAL', 'SICK', 'FAMILY', 'COMPENSATORY']).default('ANNUAL'),
  reason: z.string().min(1).max(255),
});

export const approveLeaveSchema = z.object({
  status: z.enum(['ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED']),
});
