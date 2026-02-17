import { configureStore } from '@reduxjs/toolkit';
import chatsReducer from './slices/chatsSlice';
import serversReducer from './slices/serversSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    chats: chatsReducer,
    servers: serversReducer,
    user: userReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
