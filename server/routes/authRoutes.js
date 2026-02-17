const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middlewares/auth');

// Public routes
router.post('/register', authController.register);
router.post('/resend', authController.resend);
router.post('/verify', authController.verify);
router.post('/login', authController.login);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.post('/profile', requireAuth, authController.updateProfile);

module.exports = router;
