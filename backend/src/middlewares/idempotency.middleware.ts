import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma';

export const idempotencyGuard = (handlerName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!idempotencyKey) {
      return next(); // Không truyền key thì chạy bình thường
    }

    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    try {
      const existingRecord = await prisma.idempotencyRecord.findUnique({
        where: { idempotencyKey },
      });

      if (existingRecord) {
        if (existingRecord.expiresAt < new Date()) {
          // Key đã hết hạn, xóa bản ghi cũ
          await prisma.idempotencyRecord.delete({ where: { idempotencyKey } });
        } else {
          // Trả về kết quả đã cache từ trước
          return res.status(existingRecord.statusCode).json(JSON.parse(existingRecord.responseBody));
        }
      }

      // Intercept res.json để lưu cache kết quả trả về
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          prisma.idempotencyRecord
            .create({
              data: {
                idempotencyKey,
                handler: handlerName,
                requestHash,
                responseBody: JSON.stringify(body),
                statusCode,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Cache 24h
              },
            })
            .then(() => originalJson(body))
            .catch(() => originalJson(body));
          return res;
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};
