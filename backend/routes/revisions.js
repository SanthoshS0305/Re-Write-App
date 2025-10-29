const express = require('express');
const {
  getRevisions,
  getRevision,
  restoreRevision,
} = require('../controllers/revisionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/chapters/:id/revisions
 * @desc    Get all revisions for chapter
 * @access  Private
 */
router.get('/chapters/:id/revisions', getRevisions);

/**
 * @route   GET /api/v1/revisions/:id
 * @desc    Get single revision
 * @access  Private
 */
router.get('/revisions/:id', getRevision);

/**
 * @route   POST /api/v1/chapters/:id/restore/:revisionId
 * @desc    Restore revision
 * @access  Private
 */
router.post('/chapters/:id/restore/:revisionId', restoreRevision);

module.exports = router;

