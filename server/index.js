const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// MongoDB
const { connectDB } = require('./database');
const User = require('./models/User');
const Session = require('./models/Session');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Server = require('./models/Server');
const Notification = require('./models/Notification');
const VerificationCode = require('./models/VerificationCode');
const FriendRequest = require('./models/FriendRequest');
const Friendship = require('./models/Friendship');
const Block = require('./models/Block');
const ChatSettings = require('./models/ChatSettings');

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

const io = require('socket.io')(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 50 * 1024 * 1024
});

const PORT = process.env.PORT || process.env.AUTH_PORT || 4777;
const DEV_CODE = String(process.env.AUTH_DEV_CODE || '').toLowerCase() === 'true';

// Зберігаємо активних користувачів {userId: Set<socketId>} для підтримки множинних вкладок
const onlineUsers = new Map();

app.use(cors({ 
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const dataPath = path.join(__dirname, 'disgram.auth.json');
const loadStore = () => {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], verificationCodes: [], sessions: [] };
  }
};

const saveStore = (store) => {
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
};

const store = loadStore();
store.users = store.users || [];
store.verificationCodes = store.verificationCodes || [];
store.sessions = store.sessions || [];
store.friendRequests = store.friendRequests || [];
store.friends = store.friends || [];
store.servers = store.servers || [];
store.messages = store.messages || [];
store.threadsPosts = store.threadsPosts || [];
store.threadsFollows = store.threadsFollows || [];
store.userChats = store.userChats || {};

// Migration: Add username to existing users that don't have it
store.users = store.users.map((user) => {
  if (!user.username) {
    user.username = user.email.split('@')[0];
  }
  return user;
});
saveStore(store);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const createCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');
const createToken = () => crypto.randomBytes(32).toString('hex');

const sendVerificationEmail = async (email, code) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP is not configured');
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'LUMYN verification code',
    text: `Your LUMYN verification code is: ${code}`,
  });
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

const getUserByUsername = async (username) => {
  const normalized = String(username).trim().toLowerCase();
  return await User.findOne({ username: normalized });
};

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const session = await Session.findOne({ token });
  if (!session || session.expiresAt < new Date()) {
    await Session.deleteOne({ token });
    return res.status(401).json({ error: 'Session expired' });
  }

  const user = await User.findById(session.userId);
  if (!user) return res.status(404).json({ error: 'Account not found' });

  // Update last activity
  session.lastActivity = new Date();
  await session.save();

  req.user = user;
  next();
};

const createInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

