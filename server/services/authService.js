const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const VerificationCode = require('../models/VerificationCode');
const { createCode, hashValue, createToken } = require('../utils/crypto');
const { sendVerificationEmail } = require('./emailService');

const DEV_CODE = String(process.env.AUTH_DEV_CODE || '').toLowerCase() === 'true';

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

/**
 * Get user by username
 */
const getUserByUsername = async (username) => {
  const normalized = String(username).trim().toLowerCase();
  return await User.findOne({ username: normalized });
};

/**
 * Validate username format
 */
const validateUsername = (username) => {
  if (username.length < 4 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return false;
  }
  return true;
};

/**
 * Register new user
 */
const registerUser = async (email, password, displayName, username) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const name = String(displayName || normalizedEmail.split('@')[0] || 'User').trim();
  const userUsername = String(username || normalizedEmail.split('@')[0]).trim();

  // Validate username
  if (!validateUsername(userUsername)) {
    throw new Error('Invalid username format');
  }

  // Check if username is taken
  const existingUsername = await getUserByUsername(userUsername);
  if (existingUsername) {
    throw new Error('Username already taken');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const existing = await getUserByEmail(normalizedEmail);

  if (existing && existing.verified) {
    throw new Error('Account already exists');
  }

  let user;

  if (existing && !existing.verified) {
    // Check if new username conflicts with another user
    const usernameConflict = await User.findOne({
      _id: { $ne: existing._id },
      username: userUsername.toLowerCase(),
    });
    if (usernameConflict) {
      throw new Error('Username already taken');
    }

    existing.passwordHash = passwordHash;
    existing.displayName = name;
    existing.username = userUsername.toLowerCase();
    user = await existing.save();
  } else {
    user = await User.create({
      email: normalizedEmail,
      username: userUsername.toLowerCase(),
      passwordHash,
      displayName: name,
      verified: false,
    });
  }

  // Generate and send verification code
  await VerificationCode.deleteMany({ userId: user._id });
  const code = createCode();
  await VerificationCode.create({
    userId: user._id,
    codeHash: hashValue(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // In development mode, always return the code
  if (DEV_CODE) {
    console.log(`[DEV] Verification code for ${normalizedEmail}: ${code}`);
    try {
      await sendVerificationEmail(normalizedEmail, code);
      console.log(`[DEV] Email sent successfully to ${normalizedEmail}`);
    } catch (err) {
      console.warn(`[DEV] Failed to send email, but returning code anyway:`, err.message);
    }
    return { success: true, needsVerification: true, devCode: code };
  }

  // In production mode, email must be sent successfully
  try {
    await sendVerificationEmail(normalizedEmail, code);
    return { success: true, needsVerification: true };
  } catch (err) {
    throw new Error('Failed to send verification email');
  }
};

/**
 * Resend verification code
 */
const resendVerificationCode = async (email) => {
  const user = await getUserByEmail(String(email).trim().toLowerCase());
  
  if (!user) {
    throw new Error('Account not found');
  }
  
  if (user.verified) {
    throw new Error('Account already verified');
  }

  const code = createCode();
  await VerificationCode.deleteMany({ userId: user._id });
  await VerificationCode.create({
    userId: user._id,
    codeHash: hashValue(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // In development mode, always return the code
  if (DEV_CODE) {
    console.log(`[DEV] Resend verification code for ${user.email}: ${code}`);
    try {
      await sendVerificationEmail(user.email, code);
      console.log(`[DEV] Email sent successfully to ${user.email}`);
    } catch (err) {
      console.warn(`[DEV] Failed to send email, but returning code anyway:`, err.message);
    }
    return { success: true, devCode: code };
  }

  // In production mode, email must be sent successfully
  try {
    await sendVerificationEmail(user.email, code);
    return { success: true };
  } catch (err) {
    throw new Error('Failed to send verification email');
  }
};

/**
 * Verify user email with code
 */
const verifyEmail = async (email, code) => {
  const user = await getUserByEmail(String(email).trim().toLowerCase());
  
  if (!user) {
    throw new Error('Account not found');
  }

  const entry = await VerificationCode.findOne({ userId: user._id }).sort({ expiresAt: -1 });

  if (!entry || entry.expiresAt < new Date()) {
    throw new Error('Verification code expired');
  }

  if (hashValue(String(code).trim()) !== entry.codeHash) {
    throw new Error('Invalid verification code');
  }

  user.verified = true;
  await user.save();
  await VerificationCode.deleteMany({ userId: user._id });

  return { success: true };
};

/**
 * Login user and create session
 */
const loginUser = async (email, password) => {
  const user = await getUserByEmail(String(email).trim().toLowerCase());
  
  if (!user) {
    throw new Error('Account not found');
  }
  
  if (!user.verified) {
    throw new Error('Email not verified');
  }

  const passwordOk = await bcrypt.compare(String(password), user.passwordHash);
  
  if (!passwordOk) {
    throw new Error('Invalid credentials');
  }

  const token = createToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Session.create({ token, userId: user._id, expiresAt });

  return {
    token,
    user: formatUserProfile(user),
  };
};

/**
 * Get current user by token
 */
const getCurrentUser = async (token) => {
  const session = await Session.findOne({ token });
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await Session.deleteOne({ token });
    }
    throw new Error('Session expired');
  }

  const user = await User.findById(session.userId);
  
  if (!user) {
    throw new Error('Account not found');
  }

  return formatUserProfile(user);
};

/**
 * Logout user by deleting session
 */
const logoutUser = async (token) => {
  await Session.deleteOne({ token });
  return { success: true };
};

/**
 * Update user profile
 */
const updateProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { username, displayName, bio, customStatus, status, avatar, profileBanner, profileFrame } = profileData;

  // Validate username if provided
  if (username) {
    if (username.length < 4) {
      throw new Error('Username must be at least 4 characters');
    }
    // Check if username is already taken by another user
    const existing = await User.findOne({
      _id: { $ne: userId },
      username: username.toLowerCase(),
    });
    if (existing) {
      throw new Error('Username already taken');
    }
    user.username = username.toLowerCase();
  }

  if (displayName) user.displayName = String(displayName).trim();
  if (bio !== undefined) user.bio = String(bio || '').trim();
  if (customStatus !== undefined) user.customStatus = String(customStatus || '').trim();
  if (status) user.status = status;
  if (avatar) user.avatar = avatar;
  if (profileBanner !== undefined) user.profileBanner = String(profileBanner || '').trim();
  if (profileFrame !== undefined) user.profileFrame = String(profileFrame || 'default').trim();

  await user.save();

  return formatUserProfile(user);
};

/**
 * Format user profile for API response
 */
const formatUserProfile = (user) => {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    status: user.status,
    customStatus: user.customStatus,
    bio: user.bio,
    profileBanner: user.profileBanner || '',
    profileFrame: user.profileFrame || 'default',
  };
};

module.exports = {
  getUserByEmail,
  getUserByUsername,
  registerUser,
  resendVerificationCode,
  verifyEmail,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateProfile,
  formatUserProfile,
};
