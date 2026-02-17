const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middlewares/auth');

// All user routes require authentication
router.get('/search', requireAuth, userController.searchUsers);
router.get('/blocked', requireAuth, userController.getBlockedUsers);
router.get('/:userId', requireAuth, userController.getUserProfile);
router.post('/:userId/block', requireAuth, userController.blockUser);
router.delete('/:userId/block', requireAuth, userController.unblockUser);

module.exports = router;
