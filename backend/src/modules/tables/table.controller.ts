import { Request, Response, NextFunction } from 'express';
import { TableService } from './table.service';
import { sendSuccess } from '../../utils/response';

const tableService = new TableService();

export class TableController {
  // Areas
  async getAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.getAllAreas();
      sendSuccess(res, 200, 'Lấy danh sách khu vực thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.createArea(req.body);
      sendSuccess(res, 201, 'Tạo khu vực thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateArea(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.updateArea(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật khu vực thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteArea(req: Request, res: Response, next: NextFunction) {
    try {
      await tableService.deleteArea(req.params.id);
      sendSuccess(res, 200, 'Xóa khu vực thành công');
    } catch (err) {
      next(err);
    }
  }

  // Tables
  async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = req.query.areaId as string;
      const data = await tableService.getAllTables(areaId);
      sendSuccess(res, 200, 'Lấy danh sách bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async getTableById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.getTableById(req.params.id);
      sendSuccess(res, 200, 'Lấy thông tin bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async createTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.createTable(req.body);
      sendSuccess(res, 201, 'Tạo bàn ăn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async updateTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.updateTable(req.params.id, req.body);
      sendSuccess(res, 200, 'Cập nhật bàn ăn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteTable(req: Request, res: Response, next: NextFunction) {
    try {
      await tableService.deleteTable(req.params.id);
      sendSuccess(res, 200, 'Xóa bàn ăn thành công');
    } catch (err) {
      next(err);
    }
  }

  async updatePositions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tableService.updatePositions(req.body.positions);
      sendSuccess(res, 200, 'Cập nhật sơ đồ bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }

  async transferTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceTableId, targetTableId, orderId, sourceVersion, targetVersion } = req.body;
      const userId = (req as any).user.id;
      const data = await tableService.transferTable(
        sourceTableId,
        targetTableId,
        orderId,
        sourceVersion,
        targetVersion,
        userId
      );
      sendSuccess(res, 200, 'Chuyển bàn thành công', data);
    } catch (err) {
      next(err);
    }
  }
}
