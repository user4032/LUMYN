import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './userSlice';

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
  edited?: boolean;
  attachments?: string[];
  replyTo?: string;
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  type: 'private' | 'group' | 'channel' | 'saved';
  lastMessage?: Message;
  unreadCount: number;
  status?: 'online' | 'offline';
  isPinned?: boolean;
  isMuted?: boolean;
  isHidden?: boolean;
}

interface ChatsState {
  chats: Chat[];
  hiddenChats: string[];
  messages: Record<string, Message[]>;
  loading: boolean;
}

// Завантаження повідомлень з localStorage
const loadMessagesFromStorage = (): Record<string, Message[]> => {
  try {
    const saved = localStorage.getItem('disgram_messages');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Завантаження чатів з localStorage
const loadChatsFromStorage = (): Chat[] => {
  try {
    const saved = localStorage.getItem('disgram_chats');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialMessages = loadMessagesFromStorage();
const initialChats = loadChatsFromStorage();

// Ensure Saved Messages chat exists
const ensureSavedMessagesChat = (chats: Chat[], currentUser?: { id: string; username: string; avatar?: string }): Chat[] => {
  const savedMessagesId = 'saved_messages';
  const hasSavedMessages = chats.some(chat => chat.id === savedMessagesId);
  
  if (!hasSavedMessages) {
    const savedMessagesChat: Chat = {
      id: savedMessagesId,
      name: 'Збережене', // Will be translated in UI
      avatar: undefined,
      type: 'saved',
      unreadCount: 0,
      isPinned: true,
    };
    return [savedMessagesChat, ...chats];
  }
  
  return chats;
};

const initialState: ChatsState = {
  chats: ensureSavedMessagesChat(initialChats),
  hiddenChats: [],
  messages: Object.keys(initialMessages).length > 0 ? initialMessages : {},
  loading: false,
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const { chatId } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      
      // Перевіряємо чи повідомлення вже існує
      const existingMessage = state.messages[chatId].find(m => m.id === action.payload.id);
      if (existingMessage) {
        // Оновлюємо існуюче повідомлення замість додавання дублікату
        Object.assign(existingMessage, action.payload);
      } else {
        state.messages[chatId].push(action.payload);
      }
      
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.lastMessage = action.payload;
        chat.unreadCount = 0; // Скидаємо лічильник при відправці
        // Оновлюємо аватар чату якщо це приватний чат і повідомлення має аватар
        if (chat.type === 'private' && action.payload.userAvatar && action.payload.userId === chatId) {
          chat.avatar = action.payload.userAvatar;
        }
      }
      
      // Зберігаємо в localStorage
      try {
        localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
      } catch (e) {
        console.error('Failed to save messages:', e);
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    togglePin: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (chat) {
        chat.isPinned = !chat.isPinned;
      }
    },
    toggleMute: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (chat) {
        chat.isMuted = !chat.isMuted;
      }
    },
    toggleHideChat: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (chat && chat.type !== 'saved') {
        chat.isHidden = !chat.isHidden;
        try {
          localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
        } catch (e) {
          console.error('Failed to save chats:', e);
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ messageId: string; chatId: string }>) => {
      const { messageId, chatId } = action.payload;
      const messages = state.messages[chatId];
      if (messages) {
        state.messages[chatId] = messages.filter(m => m.id !== messageId);
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          const updatedMessages = state.messages[chatId];
          chat.lastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : undefined;
        }
        try {
          localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
          localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
        } catch (e) {
          console.error('Failed to save messages:', e);
        }
      }
    },
    editMessage: (state, action: PayloadAction<{ messageId: string; chatId: string; newContent: string }>) => {
      const { messageId, chatId, newContent } = action.payload;
      const messages = state.messages[chatId];
      if (messages) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.content = newContent;
          message.edited = true;
          const chat = state.chats.find((c) => c.id === chatId);
          if (chat?.lastMessage?.id === messageId) {
            chat.lastMessage = { ...chat.lastMessage, content: newContent, edited: true };
          }
          try {
            localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
            localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
          } catch (e) {
            console.error('Failed to save messages:', e);
          }
        }
      }
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      const normalizedId = action.payload.id || (action.payload as any).chatId;
      const normalizedChat = {
        ...action.payload,
        id: normalizedId || action.payload.id,
      };
      console.log('[addChat] Adding chat:', normalizedChat);
      if (!normalizedChat.id) {
        console.warn('[addChat] Skipping chat without id');
        return;
      }
      const existingChat = state.chats.find(c => c.id === normalizedChat.id);
      if (existingChat) {
        // Оновлюємо існуючий чат (особливо аватар та статус)
        console.log('[addChat] Chat already exists, updating:', normalizedChat.id);
        Object.assign(existingChat, normalizedChat);
      } else {
        console.log('[addChat] New chat, unshifting:', normalizedChat.id);
        state.chats.unshift(normalizedChat);
      }
      try {
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
      } catch (e) {
        console.error('Failed to save chats:', e);
      }
    },
    deleteChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      
      // Prevent deletion of Saved Messages
      if (chatId === 'saved_messages') {
        console.warn('Cannot delete Saved Messages chat');
        return;
      }
      
      state.chats = state.chats.filter(c => c.id !== chatId);
      delete state.messages[chatId];
      try {
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
        localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
      } catch (e) {
        console.error('Failed to save after chat deletion:', e);
      }
    },
    loadFromStorage: (state) => {
      const chats = loadChatsFromStorage();
      const messages = loadMessagesFromStorage();
      const uniqueChats = Array.from(new Map(chats.map(chat => [chat.id, chat])).values());
      state.chats = ensureSavedMessagesChat(uniqueChats);
      state.messages = messages;
    },
    updateMyAvatar: (state, action: PayloadAction<{ userId: string; avatar: string }>) => {
      const { userId, avatar } = action.payload;
      // Оновлюємо аватар в чатах (для чатів де я є учасником)
      state.chats.forEach(chat => {
        // Для чатів де я єдиний або основний користувач (наприклад, "Збережені повідомлення")
        if (chat.id === userId || chat.id === 'me') {
          chat.avatar = avatar;
        }
      });
      
      // Оновлюємо аватар в повідомленнях (включаючи 'me')
      Object.keys(state.messages).forEach(chatId => {
        state.messages[chatId].forEach(message => {
          if (message.userId === userId || message.userId === 'me') {
            message.userAvatar = avatar;
          }
        });
      });
      
      try {
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
        localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
      } catch (e) {
        console.error('Failed to save after avatar update:', e);
      }
    },
    updateUserProfile: (state, action: PayloadAction<{ userId: string; username?: string; displayName?: string; avatar?: string }>) => {
      const { userId, username, displayName, avatar } = action.payload;
      
      // Оновлюємо профіль користувача в чатах
      state.chats.forEach(chat => {
        if (chat.id === userId && chat.type === 'private') {
          if (displayName) chat.name = displayName;
          if (avatar) chat.avatar = avatar;
        }
      });
      
      // Оновлюємо аватар в повідомленнях
      if (avatar) {
        Object.keys(state.messages).forEach(chatId => {
          state.messages[chatId].forEach(message => {
            if (message.userId === userId) {
              message.userAvatar = avatar;
            }
          });
        });
      }
      
      try {
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
        localStorage.setItem('disgram_messages', JSON.stringify(state.messages));
      } catch (e) {
        console.error('Failed to save after profile update:', e);
      }
    },
    updateUserStatus: (state, action: PayloadAction<{ userId: string; status: string }>) => {
      const { userId, status } = action.payload;
      
      // Оновлюємо статус користувача в чатах
      state.chats.forEach(chat => {
        if (chat.id === userId && chat.type === 'private') {
          chat.status = status as 'online' | 'offline';
        }
      });
      
      try {
        localStorage.setItem('disgram_chats', JSON.stringify(state.chats));
      } catch (e) {
        console.error('Failed to save after status update:', e);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.chats = [];
      state.messages = {};
      state.loading = false;
    });
  },
});

export const { addMessage, markAsRead, togglePin, toggleMute, toggleHideChat, deleteMessage, editMessage, addChat, deleteChat, loadFromStorage, updateMyAvatar, updateUserProfile, updateUserStatus } = chatsSlice.actions;
export default chatsSlice.reducer;
