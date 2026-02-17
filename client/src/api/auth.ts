import { API_BASE } from '../config/network';

export const API_URL = API_BASE;

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status?: 'online' | 'away' | 'busy' | 'offline' | 'idle' | 'dnd' | 'invisible';
  customStatus?: string;
  bio?: string;
  avatar?: string;
  profileBanner?: string;
  profileFrame?: string;
}

export interface AuthResponse {
  ok: boolean;
  token?: string;
  user?: AuthUser;
  needsVerification?: boolean;
  devCode?: string;
  error?: string;
}

const handleJson = async (response: Response) => {
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err: any) {
    // Якщо помилка при парсуванні JSON, то сервер повернув HTML (помилка)
    if (err instanceof SyntaxError) {
      throw new Error(`Server error (${response.status}): Invalid response format`);
    }
    throw err;
  }
};

export const registerAccount = async (email: string, password: string, displayName?: string, username?: string) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, username }),
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const resendCode = async (email: string) => {
  const response = await fetch(`${API_BASE}/auth/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const verifyCode = async (email: string, code: string) => {
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const loginAccount = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const fetchMe = async (token: string) => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const logoutAccount = async (token: string) => {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const updateProfile = async (token: string, profile: Partial<AuthUser>) => {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(profile),
  });

  return handleJson(response) as Promise<AuthResponse>;
};

export const searchUsers = async (token: string, query: string) => {
  const response = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleJson(response);
  return data as { ok: boolean; users: AuthUser[]; error?: string };
};
