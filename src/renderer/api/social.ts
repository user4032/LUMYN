const API_BASE = 'http://localhost:4777';

export interface FriendUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

export interface FriendRequest {
  id: string;
  user: FriendUser;
  createdAt: number;
}

export interface FriendsResponse {
  ok: boolean;
  friends: FriendUser[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface ServerResponse {
  ok: boolean;
  server?: any;
  servers?: any[];
  error?: string;
}

const handleJson = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

const normalizeServer = (server: any) => {
  if (!server) return server;
  const normalized = {
    ...server,
    id: server.id || server.serverId,
    inviteCode: server.inviteCode || '',
    channels: Array.isArray(server.channels)
      ? server.channels.map((ch: any) => ({
          ...ch,
          id: ch.id || ch.channelId,
          serverId: ch.serverId || server.id || server.serverId,
          category: ch.category || null,
        }))
      : [],
  };
  return normalized;
};

export const getFriends = async (token: string) => {
  const response = await fetch(`${API_BASE}/friends/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<FriendsResponse>;
};

export const sendFriendRequest = async (token: string, username: string) => {
  const response = await fetch(`${API_BASE}/friends/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username }),
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const respondFriendRequest = async (token: string, requestId: string, accept: boolean) => {
  const response = await fetch(`${API_BASE}/friends/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ requestId, accept }),
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const getMyServers = async (token: string) => {
  const response = await fetch(`${API_BASE}/servers/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await handleJson(response)) as ServerResponse;
  return {
    ...data,
    servers: data.servers ? data.servers.map(normalizeServer) : data.servers,
  };
};

export const createServer = async (token: string, name: string, channels: any[], banner?: string) => {
  const response = await fetch(`${API_BASE}/servers/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, channels, banner }),
  });
  const data = (await handleJson(response)) as ServerResponse;
  return {
    ...data,
    server: data.server ? normalizeServer(data.server) : data.server,
  };
};

export const joinServer = async (token: string, code: string) => {
  const response = await fetch(`${API_BASE}/servers/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  const data = (await handleJson(response)) as ServerResponse;
  return {
    ...data,
    server: data.server ? normalizeServer(data.server) : data.server,
  };
};

export const updateServer = async (token: string, serverId: string, data: { name?: string; description?: string; icon?: string; banner?: string }) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const res = (await handleJson(response)) as ServerResponse;
  return {
    ...res,
    server: res.server ? normalizeServer(res.server) : res.server,
  };
};

export const deleteServer = async (token: string, serverId: string) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) {
    return { ok: true, missing: true } as { ok: boolean; missing: boolean };
  }
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const leaveServer = async (token: string, serverId: string) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const createChannel = async (token: string, serverId: string, data: { name: string; type: 'text' | 'voice'; category?: string }) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return handleJson(response) as Promise<{ ok: boolean; channel: any }>;
};

export const updateChannel = async (token: string, serverId: string, channelId: string, data: { name?: string; category?: string }) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/channels/${channelId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return handleJson(response) as Promise<{ ok: boolean; channel: any }>;
};

export const deleteChannel = async (token: string, serverId: string, channelId: string) => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/channels/${channelId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const addMessageReaction = async (token: string, messageId: string, emoji: string) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ emoji }),
  });
  return handleJson(response) as Promise<{ ok: boolean; reactions: any[] }>;
};

export const getPinnedMessages = async (token: string, chatId: string) => {
  const response = await fetch(`${API_BASE}/messages/pinned/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; messages: any[] }>;
};

export const pinMessage = async (token: string, messageId: string) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/pin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; message: any }>;
};

export const unpinMessage = async (token: string, messageId: string) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/pin`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; message: any }>;
};

export const searchMessages = async (token: string, query: string, chatId?: string, limit?: number, skip?: number) => {
  const params = new URLSearchParams();
  params.append('query', query);
  if (chatId) params.append('chatId', chatId);
  if (limit) params.append('limit', String(limit));
  if (skip) params.append('skip', String(skip));
  
  const response = await fetch(`${API_BASE}/messages/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; messages: any[]; total: number; hasMore: boolean }>;
};

// ===== NOTIFICATION API =====

export interface Notification {
  id: string;
  type: 'message' | 'mention' | 'friend_request' | 'server_invite' | 'reaction' | 'system';
  title: string;
  content: string;
  data: Record<string, any>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  ok: boolean;
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const getNotifications = async (token: string, limit: number = 50, skip: number = 0) => {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('skip', String(skip));
  
  const response = await fetch(`${API_BASE}/notifications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<NotificationsResponse>;
};

export const createNotification = async (token: string, type: string, title: string, content: string, data?: Record<string, any>) => {
  const response = await fetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, title, content, data }),
  });
  return handleJson(response) as Promise<{ ok: boolean; notification: Notification }>;
};

export const markNotificationAsRead = async (token: string, notificationId: string) => {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; notification: Notification }>;
};

export const markAllNotificationsAsRead = async (token: string) => {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; updatedCount: number }>;
};

export const deleteNotification = async (token: string, notificationId: string) => {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const deleteAllNotifications = async (token: string) => {
  const response = await fetch(`${API_BASE}/notifications`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

// ===== USER BLOCKING =====

export const blockUser = async (token: string, userId: string, reason?: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  return handleJson(response) as Promise<{ ok: boolean; block: any }>;
};

export const unblockUser = async (token: string, userId: string) => {
  const response = await fetch(`${API_BASE}/users/${userId}/block`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean }>;
};

export const getBlockedUsers = async (token: string) => {
  const response = await fetch(`${API_BASE}/users/blocked`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; blocked: any[] }>;
};

// ===== CHAT SETTINGS =====

export interface ChatSettings {
  chatId: string;
  userId: string;
  isMuted: boolean;
  mutedUntil?: Date;
  isFavorite: boolean;
  isArchived: boolean;
  notificationLevel: 'all' | 'mentions' | 'none';
  customColor?: string;
  customEmoji?: string;
}

export const getChatSettings = async (token: string, chatId: string) => {
  const response = await fetch(`${API_BASE}/chats/${chatId}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; settings: ChatSettings }>;
};

export const updateChatSettings = async (token: string, chatId: string, settings: Partial<ChatSettings>) => {
  const response = await fetch(`${API_BASE}/chats/${chatId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  return handleJson(response) as Promise<{ ok: boolean; settings: ChatSettings }>;
};

export const getFavoriteChats = async (token: string) => {
  const response = await fetch(`${API_BASE}/chats/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; favorites: string[] }>;
};

// ===== READ RECEIPTS =====

export const markMessageAsRead = async (token: string, messageId: string) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; message: any }>;
};

export const markChatAsRead = async (token: string, chatId: string) => {
  const response = await fetch(`${API_BASE}/chats/${chatId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response) as Promise<{ ok: boolean; count: number }>;
};

// ===== MESSAGE FORWARDING =====

export const forwardMessage = async (token: string, messageId: string, targetChatId: string) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ targetChatId }),
  });
  return handleJson(response) as Promise<{ ok: boolean; message: any }>;
};

// ===== MESSAGE EXPIRATION =====

export const setMessageExpiration = async (token: string, messageId: string, expiresIn: number) => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/expire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ expiresIn }),
  });
  return handleJson(response) as Promise<{ ok: boolean; message: any }>;
};
