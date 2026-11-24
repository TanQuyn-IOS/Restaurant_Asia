/// <reference types="vite/client" />
/**
 * RESTAURANT ASIA - REALTIME SOCKET.IO CLIENT
 */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(token?: string): Socket {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token: token || localStorage.getItem('restaurant_access_token') },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ [Socket.IO] Đã kết nối thành công tới máy chủ Real-time');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn('⚠️ [Socket.IO] Mất kết nối tới máy chủ:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [Socket.IO] Lỗi kết nối Socket:', error.message);
    });

    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join-room', room);
    }
  }

  public leaveRoom(room: string) {
    if (this.socket) {
      this.socket.emit('leave-room', room);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