app.post('/auth/register', async (req, res) => {
  const { email, password, displayName, username } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const name = String(displayName || normalizedEmail.split('@')[0] || 'User').trim();
  const userUsername = String(username || normalizedEmail.split('@')[0]).trim();
  
  // Валідація username
  if (userUsername.length < 4 || !/^[a-zA-Z0-9._-]+$/.test(userUsername)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  
  // Перевірка чи username вже зайнятий
  const existingUsername = await getUserByUsername(userUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  
  const passwordHash = await bcrypt.hash(String(password), 10);

  const existing = await getUserByEmail(normalizedEmail);
  if (existing && existing.verified) {
    return res.status(409).json({ error: 'Account already exists' });
  }

  if (existing && !existing.verified) {
    // Перевірка чи новий username не зайнятий іншим користувачем
    const usernameConflict = await User.findOne({
      _id: { $ne: existing._id },
      username: userUsername.toLowerCase()
    });
    if (usernameConflict) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    existing.passwordHash = passwordHash;
    existing.displayName = name;
    existing.username = userUsername.toLowerCase();
    await existing.save();

    await VerificationCode.deleteMany({ userId: existing._id });
    const code = createCode();
    await VerificationCode.create({
      userId: existing._id,
      codeHash: hashValue(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (err) {
      if (DEV_CODE) {
        return res.json({ ok: true, needsVerification: true, devCode: code });
      }
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    return res.json({ ok: true, needsVerification: true });
  }

  const newUser = await User.create({
    email: normalizedEmail,
    username: userUsername.toLowerCase(),
    passwordHash,
    displayName: name,
    verified: false,
  });

  const code = createCode();
  await VerificationCode.create({
    userId: newUser._id,
    codeHash: hashValue(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (err) {
    if (DEV_CODE) {
      return res.json({ ok: true, needsVerification: true, devCode: code });
    }
    return res.status(500).json({ error: 'Failed to send verification email' });
  }

  return res.json({ ok: true, needsVerification: true });
});

app.post('/auth/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await getUserByEmail(String(email).trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.verified) return res.status(400).json({ error: 'Account already verified' });

  const code = createCode();
  await VerificationCode.deleteMany({ userId: user._id });
  await VerificationCode.create({
    userId: user._id,
    codeHash: hashValue(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendVerificationEmail(user.email, code);
  } catch (err) {
    if (DEV_CODE) {
      return res.json({ ok: true, devCode: code });
    }
    return res.status(500).json({ error: 'Failed to send verification email' });
  }

  return res.json({ ok: true });
});

app.post('/auth/verify', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const user = await getUserByEmail(String(email).trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'Account not found' });

  const entry = await VerificationCode.findOne({ userId: user._id }).sort({ expiresAt: -1 });

  if (!entry || entry.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Verification code expired' });
  }

  if (hashValue(String(code).trim()) !== entry.codeHash) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  user.verified = true;
  await user.save();
  await VerificationCode.deleteMany({ userId: user._id });

  return res.json({ ok: true });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await getUserByEmail(String(email).trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (!user.verified) return res.status(403).json({ error: 'Email not verified' });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = createToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Session.create({ token, userId: user._id, expiresAt });

  return res.json({
    ok: true,
    token,
    user: {
      id: String(user._id),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      customStatus: user.customStatus,
      bio: user.bio,
      profileBanner: user.profileBanner || '',
      profileFrame: user.profileFrame || 'default',
    },
  });
});

app.get('/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const session = await Session.findOne({ token });
  if (!session || session.expiresAt < new Date()) {
    await Session.deleteOne({ token });
    return res.status(401).json({ error: 'Session expired' });
  }

  const user = await User.findById(session.userId);
  if (!user) return res.status(404).json({ error: 'Account not found' });

  return res.json({
    ok: true,
    user: {
      id: String(user._id),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      customStatus: user.customStatus,
      bio: user.bio,
      profileBanner: user.profileBanner || '',
      profileFrame: user.profileFrame || 'default',
    },
  });
});

app.post('/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(400).json({ error: 'Token required' });

  await Session.deleteOne({ token });
  return res.json({ ok: true });
});

// Get user's chats
app.get('/auth/chats', requireAuth, async (req, res) => {
  const chats = await Chat.find({ 'participants.userId': req.user._id });
  // Перетворення MongoDB документів у формат, який очікує фронтенд
  const userChats = chats.map(chat => ({
    chatId: chat.chatId || (chat.type === 'saved' ? 'saved_messages' : String(chat._id)),
    name: chat.name,
    type: chat.type,
    avatar: chat.avatar,
    participants: chat.participants,
    lastMessage: chat.lastMessage,
    settings: chat.settings,
  }));
  res.json({ ok: true, chats: userChats });
});

// Save user's chats
app.post('/auth/chats/save', requireAuth, async (req, res) => {
  const { chats } = req.body || {};
  if (!Array.isArray(chats)) return res.status(400).json({ error: 'Chats array required' });
  
  // Оновлюємо або створюємо кожен чат
  for (const chatData of chats) {
    const chatId = chatData.chatId || chatData.id;
    if (!chatId) {
      continue;
    }

    const { participants, ...chatPayload } = chatData;
    await Chat.findOneAndUpdate(
      { chatId },
      {
        $set: chatPayload,
        $addToSet: {
          participants: {
            userId: req.user._id,
            username: req.user.username,
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
  
  res.json({ ok: true });
});

app.post('/auth/profile', requireAuth, async (req, res) => {
  const { username, displayName, bio, customStatus, status, avatar, profileBanner, profileFrame } = req.body || {};
  
  console.log('[POST /auth/profile] Received data:', { 
    username, 
    displayName, 
    bio, 
    customStatus, 
    status, 
    avatarSize: avatar ? avatar.length : 0 
  });
  
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Валідація username
  if (username) {
    if (username.length < 4) {
      return res.status(400).json({ error: 'Username must be at least 4 characters' });
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    // Перевіримо, чи не зайнятий username іншим користувачем
    const existingUser = await User.findOne({ 
      username: username.toLowerCase(), 
      _id: { $ne: req.user._id } 
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    user.username = username.toLowerCase();
  }

  if (displayName) user.displayName = String(displayName).trim();
  if (bio !== undefined) user.bio = String(bio).trim();
  if (customStatus !== undefined) user.customStatus = String(customStatus).trim();
  if (status) user.status = status;
  if (avatar) user.avatar = avatar;  // Тільки якщо передано
  if (profileBanner !== undefined) user.profileBanner = String(profileBanner || '').trim();
  if (profileFrame !== undefined) user.profileFrame = String(profileFrame || 'default').trim();

  await user.save();

  // Відправляємо оновлення профілю всім онлайн користувачам
  if (avatar || displayName || username) {
    io.emit('user:profile:update', {
      userId: String(user._id),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    });
  }

  console.log('[POST /auth/profile] Returning user object:', {
    username: user.username,
    avatar: user.avatar,
    status: user.status,
    bio: user.bio,
  });

  return res.json({
    ok: true,
    user: {
      id: String(user._id),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      customStatus: user.customStatus,
      bio: user.bio,
      avatar: user.avatar,
      profileBanner: user.profileBanner || '',
      profileFrame: user.profileFrame || 'default',
    },
  });
});

// Пошук користувачів по username (як у Telegram)
app.get('/users/search', requireAuth, async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.json({ ok: true, users: [] });
  }
  
  const searchQuery = String(query).toLowerCase();
  const currentUserId = req.user._id;
  
  // Шукаємо користувачів по username або displayName
  const results = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { username: { $regex: searchQuery, $options: 'i' } },
      { displayName: { $regex: searchQuery, $options: 'i' } },
    ],
  })
    .limit(20)
    .select('_id username displayName avatar status bio');
  
  return res.json({ 
    ok: true, 
    users: results.map(u => ({
      id: String(u._id),
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      status: u.status,
      bio: u.bio,
    }))
  });
});

app.get('/friends/list', requireAuth, async (req, res) => {
  const userId = req.user._id;
  
  // Знаходимо всі дружби
  const friendships = await Friendship.find({
    $or: [{ userA: userId }, { userB: userId }]
  });
  
  // Отримуємо ID друзів
  const friendIds = friendships.map(f => 
    f.userA.toString() === userId.toString() ? f.userB : f.userA
  );
  
  // Завантажуємо дані друзів
  const friends = await User.find({ _id: { $in: friendIds } })
    .select('_id email username displayName');
  
  // Вхідні запити
  const incomingRequests = await FriendRequest.find({
    toUserId: userId,
    status: 'pending'
  }).populate('fromUserId', '_id email username displayName');
  
  // Вихідні запити
  const outgoingRequests = await FriendRequest.find({
    fromUserId: userId,
    status: 'pending'
  }).populate('toUserId', '_id email username displayName');

  return res.json({ 
    ok: true, 
    friends: friends.map(f => ({
      id: String(f._id),
      email: f.email,
      username: f.username,
      displayName: f.displayName,
    })),
    incoming: incomingRequests.map(r => ({
      id: String(r._id),
      user: {
        id: String(r.fromUserId._id),
        email: r.fromUserId.email,
        username: r.fromUserId.username,
        displayName: r.fromUserId.displayName,
      },
      createdAt: r.createdAt,
    })),
    outgoing: outgoingRequests.map(r => ({
      id: String(r._id),
      user: {
        id: String(r.toUserId._id),
        email: r.toUserId.email,
        username: r.toUserId.username,
        displayName: r.toUserId.displayName,
      },
      createdAt: r.createdAt,
    }))
  });
});

app.post('/friends/request', requireAuth, async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const toUser = await getUserByUsername(username);
  if (!toUser) return res.status(404).json({ error: 'User not found' });
  if (toUser._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: 'Cannot add yourself' });
  }

  // Перевіряємо, чи вже друзі
  const alreadyFriends = await Friendship.findOne({
    $or: [
      { userA: req.user._id, userB: toUser._id },
      { userA: toUser._id, userB: req.user._id }
    ]
  });
  if (alreadyFriends) return res.status(409).json({ error: 'Already friends' });

  // Перевіряємо, чи є запит
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { fromUserId: req.user._id, toUserId: toUser._id },
      { fromUserId: toUser._id, toUserId: req.user._id }
    ],
    status: 'pending'
  });
  if (existingRequest) return res.status(409).json({ error: 'Request already exists' });

  await FriendRequest.create({
    fromUserId: req.user._id,
    toUserId: toUser._id,
  });

  // Створюємо сповіщення для одержувача
  const notification = await Notification.create({
    userId: toUser._id,
    type: 'friend_request',
    title: req.user.username,
    content: `Розіслав вам запит дружби`,
    data: {
      fromUserId: String(req.user._id),
      fromUsername: req.user.username,
    },
  });

  // Відправляємо через Socket.IO
  io.to(String(toUser._id)).emit('notification:new', {
    id: String(notification._id),
    type: 'friend_request',
    title: notification.title,
    content: notification.content,
    data: notification.data,
    createdAt: notification.createdAt,
  });

  return res.json({ ok: true });
});

app.post('/friends/respond', requireAuth, async (req,res) => {
  const { requestId, accept } = req.body || {};
  const request = await FriendRequest.findById(requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.toUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (accept) {
    // Створюємо дружбу
    await Friendship.create({
      userA: request.fromUserId,
      userB: request.toUserId,
    });
    request.status = 'accepted';
  } else {
    request.status = 'rejected';
  }
  
  await request.save();
  return res.json({ ok: true });
});

app.get('/servers/my', requireAuth, async (req, res) => {
  const userId = req.user._id;
  const servers = await Server.find({ 'members.userId': userId });
  // Serialize all servers
  const serversObj = servers.map(s => s.toObject());
  return res.json({ ok: true, servers: serversObj });
});

// Generate unique invite code (max 10 characters for user input)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

app.post('/servers/create', requireAuth, async (req, res) => {
  const { name, channels, banner } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const serverId = `srv_${Date.now()}`;
    const inviteCode = generateInviteCode();
    
    const server = await Server.create({
      serverId,
      inviteCode,
      name: String(name).trim(),
      ownerId: req.user._id,
      description: '',
      icon: '',
      banner: banner || '',
      members: [{
        userId: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        role: 'owner',
      }],
      channels: Array.isArray(channels) ? channels.map((ch, idx) => ({
        channelId: ch.id || `ch_${Date.now()}_${idx}`,
        name: ch.name,
        type: ch.type || 'text',
        category: ch.category || null,
        position: idx,
      })) : [],
    });

    console.log(`[SERVER CREATE SUCCESS] Created server ${serverId} with ${server.channels.length} channels`);
    
    // Serialize response
    const serverObj = server.toObject();
    return res.json({ ok: true, server: serverObj });
  } catch (error) {
    console.error('[SERVER CREATE ERROR]:', error.message, error);
    return res.status(500).json({ ok: false, error: error.message || 'Failed to create server' });
  }
});

app.post('/servers/join', requireAuth, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Invite code is required' });

  // Normalize code for case-insensitive matching
  const normalizedCode = String(code).trim().toUpperCase();
  const server = await Server.findOne({ inviteCode: normalizedCode });
  if (!server) return res.status(404).json({ error: 'Server not found' });

  // Перевіряємо, чи користувач вже є учасником
  const isMember = server.members.some(m => m.userId.toString() === req.user._id.toString());
  if (!isMember) {
    server.members.push({
      userId: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
      role: 'member',
    });
    await server.save();
  }

  const serverObj = server.toObject();
  return res.json({ ok: true, server: serverObj });
});

// Отримання користувача за ID
app.get('/users/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  return res.json({
    ok: true,
    user: {
      id: String(user._id),
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      status: user.status || 'offline',
      customStatus: user.customStatus || '',
      bio: user.bio || '',
      profileBanner: user.profileBanner || '',
      profileFrame: user.profileFrame || 'default',
    },
  });
});

