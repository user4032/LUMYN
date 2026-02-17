import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../api/social';

interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (
      state,
      action: PayloadAction<{ notifications: Notification[]; total: number; unreadCount: number }>
    ) => {
      state.list = action.payload.notifications;
      state.total = action.payload.total;
      state.unreadCount = action.payload.unreadCount;
      state.isLoading = false;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const existing = state.list.find(n => n.id === action.payload.id);
      if (!existing) {
        state.list.unshift(action.payload);
        state.total += 1;
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.list.find(n => n.id === action.payload);
      if (notification) {
        state.list = state.list.filter(n => n.id !== action.payload);
        state.total -= 1;
        if (!notification.read) {
          state.unreadCount -= 1;
        }
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.list.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state, action: PayloadAction<number>) => {
      state.list.forEach(n => {
        if (!n.read) n.read = true;
      });
      state.unreadCount = 0;
    },
    clearAllNotifications: (state) => {
      state.list = [];
      state.unreadCount = 0;
      state.total = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  setLoading,
  setError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
