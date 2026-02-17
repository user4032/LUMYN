const userService = require('../services/userService');

/**
 * GET /users/search
 * Search for users
 */
const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const users = await userService.searchUsers(req.user._id, query);
    res.json({ ok: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/:userId
 * Get user profile by ID
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    res.json({ ok: true, user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /users/:userId/block
 * Block a user
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await userService.blockUser(req.user._id, userId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Cannot block yourself') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'User already blocked') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /users/:userId/block
 * Unblock a user
 */
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await userService.unblockUser(req.user._id, userId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * GET /users/blocked
 * Get list of blocked users
 */
const getBlockedUsers = async (req, res, next) => {
  try {
    const users = await userService.getBlockedUsers(req.user._id);
    res.json({ ok: true, users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
};
