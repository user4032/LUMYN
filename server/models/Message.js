const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderUsername: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number,
  }],
  mentions: [{
    type: String,
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  reactions: [{
    userId: String,
    emoji: String,
  }],
  pinned: {
    type: Boolean,
    default: false,
  },
  pinnedAt: {
    type: Date,
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Read receipts
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: Date,
  }],
  // Disappearing messages (ttl in seconds, 0 = no expiration)
  expiresIn: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
  },
  // Message forwarding
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  // Rich text formatting
  formatting: {
    bold: [{ start: Number, end: Number }],
    italic: [{ start: Number, end: Number }],
    code: [{ start: Number, end: Number }],
    codeBlock: {
      language: String,
      content: String,
    },
  },
  // Translation
  translatedContent: {
    language: String,
    content: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes для ефективних запитів
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for disappearing messages

module.exports = mongoose.model('Message', messageSchema);