// Отримання членів сервера
app.get('/servers/:serverId/members', requireAuth, async (req, res) => {
  const { serverId } = req.params;
  
  // Знаходимо сервер
  const server = await Server.findOne({ serverId });
  if (!server) {
    return res.status(404).json({ ok: false, error: 'Server not found' });
  }
  
  // Перевіряємо що користувач є членом сервера
  const isMember = server.members.some(m => m.userId.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({ ok: false, error: 'Not a member of this server' });
  }
  
  // Отримуємо інформацію про членів
  const memberIds = server.members.map(m => m.userId);
  const users = await User.find({ _id: { $in: memberIds } });
  
  const members = users.map(user => ({
    id: String(user._id),
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    status: user.status || 'offline',
    customStatus: user.customStatus || '',
    bio: user.bio || '',
  }));
  
  return res.json({ ok: true, members });
});

const buildThreadsAuthor = (user) => ({
  id: String(user.id),
  username: user.username,
  displayName: user.displayName || user.username,
  avatar: user.avatar,
  profileBanner: user.profileBanner || '',
  profileFrame: user.profileFrame || 'default',
});

app.get('/threads/feed', requireAuth, (req, res) => {
  const userId = req.user.id;
  const followingIds = store.threadsFollows
    .filter((f) => f.followerId === userId)
    .map((f) => f.followingId);
  const allowed = new Set([userId, ...followingIds]);

  const posts = store.threadsPosts
    .filter((post) => allowed.has(post.userId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100)
    .map((post) => {
      const author = store.users.find((u) => u.id === post.userId);
      if (!author) return null;
      return {
        id: post.id,
        userId: post.userId,
        content: post.content,
        createdAt: post.createdAt,
        author: buildThreadsAuthor(author),
      };
    })
    .filter(Boolean);

  return res.json({ ok: true, posts });
});

app.post('/threads/posts', requireAuth, (req, res) => {
  const { content } = req.body || {};
  const text = String(content || '').trim();
  if (!text) return res.status(400).json({ error: 'Content is required' });
  if (text.length > 2000) return res.status(400).json({ error: 'Content too long' });

  const post = {
    id: `thread_${Date.now()}`,
    userId: req.user.id,
    content: text,
    createdAt: Date.now(),
  };

  store.threadsPosts.push(post);
  saveStore(store);
  return res.json({ ok: true, post });
});

app.get('/threads/profile/:userId', requireAuth, (req, res) => {
  const { userId } = req.params;
  const user = store.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const followersCount = store.threadsFollows.filter((f) => f.followingId === userId).length;
  const followingCount = store.threadsFollows.filter((f) => f.followerId === userId).length;
  const isFollowing = store.threadsFollows.some((f) => f.followerId === req.user.id && f.followingId === userId);

  const posts = store.threadsPosts
    .filter((post) => post.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      createdAt: post.createdAt,
    }));

  return res.json({
    ok: true,
    profile: buildThreadsAuthor(user),
    followersCount,
    followingCount,
    isFollowing,
    posts,
  });
});

