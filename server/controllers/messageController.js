const messageService = require('../services/messageService');

/**
 * GET /messages/history/:chatId
 * Get message history
 */
const getHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    const messages = await messageService.getMessageHistory(
      req.user._id,
      chatId,
      limit,
      before
    );
    res.json({ ok: true, messages });
  } catch (error) {
    if (error.message === 'Not a participant of this chat') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /messages/send
 * Send message
 */
const send = async (req, res, next) => {
  try {
    const { chatId, content, type, attachments, mentions, replyTo } = req.body || {};

    if (!chatId || !content) {
      return res.status(400).json({
        ok: false,
        error: 'chatId and content are required',
      });
    }

    const io = req.app.get('io');
    const message = await messageService.sendMessage(
      req.user,
      chatId,
      content,
      type,
      attachments,
      mentions,
      replyTo,
      io
    );

    res.json({ ok: true, message });
  } catch (error) {
    if (error.message === 'Not a participant of this chat') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * GET /messages/pinned/:chatId
 * Get pinned messages
 */
const getPinned = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const messages = await messageService.getPinnedMessages(req.user._id, chatId);
    res.json({ ok: true, messages });
  } catch (error) {
    if (error.message === 'Not a participant of this chat') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /messages/:messageId/pin
 * Pin message
 */
const pin = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const io = req.app.get('io');
    const message = await messageService.pinMessage(messageId, req.user._id, io);
    res.json({ ok: true, message: { id: String(message._id), pinned: true } });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /messages/:messageId/pin
 * Unpin message
 */
const unpin = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const io = req.app.get('io');
    const message = await messageService.unpinMessage(messageId, io);
    res.json({ ok: true, message: { id: String(message._id), pinned: false } });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * GET /messages/search
 * Search messages
 */
const search = async (req, res, next) => {
  try {
    const { query, chatId, limit = 20, skip = 0 } = req.query;

    const result = await messageService.searchMessages(
      req.user._id,
      query,
      chatId,
      limit,
      skip
    );

    res.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === 'Query is required') {
      return res.status(400).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a participant of this chat') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /messages/:messageId/reactions
 * Toggle reaction
 */
const toggleReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body || {};

    if (!emoji) {
      return res.status(400).json({ ok: false, error: 'Emoji is required' });
    }

    const io = req.app.get('io');
    const reactions = await messageService.toggleReaction(
      messageId,
      req.user._id,
      emoji,
      io
    );

    res.json({ ok: true, reactions });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /messages/:messageId/read
 * Mark message as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const io = req.app.get('io');
    const message = await messageService.markMessageAsRead(
      messageId,
      req.user._id,
      io
    );
    res.json({ ok: true, message });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /chats/:chatId/read
 * Mark all chat messages as read
 */
const markChatAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const count = await messageService.markChatAsRead(chatId, req.user._id);
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /messages/:messageId/forward
 * Forward message
 */
const forward = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { targetChatId } = req.body || {};

    if (!targetChatId) {
      return res.status(400).json({
        ok: false,
        error: 'targetChatId is required',
      });
    }

    const io = req.app.get('io');
    const message = await messageService.forwardMessage(
      messageId,
      req.user._id,
      targetChatId,
      io
    );

    res.json({ ok: true, message });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not a participant of target chat') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * POST /messages/:messageId/expire
 * Set message expiration
 */
const setExpiration = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { expiresIn } = req.body || {};

    if (!expiresIn || expiresIn <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'expiresIn must be > 0',
      });
    }

    const message = await messageService.setMessageExpiration(
      messageId,
      req.user._id,
      expiresIn
    );

    res.json({ ok: true, message });
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not authorized') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getHistory,
  send,
  getPinned,
  pin,
  unpin,
  search,
  toggleReaction,
  markAsRead,
  markChatAsRead,
  forward,
  setExpiration,
};
