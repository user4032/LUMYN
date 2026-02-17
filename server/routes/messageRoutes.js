const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const requireAuth = require('../middlewares/auth');

// All message routes require authentication
router.get('/history/:chatId', requireAuth, messageController.getHistory);
router.post('/send', requireAuth, messageController.send);
router.get('/pinned/:chatId', requireAuth, messageController.getPinned);
router.post('/:messageId/pin', requireAuth, messageController.pin);
router.delete('/:messageId/pin', requireAuth, messageController.unpin);
router.get('/search', requireAuth, messageController.search);
router.post('/:messageId/reactions', requireAuth, messageController.toggleReaction);
router.post('/:messageId/read', requireAuth, messageController.markAsRead);
router.post('/:messageId/forward', requireAuth, messageController.forward);
router.post('/:messageId/expire', requireAuth, messageController.setExpiration);

module.exports = router;
