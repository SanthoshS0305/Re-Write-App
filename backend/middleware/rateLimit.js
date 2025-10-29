const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints
 * Development: 500 requests per 15 minutes per IP (very high for testing)
 * Production: Consider reducing to 5 for security
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 500, // Much higher for development
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
 * Development: 20 requests per hour per IP (increased for testing)
 * Production: Consider reducing to 3 for security
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Increased for development
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Development: 1000 requests per 15 minutes
 * Production: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
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

