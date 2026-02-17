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
 * Generate server invite code (без префіксу)
 * @returns {string} 8-character readable code
 */
const createInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без схожих символів
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generate random gradient for server banner
 * @returns {string} CSS gradient string
 */
const createRandomGradient = () => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f8b500 0%, #fceabb 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #667eea 0%, #f857a6 100%)',
    'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

module.exports = {
  createCode,
  hashValue,
  createToken,
  createInviteCode,
  createRandomGradient,
};
