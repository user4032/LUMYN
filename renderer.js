// УВАГА: Цей код використовує nodeIntegration для простоти демонстрації.
// Для production додатків використовуйте preload script з contextBridge.
// Детальніше: https://www.electronjs.org/docs/latest/tutorial/context-isolation

const { ipcRenderer } = require('electron');

let version = 'loading...';

// Отримання версії додатку
ipcRenderer.send('get-version');
ipcRenderer.on('version', (event, ver) => {
  version = ver;
  updateVersionDisplay();
});

// Отримання статусу оновлень
ipcRenderer.on('update-status', (event, text) => {
  const statusElement = document.getElementById('update-status');
  const logElement = document.getElementById('update-log');
  
  if (statusElement) {
    statusElement.textContent = text;
  }
  
  if (logElement) {
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${time}] ${text}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }
});

// Кнопка для ручної перевірки оновлень
function checkForUpdates() {
  const statusElement = document.getElementById('update-status');
  if (statusElement) {
    statusElement.textContent = 'Перевірка оновлень...';
  }
  ipcRenderer.send('check-for-updates');
}

function updateVersionDisplay() {
  const versionElement = document.getElementById('version');
  if (versionElement) {
    versionElement.textContent = version;
  }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  updateVersionDisplay();
  
  const updateButton = document.getElementById('check-updates-btn');
  if (updateButton) {
    updateButton.addEventListener('click', checkForUpdates);
  }
});
