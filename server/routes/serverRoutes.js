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
router.post('/:serverId/channels', requireAuth, serverController.createChannel);
router.delete('/:serverId/channels/:channelId', requireAuth, serverController.deleteChannel);
router.patch('/:serverId/channels/:channelId', requireAuth, serverController.updateChannel);

module.exports = router;