app.post('/threads/follow', requireAuth, (req, res) => {
  const { userId, action } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
  const target = store.users.find((u) => u.id === userId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = store.threadsFollows.find(
    (f) => f.followerId === req.user.id && f.followingId === userId
  );

  const shouldFollow = action ? action === 'follow' : !existing;

  if (shouldFollow && !existing) {
    store.threadsFollows.push({
      id: `follow_${Date.now()}`,
      followerId: req.user.id,
      followingId: userId,
      createdAt: Date.now(),
    });
  }

  if (!shouldFollow && existing) {
    store.threadsFollows = store.threadsFollows.filter((f) => f !== existing);
  }

  saveStore(store);
  return res.json({ ok: true, following: shouldFollow });
});

// Оновлення налаштувань сервера
app.patch('/servers/:serverId', requireAuth, async (req, res) => {
  const { serverId } = req.params;
  const { name, description, icon, banner } = req.body || {};

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    // Тільки власник може оновлювати сервер
    if (String(server.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: 'Only owner can update server' });
    }

    if (name) server.name = String(name).trim();
    if (description !== undefined) server.description = String(description).trim();
    if (icon !== undefined) server.icon = icon;
    if (banner !== undefined) server.banner = banner;

    await server.save();
    const serverObj = server.toObject();
    return res.json({ ok: true, server: serverObj });
  } catch (error) {
    console.error('Error updating server:', error);
    return res.status(500).json({ ok: false, error: 'Failed to update server' });
  }
});

// Видалення сервера
app.delete('/servers/:serverId', requireAuth, async (req, res) => {
  const { serverId } = req.params;

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    // Тільки власник може видалити сервер
    if (String(server.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: 'Only owner can delete server' });
    }

    await Server.deleteOne({ _id: server._id });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting server:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete server' });
  }
});

// Вихід з сервера
app.post('/servers/:serverId/leave', requireAuth, async (req, res) => {
  const { serverId } = req.params;

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    // Власник не може вийти, тільки видалити сервер
    if (String(server.ownerId) === String(req.user._id)) {
      return res.status(403).json({ ok: false, error: 'Owner cannot leave. Delete server instead.' });
    }

    const isMember = server.members.some(m => String(m.userId) === String(req.user._id));
    if (!isMember) {
      return res.status(400).json({ ok: false, error: 'Not a member of this server' });
    }

    server.members = server.members.filter(m => String(m.userId) !== String(req.user._id));
    await server.save();
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error leaving server:', error);
    return res.status(500).json({ ok: false, error: 'Failed to leave server' });
  }
});

// Створення каналу
app.post('/servers/:serverId/channels', requireAuth, async (req, res) => {
  const { serverId } = req.params;
  const { name, type, category } = req.body || {};

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    if (!server.members.some(m => String(m.userId) === String(req.user._id))) {
      return res.status(403).json({ ok: false, error: 'Not a member of this server' });
    }

    // TODO: Додати перевірку прав (поки що дозволяємо всім)

    if (!name || !type) {
      return res.status(400).json({ ok: false, error: 'Name and type are required' });
    }

    const channel = {
      channelId: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: String(name).trim(),
      type: type,
      category: category || null,
      position: Array.isArray(server.channels) ? server.channels.length : 0,
    };

    if (!server.channels) server.channels = [];
    server.channels.push(channel);

    await server.save();
    return res.json({ 
      ok: true, 
      channel: { 
        ...channel, 
        serverId: server.serverId 
      } 
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ ok: false, error: 'Failed to create channel' });
  }
});

// Видалення каналу
app.delete('/servers/:serverId/channels/:channelId', requireAuth, async (req, res) => {
  const { serverId, channelId } = req.params;

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    if (!server.members.some(m => String(m.userId) === String(req.user._id))) {
      return res.status(403).json({ ok: false, error: 'Not a member of this server' });
    }

    // TODO: Додати перевірку прав

    if (!server.channels) {
      return res.status(404).json({ ok: false, error: 'Channel not found' });
    }

    const channelIndex = server.channels.findIndex(ch => ch.channelId === channelId);
    if (channelIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Channel not found' });
    }

    server.channels.splice(channelIndex, 1);
    await server.save();
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete channel' });
  }
});

// Оновлення каналу
app.patch('/servers/:serverId/channels/:channelId', requireAuth, async (req, res) => {
  const { serverId, channelId } = req.params;
  const { name, category } = req.body || {};

  try {
    const server = await Server.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ ok: false, error: 'Server not found' });
    }

    if (!server.members.some(m => String(m.userId) === String(req.user._id))) {
      return res.status(403).json({ ok: false, error: 'Not a member of this server' });
    }

    if (!server.channels) {
      return res.status(404).json({ ok: false, error: 'Channel not found' });
    }

    const channel = server.channels.find(ch => ch.channelId === channelId);
    if (!channel) {
      return res.status(404).json({ ok: false, error: 'Channel not found' });
    }

    if (name) channel.name = String(name).trim();
    if (category !== undefined) channel.category = category;

    await server.save();
    // Return normalized channels list
    return res.json({ 
      ok: true, 
      channel: { 
        ...channel.toObject(), 
        serverId: server.serverId 
      } 
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    return res.status(500).json({ ok: false, error: 'Failed to update channel' });
  }
});

