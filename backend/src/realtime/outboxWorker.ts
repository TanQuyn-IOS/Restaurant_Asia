import { prisma } from '../config/prisma';
import { getIO } from './socket';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class OutboxWorker {
  private workerId: string;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 1000) {
    this.workerId = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
    this.pollIntervalMs = pollIntervalMs;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info({ workerId: this.workerId }, 'Khởi chạy Outbox Background Worker (MySQL 8.0 SKIP LOCKED)');

    this.intervalId = setInterval(() => {
      this.processOutboxBatch().catch((err) => {
        logger.error({ err, workerId: this.workerId }, 'Lỗi vòng lặp Outbox Worker');
      });
    }, this.pollIntervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info({ workerId: this.workerId }, 'Dừng Outbox Worker');
  }

  private async processOutboxBatch() {
    // 1. Reclaim stale locked events (Worker crash recovery: quá 60s mà vẫn PROCESSING)
    await prisma.$executeRawUnsafe(`
      UPDATE outbox_events 
      SET status = 'PENDING', locked_by = NULL, retry_count = retry_count + 1 
      WHERE status = 'PROCESSING' AND locked_at < NOW() - INTERVAL 60 SECOND
    `);

    // 2. Fetch and Lock next batch of PENDING events using MySQL 8.0 SKIP LOCKED
    const now = new Date();
    const batchSize = 50;

    // Lấy ID và chiếm quyền khóa dòng an toàn
    const eventsToProcess: Array<{ id: string }> = await prisma.$queryRawUnsafe(`
      SELECT id FROM outbox_events 
      WHERE status = 'PENDING' AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY aggregate_type ASC, aggregate_id ASC, aggregate_sequence ASC
      LIMIT ${batchSize} 
      FOR UPDATE SKIP LOCKED
    `);

    if (!eventsToProcess || eventsToProcess.length === 0) {
      return;
    }

    const ids = eventsToProcess.map((e) => e.id);

    // Chuyển sang PROCESSING và gắn workerId
    await prisma.outboxEvent.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'PROCESSING',
        lockedBy: this.workerId,
        lockedAt: now,
      },
    });

    // 3. Đọc dữ liệu chi tiết các sự kiện đã khóa
    const events = await prisma.outboxEvent.findMany({
      where: { id: { in: ids } },
      orderBy: [{ aggregateType: 'asc' }, { aggregateId: 'asc' }, { aggregateSequence: 'asc' }],
    });

    let io: any;
    try {
      io = getIO();
    } catch {
      // Socket.IO chưa sẵn sàng, nhả khóa để thử lại
      await prisma.outboxEvent.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PENDING', lockedBy: null },
      });
      return;
    }

    // 4. Phát sự kiện ra các room tương ứng
    for (const evt of events) {
      try {
        const payload = evt.payload;
        const eventType = evt.eventType;

        // Định tuyến room theo loại sự kiện
        if (eventType.startsWith('order.') || eventType.startsWith('kitchen.')) {
          io.to('kitchen').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
          io.to('cashier').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
          io.to('waiter').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
        } else if (eventType.startsWith('table.')) {
          io.to('waiter').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
          io.to('cashier').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
        } else if (eventType.startsWith('payment.')) {
          io.to('cashier').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
          io.to('kitchen').emit(eventType, { id: evt.id, aggregateId: evt.aggregateId, sequence: evt.aggregateSequence, payload });
        }

        // Phát thêm tới room cá nhân của bàn nếu có
        if (evt.aggregateType === 'TABLE' || evt.aggregateType === 'ORDER') {
          io.to(`table:${evt.aggregateId}`).emit(eventType, { id: evt.id, sequence: evt.aggregateSequence, payload });
        }

        // Đánh dấu thành công PUBLISHED
        await prisma.outboxEvent.update({
          where: { id: evt.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            lockedBy: null,
          },
        });
      } catch (err: any) {
        logger.error({ err, eventId: evt.id }, 'Lỗi phát sự kiện Outbox ra Socket.IO');

        const newRetryCount = evt.retryCount + 1;
        if (newRetryCount >= evt.maxRetries) {
          // Vượt quá số lần thử lại tối đa -> Chuyển FAILED (Dead-letter Queue)
          await prisma.outboxEvent.update({
            where: { id: evt.id },
            data: {
              status: 'FAILED',
              retryCount: newRetryCount,
              lastError: err.message || 'Lỗi không xác định khi phát Socket',
              lockedBy: null,
            },
          });
        } else {
          // Tính thời gian chờ Exponential Backoff: delay = min(1000 * 2^retry + jitter, 60000)
          const delayMs = Math.min(1000 * Math.pow(2, newRetryCount) + Math.floor(Math.random() * 500), 60000);
          await prisma.outboxEvent.update({
            where: { id: evt.id },
            data: {
              status: 'PENDING',
              retryCount: newRetryCount,
              scheduledAt: new Date(Date.now() + delayMs),
              lastError: err.message,
              lockedBy: null,
            },
          });
        }
      }
    }
  }
}
