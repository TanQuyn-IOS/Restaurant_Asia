import { Request, Response, NextFunction } from 'express';
import { WaiterService } from './waiter.service';
import { sendSuccess } from '../../utils/response';

const waiterService = new WaiterService();

export class WaiterController {
  async markServed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await waiterService.markServed(req.params.itemId, userId);
      sendSuccess(res, 200, 'Xác nhận món ăn đã phục vụ tới bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getServiceRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, tableId } = req.query;
      const data = await waiterService.getServiceRequests(status as any, tableId as string);
      sendSuccess(res, 200, 'Lấy danh sách yêu cầu phục vụ thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await waiterService.createServiceRequest(req.body);
      sendSuccess(res, 201, 'Tạo yêu cầu gọi phục vụ thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await waiterService.updateServiceRequest(req.params.id, req.body, userId);
      sendSuccess(res, 200, 'Cập nhật yêu cầu phục vụ thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
