import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './userSlice';

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  unreadCount: number;
  channels: Channel[];
  inviteCode?: string;
  members?: string[];
  ownerId?: string;
  roles?: Role[];
  memberRoles?: { [userId: string]: string };
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: 'text' | 'voice' | 'video';
  category?: string | null;
  unreadCount: number;
}

interface ServersState {
  servers: Server[];
  activeServer: string | null;
  activeChannel: string | null;
}

// Завантаження серверів з localStorage
const loadServersFromStorage = (): Server[] => {
  try {
    const saved = localStorage.getItem('disgram_servers');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: ServersState = {
  servers: loadServersFromStorage(),
  activeServer: null,
  activeChannel: null,
};

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setActiveServer: (state, action: PayloadAction<string>) => {
      state.activeServer = action.payload;
    },
    setActiveChannel: (state, action: PayloadAction<string>) => {
      state.activeChannel = action.payload;
    },
    setServers: (state, action: PayloadAction<Server[]>) => {
      state.servers = action.payload;
      try {
        localStorage.setItem('disgram_servers', JSON.stringify(state.servers));
      } catch (e) {
        console.error('Failed to save servers to localStorage:', e);
      }
    },
    addServer: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
      try {
        localStorage.setItem('disgram_servers', JSON.stringify(state.servers));
      } catch (e) {
        console.error('Failed to save servers to localStorage:', e);
      }
    },
    removeServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter(s => s.id !== action.payload);
      if (state.activeServer === action.payload) {
        state.activeServer = null;
        state.activeChannel = null;
      }
      try {
        localStorage.setItem('disgram_servers', JSON.stringify(state.servers));
      } catch (e) {
        console.error('Failed to save servers to localStorage:', e);
      }
    },
    updateServer: (state, action: PayloadAction<Partial<Server> & { id: string }>) => {
      const server = state.servers.find(s => s.id === action.payload.id);
      if (server) {
        Object.assign(server, action.payload);
        try {
          localStorage.setItem('disgram_servers', JSON.stringify(state.servers));
        } catch (e) {
          console.error('Failed to save servers to localStorage:', e);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.servers = [];
      state.activeServer = null;
      state.activeChannel = null;
    });
  },
});

export const { setActiveServer, setActiveChannel, setServers, addServer, removeServer, updateServer } = serversSlice.actions;
export default serversSlice.reducer;
