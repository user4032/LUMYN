const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['message', 'mention', 'friend_request', 'server_invite', 'reaction', 'system'],
    default: 'message',
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  data: {
    chatId: String,
    messageId: String,
    serverId: String,
    userId: String,
    username: String,
    displayName: String,
    avatar: String,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Index для ефективних запитів
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
