const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Progressive delays for repeated attempts
  skipSuccessfulRequests: true,
});

/**
 * Registration rate limiter
 * 3 requests per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search endpoint rate limiter
 * 20 requests per minute to prevent abuse
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: 'Too many search requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  registerLimiter,
  apiLimiter,
  searchLimiter,
};

