import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Lỗi máy chủ nội bộ';
  let errorCode = 'INTERNAL_SERVER_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else if (err.code === 'P2002') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = `Dữ liệu bị trùng lặp trường duy nhất: ${(err.meta?.target as string[])?.join(', ') || 'Unique constraint'}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    errorCode = 'RECORD_NOT_FOUND';
    message = 'Bản ghi không tồn tại trong cơ sở dữ liệu';
  }

  logger.error({
    err: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
    },
    req: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
  }, `[Error] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
