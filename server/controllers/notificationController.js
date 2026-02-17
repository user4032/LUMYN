const notificationService = require('../services/notificationService');

/**
 * GET /notifications
 * Get all notifications
 */
const getAll = async (req, res, next) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const result = await notificationService.getNotifications(req.user._id, limit, skip);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /notifications
 * Create notification
 */
const create = async (req, res, next) => {
  try {
    const { type, title, content, data } = req.body || {};

    if (!title || !type) {
      return res.status(400).json({
        ok: false,
        error: 'Title and type are required',
      });
    }

    const io = req.app.get('io');
    const notification = await notificationService.createNotification(
      req.user._id,
      type,
      title,
      content,
      data,
      io
    );

    res.json({ ok: true, notification });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /notifications/:notificationId/read
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(
      notificationId,
      req.user._id
    );
    res.json({ ok: true, notification });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not authorized') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const updatedCount = await notificationService.markAllAsRead(req.user._id);
    res.json({ ok: true, updatedCount });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /notifications/:notificationId
 * Delete notification
 */
const deleteOne = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await notificationService.deleteNotification(notificationId, req.user._id);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({ ok: false, error: error.message });
    }
    if (error.message === 'Not authorized') {
      return res.status(403).json({ ok: false, error: error.message });
    }
    next(error);
  }
};

/**
 * DELETE /notifications
 * Delete all notifications
 */
const deleteAll = async (req, res, next) => {
  try {
    await notificationService.deleteAllNotifications(req.user._id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  create,
  markAsRead,
  markAllAsRead,
  deleteOne,
  deleteAll,
};
