const friendService = require('../services/friendService');

/**
 * GET /friends/list
 * Get friends list with pending requests
 */
const getFriendsList = async (req, res, next) => {
  try {
    const result = await friendService.getFriendsList(req.user._id);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /friends/request
 * Send friend request
 */
const sendFriendRequest = async (req, res, next) => {
  try {
    const { username } = req.body || {};

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Pass io from app locals (will be set in app.js)
    const io = req.app.get('io');
    await friendService.sendFriendRequest(req.user, username, io);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Cannot add yourself') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Already friends' || error.message === 'Request already exists') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /friends/respond
 * Accept or reject friend request
 */
const respondToFriendRequest = async (req, res, next) => {
  try {
    const { requestId, accept } = req.body || {};

    await friendService.respondToFriendRequest(req.user._id, requestId, accept);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Request not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getFriendsList,
  sendFriendRequest,
  respondToFriendRequest,
};
