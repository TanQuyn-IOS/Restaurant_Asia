import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, entityName, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = { contains: action as string };
    if (entityName) where.entityName = entityName as string;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, username: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    sendSuccess(res, 200, 'Lấy nhật ký kiểm toán thành công', logs, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
