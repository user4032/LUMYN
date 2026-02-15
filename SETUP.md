# DisgRAM - Інструкція з встановлення та запуску

## 📋 Вимоги

- **Node.js** версія 18 або вище
- **npm** або **yarn**
- **Git** (для клонування репозиторію)

## 🚀 Встановлення

### 1. Встановіть залежності

```bash
npm install
```

Це встановить всі необхідні пакети:
- **React** - UI бібліотека
- **Electron** - для створення десктопного додатку
- **Redux Toolkit** - керування станом
- **Material-UI** - компоненти інтерфейсу
- **TypeScript** - типізація
- **Vite** - швидкий bundler

### 2. Запуск у режимі розробки

```bash
npm run dev
```

Ця команда:
- Запустить Vite dev server на порту 5173
- Автоматично відкриє Electron вікно
- Включить hot reload для швидкої розробки
- Відкриє DevTools для налагодження

### 3. Збірка для продакшену

#### Windows
```bash
npm run build:win
```

#### macOS
```bash
npm run build:mac
```

#### Linux
```bash
npm run build:linux
```

Готові файли будуть в папці `release/`

## 🛠️ Корисні команди

### Лінтинг коду
```bash
npm run lint
```

### Форматування коду
```bash
npm run format
```

### Просто збірка (без пакування)
```bash
npm run build
```

## 📁 Структура проекту

```
disgram/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js             # Головний файл Electron
│   │   └── preload.js          # Preload script (безпека)
│   │
│   ├── renderer/               # React UI
│   │   ├── components/         # React компоненти
│   │   │   ├── Sidebar/        # Бокова панель навігації
│   │   │   ├── ChatList/       # Список чатів
│   │   │   ├── ChatWindow/     # Вікно чату
│   │   │   └── ServerList/     # Список серверів
│   │   │
│   │   ├── store/              # Redux store
│   │   │   ├── store.ts        # Конфігурація store
│   │   │   └── slices/         # Redux slices
│   │   │       ├── chatsSlice.ts
│   │   │       ├── serversSlice.ts
│   │   │       ├── userSlice.ts
│   │   │       └── uiSlice.ts
│   │   │
│   │   ├── App.tsx             # Головний React компонент
│   │   ├── main.tsx            # Точка входу React
│   │   ├── theme.ts            # Material-UI тема
│   │   └── styles/             # Стилі
│   │       └── global.css
│   │
│   ├── shared/                 # Спільний код
│   │   └── types.d.ts          # TypeScript типи
│   │
├── public/                     # Статичні файли
├── assets/                     # Іконки додатку
├── index.html                  # HTML шаблон
├── package.json                # Залежності та скрипти
├── tsconfig.json              # TypeScript конфігурація
├── vite.config.ts             # Vite конфігурація
└── README.md                   # Документація
```

## 🎨 Основні функції

### Поточні (реалізовані):
- ✅ Базовий UI інтерфейс
- ✅ Список чатів з пошуком
- ✅ Вікно чату з відправкою повідомлень
- ✅ Список серверів з каналами
- ✅ Redux state management
- ✅ Темна тема
- ✅ Responsive дизайн

### В розробці:
- 🔄 Реальний backend (WebSocket)
- 🔄 Аутентифікація користувачів
- 🔄 Голосові канали (WebRTC)
- 🔄 Відео дзвінки
- 🔄 Файлові вкладення
- 🔄 Емоджі picker
- 🔄 Секретні чати з шифруванням

### Заплановано:
- 📅 База даних (PostgreSQL)
- 📅 Backend API (Node.js + Express)
- 📅 Хмарне зберігання файлів
- 📅 Боти та інтеграції
- 📅 Мобільні додатки (React Native)

## 🐛 Вирішення проблем

### Помилка: "Cannot find module"
```bash
# Видаліть node_modules та встановіть заново
rm -rf node_modules
npm install
```

###  Electron не запускається
```bash
# Переконайтеся що Vite dev server запущений
# Перевірте чи порт 5173 вільний
```

### Помилки TypeScript
```bash
# Очистіть кеш TypeScript
npx tsc --build --clean
```

## 📝 Розробка

### Додавання нового компонента

1. Створіть папку в `src/renderer/components/`
2. Додайте файл `ComponentName.tsx`
3. Імпортуйте в батьківський компонент

### Додавання нового Redux slice

1. Створіть файл у `src/renderer/store/slices/`
2. Додайте до `store.ts`
3. Використовуйте `useSelector` та `useDispatch` у компонентах

### Додавання IPC каналу

1. Додайте обробник у `src/main/main.js`
2. Експортуйте API в `src/main/preload.js`
3. Використовуйте `window.electronAPI` у React компонентах

## 📖 Додаткові ресурси

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Material-UI](https://mui.com)
- [Vite Documentation](https://vitejs.dev)

## 🤝 Внесок

Якщо хочете долучитися до розробки:

1. Fork репозиторій
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push до branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

MIT License - можете вільно використовувати для власних проектів.

---

**Успіхів у розробці! 🚀**
