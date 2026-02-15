/**
 * Migration script to move data from disgram.auth.json to MongoDB
 * Run this once to migrate existing user data to the cloud database
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./database');
const User = require('./models/User');
const Session = require('./models/Session');
const VerificationCode = require('./models/VerificationCode');
const FriendRequest = require('./models/FriendRequest');
const Friendship = require('./models/Friendship');
const Chat = require('./models/Chat');

const dataPath = path.join(__dirname, 'disgram.auth.json');

const loadStore = () => {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading disgram.auth.json:', err.message);
    return null;
  }
};

const migrate = async () => {
  try {
    console.log('Starting migration...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✓ Connected to MongoDB');
    
    // Load existing data
    const store = loadStore();
    if (!store) {
      console.log('No data to migrate.');
      return;
    }
    
    // Migrate users
    console.log(`\nMigrating ${store.users?.length || 0} users...`);
    const userIdMap = new Map(); // old ID -> new MongoDB ObjectId
    
    for (const oldUser of store.users || []) {
      // Check if user already exists
      const existing = await User.findOne({ email: oldUser.email });
      if (existing) {
        userIdMap.set(oldUser.id, existing._id);
        console.log(`  - User ${oldUser.email} already exists, skipping`);
        continue;
      }
      
      const newUser = await User.create({
        email: oldUser.email,
        username: oldUser.username || oldUser.email.split('@')[0],
        passwordHash: oldUser.passwordHash,
        displayName: oldUser.displayName,
        verified: oldUser.verified || false,
        avatar: oldUser.avatar || '',
        profileBanner: oldUser.profileBanner || '',
        profileFrame: oldUser.profileFrame || 'default',
        bio: oldUser.bio || '',
        customStatus: oldUser.customStatus || '',
        status: oldUser.status || 'offline',
        createdAt: oldUser.createdAt ? new Date(oldUser.createdAt) : new Date(),
      });
      
      userIdMap.set(oldUser.id, newUser._id);
      console.log(`  ✓ Migrated user: ${oldUser.email}`);
    }
    
    // Migrate sessions
    console.log(`\nMigrating ${store.sessions?.length || 0} sessions...`);
    for (const oldSession of store.sessions || []) {
      const userId = userIdMap.get(oldSession.userId);
      if (!userId) {
        console.log(`  - Session for unknown user ${oldSession.userId}, skipping`);
        continue;
      }
      
      // Skip expired sessions
      if (oldSession.expiresAt < Date.now()) {
        console.log(`  - Expired session, skipping`);
        continue;
      }
      
      const existing = await Session.findOne({ token: oldSession.token });
      if (existing) {
        console.log(`  - Session already exists, skipping`);
        continue;
      }
      
      await Session.create({
        userId,
        token: oldSession.token,
        expiresAt: new Date(oldSession.expiresAt),
      });
      
      console.log(`  ✓ Migrated session for user ${userId}`);
    }
    
    // Migrate friendships
    console.log(`\nMigrating ${store.friends?.length || 0} friendships...`);
    for (const oldFriend of store.friends || []) {
      const userA = userIdMap.get(oldFriend.userA);
      const userB = userIdMap.get(oldFriend.userB);
      
      if (!userA || !userB) {
        console.log(`  - Friendship with unknown users, skipping`);
        continue;
      }
      
      const existing = await Friendship.findOne({
        $or: [
          { userA, userB },
          { userA: userB, userB: userA }
        ]
      });
      
      if (existing) {
        console.log(`  - Friendship already exists, skipping`);
        continue;
      }
      
      await Friendship.create({ userA, userB });
      console.log(`  ✓ Migrated friendship`);
    }
    
    // Migrate friend requests
    console.log(`\nMigrating ${store.friendRequests?.length || 0} friend requests...`);
    for (const oldReq of store.friendRequests || []) {
      const fromUserId = userIdMap.get(oldReq.fromUserId);
      const toUserId = userIdMap.get(oldReq.toUserId);
      
      if (!fromUserId || !toUserId) {
        console.log(`  - Request with unknown users, skipping`);
        continue;
      }
      
      const existing = await FriendRequest.findOne({ fromUserId, toUserId });
      if (existing) {
        console.log(`  - Friend request already exists, skipping`);
        continue;
      }
      
      await FriendRequest.create({
        fromUserId,
        toUserId,
        status: 'pending',
      });
      
      console.log(`  ✓ Migrated friend request`);
    }
    
    // Migrate user chats
    console.log(`\nMigrating user chats...`);
    for (const [oldUserId, chats] of Object.entries(store.userChats || {})) {
      const userId = userIdMap.get(oldUserId);
      if (!userId) {
        console.log(`  - Chats for unknown user ${oldUserId}, skipping`);
        continue;
      }
      
      for (const chat of chats) {
        const existing = await Chat.findOne({ chatId: chat.chatId });
        if (existing) {
          // Add user to participants if not already there
          const isParticipant = existing.participants.some(
            p => p.userId.toString() === userId.toString()
          );
          if (!isParticipant) {
            existing.participants.push({ userId });
            await existing.save();
          }
          continue;
        }
        
        await Chat.create({
          chatId: chat.chatId,
          name: chat.name,
          type: chat.type || 'private',
          avatar: chat.avatar || '',
          participants: [{ userId }],
          lastMessage: chat.lastMessage,
          settings: chat.settings || {},
        });
        
        console.log(`  ✓ Migrated chat: ${chat.name}`);
      }
    }
    
    console.log('\n✓ Migration completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Backup disgram.auth.json (optional)');
    console.log('2. Start the server with: npm run server');
    console.log('3. The server will now use MongoDB instead of JSON file storage');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
