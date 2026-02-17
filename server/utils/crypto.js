const crypto = require('crypto');

/**
 * Generate 6-digit verification code
 */
const createCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash a value using SHA-256
 * @param {string} value - Value to hash
 * @returns {string} Hashed value
 */
const hashValue = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Generate random session token
 * @returns {string} 64-character hex token
 */
const createToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate server invite code
 * @returns {string} 8-character uppercase hex code
 */
const createInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

module.exports = {
  createCode,
  hashValue,
  createToken,
  createInviteCode,
};
