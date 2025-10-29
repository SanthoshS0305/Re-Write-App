const express = require('express');
const { body } = require('express-validator');
const {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  reorderChapters,
} = require('../controllers/storyController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/stories
 * @desc    Get all stories for user
 * @access  Private
 */
router.get('/', getStories);

/**
 * @route   GET /api/v1/stories/:id
 * @desc    Get single story
 * @access  Private
 */
router.get('/:id', getStory);

/**
 * @route   POST /api/v1/stories
 * @desc    Create new story
 * @access  Private
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
  ],
  validate,
  createStory
);

/**
 * @route   PUT /api/v1/stories/:id
 * @desc    Update story
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
  ],
  validate,
  updateStory
);

/**
 * @route   DELETE /api/v1/stories/:id
 * @desc    Delete story
 * @access  Private
 */
router.delete('/:id', deleteStory);

/**
 * @route   PUT /api/v1/stories/:id/reorder
 * @desc    Reorder chapters
 * @access  Private
 */
router.put(
  '/:id/reorder',
  [
    body('chapterIds')
      .isArray()
      .withMessage('Chapter IDs must be an array')
      .notEmpty()
      .withMessage('Chapter IDs cannot be empty'),
  ],
  validate,
  reorderChapters
);

module.exports = router;