// Отримання історії повідомлень для чату
app.get('/messages/history/:chatId', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  const { limit = 50, before } = req.query;
  
  try {
    // Перевіряємо, що користувач є учасником чату
    const chat = await Chat.findOne({ 
      chatId,
      'participants.userId': req.user._id 
    });
    
    if (!chat) {
      return res.status(403).json({ ok: false, error: 'Not a participant of this chat' });
    }
    
    // Запит повідомлень
    const query = { chatId, deleted: { $ne: true } };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'username displayName avatar');
    
    return res.json({ 
      ok: true, 
      messages: messages.reverse().map(m => ({
        id: String(m._id),
        chatId: m.chatId,
        senderId: String(m.senderId._id),
        senderUsername: m.senderId.username,
        senderDisplayName: m.senderId.displayName,
        senderAvatar: m.senderId.avatar,
        content: m.content,
        type: m.type,
        attachments: m.attachments,
        mentions: m.mentions,
        replyTo: m.replyTo,
        edited: m.edited,
        editedAt: m.editedAt,
        reactions: m.reactions,
        createdAt: m.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch messages' });
  }
});

// Відправка повідомлення
app.post('/messages/send', requireAuth, async (req, res) => {
  const { chatId, content, type, attachments, mentions, replyTo } = req.body || {};
  
  if (!chatId || !content) {
    return res.status(400).json({ ok: false, error: 'chatId and content are required' });
  }
  
  try {
    // Перевіряємо, що чат існує і користувач є учасником
    const chat = await Chat.findOne({ 
      chatId,
      'participants.userId': req.user._id 
    });
    
    if (!chat) {
      return res.status(403).json({ ok: false, error: 'Not a participant of this chat' });
    }
    
    // Створюємо повідомлення
    const message = await Message.create({
      chatId,
      senderId: req.user._id,
      senderUsername: req.user.username,
      content: String(content).trim(),
      type: type || 'text',
      attachments: attachments || [],
      mentions: mentions || [],
      replyTo: replyTo || null,
    });
    
    // Оновлюємо останнє повідомлення у чаті
    chat.lastMessage = {
      content: message.content,
      senderId: String(req.user._id),
      timestamp: message.createdAt,
    };
    await chat.save();
    
    // Crear notificaciones para otros participantes
    const otherParticipants = chat.participants.filter(p => String(p.userId) !== String(req.user._id));
    
    for (const participant of otherParticipants) {
      // Crear notificación de mensaje
      const notification = await Notification.create({
        userId: participant.userId,
        type: 'message',
        title: req.user.username,
        content: message.content.substring(0, 100),
        data: {
          chatId,
          messageId: String(message._id),
        },
      });
      
      // Emitir por Socket.IO
      io.to(String(participant.userId)).emit('notification:new', {
        id: String(notification._id),
        type: 'message',
        title: notification.title,
        content: notification.content,
        data: notification.data,
        createdAt: notification.createdAt,
      });
    }
    
    // Crear notificaciones para menciones
    if (mentions && mentions.length > 0) {
      for (const mentionedId of mentions) {
        const mentionNotif = await Notification.create({
          userId: mentionedId,
          type: 'mention',
          title: req.user.username,
          content: `Упомяну вас в: ${message.content.substring(0, 50)}`,
          data: {
            chatId,
            messageId: String(message._id),
          },
        });
        
        io.to(String(mentionedId)).emit('notification:new', {
          id: String(mentionNotif._id),
          type: 'mention',
          title: mentionNotif.title,
          content: mentionNotif.content,
          data: mentionNotif.data,
          createdAt: mentionNotif.createdAt,
        });
      }
    }
    
    // Відправляємо через Socket.IO
    io.to(chatId).emit('message:new', {
      id: String(message._id),
      chatId: message.chatId,
      senderId: String(req.user._id),
      senderUsername: req.user.username,
      content: message.content,
      type: message.type,
      attachments: message.attachments,
      createdAt: message.createdAt,
    });
    
    return res.json({ ok: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
});

// Отримання пінованих повідомлень для чату
app.get('/messages/pinned/:chatId', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  
  try {
    // Перевіряємо, що користувач є учасником чату
    const chat = await Chat.findOne({ 
      chatId,
      'participants.userId': req.user._id 
    });
    
    if (!chat) {
      return res.status(403).json({ ok: false, error: 'Not a participant of this chat' });
    }
    
    // Отримуємо пінавані повідомлення
    const pinnedMessages = await Message.find({ chatId, pinned: true })
      .sort({ pinnedAt: -1 })
      .populate('senderId', 'username displayName avatar')
      .populate('pinnedBy', 'username displayName');
    
    return res.json({
      ok: true,
      messages: pinnedMessages.map(m => ({
        id: String(m._id),
        chatId: m.chatId,
        senderId: String(m.senderId._id),
        senderUsername: m.senderId.username,
        senderDisplayName: m.senderId.displayName,
        senderAvatar: m.senderId.avatar,
        content: m.content,
        type: m.type,
        attachments: m.attachments,
        reactions: m.reactions,
        pinned: m.pinned,
        pinnedAt: m.pinnedAt,
        pinnedBy: m.pinnedBy ? {
          id: String(m.pinnedBy._id),
          username: m.pinnedBy.username,
          displayName: m.pinnedBy.displayName,
        } : null,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch pinned messages' });
  }
});

// Пінування повідомлення
app.post('/messages/:messageId/pin', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    message.pinned = true;
    message.pinnedAt = new Date();
    message.pinnedBy = req.user._id;
    await message.save();
    
    // Сповіщаємо інших користувачів через Socket.IO
    io.to(message.chatId).emit('message:pinned', {
      messageId: String(message._id),
      pinned: true,
      pinnedAt: message.pinnedAt,
    });
    
    return res.json({ ok: true, message: { id: String(message._id), pinned: true } });
  } catch (error) {
    console.error('Error pinning message:', error);
    return res.status(500).json({ ok: false, error: 'Failed to pin message' });
  }
});

// Розпінування повідомлення
app.delete('/messages/:messageId/pin', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    message.pinned = false;
    message.pinnedAt = null;
    message.pinnedBy = null;
    await message.save();
    
    // Сповіщаємо інших користувачів
    io.to(message.chatId).emit('message:pinned', {
      messageId: String(message._id),
      pinned: false,
    });
    
    return res.json({ ok: true, message: { id: String(message._id), pinned: false } });
  } catch (error) {
    console.error('Error unpinning message:', error);
    return res.status(500).json({ ok: false, error: 'Failed to unpin message' });
  }
});

// Пошук повідомлень
app.get('/messages/search', requireAuth, async (req, res) => {
  const { query, chatId, limit = 20, skip = 0 } = req.query;
  
  if (!query) {
    return res.status(400).json({ ok: false, error: 'Query is required' });
  }
  
  try {
    // Якщо вказано chatId, перевіряємо доступ
    if (chatId) {
      const chat = await Chat.findOne({ 
        chatId,
        'participants.userId': req.user._id 
      });
      
      if (!chat) {
        return res.status(403).json({ ok: false, error: 'Not a participant of this chat' });
      }
    }
    
    // Будуємо фільтр
    const filter = {
      deleted: { $ne: true },
      $or: [
        { content: { $regex: String(query), $options: 'i' } },
      ],
    };
    
    if (chatId) {
      filter.chatId = String(chatId);
    }
    
    // Шукаємо повідомлення
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('senderId', 'username displayName avatar');
    
    const total = await Message.countDocuments(filter);
    
    return res.json({
      ok: true,
      messages: messages.map(m => ({
        id: String(m._id),
        chatId: m.chatId,
        senderId: String(m.senderId._id),
        senderUsername: m.senderId.username,
        senderDisplayName: m.senderId.displayName,
        senderAvatar: m.senderId.avatar,
        content: m.content,
        type: m.type,
        reactions: m.reactions,
        pinned: m.pinned,
        createdAt: m.createdAt,
      })),
      total,
      hasMore: parseInt(skip) + messages.length < total,
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return res.status(500).json({ ok: false, error: 'Failed to search messages' });
  }
});

// Додавання або видалення реакції на повідомлення
app.post('/messages/:messageId/reactions', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body || {};
  
  if (!emoji) {
    return res.status(400).json({ ok: false, error: 'Emoji is required' });
  }
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    // Перевіряємо чи користувач вже відреагував цим емодзі
    const existingReactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    
    if (existingReactionIndex >= 0) {
      const reaction = message.reactions[existingReactionIndex];
      const userIdStr = String(req.user._id);
      const userIndex = reaction.userId.findIndex(id => String(id) === userIdStr);
      
      if (userIndex >= 0) {
        // Видаляємо користувача (toggle off)
        reaction.userId.splice(userIndex, 1);
        
        // Якщо більше ніхто не реагує - видаляємо реакцію
        if (reaction.userId.length === 0) {
          message.reactions.splice(existingReactionIndex, 1);
        }
      } else {
        // Додаємо користувача
        reaction.userId.push(req.user._id);
      }
    } else {
      // Створюємо нову реакцію
      message.reactions.push({
        emoji,
        userId: [req.user._id],
      });
    }
    
    await message.save();
    
    // Відправляємо оновлення через Socket.IO
    io.to(message.chatId).emit('message:reaction', {
      messageId: String(message._id),
      reactions: message.reactions,
    });
    
    return res.json({ ok: true, reactions: message.reactions });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return res.status(500).json({ ok: false, error: 'Failed to toggle reaction' });
  }
});

// ===== NOTIFICATION ENDPOINTS =====

// Отримання всіх сповіщень користувача
app.get('/notifications', requireAuth, async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;
  
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments({ userId: req.user._id });
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    
    return res.json({
      ok: true,
      notifications: notifications.map(n => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        content: n.content,
        data: n.data,
        read: n.read,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch notifications' });
  }
});

// Створення сповіщення
app.post('/notifications', requireAuth, async (req, res) => {
  const { type, title, content, data } = req.body || {};
  
  if (!title || !type) {
    return res.status(400).json({ ok: false, error: 'Title and type are required' });
  }
  
  try {
    const notification = await Notification.create({
      userId: req.user._id,
      type,
      title,
      content,
      data,
    });
    
    // Відправляємо через Socket.IO
    io.to(String(req.user._id)).emit('notification:new', {
      id: String(notification._id),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      createdAt: notification.createdAt,
    });
    
    return res.json({ ok: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ ok: false, error: 'Failed to create notification' });
  }
});

// Позначення сповіщення як прочитане
app.patch('/notifications/:notificationId/read', requireAuth, async (req, res) => {
  const { notificationId } = req.params;
  
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }
    
    if (String(notification.userId) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    return res.json({ ok: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mark notification as read' });
  }
});

// Позначення всіх сповіщень як прочитані
app.patch('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    return res.json({ ok: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mark notifications as read' });
  }
});

// Видалення сповіщення
app.delete('/notifications/:notificationId', requireAuth, async (req, res) => {
  const { notificationId } = req.params;
  
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }
    
    if (String(notification.userId) !== String(req.user._id)) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }
    
    await Notification.deleteOne({ _id: notificationId });
    
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete notification' });
  }
});

// Видалення всіх сповіщень
app.delete('/notifications', requireAuth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return res.status(500).json({ ok: false, error: 'Failed to delete notifications' });
  }
});

