const Server = require('../models/Server');
const User = require('../models/User');
const { createInviteCode } = require('../utils/crypto');

/**
 * Get all user's servers
 */
const getUserServers = async (userId) => {
  const servers = await Server.find({ 'members.userId': userId });
  return servers.map((s) => s.toObject());
};

/**
 * Create new server
 */
const createServer = async (userId, user, name, channels, banner) => {
  const serverId = `srv_${Date.now()}`;
  const inviteCode = createInviteCode();

  const server = await Server.create({
    serverId,
    inviteCode,
    name: String(name).trim(),
    ownerId: userId,
    description: '',
    icon: '',
    banner: banner || '',
    members: [
      {
        userId,
        username: user.username,
        displayName: user.displayName,
        role: 'owner',
      },
    ],
    channels: Array.isArray(channels)
      ? channels.map((ch, idx) => ({
          channelId: ch.id || `ch_${Date.now()}_${idx}`,
          name: ch.name,
          type: ch.type || 'text',
          category: ch.category || null,
          position: idx,
        }))
      : [],
  });

  console.log(`[SERVER CREATE SUCCESS] Created server ${serverId} with ${server.channels.length} channels`);
  return server.toObject();
};

/**
 * Join server by invite code
 */
const joinServer = async (userId, user, code) => {
  const normalizedCode = String(code).trim().toUpperCase();
  const server = await Server.findOne({ inviteCode: normalizedCode });

  if (!server) {
    throw new Error('Server not found');
  }

  const isMember = server.members.some((m) => m.userId.toString() === userId.toString());
  
  if (!isMember) {
    server.members.push({
      userId,
      username: user.username,
      displayName: user.displayName,
      role: 'member',
    });
    await server.save();
  }

  return server.toObject();
};

/**
 * Get server members
 */
const getServerMembers = async (userId, serverId) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  const isMember = server.members.some((m) => m.userId.toString() === userId.toString());
  
  if (!isMember) {
    throw new Error('Not a member of this server');
  }

  const memberIds = server.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } });

  return users.map((user) => ({
    id: String(user._id),
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    status: user.status || 'offline',
    customStatus: user.customStatus || '',
    bio: user.bio || '',
  }));
};

/**
 * Update server settings
 */
const updateServer = async (userId, serverId, updates) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (String(server.ownerId) !== String(userId)) {
    throw new Error('Only owner can update server');
  }

  if (updates.name) server.name = String(updates.name).trim();
  if (updates.description !== undefined) server.description = String(updates.description).trim();
  if (updates.icon !== undefined) server.icon = updates.icon;
  if (updates.banner !== undefined) server.banner = updates.banner;

  await server.save();
  return server.toObject();
};

/**
 * Delete server
 */
const deleteServer = async (userId, serverId) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (String(server.ownerId) !== String(userId)) {
    throw new Error('Only owner can delete server');
  }

  await Server.deleteOne({ _id: server._id });
  return { success: true };
};

/**
 * Leave server
 */
const leaveServer = async (userId, serverId) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (String(server.ownerId) === String(userId)) {
    throw new Error('Owner cannot leave. Delete server instead.');
  }

  const isMember = server.members.some((m) => String(m.userId) === String(userId));
  
  if (!isMember) {
    throw new Error('Not a member of this server');
  }

  server.members = server.members.filter((m) => String(m.userId) !== String(userId));
  await server.save();
  return { success: true };
};

/**
 * Create channel
 */
const createChannel = async (userId, serverId, name, type, category) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (!server.members.some((m) => String(m.userId) === String(userId))) {
    throw new Error('Not a member of this server');
  }

  if (!name || !type) {
    throw new Error('Name and type are required');
  }

  const channel = {
    channelId: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: String(name).trim(),
    type: type,
    category: category || null,
    position: Array.isArray(server.channels) ? server.channels.length : 0,
  };

  if (!server.channels) server.channels = [];
  server.channels.push(channel);

  await server.save();
  return { ...channel, serverId: server.serverId };
};

/**
 * Delete channel
 */
const deleteChannel = async (userId, serverId, channelId) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (!server.members.some((m) => String(m.userId) === String(userId))) {
    throw new Error('Not a member of this server');
  }

  if (!server.channels) {
    throw new Error('Channel not found');
  }

  const channelIndex = server.channels.findIndex((ch) => ch.channelId === channelId);
  
  if (channelIndex === -1) {
    throw new Error('Channel not found');
  }

  server.channels.splice(channelIndex, 1);
  await server.save();
  return { success: true };
};

/**
 * Update channel
 */
const updateChannel = async (userId, serverId, channelId, updates) => {
  const server = await Server.findOne({ serverId });

  if (!server) {
    throw new Error('Server not found');
  }

  if (!server.members.some((m) => String(m.userId) === String(userId))) {
    throw new Error('Not a member of this server');
  }

  if (!server.channels) {
    throw new Error('Channel not found');
  }

  const channel = server.channels.find((ch) => ch.channelId === channelId);
  
  if (!channel) {
    throw new Error('Channel not found');
  }

  if (updates.name) channel.name = String(updates.name).trim();
  if (updates.category !== undefined) channel.category = updates.category;

  await server.save();
  return { ...channel.toObject(), serverId: server.serverId };
};

module.exports = {
  getUserServers,
  createServer,
  joinServer,
  getServerMembers,
  updateServer,
  deleteServer,
  leaveServer,
  createChannel,
  deleteChannel,
  updateChannel,
};
