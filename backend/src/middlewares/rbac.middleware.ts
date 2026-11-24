import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { RoleName } from '@prisma/client';

export const requireRoles = (...allowedRoles: (RoleName | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Chưa xác thực người dùng'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Vai trò [${req.user.role}] không có quyền truy cập chức năng này`));
    }

    next();
  };
};
