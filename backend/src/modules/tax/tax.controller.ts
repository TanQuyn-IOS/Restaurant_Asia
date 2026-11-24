import { Request, Response, NextFunction } from 'express';
import { TaxService } from './tax.service';
import { sendSuccess } from '../../utils/response';

const taxService = new TaxService();

export class TaxController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await taxService.getAllTaxConfigs();
      sendSuccess(res, 200, 'Lấy danh sách cấu hình thuế thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.query;
      const data = await taxService.getActiveTaxConfig(categoryId as string);
      sendSuccess(res, 200, 'Lấy cấu hình thuế hiệu lực thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await taxService.createTaxConfig(req.body);
      sendSuccess(res, 201, 'Tạo cấu hình thuế thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await taxService.updateTaxConfig(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật cấu hình thuế thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
