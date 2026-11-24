import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service';
import { sendSuccess } from '../../utils/response';

const supplierService = new SupplierService();

export class SupplierController {
  // Suppliers
  async getAllSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.getAllSuppliers();
      sendSuccess(res, 200, 'Lấy danh sách nhà cung cấp thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getSupplierById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.getSupplierById(req.params.id);
      sendSuccess(res, 200, 'Lấy thông tin nhà cung cấp thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.createSupplier(req.body);
      sendSuccess(res, 201, 'Tạo nhà cung cấp thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.updateSupplier(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật nhà cung cấp thành công', data);
    } catch (err) {
      next(err);
    }
  }

  // Goods Receipts
  async getGoodsReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId, startDate, endDate } = req.query;
      const data = await supplierService.getGoodsReceipts({
        supplierId: supplierId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, 200, 'Lấy danh sách phiếu nhập kho thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createGoodsReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await supplierService.createGoodsReceipt(req.body, userId);
      sendSuccess(res, 201, 'Nhập kho và tính lại giá WAC thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createSupplierPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await supplierService.createSupplierPayment(req.body, userId);
      sendSuccess(res, 201, 'Thanh toán công nợ NCC thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
