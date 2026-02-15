const mongoose = require('mongoose');

const chatSettingsSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Chat actions
  isMuted: {
    type: Boolean,
    default: false,
  },
  mutedUntil: Date, // null = muted forever
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  // Notification settings per chat
  notificationLevel: {
    type: String,
    enum: ['all', 'mentions', 'none'],
    default: 'all',
  },
  customColor: String, // Chat color override
  customEmoji: String, // Chat emoji override
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
chatSettingsSchema.index({ chatId: 1, userId: 1 }, { unique: true });
chatSettingsSchema.index({ userId: 1, isFavorite: 1 });
chatSettingsSchema.index({ userId: 1, isArchived: 1 });

module.exports = mongoose.model('ChatSettings', chatSettingsSchema);
