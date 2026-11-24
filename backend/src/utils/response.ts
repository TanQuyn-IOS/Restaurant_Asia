import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export const sendResponse = <T>(res: Response, options: ApiResponseOptions<T>) => {
  const statusCode = options.statusCode || 200;
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message: options.message || 'Thao tác thành công',
    data: options.data !== undefined ? options.data : null,
    meta: options.meta || undefined,
  });
};

export const sendSuccess = <T>(
  res: Response,
  statusCode = 200,
  message = 'Thao tác thành công',
  data?: T,
  meta?: any
) => {
  return sendResponse(res, { statusCode, message, data, meta });
};