// ===== USER BLOCKING =====

// Block user
app.post('/users/:userId/block', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body || {};
  
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ ok: false, error: 'Cannot block yourself' });
  }
  
  try {
    const existingBlock = await Block.findOne({
      blockedBy: req.user._id,
      blockedUser: userId,
    });
    
    if (existingBlock) {
      return res.status(409).json({ ok: false, error: 'Already blocked' });
    }
    
    const block = await Block.create({
      blockedBy: req.user._id,
      blockedUser: userId,
      reason,
    });
    
    return res.json({ ok: true, block });
  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({ ok: false, error: 'Failed to block user' });
  }
});

// Unblock user
app.delete('/users/:userId/block', requireAuth, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await Block.deleteOne({
      blockedBy: req.user._id,
      blockedUser: userId,
    });
    
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return res.status(500).json({ ok: false, error: 'Failed to unblock user' });
  }
});

// Get blocked users
app.get('/users/blocked', requireAuth, async (req, res) => {
  try {
    const blocks = await Block.find({ blockedBy: req.user._id }).populate('blockedUser', 'username displayName avatar');
    
    return res.json({
      ok: true,
      blocked: blocks.map(b => ({
        id: b.blockedUser._id,
        username: b.blockedUser.username,
        displayName: b.blockedUser.displayName,
        avatar: b.blockedUser.avatar,
        blockedAt: b.blockedAt,
        reason: b.reason,
      })),
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch blocked users' });
  }
});

// ===== CHAT SETTINGS =====

// Get chat settings
app.get('/chats/:chatId/settings', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  
  try {
    let settings = await ChatSettings.findOne({
      chatId,
      userId: req.user._id,
    });
    
    if (!settings) {
      settings = await ChatSettings.create({
        chatId,
        userId: req.user._id,
      });
    }
    
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch chat settings' });
  }
});

// Update chat settings
app.patch('/chats/:chatId/settings', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  const { isMuted, isFavorite, isArchived, notificationLevel, customColor, customEmoji, mutedUntil } = req.body || {};
  
  try {
    let settings = await ChatSettings.findOne({
      chatId,
      userId: req.user._id,
    });
    
    if (!settings) {
      settings = await ChatSettings.create({
        chatId,
        userId: req.user._id,
      });
    }
    
    if (isMuted !== undefined) settings.isMuted = isMuted;
    if (mutedUntil !== undefined) settings.mutedUntil = mutedUntil;
    if (isFavorite !== undefined) settings.isFavorite = isFavorite;
    if (isArchived !== undefined) settings.isArchived = isArchived;
    if (notificationLevel !== undefined) settings.notificationLevel = notificationLevel;
    if (customColor !== undefined) settings.customColor = customColor;
    if (customEmoji !== undefined) settings.customEmoji = customEmoji;
    
    await settings.save();
    
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return res.status(500).json({ ok: false, error: 'Failed to update chat settings' });
  }
});

