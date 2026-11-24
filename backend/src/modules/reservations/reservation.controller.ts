import { Request, Response, NextFunction } from 'express';
import { ReservationService } from './reservation.service';
import { sendSuccess } from '../../utils/response';

const reservationService = new ReservationService();

export class ReservationController {
  async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, tableId, status } = req.query;
      const data = await reservationService.getReservations({
        date: date as string,
        tableId: tableId as string,
        status: status as any,
      });
      sendSuccess(res, 200, 'Lấy danh sách đặt bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await reservationService.createReservation(req.body, userId);
      sendSuccess(res, 201, 'Đặt bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reservationService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, 200, 'Cập nhật trạng thái đặt bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
