const express = require('express');
const { body } = require('express-validator');
const {
  createChapter,
  getChapter,
  updateChapter,
  deleteChapter,
  createModularSection,
  updateModularSection,
  activateVariant,
  deleteModularSection,
} = require('../controllers/chapterController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/stories/:storyId/chapters
 * @desc    Create new chapter
 * @access  Private
 */
router.post(
  '/stories/:storyId/chapters',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('content').optional().isString(),
  ],
  validate,
  createChapter
);

/**
 * @route   GET /api/v1/chapters/:id
 * @desc    Get chapter
 * @access  Private
 */
router.get('/:id', getChapter);

/**
 * @route   PUT /api/v1/chapters/:id
 * @desc    Update chapter
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
    body('content').optional().isString(),
    body('createRevision').optional().isBoolean(),
    body('revisionDescription').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  updateChapter
);

/**
 * @route   DELETE /api/v1/chapters/:id
 * @desc    Delete chapter
 * @access  Private
 */
router.delete('/:id', deleteChapter);

/**
 * @route   POST /api/v1/chapters/:id/modules
 * @desc    Create modular section
 * @access  Private
 */
router.post(
  '/:id/modules',
  [
    body('selectionStart')
      .isInt({ min: 0 })
      .withMessage('Selection start must be a non-negative integer')
      .customSanitizer((value) => parseInt(value, 10)),
    body('selectionEnd')
      .isInt({ min: 0 })
      .withMessage('Selection end must be a non-negative integer')
      .customSanitizer((value) => parseInt(value, 10)),
    body('variantName').optional().trim(),
    body('selectedContent').notEmpty().withMessage('Selected content is required'),
  ],
  validate,
  createModularSection
);

/**
 * @route   PUT /api/v1/chapters/:id/modules/:moduleId
 * @desc    Update modular section variants
 * @access  Private
 */
router.put(
  '/:id/modules/:moduleId',
  [body('variants').isArray().withMessage('Variants must be an array')],
  validate,
  updateModularSection
);

/**
 * @route   PUT /api/v1/chapters/:id/modules/:moduleId/activate
 * @desc    Activate variant
 * @access  Private
 */
router.put(
  '/:id/modules/:moduleId/activate',
  [body('variantName').notEmpty().withMessage('Variant name is required')],
  validate,
  activateVariant
);

/**
 * @route   DELETE /api/v1/chapters/:id/modules/:moduleId
 * @desc    Delete modular section
 * @access  Private
 */
router.delete('/:id/modules/:moduleId', deleteModularSection);

module.exports = router;

