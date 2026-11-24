import { Router } from 'express';
import { HrController } from './hr.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createScheduleSchema,
  attendanceCheckSchema,
  createLeaveRequestSchema,
  approveLeaveSchema,
} from './hr.validator';

const router = Router();
const controller = new HrController();

router.use(authenticate);

// Nhân viên
router.get('/employees', requireRoles('ADMIN', 'HR_MANAGER'), controller.getEmployees);
router.get('/employees/:id', requireRoles('ADMIN', 'HR_MANAGER'), controller.getEmployeeById);
router.post(
  '/employees',
  requireRoles('ADMIN', 'HR_MANAGER'),
  validate(createEmployeeSchema),
  controller.createEmployee
);
router.put(
  '/employees/:id',
  requireRoles('ADMIN', 'HR_MANAGER'),
  validate(updateEmployeeSchema),
  controller.updateEmployee
);

// Lịch trực
router.get('/schedules', controller.getSchedules);
router.post(
  '/schedules',
  requireRoles('ADMIN', 'HR_MANAGER'),
  validate(createScheduleSchema),
  controller.createSchedule
);
router.post(
  '/schedules/:id/attendance',
  validate(attendanceCheckSchema),
  controller.checkAttendance
);

// Nghỉ phép
router.get('/leaves', controller.getLeaveRequests);
router.post('/leaves', validate(createLeaveRequestSchema), controller.createLeaveRequest);
router.put(
  '/leaves/:id/approve',
  requireRoles('ADMIN', 'HR_MANAGER'),
  validate(approveLeaveSchema),
  controller.approveLeaveRequest
);

export default router;
