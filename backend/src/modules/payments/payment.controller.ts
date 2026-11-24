import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess } from '../../utils/response';

const paymentService = new PaymentService();

export class PaymentController {
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, startDate, endDate } = req.query;
      const data = await paymentService.getPayments({
        orderId: orderId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, 200, 'Lấy danh sách thanh toán thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await paymentService.createPayment(req.body, userId);
      sendSuccess(res, 201, 'Thanh toán đơn hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await paymentService.refundPayment(req.body, userId);
      sendSuccess(res, 200, 'Hoàn tiền giao dịch thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async generateVietQR(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, bankBin, accountNo, accountName } = req.body;
      const data = await paymentService.generateVietQR(orderId, bankBin, accountNo, accountName);
      sendSuccess(res, 200, 'Tạo mã VietQR thanh toán thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
