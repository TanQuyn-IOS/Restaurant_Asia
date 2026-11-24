import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendResponse } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password, req.ip, req.headers['user-agent']);
      return sendResponse(res, {
        statusCode: 200,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return sendResponse(res, {
        statusCode: 200,
        message: 'Làm mới token thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.activateAccount(token, newPassword, req.ip, req.headers['user-agent']);
      return sendResponse(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.userId, oldPassword, newPassword);
      return sendResponse(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      return sendResponse(res, {
        statusCode: 200,
        message: 'Lấy thông tin người dùng thành công',
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return sendResponse(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
