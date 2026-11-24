import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { sendSuccess } from '../../utils/response';

const customerService = new CustomerService();

export class CustomerController {
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, customerType } = req.query;
      const data = await customerService.getCustomers({
        search: search as string,
        customerType: customerType as any,
      });
      sendSuccess(res, 200, 'Lấy danh sách khách hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getCustomerById(req.params.id);
      sendSuccess(res, 200, 'Lấy chi tiết khách hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.createCustomer(req.body);
      sendSuccess(res, 201, 'Tạo hồ sơ khách hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.updateCustomer(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật thông tin khách hàng thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
