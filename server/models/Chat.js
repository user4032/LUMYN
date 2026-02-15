const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['private', 'group', 'channel', 'saved'],
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  // Учасники чату
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Останнє повідомлення
  lastMessage: {
    content: String,
    senderId: String,
    timestamp: Date,
  },
  // Налаштування чату
  settings: {
    isPinned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes - chatId вже має unique: true
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ type: 1 });

module.exports = mongoose.model('Chat', chatSchema);
