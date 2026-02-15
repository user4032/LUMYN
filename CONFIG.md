# LUMYN Configuration Guide

Complete environment and configuration documentation for LUMYN Messenger.

## Environment Variables (.env)

Create `.env` file in the project root. Use `.env.example` as template.

### Required Variables

#### Server Configuration
```env
# Server Port
PORT=4777

# Database Connection
MONGODB_URI=mongodb://localhost:27017/lumyn

# Frontend API URL
VITE_API_URL=http://localhost:4777

# JWT Secret (use strong random string in production)
JWT_SECRET=your-secure-secret-key-change-in-production
```

#### Email Configuration (Optional)
```env
# Email provider settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Email settings
EMAIL_FROM=noreply@lumyn.messenger
EMAIL_FROM_NAME=LUMYN Messenger
```

### Optional Variables

```env
# Environment
NODE_ENV=development

# Debugging
DEBUG=false
DEBUG_LEVEL=info    # error, warn, info, debug, trace

# Frontend Configuration
VITE_APP_NAME=LUMYN Messenger
VITE_APP_VERSION=1.0.0

# Electron Configuration
ELECTRON_DEV=true
ELECTRON_DEBUG=false

# Database Options
MONGODB_POOL_SIZE=10
MONGODB_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your-session-secret-key
SESSION_EXPIRY=86400000    # 24 hours in milliseconds

# Socket.IO
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
SOCKET_IO_CORS_CREDENTIALS=true

# JWT
JWT_EXPIRY=7d    # 7 days

# File Upload
MAX_FILE_SIZE=5242880    # 5MB in bytes
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_FORMAT=json    # json or simple

# Features
FEATURE_MESSAGE_REACTIONS=true
FEATURE_MESSAGE_THREADS=true
FEATURE_DISAPPEARING_MESSAGES=true
FEATURE_FILE_UPLOAD=true
FEATURE_VOICE_MESSAGES=false    # Coming soon
FEATURE_VIDEO_CALLS=false       # Coming soon
```

---

## Configuration Files

### vite.config.ts (Frontend Build)

```typescript
// Core configuration for React development
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/renderer/components',
      '@pages': '/src/renderer/pages',
      '@store': '/src/renderer/store',
      '@i18n': '/src/renderer/i18n',
      '@types': '/src/renderer/types',
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

### tsconfig.json (TypeScript)

Key compiler options:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/renderer/components/*"],
      "@pages/*": ["./src/renderer/pages/*"]
    }
  }
}
```

### electron-builder.yml (Desktop Build)

Configuration for building Electron app:
```yaml
appId: com.lumyn.messenger
productName: LUMYN Messenger
directories:
  buildResources: assets
  output: release
files:
  - from: dist/main
    to: app/main
  - from: dist/preload
    to: app/preload
  - from: dist/renderer
    to: app/renderer
extraMetadata:
  main: app/main/index.js
win:
  target: [nsis, portable]
  certificateFile: null
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
mac:
  target: [dmg, zip]
  certificateFile: null
linux:
  target: [AppImage, deb]
```

---

## Database Configuration

### MongoDB Connection

#### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/lumyn
```

#### MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lumyn?retryWrites=true&w=majority
```

#### MongoDB Options
```env
# Connection pooling
MONGODB_POOL_SIZE=10

# Connection timeout
MONGODB_TIMEOUT=30000

# Authentication database
MONGODB_AUTH_SOURCE=admin

# SSL/TLS
MONGODB_SSL=true
MONGODB_CERT_FILE=/path/to/cert.pem
```

### Database Initialization

```javascript
// Mongoose connection setup
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE),
  connectTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT),
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT),
});
```

---

## Frontend Configuration

### API Configuration

```typescript
// src/config/api.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4777',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

### i18n Configuration

```typescript
// src/renderer/i18n/index.ts
export const AVAILABLE_LANGUAGES = {
  en: 'English',
  uk: 'Українська',
};

export const DEFAULT_LANGUAGE = 'en';
```

### Redux Store Configuration

```typescript
// src/renderer/store/index.ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatsReducer,
    messages: messagesReducer,
    users: usersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
