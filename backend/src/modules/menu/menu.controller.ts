import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { sendSuccess } from '../../utils/response';

const menuService = new MenuService();

export class MenuController {
  // Categories
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.getAllCategories();
      sendSuccess(res, 200, 'Lấy danh sách danh mục thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.createCategory(req.body);
      sendSuccess(res, 201, 'Tạo danh mục thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.updateCategory(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật danh mục thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await menuService.deleteCategory(req.params.id);
      sendSuccess(res, 200, 'Xóa danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  // Menu Items
  async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, search, isAvailable, includeDeleted } = req.query;
      const data = await menuService.getAllMenuItems({
        categoryId: categoryId as string,
        search: search as string,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
        includeDeleted: includeDeleted === 'true',
      });
      sendSuccess(res, 200, 'Lấy danh sách thực đơn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.getMenuItemById(req.params.id);
      sendSuccess(res, 200, 'Lấy chi tiết món ăn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.createMenuItem(req.body);
      sendSuccess(res, 201, 'Tạo món ăn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.updateMenuItem(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật món ăn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      await menuService.softDeleteMenuItem(req.params.id);
      sendSuccess(res, 200, 'Xóa món ăn thành công (Soft delete)');
    } catch (err) {
      next(err);
    }
  }

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.toggleAvailability(req.params.id);
      sendSuccess(res, 200, 'Thay đổi trạng thái phục vụ thành công', data);
    } catch (err) {
      next(err);
    }
  }

  // BOM
  async setBOMRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await menuService.setBOMRecipes(req.params.id, req.body.recipes);
      sendSuccess(res, 200, 'Cấu hình định mức BOM thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
