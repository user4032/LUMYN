# 🚀 LUMYN Refactoring Plan - Portfolio Level 8/10

## Current Status Assessment

### ✅ What's Already Good
- **Modern Stack**: React 18 + TypeScript + Redux Toolkit + Material-UI
- **Client Architecture**: Well-organized folder structure (`api/`, `services/`, `components/`, `utils/`, `store/`)
- **Database**: Mongoose ODM with proper models
- **Desktop**: Electron with auto-update system
- **Code Quality Tools**: ESLint + Prettier configured
- **Modular Components**: 40+ well-separated React components

### 🔴 Critical Issues to Fix
1. **Server**: Monolithic `index.js` (2254 lines) - all routes/logic in one file
2. **No Tests**: Zero test coverage
3. **No CI/CD**: No automated workflows
4. **No Validation**: Input data not validated
5. **No Error Handling**: No centralized error middleware
6. **Empty README**: Documentation missing
7. **No API Docs**: No Swagger/OpenAPI specification

---

## 📋 Refactoring Roadmap (Prioritized)

### Phase 1: Server Architecture Refactoring (Week 1-2)
**Impact**: High | **Effort**: High | **Priority**: Critical

#### 1.1 Split Monolithic Server

**Current Structure**:
```
server/
  index.js (2254 lines!)
  models/
  database.js
```

**Target Structure**:
```
server/
  src/
    controllers/      # Request handlers
      auth.controller.js
      chat.controller.js
      server.controller.js
      user.controller.js
      friend.controller.js
      thread.controller.js
    services/         # Business logic
      auth.service.js
      chat.service.js
      notification.service.js
      email.service.js
    routes/           # Route definitions
      auth.routes.js
      chat.routes.js
      server.routes.js
      user.routes.js
      index.js
    middleware/       # Custom middleware
      auth.middleware.js
      errorHandler.middleware.js
      validation.middleware.js
      rateLimiter.middleware.js
    validators/       # Input validation schemas
      auth.validator.js
      chat.validator.js
      server.validator.js
    utils/            # Helper functions
      generateCode.js
      hashPassword.js
      sendEmail.js
    config/           # Configuration
      database.js
      email.js
      socket.js
      constants.js
    models/           # Mongoose schemas (existing)
    app.js            # Express app setup
    server.js         # HTTP + Socket.IO server
  index.js            # Entry point
```

#### 1.2 Example Implementation

**File: `server/src/middleware/errorHandler.middleware.js`**
```javascript
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;
  
  console.error('ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
```

**File: `server/src/validators/auth.validator.js`**
```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message,
    }));
    return res.status(400).json({ success: false, errors });
  }
  
  req.validatedData = value;
  next();
};

module.exports = { registerSchema, loginSchema, validate };
```

**File: `server/src/services/auth.service.js`**
```javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const VerificationCode = require('../models/VerificationCode');
const { AppError } = require('../middleware/errorHandler.middleware');
const emailService = require('./email.service');

class AuthService {
  async registerUser({ username, email, password }) {
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new AppError(
        existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
        400
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      verified: false,
    });

    // Generate verification code
    const code = crypto.randomInt(100000, 999999).toString();
    await VerificationCode.create({
      userId: user._id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, code);

    return { userId: user._id, email: user.email };
  }

  async loginUser({ email, password }) {
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { 
      token, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      }
    };
  }

  async verifyEmail({ userId, code }) {
    const verification = await VerificationCode.findOne({ 
      userId, 
      code, 
      used: false 
    });

    if (!verification) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    if (new Date() > verification.expiresAt) {
      throw new AppError('Verification code expired', 400);
    }

    await User.findByIdAndUpdate(userId, { verified: true });
    await VerificationCode.updateOne({ _id: verification._id }, { used: true });

    return { success: true };
  }

  async getUserByToken(token) {
    const session = await Session.findOne({ token })
      .populate('userId', '-passwordHash');

    if (!session || new Date() > session.expiresAt) {
      throw new AppError('Invalid or expired session', 401);
    }

    return session.userId;
  }
}

module.exports = new AuthService();
```

