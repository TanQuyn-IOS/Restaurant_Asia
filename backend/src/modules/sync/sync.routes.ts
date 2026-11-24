import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(authenticate);

router.get('/catch-up', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aggregateType, aggregateId, sinceSequence, sinceTime, limit = '100' } = req.query;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (aggregateType) where.aggregateType = aggregateType as string;
    if (aggregateId) where.aggregateId = aggregateId as string;
    if (sinceSequence) {
      where.aggregateSequence = { gt: parseInt(sinceSequence as string, 10) };
    }
    if (sinceTime) {
      where.createdAt = { gt: new Date(sinceTime as string) };
    }

    const events = await prisma.outboxEvent.findMany({
      where,
      take: parseInt(limit as string, 10),
      orderBy: [{ aggregateType: 'asc' }, { aggregateId: 'asc' }, { aggregateSequence: 'asc' }],
    });

    sendSuccess(res, 200, 'Lấy sự kiện bù đắp sau mất kết nối thành công', events);
  } catch (err) {
    next(err);
  }
});

export default router;
