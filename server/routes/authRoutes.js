const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middlewares/auth');

// Додаємо контролер чатів для проксі
const chatController = require('../controllers/chatController');

// Public routes
router.post('/register', authController.register);
router.post('/resend', authController.resend);
router.post('/verify', authController.verify);
router.post('/login', authController.login);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.post('/profile', requireAuth, authController.updateProfile);

// --- Додаємо проксі-маршрути для чатів ---
// GET /auth/chats — отримати всі чати користувача
router.get('/chats', requireAuth, chatController.getChats);

// POST /auth/chats/save — зберегти/оновити чати користувача (isFavorite)
router.post('/chats/save', requireAuth, (req, res, next) => {
	const { chatId, isFavorite } = req.body;
	if (!chatId || typeof isFavorite === 'undefined') {
		return res.status(400).json({ ok: false, error: 'chatId and isFavorite required' });
	}
	req.params.chatId = chatId;
	req.body.isFavorite = isFavorite;
	return chatController.saveChat(req, res, next);
});

module.exports = router;
