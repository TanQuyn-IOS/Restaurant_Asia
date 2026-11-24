import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/token';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        username: string;
        role: string;
        tokenVersion: number;
        mustChangePassword?: boolean;
        isActivated?: boolean;
      };
    }
  }
}

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Yêu cầu cung cấp Access Token hợp lệ (Bearer token)');
    }

    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access Token đã hết hạn', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Access Token không hợp lệ', 'INVALID_TOKEN');
    }

    // Kiểm tra tokenVersion để thu hồi phiên tức thì nếu vai trò thay đổi hoặc tài khoản bị khóa
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        isActive: true,
        isActivated: true,
        mustChangePassword: true,
        tokenVersion: true,
        role: { select: { name: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Tài khoản không tồn tại hoặc đã bị khóa', 'ACCOUNT_DISABLED');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError('Phiên đăng nhập đã bị hủy do thay đổi bảo mật hoặc quyền hạn', 'TOKEN_OUTDATED');
    }

    req.user = {
      id: user.id,
      userId: user.id,
      username: user.username,
      role: user.role.name,
      tokenVersion: user.tokenVersion,
      mustChangePassword: user.mustChangePassword,
      isActivated: user.isActivated,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authenticate = authenticateJwt;