**File: `server/src/controllers/auth.controller.js`**
```javascript
const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errorHandler.middleware');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.validatedData);
  
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    data: result,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.validatedData);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

exports.verify = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  await authService.verifyEmail({ userId, code });
  
  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  await Session.deleteOne({ token: req.token });
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

**File: `server/src/routes/auth.routes.js`**
```javascript
const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../validators/auth.validator');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify', authController.verify);
router.post('/resend', authController.resendCode);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
```

**File: `server/src/routes/index.js`**
```javascript
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const chatRoutes = require('./chat.routes');
const serverRoutes = require('./server.routes');
const friendRoutes = require('./friend.routes');
const threadRoutes = require('./thread.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/servers', serverRoutes);
router.use('/friends', friendRoutes);
router.use('/threads', threadRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'LUMYN API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

**File: `server/src/app.js`**
```javascript
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { rateLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
```

**File: `server/index.js`**
```javascript
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { initializeSocketIO } = require('./src/config/socket');

const PORT = process.env.PORT || 4777;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(server);
    console.log('✅ Socket.IO initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 LUMYN API running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

### Phase 2: Testing Infrastructure (Week 2-3)
**Impact**: High | **Effort**: Medium | **Priority**: High

#### 2.1 Install Testing Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest mongodb-memory-server
```

#### 2.2 Jest Configuration

**File: `jest.config.js`**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/server'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'server/src/**/*.js',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
```

**File: `jest.setup.js`**
```javascript
import '@testing-library/jest-dom';

// Mock Electron
global.window.electron = {
  ipcRenderer: {
    send: jest.fn(),
    on: jest.fn(),
    invoke: jest.fn(),
  },
};

// Mock WebSocket
global.WebSocket = jest.fn();
```

#### 2.3 Example Backend Tests

**File: `server/src/services/__tests__/auth.service.test.js`**
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const authService = require('../auth.service');
const User = require('../../models/User');
const { AppError } = require('../../middleware/errorHandler.middleware');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      };

      const result = await authService.registerUser(userData);

      expect(result).toHaveProperty('userId');
      expect(result.email).toBe(userData.email);

      const user = await User.findById(result.userId);
      expect(user).toBeTruthy();
      expect(user.passwordHash).not.toBe(userData.password);
    });

    it('should throw error if email already exists', async () => {
      await User.create({
        username: 'existing',
        email: 'existing@example.com',
        passwordHash: 'hash',
      });

      await expect(
        authService.registerUser({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('loginUser', () => {
    it('should return token for valid credentials', async () => {
      // Create verified user
      const { userId } = await authService.registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      });
      await User.findByIdAndUpdate(userId, { verified: true });

      const result = await authService.loginUser({
        email: 'test@example.com',
        password: 'Test1234',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.loginUser({
          email: 'test@example.com',
          password: 'WrongPass',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

#### 2.4 Example Frontend Tests

**File: `src/renderer/components/ChatWindow/__tests__/ChatWindow.test.tsx`**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatWindow from '../ChatWindow';
import chatReducer from '../../../store/chatSlice';

const mockStore = configureStore({
  reducer: {
    chat: chatReducer,
  },
  preloadedState: {
    chat: {
      messages: [
        {
          id: '1',
          content: 'Hello, world!',
          senderId: 'user1',
          timestamp: Date.now(),
        },
      ],
      currentChatId: 'chat1',
    },
  },
});

describe('ChatWindow', () => {
  it('should render messages', () => {
    render(
      <Provider store={mockStore}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('should send message on submit', async () => {
    const user = userEvent.setup();
    
    render(
      <Provider store={mockStore}>
        <ChatWindow />
      </Provider>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });
});
```

#### 2.5 Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:server": "jest server/",
    "test:client": "jest src/"
  }
}
```

---

### Phase 3: CI/CD Pipeline (Week 3)
**Impact**: Medium | **Effort**: Low | **Priority**: High

#### 3.1 GitHub Actions Workflows

**File: `.github/workflows/ci.yml`**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format -- --check

  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:server
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: server

  test-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:client
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: client

  build-desktop:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build Electron App
        run: |
          npm run build
          npm run build:desktop
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/
```

