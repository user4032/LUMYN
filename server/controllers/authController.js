const authService = require('../services/authService');

/**
 * POST /auth/register
 * Register new user account
 */
const register = async (req, res, next) => {
  try {
    const { email, password, displayName, username } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.registerUser(email, password, displayName, username);
    res.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === 'Invalid username format') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Username already taken' || error.message === 'Account already exists') {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === 'Failed to send verification email') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /auth/resend
 * Resend verification code
 */
const resend = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await authService.resendVerificationCode(email);
    res.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Account already verified') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Failed to send verification email') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /auth/verify
 * Verify email with code
 */
const verify = async (req, res, next) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const result = await authService.verifyEmail(email, code);
    res.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Verification code expired' || error.message === 'Invalid verification code') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /auth/login
 * Login user and create session
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.loginUser(email, password);
    res.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Email not verified') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current user profile
 */
const me = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getCurrentUser(token);
    res.json({ ok: true, user });
  } catch (error) {
    if (error.message === 'Session expired') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout user and delete session
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      await authService.logoutUser(token);
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/profile
 * Update user profile (banner, avatar, frame, bio, etc.)
 */
const updateProfile = async (req, res, next) => {
  try {
    const profileData = req.body || {};

    const user = await authService.updateProfile(req.user._id, profileData);
    
    res.json({ ok: true, user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Username must be at least 4 characters' || 
        error.message === 'Username already taken') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  register,
  resend,
  verify,
  login,
  me,
  logout,
  updateProfile,
};
