import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io('http://localhost:4777', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      if (this.userId) {
        // Notify server that user is online
        this.socket?.emit('user:online', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
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

    // Send via REST API or emit Socket event
    this.socket.emit('message:send', {
      chatId: message.chatId || recipientId,
      message: {
        id: message.id,
        content: message.content,
        senderId,
        timestamp: new Date().toISOString(),
        ...message,
      },
    });
  }

  sendMessageEdit(recipientId: string, senderId: string, edit: { messageId: string; chatId: string; newContent: string }) {
    if (!this.socket) return;

    this.socket.emit('message:edit', {
      chatId: edit.chatId,
      messageId: edit.messageId,
      newContent: edit.newContent,
    });
  }

  sendReaction(recipientId: string, senderId: string, reaction: { messageId: string; chatId: string; emoji: string; userId: string; action: 'add' | 'remove' }) {
    if (!this.socket) return;

    this.socket.emit('message:reaction', {
      chatId: reaction.chatId,
      messageId: reaction.messageId,
      emoji: reaction.emoji,
      userId: senderId,
      action: reaction.action,
    });
  }

  sendMessageDelete(recipientId: string, senderId: string, payload: { messageId: string; chatId: string }) {
    if (!this.socket) return;

    this.socket.emit('message:delete', {
      chatId: payload.chatId,
      messageId: payload.messageId,
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

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
