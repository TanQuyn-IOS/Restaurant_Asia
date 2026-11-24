import { Request, Response, NextFunction } from 'express';
import { CashFlowService } from './cashflow.service';
import { sendSuccess } from '../../utils/response';

const cashFlowService = new CashFlowService();

export class CashFlowController {
  async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, category, startDate, endDate } = req.query;
      const data = await cashFlowService.getRecords({
        type: type as any,
        category: category as any,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, 200, 'Lấy danh sách bản ghi sổ quỹ thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await cashFlowService.getSummary(startDate as string, endDate as string);
      sendSuccess(res, 200, 'Lấy tổng hợp sổ quỹ thu chi thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await cashFlowService.createManualRecord(req.body, userId);
      sendSuccess(res, 201, 'Ghi chép sổ quỹ thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
