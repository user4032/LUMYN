# 🧪 Testing Guide - Quick Start Examples

## Setup Jest (5 minutes)

### 1. Install Dependencies

```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  supertest \
  mongodb-memory-server
```

### 2. Create Configuration Files

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
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

**File: `jest.setup.js`**
```javascript
import '@testing-library/jest-dom';

// Mock Electron IPC
global.window.electron = {
  ipcRenderer: {
    send: jest.fn(),
    on: jest.fn(),
    invoke: jest.fn().mockResolvedValue(undefined),
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock WebSocket
global.WebSocket = jest.fn();
```

### 3. Update package.json

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

## Backend Testing Examples

### Testing Services

**File: `server/src/services/__tests__/auth.service.test.js`**

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const authService = require('../auth.service');
const User = require('../../models/User');

let mongoServer;

// Setup: Start in-memory MongoDB
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Stop MongoDB and disconnect
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      };

      const result = await authService.registerUser(userData);

      // Assertions
      expect(result).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.email).toBe(userData.email);

      // Verify user in database
      const user = await User.findById(result.userId);
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
      expect(user.verified).toBe(false);
      expect(user.passwordHash).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error if email already exists', async () => {
      // Create existing user
      await User.create({
        username: 'existing',
        email: 'existing@example.com',
        passwordHash: 'hashedpass',
      });

      // Attempt to register with same email
      await expect(
        authService.registerUser({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error if username already taken', async () => {
      await User.create({
        username: 'existinguser',
        email: 'email1@example.com',
        passwordHash: 'hashedpass',
      });

      await expect(
        authService.registerUser({
          username: 'existinguser',
          email: 'email2@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow('Username already taken');
    });

    it('should hash the password', async () => {
      const result = await authService.registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'MyPassword123',
      });

      const user = await User.findById(result.userId);
      expect(user.passwordHash).not.toBe('MyPassword123');
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create and verify a test user before each login test
      const { userId } = await authService.registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      });
      await User.findByIdAndUpdate(userId, { verified: true });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.loginUser({
        email: 'test@example.com',
        password: 'Test1234',
      });

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.username).toBe('testuser');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.loginUser({
          email: 'nonexistent@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.loginUser({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user not verified', async () => {
      // Create unverified user
      await authService.registerUser({
        username: 'unverified',
        email: 'unverified@example.com',
        password: 'Test1234',
      });

      await expect(
        authService.loginUser({
          email: 'unverified@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow('Please verify your email first');
    });

    it('should create a session token', async () => {
      const result = await authService.loginUser({
        email: 'test@example.com',
        password: 'Test1234',
      });

      expect(result.token).toHaveLength(64); // 32 bytes hex = 64 chars
    });
  });
});
```

### Testing API Endpoints

**File: `server/src/routes/__tests__/auth.routes.test.js`**

```javascript
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

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

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePass123',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Registration successful');
    expect(response.body.data.userId).toBeDefined();
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'invalid-email',
        password: 'SecurePass123',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 400 for weak password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for short username', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab',
        email: 'test@example.com',
        password: 'SecurePass123',
      })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create verified user for login tests
    await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234',
    });

    await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { verified: true }
    );
  });

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should return 401 for non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test1234',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
```

---

## Frontend Testing Examples

### Testing React Components

**File: `src/renderer/components/ChatWindow/__tests__/ChatWindow.test.tsx`**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatWindow from '../ChatWindow';
import chatReducer from '../../../store/chatSlice';

// Mock socket service
jest.mock('../../../services/socket', () => ({
  socket: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
    },
    preloadedState: {
      chat: {
        messages: [],
        currentChatId: null,
        loading: false,
        ...initialState,
      },
    },
  });
};

describe('ChatWindow', () => {
  it('should render without crashing', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  it('should display messages', () => {
    const store = createMockStore({
      messages: [
        {
          id: '1',
          content: 'Hello, world!',
          senderId: 'user1',
          timestamp: Date.now(),
        },
        {
          id: '2',
          content: 'How are you?',
          senderId: 'user2',
          timestamp: Date.now(),
        },
      ],
    });

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('should send message when user types and clicks send', async () => {
    const user = userEvent.setup();
    const store = createMockStore({ currentChatId: 'chat1' });
    
    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    expect(input).toHaveValue('Test message');

    await user.click(sendButton);

    // Input should be cleared after sending
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show loading state', () => {
    const store = createMockStore({ loading: true });

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    const store = createMockStore({ messages: [] });

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>
    );

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });
});
```

### Testing Redux Slices

**File: `src/renderer/store/__tests__/authSlice.test.ts`**

```typescript
import authReducer, {
  loginSuccess,
  logout,
  setUser,
} from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginSuccess', () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };
    const token = 'abc123token';

    const actual = authReducer(
      initialState,
      loginSuccess({ user, token })
    );

    expect(actual.user).toEqual(user);
    expect(actual.token).toBe(token);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'abc123',
      isAuthenticated: true,
      loading: false,
      error: null,
    };

    const actual = authReducer(loggedInState, logout());

    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });

  it('should handle setUser', () => {
    const user = {
      id: '1',
      username: 'updateduser',
      email: 'updated@example.com',
    };

    const actual = authReducer(initialState, setUser(user));

    expect(actual.user).toEqual(user);
  });
});
```

### Testing API Services

**File: `src/renderer/api/__tests__/auth.test.ts`**

```typescript
import axios from 'axios';
import { registerUser, loginUser } from '../auth';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should call POST /auth/register with correct data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
      };

      const mockResponse = {
        data: {
          success: true,
          data: { userId: '123', email: 'test@example.com' },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await registerUser(userData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/register',
        userData
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should throw error on failed registration', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { message: 'Email already exists' } },
      });

      await expect(
        registerUser({
          username: 'test',
          email: 'test@example.com',
          password: 'Test1234',
        })
      ).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    it('should return token and user on successful login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test1234',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'abc123',
            user: { id: '1', username: 'testuser', email: 'test@example.com' },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await loginUser(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.token).toBe('abc123');
      expect(result.user.username).toBe('testuser');
    });
  });
});
```

---

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run only server tests
npm run test:server

# Run only client tests
npm run test:client

# Generate coverage report
npm run test:coverage
```

### Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in a browser to see detailed coverage.

**Target Coverage Goals:**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

---

## Best Practices

### ✅ Do
- Test behavior, not implementation
- Use descriptive test names (`it('should...', () => {})`)
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Clean up after tests (afterEach, afterAll)
- Test edge cases and error scenarios
- Keep tests simple and focused

### ❌ Don't
- Test implementation details
- Write tests that depend on each other
- Mock everything (test real logic when possible)
- Skip cleanup
- Test framework code (React, Redux internals)
- Have overly complex test setups

---

## Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npm test -- auth.service.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Update snapshots
npm test -- -u
```

---

## Next Steps

1. Start with easy tests (utility functions, simple components)
2. Gradually add tests for complex logic (services, reducers)
3. Aim for >70% coverage before considering it "complete"
4. Add tests to CI/CD pipeline (see REFACTORING_PLAN.md)
5. Write tests for new features BEFORE implementing them (TDD)

**Remember**: Good tests are worth their weight in gold! 🏆
