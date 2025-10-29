const {
  verifyAccessToken,
  isTokenBlacklisted,
} = require('../utils/tokenManager');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Attach user ID to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

module.exports = { authenticate };

