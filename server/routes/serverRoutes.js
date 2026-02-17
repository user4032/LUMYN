const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const requireAuth = require('../middlewares/auth');

// All server routes require authentication
router.get('/my', requireAuth, serverController.getMyServers);
router.post('/create', requireAuth, serverController.createServer);
router.post('/join', requireAuth, serverController.joinServer);
router.get('/:serverId/members', requireAuth, serverController.getServerMembers);
router.patch('/:serverId', requireAuth, serverController.updateServer);
router.delete('/:serverId', requireAuth, serverController.deleteServer);
router.post('/:serverId/leave', requireAuth, serverController.leaveServer);

// Channel routes
router.post('/:serverId/channels', requireAuth, serverController.createChannel);
router.delete('/:serverId/channels/:channelId', requireAuth, serverController.deleteChannel);
router.patch('/:serverId/channels/:channelId', requireAuth, serverController.updateChannel);

// Role routes
router.post('/:serverId/roles', requireAuth, serverController.createRole);
router.patch('/:serverId/roles/:roleId', requireAuth, serverController.updateRole);
router.delete('/:serverId/roles/:roleId', requireAuth, serverController.deleteRole);
router.post('/:serverId/members/:userId/role', requireAuth, serverController.assignRole);

module.exports = router;
