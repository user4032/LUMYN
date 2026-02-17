import { io, Socket } from 'socket.io-client';
import { WS_BASE } from '../config/network';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io(WS_BASE, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      if (this.userId) {
        this.socket?.emit('user:online', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  sendMessage(recipientId: string, senderId: string, message: any) {
    if (!this.socket) return;

    this.socket.emit('message:send', {
      recipientId,
      senderId,
      message,
    });
  }

  sendMessageEdit(recipientId: string, senderId: string, edit: { messageId: string; chatId: string; newContent: string }) {
    if (!this.socket) return;

    this.socket.emit('message:edit', {
      recipientId,
      senderId,
      edit,
    });
  }

  sendReaction(recipientId: string, senderId: string, reaction: { messageId: string; chatId: string; emoji: string; userId: string; action: 'add' | 'remove' }) {
    if (!this.socket) return;

    this.socket.emit('message:reaction', {
      recipientId,
      senderId,
      reaction,
    });
  }

  sendMessageDelete(recipientId: string, senderId: string, payload: { messageId: string; chatId: string }) {
    if (!this.socket) return;

    this.socket.emit('message:delete', {
      recipientId,
      senderId,
      payload,
    });
  }

  updateStatus(userId: string, status: string) {
    if (!this.socket) return;

    this.socket.emit('user:status:update', {
      userId,
      status,
    });
  }

  startTyping(userId: string, chatId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { userId, chatId });
  }

  stopTyping(userId: string, chatId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { userId, chatId });
  }

  onMessageReceive(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('message:receive', callback);
  }

  onMessageEdit(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('message:edit', callback);
  }

  onMessageReaction(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('message:reaction', callback);
  }

  onMessageDelete(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('message:delete', callback);
  }

  onUserStatus(callback: (data: { userId: string; status: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user:status', callback);
  }

  onUserProfileUpdate(callback: (data: { userId: string; username?: string; displayName?: string; avatar?: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user:profile:update', callback);
  }

  onUserTyping(callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) {
    if (!this.socket) return;
    this.socket.on('user:typing', callback);
  }

  onNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('notification:new', callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
