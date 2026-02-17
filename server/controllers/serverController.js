const serverService = require('../services/serverService');

/**
 * GET /servers/my
 * Get all user's servers
 */
const getMyServers = async (req, res, next) => {
  try {
    const servers = await serverService.getUserServers(req.user._id);
    res.json({ ok: true, servers });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /servers/create
 * Create new server
 */
const createServer = async (req, res, next) => {
  try {
    const { name, channels, banner } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const server = await serverService.createServer(req.user._id, req.user, name, channels, banner);
    res.json({ ok: true, server });
  } catch (error) {
    console.error('[SERVER CREATE ERROR]:', error.message, error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to create server' });
  }
};

/**
 * POST /servers/join
 * Join server by invite code
 */
const joinServer = async (req, res, next) => {
  try {
    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const server = await serverService.joinServer(req.user._id, req.user, code);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * GET /servers/:serverId/members
 * Get server members
 */
const getServerMembers = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const members = await serverService.getServerMembers(req.user._id, serverId);
    res.json({ ok: true, members });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a member of this server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * PATCH /servers/:serverId
 * Update server settings
 */
const updateServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const server = await serverService.updateServer(req.user._id, serverId, req.body);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Only owner can update server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /servers/:serverId
 * Delete server
 */
const deleteServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    await serverService.deleteServer(req.user._id, serverId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Only owner can delete server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /servers/:serverId/leave
 * Leave server
 */
const leaveServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    await serverService.leaveServer(req.user._id, serverId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Owner cannot leave. Delete server instead.') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a member of this server') {
      return res.status(400).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /servers/:serverId/channels
 * Create channel
 */
const createChannel = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name, type, category } = req.body || {};
    
    const channel = await serverService.createChannel(req.user._id, serverId, name, type, category);
    res.json({ ok: true, channel });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a member of this server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    if (error.message === 'Name and type are required') {
      return res.status(400).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /servers/:serverId/channels/:channelId
 * Delete channel
 */
const deleteChannel = async (req, res, next) => {
  try {
    const { serverId, channelId } = req.params;
    await serverService.deleteChannel(req.user._id, serverId, channelId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Server not found' || error.message === 'Channel not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a member of this server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * PATCH /servers/:serverId/channels/:channelId
 * Update channel
 */
const updateChannel = async (req, res, next) => {
  try {
    const { serverId, channelId } = req.params;
    const channel = await serverService.updateChannel(req.user._id, serverId, channelId, req.body);
    res.json({ ok: true, channel });
  } catch (error) {
    if (error.message === 'Server not found' || error.message === 'Channel not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a member of this server') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /servers/:serverId/roles
 * Create role
 */
const createRole = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name, color, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, error: 'Role name is required' });
    }

    const server = await serverService.createRole(req.user._id, serverId, name, color, permissions);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'No permission to create roles' || error.message === 'Not a member') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * PATCH /servers/:serverId/roles/:roleId
 * Update role
 */
const updateRole = async (req, res, next) => {
  try {
    const { serverId, roleId } = req.params;
    const server = await serverService.updateRole(req.user._id, serverId, roleId, req.body);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found' || error.message === 'Role not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'No permission to update roles' || error.message === 'Not a member') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /servers/:serverId/roles/:roleId
 * Delete role
 */
const deleteRole = async (req, res, next) => {
  try {
    const { serverId, roleId } = req.params;
    const server = await serverService.deleteRole(req.user._id, serverId, roleId);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found' || error.message === 'Role not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Cannot delete @everyone role') {
      return res.status(400).json({ ok: false, error: error.message });
    }
    if (error.message === 'No permission to delete roles' || error.message === 'Not a member') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /servers/:serverId/members/:userId/role
 * Assign role to member
 */
const assignRole = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    const { roleId } = req.body;
    
    const server = await serverService.assignRole(req.user._id, serverId, userId, roleId);
    res.json({ ok: true, server });
  } catch (error) {
    if (error.message === 'Server not found' || error.message === 'Role not found' || error.message === 'Target user is not a member') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'No permission to assign roles' || error.message === 'Not a member') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getMyServers,
  createServer,
  joinServer,
  getServerMembers,
  updateServer,
  deleteServer,
  leaveServer,
  createChannel,
  deleteChannel,
  updateChannel,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
};
