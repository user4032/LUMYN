# Приклади конфігурації автооновлення

## Electron (electron-updater)

### package.json
```json
{
  "name": "your-app",
  "version": "1.0.0",
  "description": "Your Electron application",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder build",
    "dist": "electron-builder build --publish always"
  },
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "YourApp",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "renderer.js",
      "index.html",
      "package.json"
    ],
    "publish": {
      "provider": "github",
      "owner": "YOUR_USERNAME",
      "repo": "YOUR_REPO",
      "releaseType": "release"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns",
      "category": "public.app-category.utilities"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icon.png",
      "category": "Utility"
    }
  },
  "dependencies": {
    "electron-updater": "^6.1.7"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  }
}
```

### main.js (Main Process)
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Налаштування логування
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

// Події автооновлення
autoUpdater.on('checking-for-update', () => {
  log.info('Перевірка оновлень...');
  sendStatusToWindow('Перевірка оновлень...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Доступне оновлення:', info.version);
  sendStatusToWindow('Доступне оновлення: ' + info.version);
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
  sendStatusToWindow('Оновлення завантажено. Перезапуск...');
  
  // Перезапуск через 5 секунд
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 5000);
});

function sendStatusToWindow(text) {
  log.info(text);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

// IPC для ручної перевірки оновлень
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

app.on('ready', () => {
  createWindow();
  
  // Перевірка оновлень через 3 секунди після запуску
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### renderer.js (Renderer Process)
```javascript
const { ipcRenderer } = require('electron');

// Отримання статусу оновлень
ipcRenderer.on('update-status', (event, text) => {
  const statusElement = document.getElementById('update-status');
  if (statusElement) {
    statusElement.textContent = text;
  }
  console.log('Update status:', text);
});

// Кнопка для ручної перевірки оновлень
function checkForUpdates() {
  ipcRenderer.send('check-for-updates');
}

// Додайте це до вашого HTML
document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.textContent = 'Перевірити оновлення';
  button.onclick = checkForUpdates;
  document.body.appendChild(button);
  
  const status = document.createElement('div');
  status.id = 'update-status';
  status.textContent = 'Готово до перевірки оновлень';
  document.body.appendChild(status);
});
```

---

## Rust (self_update)

### Cargo.toml
```toml
[package]
name = "your-app"
version = "1.0.0"
edition = "2021"

[dependencies]
self_update = { version = "0.39", features = ["archive-tar", "compression-flate2"] }
```

### src/main.rs
```rust
use self_update::cargo_crate_version;
use std::error::Error;

fn update() -> Result<(), Box<dyn Error>> {
    let status = self_update::backends::github::Update::configure()
        .repo_owner("YOUR_USERNAME")
        .repo_name("YOUR_REPO")
        .bin_name("your-app")
        .show_download_progress(true)
        .current_version(cargo_crate_version!())
        .build()?
        .update()?;
    
    println!("Оновлено до версії: `{}`", status.version());
    Ok(())
}

fn main() {
    println!("Поточна версія: {}", cargo_crate_version!());
    
    // Перевірка оновлень
    match update() {
        Ok(_) => println!("Оновлення успішне!"),
        Err(e) => eprintln!("Помилка оновлення: {}", e),
    }
    
    // Ваш код додатку...
}
```

---

## Tauri

### tauri.conf.json
```json
{
  "package": {
    "productName": "YourApp",
    "version": "1.0.0"
  },
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.yourcompany.yourapp",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### src-tauri/src/main.rs
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### JavaScript (Frontend)
```javascript
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();
  
  if (update?.available) {
    const yes = await ask(
      `Доступна нова версія ${update.version}. Оновити зараз?`,
      {
        title: 'Оновлення доступне',
        kind: 'info',
      }
    );

    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}

// Перевірка оновлень при запуску
checkForUpdates();
```

---

## Flutter Desktop

### pubspec.yaml
```yaml
name: your_app
version: 1.0.0+1

dependencies:
  flutter:
    sdk: flutter
  upgrader: ^8.0.0  # Для перевірки оновлень

flutter:
  uses-material-design: true
```

### lib/main.dart
```dart
import 'package:flutter/material.dart';
import 'package:upgrader/upgrader.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: UpgradeAlert(
        upgrader: Upgrader(
          durationUntilAlertAgain: Duration(days: 1),
          showIgnore: false,
          showLater: false,
        ),
        child: HomeScreen(),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Your App')),
      body: Center(child: Text('Ваш додаток')),
    );
  }
}
```

---

## Налаштування для різних платформ

### Windows (NSIS інсталятор)
```javascript
// electron-builder config
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "YourApp"
}
```

### macOS (DMG)
```javascript
// electron-builder config
"dmg": {
  "contents": [
    {
      "x": 130,
      "y": 220
    },
    {
      "x": 410,
      "y": 220,
      "type": "link",
      "path": "/Applications"
    }
  ],
  "window": {
    "width": 540,
    "height": 380
  }
}
```

### Linux (AppImage)
```javascript
// electron-builder config
"appImage": {
  "license": "LICENSE",
  "category": "Utility"
}
```

---

## Тестування автооновлення

### Локальне тестування
```bash
# 1. Створіть локальний сервер для тестування
npm install -g http-server
http-server ./dist -p 8080

# 2. Змініть URL в коді для локального тестування
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'http://localhost:8080'
});

# 3. Створіть тестові релізи з різними версіями
```

### Перевірка в production
```bash
# 1. Створіть тестовий реліз
git tag -a v1.0.0-beta.1 -m "Test release"
git push origin v1.0.0-beta.1

# 2. Зачекайте, поки GitHub Actions створить реліз

# 3. Встановіть додаток і перевірте автооновлення

# 4. Створіть новий реліз з вищою версією
git tag -a v1.0.0-beta.2 -m "Test update"
git push origin v1.0.0-beta.2

# 5. Перевірте, чи додаток знаходить і встановлює оновлення
```

---

## Додаткові поради

1. **Завжди тестуйте автооновлення** перед публікацією стабільного релізу
2. **Використовуйте beta/alpha версії** для тестування процесу оновлення
3. **Зберігайте зворотну сумісність** при можливості
4. **Логуйте всі події оновлення** для діагностики проблем
5. **Інформуйте користувачів** про зміни у новій версії
6. **Створюйте backup** перед встановленням оновлень (якщо потрібно)

---

## Усунення проблем

### Оновлення не знаходяться
- Перевірте URL релізів
- Перевірте формат файлу latest.yml
- Перевірте права доступу до репозиторію
- Перевірте версію в package.json

### Помилка завантаження
- Перевірте розмір файлів релізу
- Перевірте інтернет-з'єднання
- Перевірте checksum файлів

### Оновлення не встановлюється
- Перевірте права доступу на запис
- Перевірте, чи додаток запущений від адміністратора (Windows)
- Перевірте антивірусне ПЗ
