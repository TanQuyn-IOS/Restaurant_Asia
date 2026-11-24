import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { sendSuccess } from '../../utils/response';

const inventoryService = new InventoryService();

export class InventoryController {
  async getIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isLowStock, search } = req.query;
      const data = await inventoryService.getAllIngredients({
        category: category as string,
        isLowStock: isLowStock === 'true',
        search: search as string,
      });
      sendSuccess(res, 200, 'Lấy danh sách nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getIngredientById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.getIngredientById(req.params.id);
      sendSuccess(res, 200, 'Lấy chi tiết nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.createIngredient(req.body);
      sendSuccess(res, 201, 'Tạo mới nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.updateIngredient(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.deleteIngredient(req.params.id);
      sendSuccess(res, 200, 'Xóa nguyên liệu thành công');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingredientId, actualStock, notes } = req.body;
      const userId = (req as any).user.id;
      const data = await inventoryService.adjustStock(ingredientId, actualStock, notes, userId);
      sendSuccess(res, 200, 'Cân đối kiểm kê kho thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async recordWaste(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingredientId, quantity, notes } = req.body;
      const userId = (req as any).user.id;
      const data = await inventoryService.recordWaste(ingredientId, quantity, notes, userId);
      sendSuccess(res, 200, 'Ghi nhận xuất hủy/hao hụt thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async reconcileLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.reconcileLedger(req.params.id);
      sendSuccess(res, 200, 'Đối chiếu sổ cái nguyên liệu thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async setUnitConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.setUnitConversion(req.params.id, req.body);
      sendSuccess(res, 200, 'Cấu hình đơn vị quy đổi thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
