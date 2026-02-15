const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  profileBanner: {
    type: String,
    default: '',
  },
  profileFrame: {
    type: String,
    default: 'default',
  },
  bio: {
    type: String,
    default: '',
  },
  customStatus: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'idle', 'dnd', 'away', 'busy', 'invisible'],
    default: 'offline',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes - email та username вже мають unique: true які створюють індекси

module.exports = mongoose.model('User', userSchema);