```

---

## Backend Configuration

### Express Server

```typescript
// server/index.ts
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: JSON.parse(process.env.CORS_CREDENTIALS),
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/messages', messagesRoutes);
```

### Socket.IO Configuration

```typescript
// Socket.IO server setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN,
    credentials: JSON.parse(process.env.SOCKET_IO_CORS_CREDENTIALS),
  },
});

// Namespaces
io.of('/messages').on('connection', (socket) => {
  // Message handlers
});

io.of('/presence').on('connection', (socket) => {
  // Presence handlers
});
```

---

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=4777

EXPOSE 4777

CMD ["npm", "run", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5173:5173"
      - "4777:4777"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/lumyn
      - NODE_ENV=production
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

---

## Security Configuration

### HTTPS/SSL

For production deployment:

```env
# Enable HTTPS
HTTPS=true
CERT_FILE=/path/to/cert.pem
KEY_FILE=/path/to/key.pem

# HSTS
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000    # 1 year
```

### Authentication

```env
# JWT Configuration
JWT_SECRET=your-strong-random-secret-min-32-chars
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=30d

# Session Configuration
SESSION_SECRET=your-session-secret-min-32-chars
SESSION_COOKIE_SECURE=true        # HTTPS only
SESSION_COOKIE_HTTP_ONLY=true     # No JS access
SESSION_COOKIE_SAME_SITE=strict
```

### Rate Limiting

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # Per window
RATE_LIMIT_KEY_PREFIX=rl:         # Redis key prefix
```

---

## Logging Configuration

### Log Levels
- `error` - Error messages only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging info
- `trace` - Very detailed trace info

### Log Format Configuration

```env
# JSON format (recommended for production)
LOG_FORMAT=json

# Simple format (good for development)
LOG_FORMAT=simple

# Log location
LOG_FILE=./logs/app.log
LOG_DIR=./logs
LOG_MAX_SIZE=10m              # Rotate at 10MB
LOG_MAX_FILES=5               # Keep 5 files
```

---

## Performance Tuning

### Database Optimization

```env
# MongoDB read preference
MONGODB_READ_PREFERENCE=secondary
MONGODB_READ_PREFERENCE_TAGS=[]

# Connection pooling
MONGODB_POOL_SIZE=10
MONGODB_MAX_IDLE_TIME=45000

# Query timeout
MONGODB_SOCKET_TIMEOUT=30000
```

### Cache Configuration

```env
# Redis (if using)
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_PASSWORD=

# Cache TTL
CACHE_TTL_SHORT=300000        # 5 minutes
CACHE_TTL_MEDIUM=900000       # 15 minutes
CACHE_TTL_LONG=3600000        # 1 hour
```

### Frontend Optimization

```typescript
// Webpack/Vite optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
  },
});
```

---

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
DEBUG=true
DEBUG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/lumyn-dev
VITE_API_URL=http://localhost:4777
```

### Staging
```env
NODE_ENV=staging
DEBUG=false
DEBUG_LEVEL=info
MONGODB_URI=mongodb+srv://...@staging.mongodb.net/lumyn-staging
VITE_API_URL=https://staging-api.lumyn.app
```

### Production
```env
NODE_ENV=production
DEBUG=false
DEBUG_LEVEL=error
MONGODB_URI=mongodb+srv://...@prod.mongodb.net/lumyn
VITE_API_URL=https://api.lumyn.app
HTTPS=true
HSTS_ENABLED=true
```

---

## Configuration Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use `.env.example`** - Commit template with placeholders
3. **Validate at startup** - Check all required variables exist
4. **Use strong secrets** - Generate with `openssl rand -hex 32`
5. **Rotate secrets regularly** - Especially JWT secret
6. **Use environment-specific files** - `.env.development`, `.env.production`
7. **Document all variables** - Keep this guide updated
8. **Use type checking** - Validate env var types at startup

---

## Validation Script

```typescript
// Validate environment variables on startup
const requiredVars = [
  'PORT',
  'MONGODB_URI',
  'VITE_API_URL',
  'JWT_SECRET',
];

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

For more information, see:
- [INSTALL.md](INSTALL.md) - Installation guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [README.md](README.md) - Project overview