**File: `.github/workflows/release.yml`**
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Build & Publish
        run: npm run build:desktop -- --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**File: `.github/workflows/codeql.yml`**
```yaml
name: CodeQL Security Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
      - uses: github/codeql-action/analyze@v2
```

---

### Phase 4: Documentation (Week 4)
**Impact**: Medium | **Effort**: Low | **Priority**: Medium

#### 4.1 Comprehensive README

**File: `README.md`**
```markdown
# 💬 LUMYN - Modern Communication Platform

> Where connections come alive

[![CI/CD](https://github.com/user4032/LUMYN/workflows/CI%2FCD/badge.svg)](https://github.com/user4032/LUMYN/actions)
[![codecov](https://codecov.io/gh/user4032/LUMYN/branch/main/graph/badge.svg)](https://codecov.io/gh/user4032/LUMYN)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/release/user4032/LUMYN)](https://github.com/user4032/LUMYN/releases)

LUMYN is a feature-rich, cross-platform communication application built with Electron, React, and Node.js. It combines real-time messaging, server communities, and social features in a beautiful, user-friendly interface.

![LUMYN Screenshot](docs/images/screenshot.png)

## ✨ Features

- 💬 **Real-time Messaging**: Instant message delivery via WebSocket (Socket.IO)
- 🏢 **Servers**: Create and join community servers with custom invite codes
- 👥 **Friend System**: Add friends, see online status, send friend requests
- 🎨 **Rich Media**: Emoji picker, GIF support, file attachments
- 🔒 **Secure**: End-to-end encryption, secure authentication
- 🌍 **Multilingual**: Full English and Ukrainian translations
- 🔔 **Notifications**: Desktop notifications for new messages
- 🎯 **Threads**: Reddit-style discussion threads
- 🔄 **Auto-Updates**: Automatic application updates
- 📱 **Cross-Platform**: Windows, macOS, Linux support

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Electron App   │ ◄─────────────────► │   Express API   │
│  (React + TS)   │                     │   (Node.js)     │
└─────────────────┘                     └─────────────────┘
        │                                        │
        │                                        │
        ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│  Redux Store    │                     │  MongoDB Atlas  │
└─────────────────┘                     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/user4032/LUMYN.git
cd LUMYN

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Start development server
npm run dev
```

The app will open automatically at `http://localhost:5173`

### Building

```bash
# Build for production
npm run build

# Build desktop app
npm run build:desktop

# Platform-specific builds
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

## 📁 Project Structure

```
LUMYN/
├── src/
│   ├── main/                # Electron main process
│   ├── renderer/            # React application
│   │   ├── components/      # React components
│   │   ├── services/        # API & WebSocket services
│   │   ├── store/           # Redux state management
│   │   ├── utils/           # Utility functions
│   │   └── i18n/            # Translations
│   └── shared/              # Shared types/interfaces
├── server/
│   └── src/
│       ├── controllers/     # Request handlers
│       ├── services/        # Business logic
│       ├── routes/          # API routes
│       ├── middleware/      # Custom middleware
│       ├── models/          # Mongoose schemas
│       ├── validators/      # Input validation
│       └── config/          # Configuration
├── docs/                    # Documentation
├── release/                 # Built installers
└── tests/                   # Test suites
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run server tests only
npm run test:server

# Run client tests only
npm run test:client

# Generate coverage report
npm run test:coverage
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Material-UI** - Component library
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB + Mongoose** - Database
- **Socket.IO** - WebSocket server
- **Joi** - Input validation
- **Nodemailer** - Email service

### Desktop
- **Electron** - Desktop framework
- **electron-builder** - Packaging
- **electron-updater** - Auto-updates

### DevOps
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality
- **GitHub Actions** - CI/CD
- **CodeQL** - Security analysis

## 📖 API Documentation

API documentation is available at `/docs/api.md` or via Swagger UI at `http://localhost:4777/api-docs` when running in development.

### Example API Usage

```javascript
// Register new user
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Send message
POST /api/chats/:chatId/messages
{
  "content": "Hello, world!",
  "attachments": []
}
```

## 🔐 Environment Variables

