#!/bin/bash

# Скрипт для створення релізу LUMYN
# Використання: ./create-release.sh

set -e

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== LUMYN Release Creator ===${NC}\n"

# Перевірка наявності gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) не встановлено${NC}"
    echo "Встановіть gh CLI: https://cli.github.com/"
    echo "Або створіть реліз вручну, дивіться QUICK_RELEASE_GUIDE.md"
    exit 1
fi

# Отримання версії з package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Файл package.json не знайдено${NC}"
    exit 1
fi

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo -e "${YELLOW}Версія з package.json:${NC} ${VERSION}"
echo -e "${YELLOW}Тег релізу:${NC} ${TAG}\n"

# Перевірка наявності папки release
if [ ! -d "release" ]; then
    echo -e "${RED}❌ Папка release не знайдена${NC}"
    echo "Спочатку зберіть проект: npm run dist"
    exit 1
fi

# Перевірка наявності необхідних файлів
INSTALLER="release/LUMYN Setup ${VERSION}.exe"
LATEST_YML="release/latest.yml"
APPIMAGE="release/LUMYN-${VERSION}.AppImage"
LATEST_LINUX_YML="release/latest-linux.yml"

FILES_TO_UPLOAD=()

if [ -f "$INSTALLER" ]; then
    echo -e "${GREEN}✓${NC} Знайдено: LUMYN Setup ${VERSION}.exe"
    FILES_TO_UPLOAD+=("$INSTALLER")
else
    echo -e "${YELLOW}⚠${NC}  Не знайдено: LUMYN Setup ${VERSION}.exe"
fi

if [ -f "$LATEST_YML" ]; then
    echo -e "${GREEN}✓${NC} Знайдено: latest.yml"
    FILES_TO_UPLOAD+=("$LATEST_YML")
else
    echo -e "${RED}❌${NC} Не знайдено: latest.yml (обов'язковий для автооновлення)"
fi

if [ -f "$APPIMAGE" ]; then
    echo -e "${GREEN}✓${NC} Знайдено: LUMYN-${VERSION}.AppImage"
    FILES_TO_UPLOAD+=("$APPIMAGE")
else
    echo -e "${YELLOW}⚠${NC}  Не знайдено: LUMYN-${VERSION}.AppImage"
fi

if [ -f "$LATEST_LINUX_YML" ]; then
    echo -e "${GREEN}✓${NC} Знайдено: latest-linux.yml"
    FILES_TO_UPLOAD+=("$LATEST_LINUX_YML")
else
    echo -e "${YELLOW}⚠${NC}  Не знайдено: latest-linux.yml"
fi

if [ ${#FILES_TO_UPLOAD[@]} -eq 0 ]; then
    echo -e "\n${RED}❌ Немає файлів для завантаження${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Файли для завантаження:${NC}"
for file in "${FILES_TO_UPLOAD[@]}"; do
    echo "  - $file"
done

# Запит підтвердження
echo -e "\n${YELLOW}Створити реліз ${TAG}?${NC} (y/n)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Скасовано"
    exit 0
fi

# Створення release notes
NOTES="## LUMYN ${TAG}

Desktop додаток з автоматичним оновленням через GitHub Releases.

### Можливості:
- ✅ Автоматична перевірка оновлень при запуску
- ✅ Завантаження та встановлення оновлень в фоні
- ✅ Підтримка Windows та Linux
- ✅ Безпечне оновлення через GitHub Releases

### Встановлення:

**Windows:**
1. Завантажте \`LUMYN Setup ${VERSION}.exe\`
2. Запустіть інсталятор
3. Додаток автоматично перевірятиме оновлення

**Linux:**
1. Завантажте \`LUMYN-${VERSION}.AppImage\`
2. Зробіть файл виконуваним: \`chmod +x LUMYN-${VERSION}.AppImage\`
3. Запустіть: \`./LUMYN-${VERSION}.AppImage\`

Детальна документація: [README.md](https://github.com/user4032/LUMYN/blob/main/README.md)"

# Створення релізу
echo -e "\n${GREEN}Створення релізу...${NC}"

gh release create "$TAG" \
  --title "LUMYN ${TAG}" \
  --notes "$NOTES" \
  "${FILES_TO_UPLOAD[@]}"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Реліз ${TAG} успішно створено!${NC}"
    echo -e "${YELLOW}Переглянути:${NC} https://github.com/user4032/LUMYN/releases/tag/${TAG}"
else
    echo -e "\n${RED}❌ Помилка при створенні релізу${NC}"
    exit 1
fi
