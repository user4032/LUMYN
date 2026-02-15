import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar?: string;
  profileBanner?: string;
  profileFrame?: string;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
  customStatus?: string;
  bio?: string;
  token?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

const loadUserFromStorage = (): User | null => {
  try {
    const saved = localStorage.getItem('disgram_current_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialState: UserState = {
  currentUser: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      try {
        localStorage.setItem('disgram_current_user', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to save user to localStorage:', e);
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem('disgram_current_user');
        localStorage.removeItem('disgram_servers');
        localStorage.removeItem('disgram_chats');
        localStorage.removeItem('disgram_messages');
      } catch (e) {
        console.error('Failed to remove user data from localStorage:', e);
      }
    },
    updateStatus: (state, action: PayloadAction<User['status']>) => {
      if (state.currentUser) {
        state.currentUser.status = action.payload;
        try {
          localStorage.setItem('disgram_current_user', JSON.stringify(state.currentUser));
        } catch (e) {
          console.error('Failed to save user to localStorage:', e);
        }
      }
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        state.currentUser.avatar = action.payload;
        try {
          localStorage.setItem('disgram_current_user', JSON.stringify(state.currentUser));
        } catch (e) {
          console.error('Failed to save user to localStorage:', e);
        }
      }
    },
  },
});

export const { setUser, logout, updateStatus, updateAvatar } = userSlice.actions;
export default userSlice.reducer;
