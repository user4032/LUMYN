const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function sendUpdateStatus(payload) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('update-status', payload);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1f22',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../../assets/icon.png'),
    autoHideMenuBar: true,
    title: 'LUMYN',
  });

  // Приховуємо меню повністю
  mainWindow.setMenuBarVisibility(false);

  // В режимі розробки завантажуємо з Vite dev server
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // В production завантажуємо з dist
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  app.setName('LUMYN');
  createWindow();

  // Auto-updater configuration
  autoUpdater.autoDownload = false; // Manual download for user control
  autoUpdater.autoInstallOnAppQuit = true; // Install when app quits
  
  // Logging for diagnostics
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';
  
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    sendUpdateStatus({ status: 'checking' });
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    sendUpdateStatus({ status: 'available', info });
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('No updates available');
    sendUpdateStatus({ status: 'not-available', info });
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    sendUpdateStatus({ status: 'error', message: err?.message || 'Update error' });
  });
  
  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${Math.round(progress.percent)}%`);
    sendUpdateStatus({ status: 'downloading', progress });
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    sendUpdateStatus({ status: 'downloaded' });
  });

  // Auto-check for updates on startup (after 3 seconds)
  setTimeout(() => {
    console.log('Checking for updates on startup...');
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Failed to check for updates:', err);
    });
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC обробники
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow?.close();
});

ipcMain.handle('check-for-updates', async () => {
  return autoUpdater.checkForUpdates();
});

ipcMain.handle('download-update', async () => {
  return autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});