// Get favorite chats
app.get('/chats/favorites', requireAuth, async (req, res) => {
  try {
    const favorites = await ChatSettings.find({
      userId: req.user._id,
      isFavorite: true,
    });
    
    return res.json({
      ok: true,
      favorites: favorites.map(f => f.chatId),
    });
  } catch (error) {
    console.error('Error fetching favorite chats:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch favorite chats' });
  }
});

// ===== READ RECEIPTS =====

// Mark message as read
app.post('/messages/:messageId/read', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    // Check if already read
    const alreadyRead = message.readBy.some(r => r.userId.toString() === req.user._id.toString());
    if (!alreadyRead) {
      message.readBy.push({
        userId: req.user._id,
        readAt: new Date(),
      });
      await message.save();
      
      // Emit read receipt via Socket.IO
      io.to(message.chatId).emit('message:read', {
        messageId: String(message._id),
        userId: String(req.user._id),
        readAt: new Date(),
      });
    }
    
    return res.json({ ok: true, message });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mark message as read' });
  }
});

// Mark chat messages as read
app.post('/chats/:chatId/read', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const messages = await Message.find({ chatId });
    
    for (const message of messages) {
      const alreadyRead = message.readBy.some(r => r.userId.toString() === req.user._id.toString());
      if (!alreadyRead) {
        message.readBy.push({
          userId: req.user._id,
          readAt: new Date(),
        });
        await message.save();
      }
    }
    
    return res.json({ ok: true, count: messages.length });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mark chat as read' });
  }
});

// ===== MESSAGE FORWARDING =====

// Forward message
app.post('/messages/:messageId/forward', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { targetChatId } = req.body || {};
  
  if (!targetChatId) {
    return res.status(400).json({ ok: false, error: 'targetChatId is required' });
  }
  
  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    // Verify user is member of target chat
    const chat = await Chat.findOne({
      chatId: targetChatId,
      'participants.userId': req.user._id,
    });
    
    if (!chat) {
      return res.status(403).json({ ok: false, error: 'Not a participant of target chat' });
    }
    
    // Create forwarded message
    const forwardedMessage = await Message.create({
      chatId: targetChatId,
      senderId: req.user._id,
      senderUsername: req.user.username,
      content: originalMessage.content,
      type: originalMessage.type,
      attachments: originalMessage.attachments,
      forwardedFrom: originalMessage._id,
    });
    
    // Update last message in chat
    chat.lastMessage = {
      content: `[Forwarded] ${forwardedMessage.content}`,
      senderId: String(req.user._id),
      timestamp: forwardedMessage.createdAt,
    };
    await chat.save();
    
    // Emit via Socket.IO
    io.to(targetChatId).emit('message:new', {
      id: String(forwardedMessage._id),
      chatId: forwardedMessage.chatId,
      senderId: String(req.user._id),
      senderUsername: req.user.username,
      content: forwardedMessage.content,
      type: forwardedMessage.type,
      attachments: forwardedMessage.attachments,
      forwardedFrom: String(originalMessage._id),
      createdAt: forwardedMessage.createdAt,
    });
    
    return res.json({ ok: true, message: forwardedMessage });
  } catch (error) {
    console.error('Error forwarding message:', error);
    return res.status(500).json({ ok: false, error: 'Failed to forward message' });
  }
});

// ===== MESSAGE EXPIRATION/DISAPPEARING MESSAGES =====

// Set message expiration
app.post('/messages/:messageId/expire', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { expiresIn } = req.body || {}; // seconds
  
  if (!expiresIn || expiresIn <= 0) {
    return res.status(400).json({ ok: false, error: 'expiresIn must be > 0' });
  }
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }
    
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }
    
    message.expiresIn = expiresIn;
    message.expiresAt = new Date(Date.now() + expiresIn * 1000);
    await message.save();
    
    return res.json({ ok: true, message });
  } catch (error) {
    console.error('Error setting message expiration:', error);
    return res.status(500).json({ ok: false, error: 'Failed to set message expiration' });
  }
});

