import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { sendSuccess } from '../../utils/response';

const reportService = new ReportService();

export class ReportController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getDashboardSummary();
      sendSuccess(res, 200, 'Lấy dữ liệu bảng điều khiển thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const today = new Date().toISOString().split('T')[0];
      const start = (startDate as string) || today;
      const end = (endDate as string) || today;

      const data = await reportService.getProfitAndLoss(start, end);
      sendSuccess(res, 200, 'Lấy báo cáo kết quả kinh doanh P&L thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getStockValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getStockValuation();
      sendSuccess(res, 200, 'Lấy báo cáo định giá tồn kho thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getTopSellingItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, startDate, endDate } = req.query;
      const data = await reportService.getTopSellingItems(
        limit ? parseInt(limit as string, 10) : 10,
        startDate as string,
        endDate as string
      );
      sendSuccess(res, 200, 'Lấy danh sách món bán chạy nhất thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
