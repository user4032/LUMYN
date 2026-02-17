# 🔄 Міграція до нової структури проєкту LUMYN

## Поточна структура vs Нова структура

### Поточна (Electron-oriented)
```
LUMYN/
├── src/
│   ├── main/              # Electron main process
│   ├── renderer/          # React frontend
│   └── shared/            # Shared types
├── server/
│   ├── models/
│   └── index.js           # Monolithic server
└── release/
```

### Нова (Модульна)
```
LUMYN/
├── client/                # Клієнтська частина
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── styles/
│   └── package.json
│
├── server/                # Серверна частина
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   └── utils/
│
├── electron/              # Electron wrapper
│   ├── main.ts
│   └── preload.ts
│
├── tests/                 # Централізовані тести
│   ├── client/
│   └── server/
│
└── .github/workflows/
```

---

## 🎯 Переваги нової структури

### ✅ Модульність
- **client/** може працювати як standalone web-додаток
- **server/** можна використовувати для mobile/web без Electron
- **electron/** - легкий wrapper для desktop

### ✅ Масштабованість
- Кожна частина має свій package.json
- Незалежне версіонування
- Окремі node_modules для кожного модуля

### ✅ CI/CD
- Окремі білди для web/desktop
- Тести ізольовані в tests/
- Легше налаштувати monorepo (Lerna, Turborepo)

### ✅ Team-friendly
- Frontend/Backend розробники можуть працювати незалежно
- Чіткий separation of concerns
- Легше code review

---

## 📋 План міграції (4-6 годин)

### Phase 1: Підготовка (30 хв)

#### 1.1 Створити нову структуру папок

```bash
# PowerShell команди
New-Item -ItemType Directory -Force -Path client/public
New-Item -ItemType Directory -Force -Path client/src/components
New-Item -ItemType Directory -Force -Path client/src/services
New-Item -ItemType Directory -Force -Path client/src/store
New-Item -ItemType Directory -Force -Path client/src/utils
New-Item -ItemType Directory -Force -Path client/src/styles

New-Item -ItemType Directory -Force -Path server/controllers
New-Item -ItemType Directory -Force -Path server/services
New-Item -ItemType Directory -Force -Path server/middlewares
New-Item -ItemType Directory -Force -Path server/routes
New-Item -ItemType Directory -Force -Path server/utils

New-Item -ItemType Directory -Force -Path electron
New-Item -ItemType Directory -Force -Path tests/client
New-Item -ItemType Directory -Force -Path tests/server
```

#### 1.2 Створити окремі package.json

**File: `client/package.json`**
```json
{
  "name": "lumyn-client",
  "version": "1.0.12",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/material": "^5.15.0",
    "@reduxjs/toolkit": "^2.2.0",
    "axios": "^1.6.0",
    "date-fns": "^3.3.0",
    "emoji-picker-react": "^4.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.1.0",
    "react-router-dom": "^6.22.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**File: `server/package.json`**
```json
{
  "name": "lumyn-server",
  "version": "1.0.12",
  "main": "app.ts",
  "scripts": {
    "dev": "nodemon app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "joi": "^17.12.0",
    "mongoose": "^9.2.1",
    "nodemailer": "^6.9.13",
    "socket.io": "^4.8.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0"
  }
}
```

**File: `electron/package.json`**
```json
{
  "name": "lumyn-electron",
  "version": "1.0.12",
  "main": "main.ts",
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "dependencies": {
    "electron-log": "^5.4.3",
    "electron-updater": "^6.3.0"
  },
  "devDependencies": {
    "electron": "^28.2.0",
    "electron-builder": "^26.7.0"
  }
}
```

---

### Phase 2: Міграція Client (1-2 години)

#### 2.1 Переміщення файлів

```bash
# Переміщення компонентів
Move-Item -Path "src/renderer/components/*" -Destination "client/src/components/" -Force

# Переміщення сервісів
Move-Item -Path "src/renderer/services/*" -Destination "client/src/services/" -Force

# Переміщення store
Move-Item -Path "src/renderer/store/*" -Destination "client/src/store/" -Force

# Переміщення utils
Move-Item -Path "src/renderer/utils/*" -Destination "client/src/utils/" -Force

# Переміщення стилів
Move-Item -Path "src/renderer/styles/*" -Destination "client/src/styles/" -Force

# Переміщення кореневих файлів
Copy-Item -Path "src/renderer/App.tsx" -Destination "client/src/App.tsx"
Copy-Item -Path "src/renderer/main.tsx" -Destination "client/src/main.tsx"
Copy-Item -Path "src/renderer/theme.ts" -Destination "client/src/theme.ts"

# Index.html
Copy-Item -Path "index.html" -Destination "client/public/index.html"
```

#### 2.2 Оновити імпорти в клієнті

**Знайти та замінити**:
- `import ... from '../../../components/...` → `import ... from '@/components/...`
- `import ... from '../../store/...` → `import ... from '@/store/...`
- `import ... from '../services/...` → `import ... from '@/services/...`

**File: `client/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

**File: `client/vite.config.ts`**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
    },
  },
});
```

#### 2.3 Оновити API сервіс

**File: `client/src/services/apiService.ts`**
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4777/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для автоматичного додавання токена
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обробки помилок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Phase 3: Міграція Server (1-2 години)

#### 3.1 Переструктурувати server/index.js

**Розбити монолітний файл на модулі:**

**File: `server/controllers/authController.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { asyncHandler } from '../middlewares/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Registration successful. Check your email.',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutUser(req.token);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

**File: `server/services/authService.ts`**
```typescript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import Session from '../models/Session';
import VerificationCode from '../models/VerificationCode';
import { AppError } from '../middlewares/errorHandler';
import emailService from './emailService';

class AuthService {
  async registerUser(data: { username: string; email: string; password: string }) {
    const { username, email, password } = data;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new AppError(
        existingUser.email === email ? 'Email already registered' : 'Username already taken',
        400
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ username, email, passwordHash, verified: false });

    // Generate verification code
    const code = crypto.randomInt(100000, 999999).toString();
    await VerificationCode.create({
      userId: user._id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Send email
    await emailService.sendVerificationEmail(email, code);

    return { userId: user._id, email: user.email };
  }

  async loginUser(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.verified) {
      throw new AppError('Please verify your email first', 403);
    }

    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    await Session.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    };
  }

  async logoutUser(token: string) {
    await Session.deleteOne({ token });
  }
}

export default new AuthService();
```

**File: `server/routes/authRoutes.ts`**
```typescript
import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate, registerSchema, loginSchema } from '../utils/validator';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

export default router;
```

**File: `server/middlewares/errorHandler.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  console.error('ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : message,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**File: `server/middlewares/authMiddleware.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import Session from '../models/Session';
import User from '../models/User';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    const session = await Session.findOne({ token }).populate('userId');

    if (!session || new Date() > session.expiresAt) {
      throw new AppError('Invalid or expired session', 401);
    }

    req.user = session.userId;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};
```

**File: `server/utils/validator.ts`**
```typescript
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    req.body = value;
    next();
  };
};
```

**File: `server/app.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 4777;

// Middleware
app.use(cors({ origin: process.env.SOCKET_IO_CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LUMYN API is running' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 LUMYN API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

**File: `server/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Phase 4: Міграція Electron (30 хв)

#### 4.1 Переміщення Electron коду

```bash
# Переміщення main process
Move-Item -Path "src/main/main.js" -Destination "electron/main.ts" -Force
Move-Item -Path "src/main/preload.js" -Destination "electron/preload.ts" -Force
```

#### 4.2 Оновити Electron main

**File: `electron/main.ts`**
```typescript
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';

// Auto-updater logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Check for updates after 3 seconds
  setTimeout(() => {
    console.log('Checking for updates...');
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Update check failed:', err);
    });
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

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Download progress: ${progress.percent}%`);
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded');
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});
```

**File: `electron/preload.ts`**
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel: string, func: Function) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    invoke: (channel: string, data?: any) => {
      return ipcRenderer.invoke(channel, data);
    },
  },
});
```

---

### Phase 5: Налаштування тестів (30 хв)

**File: `tests/jest.config.js`**
```javascript
module.exports = {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/client/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../client/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
    },
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
```

**File: `tests/setupTests.ts`**
```typescript
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as any;
```

**File: `tests/client/ChatWindow.test.tsx`**
```typescript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatWindow from '@/components/ChatWindow/ChatWindow';
import chatReducer from '@/store/chatSlice';

const mockStore = configureStore({
  reducer: {
    chat: chatReducer,
  },
});

describe('ChatWindow', () => {
  it('should render without crashing', () => {
    render(
      <Provider store={mockStore}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });
});
```

**File: `tests/server/authService.test.ts`**
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authService from '../../server/services/authService';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should create a new user', async () => {
      const result = await authService.registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      });

      expect(result.userId).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });
  });
});
```

---

### Phase 6: Оновлення Root package.json (15 хв)

**File: `package.json`** (root)
```json
{
  "name": "lumyn",
  "version": "1.0.12",
  "description": "Where connections come alive",
  "author": "Your Name",
  "license": "MIT",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "electron"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\" \"npm run dev:electron\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "dev:electron": "wait-on http://localhost:5173 && cd electron && npm run dev",
    
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "build:desktop": "npm run build && cd electron && npm run build",
    
    "test": "jest --config tests/jest.config.js",
    "test:client": "jest --config tests/jest.config.js --selectProjects client",
    "test:server": "jest --config tests/jest.config.js --selectProjects server",
    "test:coverage": "jest --config tests/jest.config.js --coverage",
    
    "lint": "npm run lint:client && npm run lint:server",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    
    "install:all": "npm install && cd client && npm install && cd ../server && npm install && cd ../electron && npm install"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.11.0",
    "concurrently": "^8.2.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "wait-on": "^7.2.0"
  }
}
```

---

### Phase 7: Оновлення конфігурацій (15 хв)

**File: `.env.example`**
```env
# Server
PORT=4777
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/lumyn

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client
VITE_API_URL=http://localhost:4777

# Socket.IO
SOCKET_IO_CORS_ORIGIN=*
```

**File: `.github/workflows/ci.yml`**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Build client
        run: npm run build:client
      
      - name: Build server
        run: npm run build:server
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: |
            client/dist
            server/dist
```

---

## 🚀 Команди для швидкої міграції

### Автоматизований скрипт міграції

**File: `migrate.ps1`**
```powershell
Write-Host "🔄 Starting LUMYN migration to new structure..." -ForegroundColor Cyan

# Step 1: Create new directories
Write-Host "📁 Creating new directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path client/public, client/src/components, client/src/services, client/src/store, client/src/utils, client/src/styles
New-Item -ItemType Directory -Force -Path server/controllers, server/services, server/middlewares, server/routes, server/utils
New-Item -ItemType Directory -Force -Path electron
New-Item -ItemType Directory -Force -Path tests/client, tests/server

# Step 2: Move client files
Write-Host "📦 Moving client files..." -ForegroundColor Yellow
Copy-Item -Path "src/renderer/components" -Destination "client/src/" -Recurse -Force
Copy-Item -Path "src/renderer/services" -Destination "client/src/" -Recurse -Force
Copy-Item -Path "src/renderer/store" -Destination "client/src/" -Recurse -Force
Copy-Item -Path "src/renderer/utils" -Destination "client/src/" -Recurse -Force
Copy-Item -Path "src/renderer/styles" -Destination "client/src/" -Recurse -Force

Copy-Item -Path "src/renderer/App.tsx" -Destination "client/src/" -Force
Copy-Item -Path "src/renderer/main.tsx" -Destination "client/src/" -Force
Copy-Item -Path "src/renderer/theme.ts" -Destination "client/src/" -Force
Copy-Item -Path "index.html" -Destination "client/public/" -Force

# Step 3: Move Electron files
Write-Host "⚡ Moving Electron files..." -ForegroundColor Yellow
Copy-Item -Path "src/main/main.js" -Destination "electron/main.ts" -Force
Copy-Item -Path "src/main/preload.js" -Destination "electron/preload.ts" -Force

# Step 4: Move server models
Write-Host "🗄️ Moving server models..." -ForegroundColor Yellow
Copy-Item -Path "server/models" -Destination "server/" -Recurse -Force

Write-Host "✅ Migration complete! Next steps:" -ForegroundColor Green
Write-Host "1. Install dependencies: npm run install:all" -ForegroundColor White
Write-Host "2. Update imports in client files" -ForegroundColor White
Write-Host "3. Create controller/service/route files in server/" -ForegroundColor White
Write-Host "4. Run tests: npm test" -ForegroundColor White
```

**Запустити міграцію:**
```bash
.\migrate.ps1
```

---

## 📋 Чекліст після міграції

### Client
- [ ] Всі компоненти переміщені в client/src/components/
- [ ] Імпорти оновлені (використовують @/ alias)
- [ ] vite.config.ts налаштований
- [ ] package.json створений
- [ ] npm install виконаний
- [ ] npm run dev працює

### Server
- [ ] Контролери створені в server/controllers/
- [ ] Сервіси створені в server/services/
- [ ] Роути створені в server/routes/
- [ ] Middleware створений
- [ ] app.ts налаштований
- [ ] tsconfig.json створений
- [ ] npm install виконаний
- [ ] npm run dev працює

### Electron
- [ ] main.ts переміщений та оновлений
- [ ] preload.ts переміщений
- [ ] package.json створений
- [ ] npm install виконаний
- [ ] electron-builder.yml налаштований

### Tests
- [ ] jest.config.js створений
- [ ] Тести для клієнта в tests/client/
- [ ] Тести для сервера в tests/server/
- [ ] npm test працює

### Root
- [ ] package.json з workspaces
- [ ] .github/workflows/ci.yml створений
- [ ] .env.example оновлений
- [ ] README.md оновлений
- [ ] Всі скрипти працюють

---

## 🎯 Очікувані результати

### Поточна структура (до)
```
LUMYN/ (1 монорепо, змішана структура)
├── src/ (Electron + React разом)
├── server/ (1 файл 2254 рядки)
└── Складно масштабувати
```

### Нова структура (після)
```
LUMYN/ (модульний монорепо)
├── client/ (standalone React app)
├── server/ (MVC архітектура)
├── electron/ (тонкий wrapper)
├── tests/ (централізовані тести)
└── ✅ Легко масштабувати, тестувати, деплоїти
```

### Переваги
- ✅ **Web deployment**: client/ можна деплоїти на Vercel/Netlify
- ✅ **Mobile ready**: server/ готовий для React Native
- ✅ **Team scalability**: Frontend/Backend команди працюють незалежно
- ✅ **CI/CD friendly**: окремі білди та тести
- ✅ **Monorepo**: код в одному repo, але модульний

---

## ⏱️ Часові оцінки

| Фаза | Час | Складність |
|------|-----|-----------|
| Підготовка структури | 30 хв | ⭐ |
| Міграція Client | 1-2 год | ⭐⭐ |
| Міграція Server | 1-2 год | ⭐⭐⭐ |
| Міграція Electron | 30 хв | ⭐⭐ |
| Налаштування тестів | 30 хв | ⭐⭐ |
| Root конфігурація | 15 хв | ⭐ |
| Тестування всього | 30 хв | ⭐ |

**Загальний час: 4-6 годин**

---

## 💡 Рекомендації

1. **Створіть нову гілку**: `git checkout -b refactor/new-structure`
2. **Коммітьте часто**: після кожної фази
3. **Тестуйте поступово**: після кожного модуля
4. **Зберігайте старий код**: не видаляйте src/ до повної міграції
5. **Використовуйте скрипт**: migrate.ps1 для автоматизації

---

**Готовий почати міграцію? Запускай `.\migrate.ps1`!** 🚀