// Socket.IO для real-time комунікації
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Користувач підключився
  socket.on('user:online', (userId) => {
    const wasOnline = onlineUsers.has(userId);
    
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    
    onlineUsers.get(userId).add(socket.id);
    console.log(`User ${userId} online`);
    
    // Повідомляємо всіх про новий онлайн статус ТІЛЬКИ якщо це перше підключення
    if (!wasOnline) {
      io.emit('user:status', { userId, status: 'online' });
    }
  });

  // Зміна статусу
  socket.on('user:status:update', ({ userId, status }) => {
    // Оновлюємо в базі даних
    const user = store.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      saveStore(store);
      
      // Транслюємо всім
      io.emit('user:status', { userId, status });
    }
  });

  // Відправка повідомлення
  socket.on('message:send', (data) => {
    const { recipientId, senderId, message } = data;
    
    console.log(`Message from ${senderId} to ${recipientId}:`, message.content);
    
    // Зберігаємо повідомлення в базі даних
    const messageData = {
      id: message.id,
      chatId: message.chatId,
      senderId: senderId,
      recipientId: recipientId,
      content: message.content,
      timestamp: message.timestamp,
      edited: message.edited || false,
      attachments: message.attachments || [],
      reactions: message.reactions || [],
      replyTo: message.replyTo || null,
    };
    
    store.messages.push(messageData);
    saveStore(store);
    
    // Знаходимо всі сокети отримувача
    const recipientSockets = onlineUsers.get(recipientId);
    
    if (recipientSockets && recipientSockets.size > 0) {
      // Відправляємо повідомлення всім вкладкам отримувача
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('message:receive', {
          chatId: senderId,
          message,
        });
      });
      console.log(`Message delivered to ${recipientId}`);
    } else {
      console.log(`Recipient ${recipientId} is offline`);
    }
    
    // Підтверджуємо відправнику
    socket.emit('message:sent', { chatId: recipientId, messageId: message.id });
  });

  // Редагування повідомлення
  socket.on('message:edit', (data) => {
    const { recipientId, senderId, edit } = data;

    // Оновлюємо повідомлення в базі
    const target = store.messages.find(m => m.id === edit.messageId);
    if (target) {
      target.content = edit.newContent;
      target.edited = true;
      saveStore(store);
    }

    // Відправляємо оновлення всім вкладкам отримувача
    const recipientSockets = onlineUsers.get(recipientId);
    if (recipientSockets && recipientSockets.size > 0) {
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('message:edit', {
          chatId: senderId,
          messageId: edit.messageId,
          newContent: edit.newContent,
        });
      });
    }

    // Відправляємо оновлення відправнику (для синхронізації між вкладками)
    const senderSockets = onlineUsers.get(senderId);
    if (senderSockets && senderSockets.size > 0) {
      senderSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('message:edit', {
            chatId: recipientId,
            messageId: edit.messageId,
            newContent: edit.newContent,
          });
        }
      });
    }
  });

  // Реакції на повідомлення
  socket.on('message:reaction', (data) => {
    const { recipientId, senderId, reaction } = data;

    const target = store.messages.find(m => m.id === reaction.messageId);
    if (target) {
      target.reactions = target.reactions || [];
      const existing = target.reactions.find(r => r.emoji === reaction.emoji);
      if (reaction.action === 'add') {
        if (existing) {
          if (!existing.users.includes(reaction.userId)) {
            existing.users.push(reaction.userId);
          }
        } else {
          target.reactions.push({ emoji: reaction.emoji, users: [reaction.userId] });
        }
      } else if (reaction.action === 'remove') {
        if (existing) {
          existing.users = existing.users.filter(u => u !== reaction.userId);
          if (existing.users.length === 0) {
            target.reactions = target.reactions.filter(r => r.emoji !== reaction.emoji);
          }
        }
      }
      saveStore(store);
    }

    // Відправляємо оновлення всім вкладкам отримувача
    const recipientSockets = onlineUsers.get(recipientId);
    if (recipientSockets && recipientSockets.size > 0) {
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('message:reaction', {
          chatId: senderId,
          messageId: reaction.messageId,
          emoji: reaction.emoji,
          userId: reaction.userId,
          action: reaction.action,
        });
      });
    }

    // Відправляємо оновлення відправнику (для синхронізації між вкладками)
    const senderSockets = onlineUsers.get(senderId);
    if (senderSockets && senderSockets.size > 0) {
      senderSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('message:reaction', {
            chatId: recipientId,
            messageId: reaction.messageId,
            emoji: reaction.emoji,
            userId: reaction.userId,
            action: reaction.action,
          });
        }
      });
    }
  });

  // Видалення повідомлення
  socket.on('message:delete', (data) => {
    const { recipientId, senderId, payload } = data;

    store.messages = store.messages.filter(m => m.id !== payload.messageId);
    saveStore(store);

    const recipientSockets = onlineUsers.get(recipientId);
    if (recipientSockets && recipientSockets.size > 0) {
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('message:delete', {
          chatId: senderId,
          messageId: payload.messageId,
        });
      });
    }
  });

  // Користувач друкує
  socket.on('typing:start', ({ userId, chatId }) => {
    socket.broadcast.emit('user:typing', { userId, chatId, isTyping: true });
  });

  socket.on('typing:stop', ({ userId, chatId }) => {
    socket.broadcast.emit('user:typing', { userId, chatId, isTyping: false });
  });

  // Відключення
  socket.on('disconnect', () => {
    // Знаходимо userId по socketId
    let disconnectedUserId = null;
    for (const [userId, socketIds] of onlineUsers.entries()) {
      if (socketIds.has(socket.id)) {
        disconnectedUserId = userId;
        socketIds.delete(socket.id);
        
        // Якщо це був останній сокет користувача - видаляємо його з Map
        if (socketIds.size === 0) {
          onlineUsers.delete(userId);
        }
        break;
      }
    }
    
    // Емітимо offline ТІЛЬКИ якщо користувач більше не має активних підключень
    if (disconnectedUserId && !onlineUsers.has(disconnectedUserId)) {
      console.log(`User ${disconnectedUserId} offline`);
      io.emit('user:status', { userId: disconnectedUserId, status: 'offline' });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LUMYN server is running' });
});

// Connect to MongoDB (optional) and start server
connectDB()
  .then((connected) => {
    server.listen(PORT, () => {
      console.log(`Auth server running on http://localhost:${PORT}`);
      if (connected) {
        console.log('Using MongoDB for data storage');
      } else {
        console.log('Using JSON file storage (disgram.auth.json)');
      }
    });
  })
  .catch((err) => {
    console.error('Unexpected error during startup:', err);
    // Still start server with JSON storage
    server.listen(PORT, () => {
      console.log(`Auth server running on http://localhost:${PORT}`);
      console.log('Using JSON file storage (disgram.auth.json)');
    });
  });


