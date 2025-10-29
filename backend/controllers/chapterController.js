const Chapter = require('../models/Chapter');
const Story = require('../models/Story');
const Revision = require('../models/Revision');

// Simple UUID generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Create new chapter
 */
const createChapter = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { title, content = '' } = req.body;

    // Verify story exists and belongs to user
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Get next position
    const position = story.chapters.length;

    const chapter = new Chapter({
      storyId,
      title,
      currentContent: content,
      position,
    });

    await chapter.save();

    // Add chapter to story
    story.chapters.push(chapter._id);
    await story.save();

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chapter by ID
 */
const getChapter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    // Verify ownership through story
    const story = await Story.findById(chapter.storyId);
    if (!story || story.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update chapter content
 */
const updateChapter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, createRevision = false, revisionDescription } = req.body;

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

    // Create revision if requested
    if (createRevision && chapter.currentContent) {
      const revision = new Revision({
        chapterId: chapter._id,
        content: chapter.currentContent,
        description: revisionDescription || 'Manual save point',
        characterOccurrences: chapter.characterOccurrences,
        dialogueBlocks: chapter.dialogueBlocks,
        dateTags: chapter.dateTags,
      });

      await revision.save();
      chapter.revisions.push(revision._id);
    }

    // Update chapter
    if (title) chapter.title = title;
    if (content !== undefined) chapter.currentContent = content;

    await chapter.save();

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete chapter
 */
const deleteChapter = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    // Remove from story's chapters array
    story.chapters = story.chapters.filter((chapterId) => chapterId.toString() !== id);
    await story.save();

    // Delete chapter
    await Chapter.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create modular section
 */
const createModularSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startOffset, endOffset, variantName, variantContent } = req.body;

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

    // Create modular section
    const moduleId = generateId();
    const modularSection = {
      id: moduleId,
      startOffset,
      endOffset,
      variants: [
        {
          name: variantName || 'Original',
          content: variantContent,
          isActive: true,
        },
      ],
    };

    chapter.modularSections.push(modularSection);
    await chapter.save();

    res.status(201).json({
      success: true,
      message: 'Modular section created successfully',
      data: { modularSection },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update modular section (add/edit variants)
 */
const updateModularSection = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;
    const { variants } = req.body;

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

    // Find and update modular section
    const section = chapter.modularSections.find((s) => s.id === moduleId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Modular section not found',
      });
    }

    section.variants = variants;
    await chapter.save();

    res.json({
      success: true,
      message: 'Modular section updated successfully',
      data: { section },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate variant
 */
const activateVariant = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;
    const { variantName } = req.body;

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

    // Find modular section
    const section = chapter.modularSections.find((s) => s.id === moduleId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Modular section not found',
      });
    }

    // Deactivate all variants and activate the selected one
    section.variants.forEach((variant) => {
      variant.isActive = variant.name === variantName;
    });

    await chapter.save();

    res.json({
      success: true,
      message: 'Variant activated successfully',
      data: { section },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete modular section
 */
const deleteModularSection = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;

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

    // Remove modular section
    chapter.modularSections = chapter.modularSections.filter((s) => s.id !== moduleId);
    await chapter.save();

    res.json({
      success: true,
      message: 'Modular section deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChapter,
  getChapter,
  updateChapter,
  deleteChapter,
  createModularSection,
  updateModularSection,
  activateVariant,
  deleteModularSection,
};

