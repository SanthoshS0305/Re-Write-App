const jwt = require('jsonwebtoken');

/**
 * Token blacklist for logout functionality
 * In production, use Redis or database
 */
const tokenBlacklist = new Set();

/**
 * Generate access token (15 minutes)
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Generate refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Add token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
};

