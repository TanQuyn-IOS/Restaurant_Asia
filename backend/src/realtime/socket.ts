import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { config } from '../config';
import { verifyAccessToken } from '../utils/token';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware xác thực JWT cho kết nối Socket nếu có truyền token
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.data.user = payload;
      } catch (err) {
        logger.debug({ socketId: socket.id }, 'Socket connection with invalid/expired token - fallback to guest');
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id, user: socket.data.user?.username || 'Guest' }, 'Client kết nối Socket.IO');

    // Client tham gia room cụ thể (kitchen, cashier, waiter, table:1, ...)
    socket.on('join', (room: string) => {
      // Bảo vệ room nghiệp vụ: kitchen, cashier, waiter yêu cầu tài khoản nhân viên
      if (['kitchen', 'cashier', 'waiter'].includes(room) && !socket.data.user) {
        logger.warn({ socketId: socket.id, room }, 'Từ chối gia nhập room nghiệp vụ do chưa xác thực token');
        return;
      }

      socket.join(room);
      logger.debug({ socketId: socket.id, room }, 'Client gia nhập room');
    });

    socket.on('leave', (room: string) => {
      socket.leave(room);
      logger.debug({ socketId: socket.id, room }, 'Client rời room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client ngắt kết nối Socket.IO');
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo');
  }
  return io;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};
