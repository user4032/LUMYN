import { API_URL } from './auth';

export interface ChatData {
  id: string;
  name: string;
  avatar?: string;
  type: 'private' | 'group' | 'channel' | 'saved';
  unreadCount: number;
  status?: 'online' | 'offline';
  isPinned?: boolean;
  isMuted?: boolean;
  isHidden?: boolean;
}

export async function getChats(token: string): Promise<ChatData[]> {
  console.log('[getChats] Fetching chats...');
  const response = await fetch(`${API_URL}/auth/chats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log('[getChats] Response status:', response.status, response.ok);
  if (!response.ok) {
    console.error('[getChats] Failed with status:', response.status);
    throw new Error('Failed to fetch chats');
  }

  const data = await response.json();
  console.log('[getChats] Data received:', data);
  const chats = (data.chats || []).map((chat: any, index: number) => {
    const normalizedId =
      chat.id ||
      chat.chatId ||
      (chat.type === 'saved' || chat.name === 'Збережене' ? 'saved_messages' : undefined) ||
      chat._id ||
      `chat_${index}`;
    return {
      ...chat,
      id: normalizedId,
    };
  });
  console.log('[getChats] Returning chats:', chats);
  return chats;
}

export async function saveChats(token: string, chats: ChatData[]): Promise<void> {
  const payloadChats = chats.map((chat) => ({
    ...chat,
    chatId: chat.id,
  }));
  const response = await fetch(`${API_URL}/auth/chats/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chats: payloadChats }),
  });

  if (!response.ok) {
    throw new Error('Failed to save chats');
  }
}
