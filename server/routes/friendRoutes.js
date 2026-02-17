const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const requireAuth = require('../middlewares/auth');

// All friend routes require authentication
router.get('/list', requireAuth, friendController.getFriendsList);
router.post('/request', requireAuth, friendController.sendFriendRequest);
router.post('/respond', requireAuth, friendController.respondToFriendRequest);

module.exports = router;
