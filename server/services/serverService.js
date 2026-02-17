const Server = require('../models/Server');
const User = require('../models/User');
const { createInviteCode, createRandomGradient } = require('../utils/crypto');

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
  const serverBanner = banner || createRandomGradient();

  const server = await Server.create({
    serverId,
    inviteCode,
    name: String(name).trim(),
    ownerId: userId,
    description: '',
    icon: '',
    banner: serverBanner,
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
  if (updates.inviteCode !== undefined) {
    const normalizedInviteCode = String(updates.inviteCode).trim().toUpperCase();
    if (!/^[A-Z0-9]{4,10}$/.test(normalizedInviteCode)) {
      throw new Error('Invalid invite code');
    }

    const existing = await Server.findOne({
      inviteCode: normalizedInviteCode,
      _id: { $ne: server._id },
    });
    if (existing) {
      throw new Error('Invite code already in use');
    }

    server.inviteCode = normalizedInviteCode;
  }

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

/**
 * Create role
 */
const createRole = async (userId, serverId, name, color, permissions) => {
  const server = await Server.findOne({ serverId });
  if (!server) throw new Error('Server not found');
  
  const member = server.members.find(m => m.userId.toString() === userId.toString());
  if (!member) throw new Error('Not a member');
  
  const isOwner = server.ownerId.toString() === userId.toString();
  const hasPermission = member.permissions?.get('admin') || member.permissions?.get('manage_roles');
  
  if (!isOwner && !hasPermission) {
    throw new Error('No permission to create roles');
  }

  const roleId = `role_${Date.now()}`;
  server.roles = server.roles || [];
  server.roles.push({
    roleId,
    name: String(name).trim(),
    color: color || '#99AAB5',
    permissions: permissions || ['send_messages'],
    position: server.roles.length,
  });

  await server.save();
  return server.toObject();
};

/**
 * Update role
 */
const updateRole = async (userId, serverId, roleId, updates) => {
  const server = await Server.findOne({ serverId });
  if (!server) throw new Error('Server not found');
  
  const member = server.members.find(m => m.userId.toString() === userId.toString());
  if (!member) throw new Error('Not a member');
  
  const isOwner = server.ownerId.toString() === userId.toString();
  const hasPermission = member.permissions?.get('admin') || member.permissions?.get('manage_roles');
  
  if (!isOwner && !hasPermission) {
    throw new Error('No permission to update roles');
  }

  const role = server.roles.find(r => r.roleId === roleId);
  if (!role) throw new Error('Role not found');

  if (updates.name) role.name = String(updates.name).trim();
  if (updates.color) role.color = updates.color;
  if (updates.permissions) role.permissions = updates.permissions;
  if (updates.position !== undefined) role.position = updates.position;

  await server.save();
  return server.toObject();
};

/**
 * Delete role
 */
const deleteRole = async (userId, serverId, roleId) => {
  const server = await Server.findOne({ serverId });
  if (!server) throw new Error('Server not found');
  
  const member = server.members.find(m => m.userId.toString() === userId.toString());
  if (!member) throw new Error('Not a member');
  
  const isOwner = server.ownerId.toString() === userId.toString();
  const hasPermission = member.permissions?.get('admin') || member.permissions?.get('manage_roles');
  
  if (!isOwner && !hasPermission) {
    throw new Error('No permission to delete roles');
  }

  if (roleId === 'everyone') {
    throw new Error('Cannot delete @everyone role');
  }

  server.roles = server.roles.filter(r => r.roleId !== roleId);
  
  // Remove this role from all members
  server.memberRoles = server.memberRoles || new Map();
  for (const [memberId, assignedRoleId] of server.memberRoles.entries()) {
    if (assignedRoleId === roleId) {
      server.memberRoles.delete(memberId);
    }
  }

  await server.save();
  return server.toObject();
};

/**
 * Assign role to member
 */
const assignRole = async (userId, serverId, targetUserId, roleId) => {
  const server = await Server.findOne({ serverId });
  if (!server) throw new Error('Server not found');
  
  const member = server.members.find(m => m.userId.toString() === userId.toString());
  if (!member) throw new Error('Not a member');
  
  const isOwner = server.ownerId.toString() === userId.toString();
  const hasPermission = member.permissions?.get('admin') || member.permissions?.get('manage_roles');
  
  if (!isOwner && !hasPermission) {
    throw new Error('No permission to assign roles');
  }

  const targetMember = server.members.find(m => m.userId.toString() === targetUserId.toString());
  if (!targetMember) throw new Error('Target user is not a member');

  const role = server.roles.find(r => r.roleId === roleId);
  if (!role && roleId !== null) throw new Error('Role not found');

  server.memberRoles = server.memberRoles || new Map();
  if (roleId === null) {
    server.memberRoles.delete(targetUserId);
  } else {
    server.memberRoles.set(targetUserId, roleId);
  }

  await server.save();
  return server.toObject();
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
  createRole,
  updateRole,
  deleteRole,
  assignRole,
};
