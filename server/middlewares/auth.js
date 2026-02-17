const Session = require('../models/Session');
const User = require('../models/User');

/**
 * Middleware to require authentication
 * Validates Bearer token and attaches user to request
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await Session.findOne({ token });
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await Session.deleteOne({ token });
      }
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = await User.findById(session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    // Attach user to request
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = requireAuth;
