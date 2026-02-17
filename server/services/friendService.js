const User = require('../models/User');
const Friendship = require('../models/Friendship');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const { getUserByUsername } = require('./authService');

/**
 * Get friends list with incoming/outgoing requests
 */
const getFriendsList = async (userId) => {
  // Find all friendships
  const friendships = await Friendship.find({
    $or: [{ userA: userId }, { userB: userId }],
  });

  // Get friend IDs
  const friendIds = friendships.map((f) =>
    f.userA.toString() === userId.toString() ? f.userB : f.userA
  );

  // Load friend data
  const friends = await User.find({ _id: { $in: friendIds } }).select(
    '_id email username displayName'
  );

  // Incoming requests
  const incomingRequests = await FriendRequest.find({
    toUserId: userId,
    status: 'pending',
  }).populate('fromUserId', '_id email username displayName');

  // Outgoing requests
  const outgoingRequests = await FriendRequest.find({
    fromUserId: userId,
    status: 'pending',
  }).populate('toUserId', '_id email username displayName');

  return {
    friends: friends.map((f) => ({
      id: String(f._id),
      email: f.email,
      username: f.username,
      displayName: f.displayName,
    })),
    incoming: incomingRequests.map((r) => ({
      id: String(r._id),
      user: {
        id: String(r.fromUserId._id),
        email: r.fromUserId.email,
        username: r.fromUserId.username,
        displayName: r.fromUserId.displayName,
      },
      createdAt: r.createdAt,
    })),
    outgoing: outgoingRequests.map((r) => ({
      id: String(r._id),
      user: {
        id: String(r.toUserId._id),
        email: r.toUserId.email,
        username: r.toUserId.username,
        displayName: r.toUserId.displayName,
      },
      createdAt: r.createdAt,
    })),
  };
};

/**
 * Send friend request
 */
const sendFriendRequest = async (currentUser, targetUsername, io) => {
  const toUser = await getUserByUsername(targetUsername);

  if (!toUser) {
    throw new Error('User not found');
  }

  if (toUser._id.toString() === currentUser._id.toString()) {
    throw new Error('Cannot add yourself');
  }

  // Check if already friends
  const alreadyFriends = await Friendship.findOne({
    $or: [
      { userA: currentUser._id, userB: toUser._id },
      { userA: toUser._id, userB: currentUser._id },
    ],
  });

  if (alreadyFriends) {
    throw new Error('Already friends');
  }

  // Check if request exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { fromUserId: currentUser._id, toUserId: toUser._id },
      { fromUserId: toUser._id, toUserId: currentUser._id },
    ],
    status: 'pending',
  });

  if (existingRequest) {
    throw new Error('Request already exists');
  }

  await FriendRequest.create({
    fromUserId: currentUser._id,
    toUserId: toUser._id,
  });

  // Create notification for recipient
  const notification = await Notification.create({
    userId: toUser._id,
    type: 'friend_request',
    title: currentUser.username,
    content: `Sent you a friend request`,
    data: {
      fromUserId: String(currentUser._id),
      fromUsername: currentUser.username,
    },
  });

  // Send via Socket.IO
  if (io) {
    io.to(String(toUser._id)).emit('notification:new', {
      id: String(notification._id),
      type: 'friend_request',
      title: notification.title,
      content: notification.content,
      data: notification.data,
      createdAt: notification.createdAt,
    });
  }

  return { success: true };
};

/**
 * Respond to friend request (accept/reject)
 */
const respondToFriendRequest = async (currentUserId, requestId, accept) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw new Error('Request not found');
  }

  if (request.toUserId.toString() !== currentUserId.toString()) {
    throw new Error('Forbidden');
  }

  if (accept) {
    // Create friendship
    await Friendship.create({
      userA: request.fromUserId,
      userB: request.toUserId,
    });
    request.status = 'accepted';
  } else {
    request.status = 'rejected';
  }

  await request.save();
  return { success: true };
};

module.exports = {
  getFriendsList,
  sendFriendRequest,
  respondToFriendRequest,
};
