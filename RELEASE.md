# Інструкція з випуску релізів (Releases)

## Зміст
1. [Підготовка до випуску](#підготовка-до-випуску)
2. [Версіювання та теги](#версіювання-та-теги)
3. [Збірка релізів](#збірка-релізів)
4. [Підписування та публікація](#підписування-та-публікація)
5. [Налаштування GitHub Token](#налаштування-github-token)
6. [Автоматизація через GitHub Actions](#автоматизація-через-github-actions)
7. [Автооновлення](#автооновлення)

---

## Підготовка до випуску

### 1. Перевірка готовності коду
Перед створенням релізу переконайтеся, що:
- ✅ Всі зміни закомічено
- ✅ Всі тести пройдені
- ✅ Код пройшов code review
- ✅ Документація оновлена
- ✅ CHANGELOG.md оновлено (якщо використовується)

### 2. Оновлення версії
Оновіть номер версії у відповідних файлах:
- `package.json` (для Node.js/Electron проектів)
- `Cargo.toml` (для Rust проектів)
- `setup.py` або `pyproject.toml` (для Python проектів)
- Інші конфігураційні файли

---

## Версіювання та теги

### Семантичне версіювання (Semantic Versioning)

Використовуйте формат **MAJOR.MINOR.PATCH** (наприклад, `1.2.3`):

- **MAJOR** (1.x.x) - несумісні зміни API
- **MINOR** (x.2.x) - нова функціональність, зворотно сумісна
- **PATCH** (x.x.3) - виправлення помилок

### Формат тегів

#### Рекомендовані формати:
```bash
v1.0.0        # Рекомендований формат з префіксом 'v'
1.0.0         # Альтернативний формат без префікса
v1.0.0-beta.1 # Для пре-релізів
v1.0.0-rc.1   # Для релізних кандидатів
```

#### Приклади:
- Стабільний реліз: `v1.0.0`, `v2.1.5`
- Бета-версія: `v1.0.0-beta.1`, `v2.0.0-beta.2`
- Альфа-версія: `v0.1.0-alpha.1`
- Релізний кандидат: `v1.0.0-rc.1`

### Створення тегу

```bash
# Створення анотованого тегу (рекомендовано)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Відправка тегу на GitHub
git push origin v1.0.0

# Відправка всіх тегів
git push origin --tags
```

---

## Збірка релізів

### Для проектів на Node.js/Electron

#### 1. Встановлення залежностей
```bash
npm install
# або
yarn install
```

#### 2. Збірка проекту
```bash
npm run build
# або
yarn build
```

#### 3. Створення дистрибутивів (для Electron)
```bash
npm run dist
# або
electron-builder build --win --mac --linux
```

### Для проектів на Rust

```bash
# Збірка для поточної платформи
cargo build --release

# Крос-компіляція для різних платформ
cargo build --release --target x86_64-pc-windows-gnu
cargo build --release --target x86_64-apple-darwin
cargo build --release --target x86_64-unknown-linux-gnu
```

### Для проектів на Python

```bash
# Створення wheel пакету
python -m build

# Створення виконуваного файлу (PyInstaller)
pyinstaller --onefile main.py
```

### Артефакти збірки

Після збірки ви отримаєте файли для дистрибуції:
- **Windows**: `.exe`, `.msi`, або `.zip`
- **macOS**: `.dmg`, `.app.zip`, або `.pkg`
- **Linux**: `.AppImage`, `.deb`, `.rpm`, або `.tar.gz`

---

## Підписування та публікація

### Підписування релізів (опціонально, але рекомендовано)

#### Для Windows (Code Signing)
```bash
# Використовуйте сертифікат для підписування
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com myapp.exe
```

#### Для macOS (Notarization)
```bash
# Підписування
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" YourApp.app

# Нотаризація
xcrun notarytool submit YourApp.app.zip --apple-id your@email.com --password app-specific-password --team-id TEAM_ID
```

### Створення GitHub Release вручну

1. Перейдіть на https://github.com/YOUR_USERNAME/YOUR_REPO/releases
2. Натисніть "Draft a new release"
3. Виберіть тег або створіть новий (наприклад, `v1.0.0`)
4. Введіть назву релізу (наприклад, "Version 1.0.0")
5. Опишіть зміни в описі релізу
6. Завантажте файли збірки (drag & drop)
7. Відмітьте "This is a pre-release" якщо це бета/альфа версія
8. Натисніть "Publish release"

### Створення GitHub Release через CLI (gh)

```bash
# Встановіть GitHub CLI
# https://cli.github.com/

# Створіть реліз
gh release create v1.0.0 \
  --title "Version 1.0.0" \
  --notes "Release notes here" \
  dist/myapp-1.0.0.exe \
  dist/myapp-1.0.0.dmg \
  dist/myapp-1.0.0.AppImage

# Для пре-релізу
gh release create v1.0.0-beta.1 \
  --title "Version 1.0.0 Beta 1" \
  --notes "Beta release" \
  --prerelease \
  dist/*
```

---

## Налаштування GitHub Token

### Створення персонального токену доступу (Personal Access Token)

1. Перейдіть на https://github.com/settings/tokens
2. Натисніть "Generate new token" → "Generate new token (classic)"
3. Введіть назву токену (наприклад, "Release Token")
4. Встановіть термін дії (рекомендовано: 90 днів або більше)
5. Виберіть необхідні права доступу (scopes):
   - ✅ `repo` (повний доступ до репозиторіїв)
   - ✅ `write:packages` (якщо публікуєте пакети)
6. Натисніть "Generate token"
7. **Збережіть токен в безпечному місці** (він показується лише один раз!)

### Додавання токену до GitHub Actions

1. Перейдіть до Settings вашого репозиторію
2. Виберіть "Secrets and variables" → "Actions"
3. Натисніть "New repository secret"
4. Введіть:
   - Name: `GH_TOKEN` або `GITHUB_TOKEN`
   - Value: ваш персональний токен
5. Натисніть "Add secret"

### Використання токену в GitHub Actions

```yaml
- name: Create Release
  env:
    GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    gh release create ${{ github.ref_name }} \
      --title "Release ${{ github.ref_name }}" \
      --generate-notes \
      dist/*
```

---

## Автоматизація через GitHub Actions

### Приклад workflow для автоматичних релізів

Створіть файл `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'  # Запускається при пуші тегів типу v1.0.0

permissions:
  contents: write  # Необхідно для створення релізів

jobs:
  build-and-release:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Build distributables
        run: npm run dist
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.os }}
          path: dist/*
          
  create-release:
    needs: build-and-release
    runs-on: ubuntu-latest
    
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist-*/*
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, 'beta') || contains(github.ref, 'alpha') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Запуск workflow

```bash
# 1. Створіть тег локально
git tag -a v1.0.0 -m "Release version 1.0.0"

# 2. Відправте тег на GitHub
git push origin v1.0.0

# 3. GitHub Actions автоматично запустить workflow
# Перевірте прогрес на https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

---

## Автооновлення

### Для Electron додатків

#### 1. Встановіть electron-updater

```bash
npm install electron-updater
```

#### 2. Налаштуйте package.json

```json
{
  "name": "your-app",
  "version": "1.0.0",
  "build": {
    "appId": "com.yourcompany.yourapp",
    "publish": {
      "provider": "github",
      "owner": "YOUR_USERNAME",
      "repo": "YOUR_REPO"
    }
  }
}
```

#### 3. Додайте код автооновлення в main process

```javascript
const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

// Налаштування логування (опціонально)
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

app.on('ready', () => {
  // Перевірка оновлень при запуску
  autoUpdater.checkForUpdatesAndNotify();
  
  // Створення вікна...
  createWindow();
});

// Події автооновлення
autoUpdater.on('update-available', (info) => {
  console.log('Доступне оновлення:', info.version);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Оновлення завантажено:', info.version);
  // Можна показати діалог користувачу
  autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (err) => {
  console.error('Помилка автооновлення:', err);
});
```

#### 4. Збірка з автооновленням

```bash
# Збірка та публікація на GitHub Releases
npm run build
npm run dist

# Або з автоматичною публікацією
GH_TOKEN=your_github_token npm run dist
```

### Для інших платформ

#### Rust (self_update)
```rust
use self_update::cargo_crate_version;

fn update() -> Result<(), Box<dyn std::error::Error>> {
    let status = self_update::backends::github::Update::configure()
        .repo_owner("YOUR_USERNAME")
        .repo_name("YOUR_REPO")
        .bin_name("your-app")
        .current_version(cargo_crate_version!())
        .build()?
        .update()?;
    
    println!("Update status: `{}`!", status.version());
    Ok(())
}
```

#### Python (auto-update)
Використовуйте бібліотеки як `pyupdater` або `esky`.

### Формат latest.yml

Для автооновлення electron-updater очікує файл `latest.yml`:

```yaml
version: 1.0.0
releaseDate: '2026-02-14T12:00:00.000Z'
files:
  - url: your-app-1.0.0.exe
    sha512: [checksum]
    size: 123456
path: your-app-1.0.0.exe
sha512: [checksum]
```

Цей файл створюється автоматично при збірці з electron-builder.

---

## Чеклист перед релізом

- [ ] Код протестовано на всіх платформах
- [ ] Версія оновлена в package.json / Cargo.toml
- [ ] CHANGELOG.md оновлено (якщо є)
- [ ] Документація оновлена
- [ ] Створено git тег (v*.*.*)
- [ ] Збірка пройшла успішно
- [ ] Артефакти підписано (якщо потрібно)
- [ ] GitHub Release створено
- [ ] Автооновлення протестовано
- [ ] Анонс релізу опубліковано (якщо потрібно)

---

## Додаткові ресурси

- [Semantic Versioning](https://semver.org/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [electron-builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)
- [GitHub Actions](https://docs.github.com/en/actions)
- [gh CLI](https://cli.github.com/)

---

## Підтримка

Якщо у вас виникли питання, створіть issue в репозиторії або зверніться до документації вашого інструменту збірки.
