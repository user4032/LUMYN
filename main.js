const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');

// Налаштування логування
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'build/icon.png')
  });

  mainWindow.loadFile('index.html');

  // Відкрити DevTools в режимі розробки
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Події автооновлення
autoUpdater.on('checking-for-update', () => {
  log.info('Перевірка оновлень...');
  sendStatusToWindow('Перевірка оновлень...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Доступне оновлення:', info.version);
  sendStatusToWindow(`Доступне оновлення: ${info.version}`);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Оновлення не знайдено');
  sendStatusToWindow('Ви використовуєте останню версію');
});

autoUpdater.on('error', (err) => {
  log.error('Помилка автооновлення:', err);
  sendStatusToWindow('Помилка оновлення: ' + err.toString());
});

autoUpdater.on('download-progress', (progressObj) => {
  let message = `Швидкість: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
  message += ` - Завантажено ${Math.round(progressObj.percent)}%`;
  message += ` (${Math.round(progressObj.transferred / 1024 / 1024)}MB/${Math.round(progressObj.total / 1024 / 1024)}MB)`;
  log.info(message);
  sendStatusToWindow(message);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Оновлення завантажено:', info.version);
  sendStatusToWindow('Оновлення завантажено. Перезапуск через 5 секунд...');
  
  // Перезапуск через 5 секунд
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 5000);
});

function sendStatusToWindow(text) {
  log.info(text);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', text);
  }
}

// IPC для ручної перевірки оновлень
ipcMain.on('check-for-updates', () => {
  log.info('Manual update check requested');
  autoUpdater.checkForUpdates();
});

ipcMain.on('get-version', (event) => {
  event.reply('version', app.getVersion());
});

app.on('ready', () => {
  createWindow();
  
  // Перевірка оновлень через 3 секунди після запуску
  setTimeout(() => {
    log.info('Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
