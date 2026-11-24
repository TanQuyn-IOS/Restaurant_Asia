import { Request, Response, NextFunction } from 'express';
import { KitchenService } from './kitchen.service';
import { sendSuccess } from '../../utils/response';

const kitchenService = new KitchenService();

export class KitchenController {
  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenService.getKdsQueue();
      sendSuccess(res, 200, 'Lấy danh sách hàng đợi bếp thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async startCooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await kitchenService.startCooking(req.params.itemId, userId);
      sendSuccess(res, 200, 'Bắt đầu nấu món và trừ kho nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async markReady(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await kitchenService.markReady(req.params.itemId);
      sendSuccess(res, 200, 'Món ăn đã sẵn sàng phục vụ', data);
    } catch (err) {
      next(err);
    }
  }

  async cancelCookedItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { reason } = req.body;
      const data = await kitchenService.cancelCookedItem(req.params.itemId, reason, userId);
      sendSuccess(res, 200, 'Hủy món và ghi nhận tổn thất thành phẩm thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
