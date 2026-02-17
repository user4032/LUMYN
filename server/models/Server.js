const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'announcement'],
    default: 'text',
  },
  position: {
    type: Number,
    default: 0,
  },
  permissions: {
    type: Map,
    of: Boolean,
    default: {},
  },
});

const serverSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Власник сервера
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Учасники сервера
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
    displayName: String,
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member',
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {},
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Канали сервера
  channels: [channelSchema],
  // Ролі сервера
  roles: [{
    roleId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#99AAB5',
    },
    permissions: [{
      type: String,
    }],
    position: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Мапа ролей для учасників {userId: roleId}
  memberRoles: {
    type: Map,
    of: String,
    default: {},
  },
  // Налаштування
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes - serverId вже має unique: true
serverSchema.index({ ownerId: 1 });
serverSchema.index({ 'members.userId': 1 });
serverSchema.index({ 'settings.isPublic': 1 });

module.exports = mongoose.model('Server', serverSchema);