```env
# Server
PORT=4777
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/lumyn

# Email (for verification codes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client
VITE_API_URL=http://localhost:4777
VITE_WS_URL=ws://localhost:4777
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for code of conduct and development guidelines.

### Development Guidelines

- Write tests for new features
- Follow ESLint/Prettier rules
- Use TypeScript for new code
- Update documentation
- Keep commits atomic and descriptive

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name** - [@user4032](https://github.com/user4032)

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Socket.IO](https://socket.io/)
- [Material-UI](https://mui.com/)
- All contributors and supporters

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/user4032/LUMYN?style=social)
![GitHub forks](https://img.shields.io/github/forks/user4032/LUMYN?style=social)
![GitHub issues](https://img.shields.io/github/issues/user4032/LUMYN)
![GitHub pull requests](https://img.shields.io/github/issues-pr/user4032/LUMYN)

## 🗺️ Roadmap

- [ ] Video/voice calls
- [ ] Screen sharing
- [ ] End-to-end encryption
- [ ] Mobile apps (React Native)
- [ ] Web version
- [ ] Plugin system
- [ ] Custom themes

See [ROADMAP.md](ROADMAP.md) for detailed future plans.

---

Made with ❤️ by LUMYN Team
```

#### 4.2 API Documentation

**File: `docs/API.md`**
```markdown
# LUMYN API Documentation

Base URL: `http://localhost:4777/api`

## Authentication

All authenticated endpoints require `Authorization` header:
```
Authorization: Bearer <session_token>
```

### Endpoints

#### POST /auth/register
Register new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, uppercase+lowercase+number)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "userId": "655abc...",
    "email": "user@example.com"
  }
}
```

**Errors:**
- 400: Validation failed
- 400: Email/username already exists

---

#### POST /auth/login
Login with credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "abc123...",
    "user": {
      "id": "655abc...",
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": "https://..."
    }
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Email not verified

---

#### GET /auth/me
Get current user profile.

**Headers:** Requires authentication

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "655abc...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### POST /chats/:chatId/messages
Send message to chat.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "content": "string (max 5000 chars)",
  "attachments": ["url1", "url2"],
  "replyTo": "messageId (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "msg123...",
    "content": "Hello, world!",
    "senderId": "655abc...",
    "chatId": "chat456...",
    "timestamp": "2024-01-01T12:00:00Z",
    "attachments": [],
    "replyTo": null
  }
}
```

---

... (continue for all endpoints)
```

#### 4.3 Architecture Diagram

**File: `docs/ARCHITECTURE.md`**
```markdown
# LUMYN Architecture

## System Overview

LUMYN consists of three main layers:

1. **Client Layer** (Electron + React)
2. **API Layer** (Express REST + WebSocket)
3. **Data Layer** (MongoDB)

## Data Flow

### Message Sending
```
User Input
   │
   ├─► ChatWindow Component
   │      │
   │      ├─► Redux Action (sendMessage)
   │      │
   │      └─► Socket.IO emit('send-message')
   │             │
   │             └─► Server Socket Handler
   │                    │
   │                    ├─► Validate & Save to MongoDB
   │                    │
   │                    └─► Broadcast to recipients
   │                           │
   │                           └─► Client receives
   │                                  │
   │                                  └─► Redux updates state
   │                                         │
   │                                         └─► UI re-renders
```

### Authentication Flow
```
Login Form
   │
   ├─► POST /api/auth/login
   │      │
   │      ├─► Validate credentials (bcrypt)
   │      │
   │      ├─► Create session token
   │      │
   │      └─► Return token + user data
   │             │
   │             └─► Store in Redux + LocalStorage
   │                    │
   │                    └─► Set Authorization header
   │                           │
   │                           └─► All future requests authenticated
```

## Component Hierarchy

### Frontend
```
App
├── SplashScreen (conditional)
├── Auth
│   ├── LoginForm
│   └── RegisterForm
└── MainLayout (authenticated)
    ├── Sidebar
    │   ├── UserProfile
    │   ├── ServerList
    │   └── FriendsList
    ├── ChatWindow
    │   ├── MessageList
    │   │   └── Message
    │   ├── MessageInput
    │   └── ChatHeader
    └── Dialogs
        ├── SettingsDialog
        ├── ProfileDialog
        └── ...others
```

