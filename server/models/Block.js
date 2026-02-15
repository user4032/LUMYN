const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blockedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: String,
  blockedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
blockSchema.index({ blockedBy: 1, blockedUser: 1 }, { unique: true });
blockSchema.index({ blockedUser: 1 });

module.exports = mongoose.model('Block', blockSchema);
