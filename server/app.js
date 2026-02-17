const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection
const { connectDB } = require('./config/database');

// Middlewares
const { errorHandler } = require('./middlewares/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const serverRoutes = require('./routes/serverRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Get allowed origins from environment
const getAllowedOrigins = () => {
  const apiUrl = process.env.VITE_API_URL;
  const corsOrigin = process.env.SOCKET_IO_CORS_ORIGIN;

  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  if (apiUrl && apiUrl !== 'http://localhost:4777') {
    origins.push(apiUrl);
  }

  if (corsOrigin && corsOrigin !== '*') {
    origins.push(corsOrigin);
  }

  return corsOrigin === '*' ? '*' : origins;
};

// Socket.IO setup
const io = require('socket.io')(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// Store Socket.IO instance in app for use in controllers
app.set('io', io);

const PORT = process.env.PORT || process.env.AUTH_PORT || 4777;

// Active users tracking: {userId: Set<socketId>}
const onlineUsers = new Map();

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/friends', friendRoutes);
app.use('/servers', serverRoutes);
app.use('/messages', messageRoutes);
app.use('/chats', chatRoutes);
app.use('/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // User comes online
  socket.on('user:online', (userId) => {
    if (!userId) return;

    // Add socket to user's active connections
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Join user's personal room for targeted messages
    socket.join(userId);
    
    console.log(`[Socket.IO] User ${userId} is online (socket: ${socket.id})`);
    
    // Broadcast online status to all connected clients
    io.emit('user:status', { userId, status: 'online' });
  });

  // Typing indicators
  socket.on('typing:start', (data) => {
    const { chatId, userId } = data || {};
    if (chatId && userId) {
      socket.to(chatId).emit('typing:start', { chatId, userId });
    }
  });

  socket.on('typing:stop', (data) => {
    const { chatId, userId } = data || {};
    if (chatId && userId) {
      socket.to(chatId).emit('typing:stop', { chatId, userId });
    }
  });

  // Chat events
  socket.on('chat:join', (data) => {
    const { chatId } = data || {};
    if (chatId) {
      socket.join(chatId);
      console.log(`[Socket.IO] User ${socket.id} joined chat ${chatId}`);
    }
  });

  socket.on('chat:leave', (data) => {
    const { chatId } = data || {};
    if (chatId) {
      socket.leave(chatId);
      console.log(`[Socket.IO] User ${socket.id} left chat ${chatId}`);
    }
  });

  // Message events
  socket.on('message:send', (data) => {
    const { chatId, message } = data || {};
    if (chatId && message) {
      // Broadcast to chat room
      io.to(chatId).emit('message:receive', { chatId, message });
      console.log(`[Socket.IO] Message sent in chat ${chatId}`);
    }
  });

  socket.on('message:edit', (data) => {
    const { chatId, messageId, newContent } = data || {};
    if (chatId && messageId) {
      io.to(chatId).emit('message:edit', { chatId, messageId, newContent });
    }
  });

  socket.on('message:delete', (data) => {
    const { chatId, messageId } = data || {};
    if (chatId && messageId) {
      io.to(chatId).emit('message:delete', { chatId, messageId });
    }
  });

  socket.on('message:reaction', (data) => {
    const { chatId, messageId, emoji, userId, action } = data || {};
    if (chatId && messageId) {
      io.to(chatId).emit('message:reaction', { chatId, messageId, emoji, userId, action });
    }
  });

  // Status updates
  socket.on('user:status:update', (data) => {
    const { userId, status } = data || {};
    if (userId) {
      io.emit('user:status', { userId, status });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    
    // Remove socket from all users
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        
        // If user has no more active connections, mark as offline
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          io.emit('user:status', { userId, status: 'offline' });
          console.log(`[Socket.IO] User ${userId} is offline`);
        }
        break;
      }
    }
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log dev mode status
      const devMode = String(process.env.AUTH_DEV_CODE || '').toLowerCase() === 'true';
      if (devMode) {
        console.log(`   🔧 DEV MODE: Verification codes will be shown in responses`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
module.exports = { app, server, io };

// Start server if running directly
if (require.main === module) {
  startServer();
}
