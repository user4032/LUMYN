const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

/**
 * Get message history for a chat
 */
const getMessageHistory = async (currentUserId, chatId, limit = 50, before = null) => {
  // Verify user is chat participant
  const chat = await Chat.findOne({
    chatId,
    'participants.userId': currentUserId,
  });

  if (!chat) {
    throw new Error('Not a participant of this chat');
  }

  // Build query
  const query = { chatId, deleted: { $ne: true } };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('senderId', 'username displayName avatar');

  return messages.reverse().map((m) => formatMessage(m));
};

/**
 * Send message
 */
const sendMessage = async (currentUser, chatId, content, type, attachments, mentions, replyTo, io) => {
  // Verify chat exists and user is participant
  const chat = await Chat.findOne({
    chatId,
    'participants.userId': currentUser._id,
  });

  if (!chat) {
    throw new Error('Not a participant of this chat');
  }

  // Create message
  const message = await Message.create({
    chatId,
    senderId: currentUser._id,
    senderUsername: currentUser.username,
    content: String(content).trim(),
    type: type || 'text',
    attachments: attachments || [],
    mentions: mentions || [],
    replyTo: replyTo || null,
  });

  // Update last message in chat
  chat.lastMessage = {
    content: message.content,
    senderId: String(currentUser._id),
    timestamp: message.createdAt,
  };
  await chat.save();

  // Create notifications for participants
  const otherParticipants = chat.participants.filter(
    (p) => String(p.userId) !== String(currentUser._id)
  );

  for (const participant of otherParticipants) {
    const notification = await Notification.create({
      userId: participant.userId,
      type: 'message',
      title: currentUser.username,
      content: message.content.substring(0, 100),
      data: {
        chatId,
        messageId: String(message._id),
      },
    });

    if (io) {
      io.to(String(participant.userId)).emit('notification:new', {
        id: String(notification._id),
        type: 'message',
        title: notification.title,
        content: notification.content,
        data: notification.data,
        createdAt: notification.createdAt,
      });
    }
  }

  // Create notifications for mentions
  if (mentions && mentions.length > 0) {
    for (const mentionedId of mentions) {
      const mentionNotif = await Notification.create({
        userId: mentionedId,
        type: 'mention',
        title: currentUser.username,
        content: `Mentioned you in: ${message.content.substring(0, 50)}`,
        data: {
          chatId,
          messageId: String(message._id),
        },
      });

      if (io) {
        io.to(String(mentionedId)).emit('notification:new', {
          id: String(mentionNotif._id),
          type: 'mention',
          title: mentionNotif.title,
          content: mentionNotif.content,
          data: mentionNotif.data,
          createdAt: mentionNotif.createdAt,
        });
      }
    }
  }

  // Broadcast via Socket.IO to chat room
  if (io) {
    io.to(chatId).emit('message:receive', {
      chatId: message.chatId,
      message: {
        id: String(message._id),
        chatId: message.chatId,
        senderId: String(currentUser._id),
        senderUsername: currentUser.username,
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        reactions: [],
        edited: false,
        createdAt: message.createdAt,
        readBy: [],
      },
    });
  }

  return message;
};

/**
 * Get pinned messages
 */
const getPinnedMessages = async (currentUserId, chatId) => {
  // Verify user is participant
  const chat = await Chat.findOne({
    chatId,
    'participants.userId': currentUserId,
  });

  if (!chat) {
    throw new Error('Not a participant of this chat');
  }

  const pinnedMessages = await Message.find({ chatId, pinned: true })
    .sort({ pinnedAt: -1 })
    .populate('senderId', 'username displayName avatar')
    .populate('pinnedBy', 'username displayName');

  return pinnedMessages.map((m) => ({
    ...formatMessage(m),
    pinned: m.pinned,
    pinnedAt: m.pinnedAt,
    pinnedBy: m.pinnedBy
      ? {
          id: String(m.pinnedBy._id),
          username: m.pinnedBy.username,
          displayName: m.pinnedBy.displayName,
        }
      : null,
  }));
};

/**
 * Pin message
 */
const pinMessage = async (messageid, currentUserId, io) => {
  const message = await Message.findById(messageid);

  if (!message) {
    throw new Error('Message not found');
  }

  message.pinned = true;
  message.pinnedAt = new Date();
  message.pinnedBy = currentUserId;
  await message.save();

  if (io) {
    io.to(message.chatId).emit('message:pinned', {
      messageId: String(message._id),
      pinned: true,
      pinnedAt: message.pinnedAt,
    });
  }

  return message;
};

/**
 * Unpin message
 */
const unpinMessage = async (messageId, io) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  message.pinned = false;
  message.pinnedAt = null;
  message.pinnedBy = null;
  await message.save();

  if (io) {
    io.to(message.chatId).emit('message:pinned', {
      messageId: String(message._id),
      pinned: false,
    });
  }

  return message;
};

/**
 * Search messages
 */
