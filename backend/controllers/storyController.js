const Story = require('../models/Story');
const Chapter = require('../models/Chapter');

/**
 * Get all stories for authenticated user
 */
const getStories = async (req, res, next) => {
  try {
    const stories = await Story.find({ userId: req.userId })
      .populate('chapters', 'title position')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { stories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single story by ID
 */
const getStory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const story = await Story.findById(id).populate('chapters');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Verify ownership
    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new story
 */
const createStory = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const story = new Story({
      userId: req.userId,
      title,
      description,
    });

    await story.save();

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: { story },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update story
 */
const updateStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Verify ownership
    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    story.title = title || story.title;
    story.description = description !== undefined ? description : story.description;

    await story.save();

    res.json({
      success: true,
      message: 'Story updated successfully',
      data: { story },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete story and all its chapters
 */
const deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Verify ownership
    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Delete all chapters
    await Chapter.deleteMany({ storyId: id });

    // Delete story
    await Story.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder chapters
 */
const reorderChapters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { chapterIds } = req.body;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Verify ownership
    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update chapter order
    story.chapters = chapterIds;
    await story.save();

    // Update position field in each chapter
    for (let i = 0; i < chapterIds.length; i++) {
      await Chapter.findByIdAndUpdate(chapterIds[i], { position: i });
    }

    res.json({
      success: true,
      message: 'Chapters reordered successfully',
      data: { story },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  reorderChapters,
};

