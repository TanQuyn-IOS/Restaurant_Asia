import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initSocket } from './realtime/socket';
import { OutboxWorker } from './realtime/outboxWorker';
import { prisma } from './config/prisma';

const app = createApp();
const server = http.createServer(app);

// Khởi tạo Socket.IO Hub
initSocket(server);

// Khởi tạo và khởi chạy Outbox Background Worker
const outboxWorker = new OutboxWorker(1000); // Polling mỗi 1 giây

server.listen(config.port, () => {
  logger.info(`========================================================`);
  logger.info(` RESTAURANT ASIA - BACKEND THREE-TIER API SERVER`);
  logger.info(` Port: http://localhost:${config.port}`);
  logger.info(` Environment: ${config.env}`);
  logger.info(` Health Check: http://localhost:${config.port}/health`);
  logger.info(`========================================================`);

  outboxWorker.start();
});

// Xử lý Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`Nhận tín hiệu ${signal}. Đang tiến hành đóng máy chủ an toàn...`);
  outboxWorker.stop();

  server.close(async () => {
    logger.info('HTTP Server đã đóng.');
    await prisma.$disconnect();
    logger.info('Prisma Database Connection đã ngắt kết nối an toàn.');
    process.exit(0);
  });

  // Timeout ép tắt sau 10 giây nếu kẹt kết nối
  setTimeout(() => {
    logger.error('Quá thời gian chờ shutdown an toàn. Ép buộc dừng ứng dụng.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