const searchMessages = async (currentUserId, query, chatId = null, limit = 20, skip = 0) => {
  if (!query) {
    throw new Error('Query is required');
  }

  if (chatId) {
    // Verify access
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': currentUserId,
    });

    if (!chat) {
      throw new Error('Not a participant of this chat');
    }
  }

  const filter = {
    deleted: { $ne: true },
    content: { $regex: String(query), $options: 'i' },
  };

  if (chatId) {
    filter.chatId = String(chatId);
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('senderId', 'username displayName avatar');

  const total = await Message.countDocuments(filter);

  return {
    messages: messages.map((m) => formatMessage(m)),
    total,
    hasMore: parseInt(skip) + messages.length < total,
  };
};

/**
 * Toggle reaction on message
 */
const toggleReaction = async (messageId, currentUserId, emoji, io) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  const existingReactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);

  if (existingReactionIndex >= 0) {
    const reaction = message.reactions[existingReactionIndex];
    const userIdStr = String(currentUserId);
    const userIndex = reaction.userId.findIndex((id) => String(id) === userIdStr);

    if (userIndex >= 0) {
      // Remove user (toggle off)
      reaction.userId.splice(userIndex, 1);

      if (reaction.userId.length === 0) {
        message.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      // Add user
      reaction.userId.push(currentUserId);
    }
  } else {
    // Create new reaction
    message.reactions.push({
      emoji,
      userId: [currentUserId],
    });
  }

  await message.save();

  if (io) {
    io.to(message.chatId).emit('message:reaction', {
      messageId: String(message._id),
      reactions: message.reactions,
    });
  }

  return message.reactions;
};

/**
 * Mark message as read
 */
const markMessageAsRead = async (messageId, currentUserId, io) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  const alreadyRead = message.readBy.some((r) => r.userId.toString() === currentUserId.toString());

  if (!alreadyRead) {
    message.readBy.push({
      userId: currentUserId,
      readAt: new Date(),
    });
    await message.save();

    if (io) {
      io.to(message.chatId).emit('message:read', {
        messageId: String(message._id),
        userId: String(currentUserId),
        readAt: new Date(),
      });
    }
  }

  return message;
};

/**
 * Mark all chat messages as read
 */
const markChatAsRead = async (chatId, currentUserId) => {
  const messages = await Message.find({ chatId });

  for (const message of messages) {
    const alreadyRead = message.readBy.some((r) => r.userId.toString() === currentUserId.toString());

    if (!alreadyRead) {
      message.readBy.push({
        userId: currentUserId,
        readAt: new Date(),
      });
      await message.save();
    }
  }

  return messages.length;
};

/**
 * Forward message
 */
const forwardMessage = async (messageId, currentUserId, targetChatId, io) => {
  const originalMessage = await Message.findById(messageId);

  if (!originalMessage) {
    throw new Error('Message not found');
  }

  // Verify user is chat member
  const chat = await Chat.findOne({
    chatId: targetChatId,
    'participants.userId': currentUserId,
  });

  if (!chat) {
    throw new Error('Not a participant of target chat');
  }

  const user = await require('../models/User').findById(currentUserId);

  const forwardedMessage = await Message.create({
    chatId: targetChatId,
    senderId: currentUserId,
    senderUsername: user.username,
    content: originalMessage.content,
    type: originalMessage.type,
    attachments: originalMessage.attachments,
    forwardedFrom: originalMessage._id,
  });

  chat.lastMessage = {
    content: `[Forwarded] ${forwardedMessage.content}`,
    senderId: String(currentUserId),
    timestamp: forwardedMessage.createdAt,
  };
  await chat.save();

  if (io) {
    io.to(targetChatId).emit('message:new', {
      id: String(forwardedMessage._id),
      chatId: forwardedMessage.chatId,
      senderId: String(currentUserId),
      senderUsername: user.username,
      content: forwardedMessage.content,
      type: forwardedMessage.type,
      attachments: forwardedMessage.attachments,
      forwardedFrom: String(originalMessage._id),
      createdAt: forwardedMessage.createdAt,
    });
  }

  return forwardedMessage;
};

/**
 * Set message expiration
 */
const setMessageExpiration = async (messageId, currentUserId, expiresInSeconds) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  if (message.senderId.toString() !== currentUserId.toString()) {
    throw new Error('Not authorized');
  }

  message.expiresIn = expiresInSeconds;
  message.expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  await message.save();

  return message;
};

/**
 * Helper function to format message response
 */
const formatMessage = (m) => ({
  id: String(m._id),
  chatId: m.chatId,
  senderId: String(m.senderId._id),
  senderUsername: m.senderId.username,
  senderDisplayName: m.senderId.displayName,
  senderAvatar: m.senderId.avatar,
  content: m.content,
  type: m.type,
  attachments: m.attachments,
  mentions: m.mentions,
  replyTo: m.replyTo,
  edited: m.edited,
  editedAt: m.editedAt,
  reactions: m.reactions,
  createdAt: m.createdAt,
});

module.exports = {
  getMessageHistory,
  sendMessage,
  getPinnedMessages,
  pinMessage,
  unpinMessage,
  searchMessages,
  toggleReaction,
  markMessageAsRead,
  markChatAsRead,
  forwardMessage,
  setMessageExpiration,
};
