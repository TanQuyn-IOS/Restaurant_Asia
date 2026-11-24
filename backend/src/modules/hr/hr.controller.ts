import { Request, Response, NextFunction } from 'express';
import { HrService } from './hr.service';
import { sendSuccess } from '../../utils/response';

const hrService = new HrService();

export class HrController {
  // Employees
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getAllEmployees(req.query.status as any);
      sendSuccess(res, 200, 'Lấy danh sách nhân viên thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getEmployeeById(req.params.id);
      sendSuccess(res, 200, 'Lấy thông tin nhân viên thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.createEmployee(req.body);
      sendSuccess(res, 201, 'Tạo hồ sơ nhân viên thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.updateEmployee(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật hồ sơ nhân viên thành công', data);
    } catch (err) {
      next(err);
    }
  }

  // Schedules
  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, employeeId } = req.query;
      const data = await hrService.getSchedules(startDate as string, endDate as string, employeeId as string);
      sendSuccess(res, 200, 'Lấy lịch làm việc thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.createSchedule(req.body);
      sendSuccess(res, 201, 'Xếp lịch làm việc thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async checkAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.body;
      const data = await hrService.checkAttendance(req.params.id, type);
      sendSuccess(res, 200, `${type === 'CHECK_IN' ? 'Điểm danh vào ca' : 'Điểm danh tan ca'} thành công`, data);
    } catch (err) {
      next(err);
    }
  }

  // Leaves
  async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getLeaveRequests(req.query.employeeId as string);
      sendSuccess(res, 200, 'Lấy danh sách đơn nghỉ phép thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.createLeaveRequest(req.body);
      sendSuccess(res, 201, 'Tạo đơn xin nghỉ phép thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async approveLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await hrService.approveLeaveRequest(req.params.id, req.body.status, userId);
      sendSuccess(res, 200, 'Xét duyệt đơn nghỉ phép thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
