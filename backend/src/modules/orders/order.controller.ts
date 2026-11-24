import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { sendSuccess } from '../../utils/response';

const orderService = new OrderService();

export class OrderController {
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, paymentStatus, tableId, startDate, endDate, page, limit } = req.query;
      const result = await orderService.getOrders({
        status: status as any,
        paymentStatus: paymentStatus as any,
        tableId: tableId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendSuccess(res, 200, 'Lấy danh sách đơn hàng thành công', result.data, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getOrderById(req.params.id);
      sendSuccess(res, 200, 'Lấy chi tiết đơn hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getActiveOrderByTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getActiveOrderByTable(req.params.tableId);
      sendSuccess(res, 200, 'Lấy đơn hàng hiện tại của bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await orderService.createOrder(req.body, userId);
      sendSuccess(res, 201, 'Mở bàn và tạo đơn hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async addItems(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.addItemsToOrder(req.params.id, req.body.items);
      sendSuccess(res, 200, 'Thêm món vào đơn hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async cancelItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const data = await orderService.cancelOrderItem(req.params.itemId, reason);
      sendSuccess(res, 200, 'Hủy món thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async applyDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.applyDiscount(req.params.id, req.body);
      sendSuccess(res, 200, 'Áp dụng giảm giá thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async splitOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const splits = req.body.splits || req.body.itemSplits;
      const { targetTableId } = req.body;
      const userId = (req as any).user.id;
      const data = await orderService.splitOrder(req.params.id, splits, targetTableId, userId);
      sendSuccess(res, 200, 'Tách hóa đơn thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
