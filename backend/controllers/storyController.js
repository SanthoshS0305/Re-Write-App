const Story = require('../models/Story');
const Chapter = require('../models/Chapter');

/**
 * Get all stories for authenticated user
 */
const getStories = async (req, res, next) => {
  try {
    const stories = await Story.find({ userId: req.userId })
      .select('title description chapters createdAt updatedAt') // Only select needed fields
      .lean() // Return plain JS objects for better performance
      .sort({ createdAt: -1 });

    // Add chapter count instead of populating
    const storiesWithCounts = stories.map(story => ({
      _id: story._id,
      title: story.title,
      description: story.description,
      chapterCount: story.chapters.length,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    }));

    res.json({
      success: true,
      data: { stories: storiesWithCounts },
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

/**
 * Create character
 */
const createCharacter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { primaryName, aliases, shortcuts, color } = req.body;

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

    // Generate character ID
    const characterId = primaryName.toLowerCase().replace(/\s+/g, '-');

    // Check if character already exists
    if (story.characters.some((c) => c.id === characterId)) {
      return res.status(400).json({
        success: false,
        message: 'Character with this name already exists',
      });
    }

    const character = {
      id: characterId,
      primaryName,
      aliases: aliases || [],
      shortcuts: shortcuts || [],
      color: color || '#3b82f6',
    };

    story.characters.push(character);
    await story.save();

    res.status(201).json({
      success: true,
      message: 'Character created successfully',
      data: { character },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update character
 */
const updateCharacter = async (req, res, next) => {
  try {
    const { id, characterId } = req.params;
    const { primaryName, aliases, shortcuts, color } = req.body;

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

    const character = story.characters.id(characterId);
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found',
      });
    }

    // Update fields
    if (primaryName !== undefined) character.primaryName = primaryName;
    if (aliases !== undefined) character.aliases = aliases;
    if (shortcuts !== undefined) character.shortcuts = shortcuts;
    if (color !== undefined) character.color = color;

    await story.save();

    res.json({
      success: true,
      message: 'Character updated successfully',
      data: { character },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete character
 */
const deleteCharacter = async (req, res, next) => {
  try {
    const { id, characterId } = req.params;

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

    const character = story.characters.id(characterId);
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found',
      });
    }

    // Remove character
    story.characters = story.characters.filter((c) => c.id !== characterId);
    await story.save();

    res.json({
      success: true,
      message: 'Character deleted successfully',
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
  createCharacter,
  updateCharacter,
  deleteCharacter,
};

