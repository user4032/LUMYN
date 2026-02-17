const Notification = require('../models/Notification');

/**
 * Get all notifications for user
 */
const getNotifications = async (currentUserId, limit = 50, skip = 0) => {
  const notifications = await Notification.find({ userId: currentUserId })
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit));

  const total = await Notification.countDocuments({ userId: currentUserId });
  const unreadCount = await Notification.countDocuments({
    userId: currentUserId,
    read: false,
  });

  return {
    notifications: notifications.map((n) => formatNotification(n)),
    total,
    unreadCount,
  };
};

/**
 * Create notification
 */
const createNotification = async (userId, type, title, content, data, io) => {
  const notification = await Notification.create({
    userId,
    type,
    title,
    content,
    data,
  });

  if (io) {
    io.to(String(userId)).emit('notification:new', {
      id: String(notification._id),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, currentUserId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (String(notification.userId) !== String(currentUserId)) {
    throw new Error('Not authorized');
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (currentUserId) => {
  const result = await Notification.updateMany(
    { userId: currentUserId, read: false },
    { read: true, readAt: new Date() }
  );

  return result.modifiedCount;
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, currentUserId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (String(notification.userId) !== String(currentUserId)) {
    throw new Error('Not authorized');
  }

  await Notification.deleteOne({ _id: notificationId });
  return { success: true };
};

/**
 * Delete all notifications
 */
const deleteAllNotifications = async (currentUserId) => {
  await Notification.deleteMany({ userId: currentUserId });
  return { success: true };
};

/**
 * Helper function to format notification
 */
const formatNotification = (n) => ({
  id: String(n._id),
  type: n.type,
  title: n.title,
  content: n.content,
  data: n.data,
  read: n.read,
  readAt: n.readAt,
  createdAt: n.createdAt,
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
