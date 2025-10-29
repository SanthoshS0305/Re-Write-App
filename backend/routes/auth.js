const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
} = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  ],
  validate,
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