### Backend
```
server.js
├── app.js (Express config)
├── routes/
│   ├── auth.routes.js → auth.controller.js → auth.service.js
│   ├── chat.routes.js → chat.controller.js → chat.service.js
│   └── ...
├── middleware/
│   ├── auth.middleware.js
│   ├── errorHandler.middleware.js
│   └── validation.middleware.js
├── models/ (Mongoose schemas)
└── config/
    ├── database.js
    └── socket.js
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  passwordHash: String,
  avatar: String,
  verified: Boolean,
  createdAt: Date,
  lastOnline: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  chatId: ObjectId (ref: 'Chat'),
  senderId: ObjectId (ref: 'User'),
  content: String,
  attachments: [String],
  replyTo: ObjectId (ref: 'Message'),
  reactions: [{
    userId: ObjectId,
    emoji: String
  }],
  timestamp: Date,
  edited: Boolean,
  deleted: Boolean
}
```

### Servers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  ownerId: ObjectId (ref: 'User'),
  members: [ObjectId] (ref: 'User'),
  inviteCode: String (unique),
  icon: String,
  channels: [{
    name: String,
    type: String (text/voice),
    chatId: ObjectId
  }],
  createdAt: Date
}
```

## Security

### Authentication
- Passwords hashed with bcrypt (cost factor: 12)
- Session tokens: 32-byte random hex strings
- Token expiry: 30 days
- Automatic session cleanup via TTL index

### Authorization
- Middleware checks session token validity
- Role-based access control (owner/admin/member)
- Server/chat membership verification

### Data Validation
- Joi schemas for all inputs
- Sanitization of user-generated content
- File upload size limits (10MB)

## Performance Optimizations

### Frontend
- Code splitting per route
- Lazy loading of components
- Virtual scrolling for message lists
- Debounced search inputs
- Memoized selectors (Reselect)

### Backend
- MongoDB indexes on frequently queried fields
- Connection pooling
- Rate limiting (100 req/min per IP)
- Compression middleware (gzip)

### Real-time
- Socket.IO room-based broadcasting
- Binary data support for files
- Automatic reconnection
- Heartbeat ping/pong

## Deployment

### Development
```
localhost:5173 (Vite dev server)
   │
   └─► localhost:4777 (Express API)
          │
          └─► localhost:27017 (MongoDB)
```

### Production
```
Electron App (packaged)
   │
   └─► railway.app/api (Express API)
          │
          └─► MongoDB Atlas (Cloud DB)
```

## Monitoring

- Server health endpoint: `/api/health`
- Electron crash reporting
- Socket.IO connection diagnostics
- MongoDB slow query logging
```

---

### Phase 5: Additional Enhancements (Week 4-5)
**Impact**: Low-Medium | **Effort**: Low-Medium | **Priority**: Low-Medium

#### 5.1 Rate Limiting

**Install:**
```bash
npm install express-rate-limit
```

**File: `server/src/middleware/rateLimiter.middleware.js`**
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
});

module.exports = { apiLimiter, authLimiter };
```

#### 5.2 Request Logging

**Install:**
```bash
npm install morgan
```

**File: `server/src/middleware/logger.middleware.js`**
```javascript
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

const morganMiddleware = morgan(
  ':method :url :status :response-time ms - :res[content-length]',
  { stream: accessLogStream }
);

