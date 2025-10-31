const express = require('express');
const { body } = require('express-validator');
const {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  reorderChapters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
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

/**
 * @route   POST /api/v1/stories/:id/characters
 * @desc    Create character
 * @access  Private
 */
router.post(
  '/:id/characters',
  [
    body('primaryName')
      .trim()
      .notEmpty()
      .withMessage('Character name is required')
      .isLength({ max: 100 })
      .withMessage('Character name cannot exceed 100 characters'),
    body('aliases').optional().isArray().withMessage('Aliases must be an array'),
    body('shortcuts').optional().isArray().withMessage('Shortcuts must be an array'),
    body('color').optional().isString().withMessage('Color must be a string'),
  ],
  validate,
  createCharacter
);

/**
 * @route   PUT /api/v1/stories/:id/characters/:characterId
 * @desc    Update character
 * @access  Private
 */
router.put(
  '/:id/characters/:characterId',
  [
    body('primaryName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Character name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Character name cannot exceed 100 characters'),
    body('aliases').optional().isArray().withMessage('Aliases must be an array'),
    body('shortcuts').optional().isArray().withMessage('Shortcuts must be an array'),
    body('color').optional().isString().withMessage('Color must be a string'),
  ],
  validate,
  updateCharacter
);

/**
 * @route   DELETE /api/v1/stories/:id/characters/:characterId
 * @desc    Delete character
 * @access  Private
 */
router.delete('/:id/characters/:characterId', deleteCharacter);

module.exports = router;

