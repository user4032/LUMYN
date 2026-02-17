const User = require('../models/User');
const Block = require('../models/Block');
const { formatUserProfile } = require('./authService');

/**
 * Search users by username or display name
 */
const searchUsers = async (currentUserId, query) => {
  if (!query || query.length < 2) {
    return [];
  }

  const searchQuery = String(query).toLowerCase();

  const results = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { username: { $regex: searchQuery, $options: 'i' } },
      { displayName: { $regex: searchQuery, $options: 'i' } },
    ],
  })
    .limit(20)
    .select('_id username displayName avatar status bio');

  return results.map((u) => ({
    id: String(u._id),
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    status: u.status,
    bio: u.bio,
  }));
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('_id email username displayName avatar status customStatus bio profileBanner profileFrame');

  if (!user) {
    throw new Error('User not found');
  }

  return formatUserProfile(user);
};

/**
 * Block user
 */
const blockUser = async (currentUserId, targetUserId) => {
  if (currentUserId.toString() === targetUserId) {
    throw new Error('Cannot block yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('User not found');
  }

  const existing = await Block.findOne({
    blockerId: currentUserId,
    blockedId: targetUserId,
  });

  if (existing) {
    throw new Error('User already blocked');
  }

  await Block.create({
    blockerId: currentUserId,
    blockedId: targetUserId,
  });

  return { success: true };
};

/**
 * Unblock user
 */
const unblockUser = async (currentUserId, targetUserId) => {
  const result = await Block.findOneAndDelete({
    blockerId: currentUserId,
    blockedId: targetUserId,
  });

  if (!result) {
    throw new Error('Block not found');
  }

  return { success: true };
};

/**
 * Get list of blocked users
 */
const getBlockedUsers = async (currentUserId) => {
  const blocks = await Block.find({ blockerId: currentUserId }).populate(
    'blockedId',
    '_id username displayName avatar'
  );

  return blocks.map((b) => ({
    id: String(b.blockedId._id),
    username: b.blockedId.username,
    displayName: b.blockedId.displayName,
    avatar: b.blockedId.avatar,
    blockedAt: b.createdAt,
  }));
};

module.exports = {
  searchUsers,
  getUserById,
  blockUser,
  unblockUser,
  getBlockedUsers,
};