module.exports = morganMiddleware;
```

#### 5.3 Swagger Documentation

**Install:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**File: `server/src/config/swagger.js`**
```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LUMYN API',
      version: '1.0.12',
      description: 'Real-time communication platform API',
    },
    servers: [
      {
        url: 'http://localhost:4777/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
```

**Usage in app.js:**
```javascript
const { swaggerUi, specs } = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

---

## 📊 Implementation Priority Matrix

| Phase | Priority | Impact | Effort | Timeline | Status |
|-------|----------|--------|--------|----------|--------|
| Server Refactoring | 🔴 Critical | High | High | Week 1-2 | ⏳ Pending |
| Testing Setup | 🟠 High | High | Medium | Week 2-3 | ⏳ Pending |
| CI/CD Pipeline | 🟠 High | Medium | Low | Week 3 | ⏳ Pending |
| Documentation | 🟡 Medium | Medium | Low | Week 4 | ⏳ Pending |
| Enhancements | 🟢 Low | Low-Med | Low-Med | Week 4-5 | ⏳ Pending |

---

## ✅ Implementation Checklist

### Week 1-2: Server Refactoring
- [ ] Create new folder structure (`controllers/`, `services/`, `routes/`, etc.)
- [ ] Extract authentication logic to `auth.service.js`
- [ ] Create `auth.controller.js` with route handlers
- [ ] Implement error handling middleware
- [ ] Add Joi validation schemas
- [ ] Implement `auth.routes.js`
- [ ] Repeat for chat, server, user, friend, thread modules
- [ ] Update `app.js` to use new structure
- [ ] Test all endpoints manually
- [ ] Update client API calls if needed

### Week 2-3: Testing
- [ ] Install Jest and testing libraries
- [ ] Configure Jest (`jest.config.js`, `jest.setup.js`)
- [ ] Write authentication service tests
- [ ] Write chat service tests
- [ ] Write authentication controller tests
- [ ] Write React component tests (ChatWindow, Message, etc.)
- [ ] Write Redux slice tests
- [ ] Achieve >70% code coverage
- [ ] Add test scripts to package.json

### Week 3: CI/CD
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/release.yml`
- [ ] Configure CodeQL security scanning
- [ ] Set up code coverage reporting (Codecov)
- [ ] Add status badges to README
- [ ] Test CI pipeline with sample PR

### Week 4: Documentation
- [ ] Write comprehensive README
- [ ] Create API documentation
- [ ] Add architecture diagrams
- [ ] Write CONTRIBUTING.md
- [ ] Document deployment process
- [ ] Add code examples
- [ ] Create screenshots/GIFs

### Week 4-5: Enhancements
- [ ] Implement rate limiting
- [ ] Add request logging (Morgan)
- [ ] Set up Swagger/OpenAPI docs
- [ ] Add security headers (Helmet)
- [ ] Implement CORS properly
- [ ] Add health check endpoints

---

## 🎯 Expected Outcomes

After completing this refactoring plan:

### Technical Improvements ✅
- **Maintainability**: Code is modular, easy to navigate and modify
- **Testability**: >70% test coverage, automated testing
- **Reliability**: Error handling, input validation, logging
- **Security**: Proper authentication, rate limiting, input sanitization
- **Scalability**: Service-based architecture allows easy feature additions

### Portfolio Impact 📈
- **Professional Structure**: Industry-standard MVC architecture
- **Quality Assurance**: Comprehensive test suite demonstrates reliability
- **DevOps Skills**: CI/CD pipeline shows automation expertise
- **Documentation**: Clear README and API docs show communication skills
- **Best Practices**: ESLint, Prettier, TypeScript, Git workflow

### Rating Progression
- **Current**: ~5/10 (working app, basic functionality)
- **After Phase 1-2**: ~7/10 (professional structure + tests)
- **After Phase 3-4**: ~8/10 (CI/CD + documentation)
- **After Phase 5**: ~8.5/10 (production-ready, polished)

---

## 💡 Tips for Success

1. **Incremental Refactoring**: Don't try to refactor everything at once. Start with one module (e.g., auth) and use it as a template.

2. **Test After Each Change**: After refactoring a module, test it thoroughly before moving to the next.

3. **Git Workflow**: 
   - Create feature branches for each phase
   - Make small, atomic commits
   - Write descriptive commit messages

4. **Documentation As You Go**: Update docs immediately after implementing features, not later.

5. **Seek Feedback**: Share progress with peers/mentors for code review.

6. **Use AI Tools**: Leverage ChatGPT/Copilot for boilerplate code generation, test writing.

---

## 📚 Learning Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Mongoose Best Practices](https://mongoosejs.com/docs/guide.html)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Next Step**: Start with Phase 1 by creating the new folder structure and refactoring the authentication module. This will serve as a template for all other modules.

Good luck! 🚀
