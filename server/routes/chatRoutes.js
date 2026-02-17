const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const requireAuth = require('../middlewares/auth');

// All chat routes require authentication
router.get('/', requireAuth, chatController.getChats);
router.get('/favorites', requireAuth, chatController.getFavorites);
router.get('/:chatId/settings', requireAuth, chatController.getSettings);
router.patch('/:chatId/settings', requireAuth, chatController.updateSettings);
router.post('/:chatId/save', requireAuth, chatController.saveChat);
router.post('/:chatId/read', requireAuth, chatController.markAsRead);

module.exports = router;
