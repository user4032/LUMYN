const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  || runtimeOrigin;

export const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined)
  || runtimeOrigin;
