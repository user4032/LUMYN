// Глобальні типи для Electron API
export {};

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      onNotification: (callback: (data: any) => void) => void;
      sendMessage: (channel: string, data: any) => void;
      receiveMessage: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}
