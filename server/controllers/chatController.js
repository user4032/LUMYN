const chatService = require('../services/chatService');

/**
 * GET /chats
 * Get all user's chats
 */
const getChats = async (req, res, next) => {
  try {
    const chats = await chatService.getUserChats(req.user._id);
    res.json({ ok: true, chats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /chats/:chatId/settings
 * Get chat settings
 */
const getSettings = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const settings = await chatService.getSettings(req.user._id, chatId);
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /chats/:chatId/settings
 * Update chat settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const settings = await chatService.updateSettings(req.user._id, chatId, req.body);
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /chats/favorites
 * Get favorite chats
 */
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await chatService.getFavorites(req.user._id);
    res.json({ ok: true, favorites });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /chats/:chatId/save
 * Save/favorite a chat
 */
const saveChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { isFavorite } = req.body || {};

    if (isFavorite === undefined) {
      return res.status(400).json({
        ok: false,
        error: 'isFavorite is required',
      });
    }

    const settings = await chatService.saveChat(req.user._id, chatId, isFavorite);
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /chats/:chatId/read
 * Mark all messages in chat as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const messageService = require('../services/messageService');
    const count = await messageService.markChatAsRead(chatId, req.user._id);
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChats,
  getSettings,
  updateSettings,
  getFavorites,
  saveChat,
  markAsRead,
};
