const { contextBridge, ipcRenderer } = require('electron');

type IpcRendererEvent = import('electron').IpcRendererEvent;
type UpdateStatusPayload = {
  status: 'checking' | 'available' | 'not-available' | 'error' | 'downloading' | 'downloaded';
  info?: unknown;
  progress?: unknown;
  message?: string;
};

type NotificationPayload = Record<string, unknown>;
type AllowedSendChannel = 'user-login' | 'user-logout' | 'send-message';
type AllowedReceiveChannel = 'message-received' | 'user-status-changed';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: UpdateStatusPayload) => callback(data);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  },
  
  // Додаткові API для майбутніх функцій
  onNotification: (callback: (payload: NotificationPayload) => void) => {
    ipcRenderer.on('notification', (_event: IpcRendererEvent, data: NotificationPayload) => callback(data));
  },
  
  sendMessage: (channel: AllowedSendChannel, data: unknown) => {
    const validChannels: AllowedSendChannel[] = ['user-login', 'user-logout', 'send-message'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  receiveMessage: (channel: AllowedReceiveChannel, callback: (...args: unknown[]) => void) => {
    const validChannels: AllowedReceiveChannel[] = ['message-received', 'user-status-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args));
    }
  },
});

export {};
