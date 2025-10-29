const Revision = require('../models/Revision');
const Chapter = require('../models/Chapter');
const Story = require('../models/Story');

/**
 * Get all revisions for a chapter
 */
const getRevisions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify chapter exists and user has access
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const story = await Story.findById(chapter.storyId);
    if (!story || story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Get revisions with pagination
    const revisions = await Revision.find({ chapterId: id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content'); // Exclude content for list view

    const total = await Revision.countDocuments({ chapterId: id });

    res.json({
      success: true,
      data: {
        revisions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single revision with full content
 */
const getRevision = async (req, res, next) => {
  try {
    const { id } = req.params;

    const revision = await Revision.findById(id);

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'Revision not found',
      });
    }

    // Verify ownership
    const chapter = await Chapter.findById(revision.chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const story = await Story.findById(chapter.storyId);
    if (!story || story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { revision },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore revision
 */
const restoreRevision = async (req, res, next) => {
  try {
    const { id, revisionId } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    // Verify ownership
    const story = await Story.findById(chapter.storyId);
    if (!story || story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const revision = await Revision.findById(revisionId);
    if (!revision || revision.chapterId.toString() !== id) {
      return res.status(404).json({
        success: false,
        message: 'Revision not found',
      });
    }

    // Create backup of current state before restoring
    const backupRevision = new Revision({
      chapterId: chapter._id,
      content: chapter.currentContent,
      description: 'Auto-saved before restore',
      characterOccurrences: chapter.characterOccurrences,
      dialogueBlocks: chapter.dialogueBlocks,
      dateTags: chapter.dateTags,
    });

    await backupRevision.save();
    chapter.revisions.push(backupRevision._id);

    // Restore content from revision
    chapter.currentContent = revision.content;
    chapter.characterOccurrences = revision.characterOccurrences || [];
    chapter.dialogueBlocks = revision.dialogueBlocks || [];
    chapter.dateTags = revision.dateTags || [];

    await chapter.save();

    res.json({
      success: true,
      message: 'Revision restored successfully',
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevisions,
  getRevision,
  restoreRevision,
};

