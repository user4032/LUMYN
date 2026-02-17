const Chat = require('../models/Chat');
const ChatSettings = require('../models/ChatSettings');

/**
 * Get chat settings
 */
const getSettings = async (currentUserId, chatId) => {
  let settings = await ChatSettings.findOne({
    chatId,
    userId: currentUserId,
  });

  if (!settings) {
    settings = await ChatSettings.create({
      chatId,
      userId: currentUserId,
    });
  }

  return settings;
};

/**
 * Update chat settings
 */
const updateSettings = async (currentUserId, chatId, updateData) => {
  const {
    isMuted,
    isFavorite,
    isArchived,
    notificationLevel,
    customColor,
    customEmoji,
    mutedUntil,
  } = updateData || {};

  let settings = await ChatSettings.findOne({
    chatId,
    userId: currentUserId,
  });

  if (!settings) {
    settings = await ChatSettings.create({
      chatId,
      userId: currentUserId,
    });
  }

  if (isMuted !== undefined) settings.isMuted = isMuted;
  if (mutedUntil !== undefined) settings.mutedUntil = mutedUntil;
  if (isFavorite !== undefined) settings.isFavorite = isFavorite;
  if (isArchived !== undefined) settings.isArchived = isArchived;
  if (notificationLevel !== undefined) settings.notificationLevel = notificationLevel;
  if (customColor !== undefined) settings.customColor = customColor;
  if (customEmoji !== undefined) settings.customEmoji = customEmoji;

  await settings.save();
  return settings;
};

/**
 * Get favorite chats
 */
const getFavorites = async (currentUserId) => {
  const favorites = await ChatSettings.find({
    userId: currentUserId,
    isFavorite: true,
  });

  return favorites.map((f) => f.chatId);
};

/**
 * Get chats
 */
const getUserChats = async (currentUserId) => {
  const chats = await Chat.find({
    'participants.userId': currentUserId,
  })
    .sort({ 'lastMessage.timestamp': -1 })
    .populate('participants.userId', 'username displayName avatar');

  return chats.map((c) => ({
    id: String(c._id),
    chatId: c.chatId,
    name: c.name,
    type: c.type,
    participants: c.participants.map((p) => ({
      id: String(p.userId._id),
      username: p.userId.username,
      displayName: p.userId.displayName,
      avatar: p.userId.avatar,
      role: p.role,
    })),
    lastMessage: c.lastMessage,
    createdAt: c.createdAt,
  }));
};

/**
 * Save chat (mark as favorite/unfavorite)
 */
const saveChat = async (currentUserId, chatId, isFavorite) => {
  const settings = await updateSettings(currentUserId, chatId, {
    isFavorite,
  });

  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
  getFavorites,
  getUserChats,
  saveChat,
};
