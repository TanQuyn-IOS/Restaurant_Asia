import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export const requireActivatedAccount = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    if (req.user.mustChangePassword || !req.user.isActivated) {
      return next(
        new ForbiddenError(
          'Tài khoản cần hoàn tất kích hoạt và đổi mật khẩu an toàn trước khi sử dụng nghiệp vụ',
          'PASSWORD_CHANGE_REQUIRED'
        )
      );
    }
  }
  next();
};
