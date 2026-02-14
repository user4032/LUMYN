# Інструкція зі створення релізу LUMYN

## Автоматичний спосіб (Рекомендовано)

### Крок 1: Встановіть GitHub CLI (якщо ще не встановлено)

```bash
# Windows (через winget)
winget install --id GitHub.cli

# macOS (через Homebrew)
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Або завантажте з https://cli.github.com/
```

### Крок 2: Авторизуйтесь в GitHub

```bash
gh auth login
```

Виберіть:
- GitHub.com
- HTTPS
- Login with a web browser (або paste authentication token)

### Крок 3: Створіть реліз

```bash
# Перейдіть в папку проекту
cd /шлях/до/LUMYN

# Створіть реліз з файлами
gh release create v0.1.0 \
  --title "LUMYN v0.1.0" \
  --notes "Перший реліз LUMYN з автооновленням" \
  "release/LUMYN Setup 0.1.0.exe" \
  "release/latest.yml" \
  "release/LUMYN-0.1.0.AppImage" \
  "release/latest-linux.yml"
```

---

## Ручний спосіб (через веб-інтерфейс GitHub)

### Крок 1: Перейдіть на сторінку релізів

Відкрийте: https://github.com/user4032/LUMYN/releases

### Крок 2: Створіть новий реліз

1. Натисніть **"Draft a new release"**

### Крок 3: Налаштуйте реліз

1. **Choose a tag**: Введіть `v0.1.0` (або створіть новий тег)
2. **Target**: Оберіть гілку `main` або `copilot/add-auto-update-github-releases`
3. **Release title**: `LUMYN v0.1.0`
4. **Describe this release**: Введіть опис:

```markdown
## Перший реліз LUMYN

Desktop додаток з автоматичним оновленням через GitHub Releases.

### Можливості:
- ✅ Автоматична перевірка оновлень при запуску
- ✅ Завантаження та встановлення оновлень в фоні
- ✅ Підтримка Windows та Linux
- ✅ Безпечне оновлення через GitHub Releases

### Файли:
- **LUMYN Setup 0.1.0.exe** - Інсталятор для Windows
- **LUMYN-0.1.0.AppImage** - Portable версія для Linux
- **latest.yml** - Файл автооновлення для Windows (ОБОВ'ЯЗКОВИЙ!)
- **latest-linux.yml** - Файл автооновлення для Linux (ОБОВ'ЯЗКОВИЙ!)

### Встановлення:

**Windows:**
1. Завантажте `LUMYN Setup 0.1.0.exe`
2. Запустіть інсталятор
3. Додаток автоматично перевірятиме оновлення

**Linux:**
1. Завантажте `LUMYN-0.1.0.AppImage`
2. Зробіть файл виконуваним: `chmod +x LUMYN-0.1.0.AppImage`
3. Запустіть: `./LUMYN-0.1.0.AppImage`
```

### Крок 4: Завантажте файли релізу

**ВАЖЛИВО:** Прикріпіть ВСІ наступні файли з папки `release`:

1. Перетягніть файли у секцію "Attach binaries":
   - `LUMYN Setup 0.1.0.exe` (інсталятор для Windows)
   - `latest.yml` (**ОБОВ'ЯЗКОВО** для автооновлення Windows)
   - `LUMYN-0.1.0.AppImage` (portable для Linux)
   - `latest-linux.yml` (**ОБОВ'ЯЗКОВО** для автооновлення Linux)

2. Дочекайтеся завершення завантаження всіх файлів

### Крок 5: Опублікуйте реліз

1. Переконайтеся, що:
   - ✅ Тег правильний (v0.1.0)
   - ✅ Всі 4 файли завантажені
   - ✅ latest.yml і latest-linux.yml присутні
   
2. Натисніть **"Publish release"**

---

## Перевірка релізу

Після створення релізу:

1. Перевірте, що реліз видимий на: https://github.com/user4032/LUMYN/releases/latest

2. Переконайтеся, що всі файли доступні для завантаження

3. Перевірте, що файли latest.yml доступні за URL:
   - Windows: `https://github.com/user4032/LUMYN/releases/download/v0.1.0/latest.yml`
   - Linux: `https://github.com/user4032/LUMYN/releases/download/v0.1.0/latest-linux.yml`

4. Встановіть додаток і перевірте автооновлення (після створення v0.2.0)

---

## Створення наступних релізів

### 1. Оновіть версію в package.json

```json
{
  "version": "0.2.0"
}
```

### 2. Зберіть новий реліз

```bash
npm run dist
```

### 3. Створіть новий тег і реліз

```bash
gh release create v0.2.0 \
  --title "LUMYN v0.2.0" \
  --notes "Що нового у версії 0.2.0..." \
  "release/LUMYN Setup 0.2.0.exe" \
  "release/latest.yml" \
  "release/LUMYN-0.2.0.AppImage" \
  "release/latest-linux.yml"
```

### 4. Тестування автооновлення

1. Встановіть v0.1.0
2. Опублікуйте v0.2.0
3. Запустіть v0.1.0
4. Додаток має автоматично знайти і запропонувати оновлення до v0.2.0

---

## Поширені помилки

### ❌ Автооновлення не працює

**Причина:** Не завантажено файл latest.yml

**Рішення:** Завжди завантажуйте latest.yml та latest-linux.yml разом з інсталятором

### ❌ Помилка "Update not found"

**Причина:** Неправильний формат тегу або версії

**Рішення:** 
- Використовуйте формат v*.*.* (наприклад, v0.1.0)
- Версія в package.json має співпадати з тегом (без 'v')

### ❌ Помилка завантаження оновлення

**Причина:** Великий розмір файлу або проблеми з мережею

**Рішення:**
- Перевірте інтернет-з'єднання
- Спробуйте знову
- Зменшіть розмір додатку (виключіть непотрібні залежності)

---

## Автоматизація через GitHub Actions

Для автоматичного створення релізів при пуші тегу використовуйте workflow `.github/workflows/release.yml`:

```bash
# Створіть і відправте тег
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# GitHub Actions автоматично:
# 1. Зберуть проект
# 2. Створять дистрибутиви
# 3. Опублікують реліз
```

Детальніше див. [RELEASE.md](RELEASE.md#автоматизація-через-github-actions)

---

## Додаткова інформація

- [Основна інструкція з релізів](RELEASE.md)
- [Приклади автооновлення](AUTO_UPDATE_EXAMPLES.md)
- [README проекту](README.md)
