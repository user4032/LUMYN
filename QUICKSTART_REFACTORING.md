# 🚀 Quick Start Guide - Server Refactoring

## Step 1: Create New Structure (5 minutes)

```bash
# Create new directories
mkdir -p server/src/{controllers,services,routes,middleware,validators,utils,config}

# Move existing files
mv server/models server/src/models
mv server/database.js server/src/config/database.js
```

## Step 2: Install Dependencies (2 minutes)

```bash
npm install joi express-rate-limit morgan
npm install --save-dev jest @types/jest supertest mongodb-memory-server
```

## Step 3: Create Core Middleware (10 minutes)

### File: `server/src/middleware/errorHandler.middleware.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;
  
  console.error('ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
```

### File: `server/src/middleware/auth.middleware.js`

```javascript
const Session = require('../models/Session');
const User = require('../models/User');
const { AppError } = require('./errorHandler.middleware');

const requireAuth = async (req, res, next) => {
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

module.exports = { requireAuth };
```

## Step 4: Create Auth Module (30 minutes)

### File: `server/src/validators/auth.validator.js`

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
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

### File: `server/src/services/auth.service.js`

```javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const VerificationCode = require('../models/VerificationCode');
const { AppError } = require('../middleware/errorHandler.middleware');
const nodemailer = require('nodemailer');

class AuthService {
  async registerUser({ username, email, password }) {
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

    // Send email (simplified for example)
    await this.sendVerificationEmail(email, code);

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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  async sendVerificationEmail(email, code) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your LUMYN account',
      html: `<p>Your verification code is: <strong>${code}</strong></p>`,
    });
  }
}

module.exports = new AuthService();
```

### File: `server/src/controllers/auth.controller.js`

```javascript
const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errorHandler.middleware');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.validatedData);
  
  res.status(201).json({
    success: true,
    message: 'Registration successful. Check your email for verification code.',
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
```

### File: `server/src/routes/auth.routes.js`

```javascript
const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
```

## Step 5: Update Main Server File (10 minutes)

### File: `server/src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

// Middleware
app.use(cors({ origin: process.env.SOCKET_IO_CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);

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

module.exports = app;
```

### File: `server/index.js`

```javascript
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 4777;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected');

    const server = http.createServer(app);

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

## Step 6: Test Your Changes (5 minutes)

```bash
# Test registration
curl -X POST http://localhost:4777/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Test login
curl -X POST http://localhost:4777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Test health
curl http://localhost:4777/api/health
```

## Step 7: Continue With Other Modules

Now that you have the auth module refactored, use the same pattern for:

1. **Chat Module** (`chat.service.js`, `chat.controller.js`, `chat.routes.js`)
2. **User Module** (`user.service.js`, `user.controller.js`, `user.routes.js`)
3. **Server Module** (`server.service.js`, `server.controller.js`, `server.routes.js`)
4. **Friend Module** (`friend.service.js`, `friend.controller.js`, `friend.routes.js`)

Each module should follow this structure:
```
routes → controller → service → model
   ↓         ↓           ↓
validate  handle      business
input    request      logic
```

## Common Pitfalls to Avoid

❌ **Don't**:
- Mix business logic in controllers
- Put validation in services
- Directly access models from controllers
- Forget to handle errors properly
- Skip input validation

✅ **Do**:
- Keep controllers thin (just request/response handling)
- Put all business logic in services
- Validate all inputs at route level
- Use asyncHandler for all async routes
- Return consistent response format

## Need Help?

Reference the full [REFACTORING_PLAN.md](REFACTORING_PLAN.md) for detailed examples of all modules.

---

Time estimate for full refactoring: **2-3 weeks** (part-time)

**Remember**: Commit after each module is working! 🎯
