const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireAuth = require('../middlewares/auth');

// All notification routes require authentication
router.get('/', requireAuth, notificationController.getAll);
router.post('/', requireAuth, notificationController.create);
router.patch('/:notificationId/read', requireAuth, notificationController.markAsRead);
router.patch('/read-all', requireAuth, notificationController.markAllAsRead);
router.delete('/:notificationId', requireAuth, notificationController.deleteOne);
router.delete('/', requireAuth, notificationController.deleteAll);

module.exports = router;
