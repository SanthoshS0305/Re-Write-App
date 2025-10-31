const Chapter = require('../models/Chapter');
const Story = require('../models/Story');
const Revision = require('../models/Revision');
const { 
  applyActiveVariants, 
  reconstructContent, 
  findSectionByPosition, 
  splitSectionAt, 
  findSectionById,
  validateSections,
  generateId 
} = require('../services/textProcessor');

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

    // Initialize sections array with single text section
    const initialSections = [{
      id: generateId(),
      position: 0,
      type: 'text',
      isModular: false,
      content: content
    }];

    const chapter = new Chapter({
      storyId,
      title,
      currentContent: content,
      sections: initialSections,
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

    // Initialize sections if chapter has currentContent but no sections
    let sectionsToUse = chapter.sections || [];
    let currentContentToUse = chapter.currentContent || '';
    
    if (currentContentToUse && (!sectionsToUse || sectionsToUse.length === 0)) {
      // Migrate: create a single text section from currentContent
      sectionsToUse = [{
        id: generateId(),
        position: 0,
        type: 'text',
        isModular: false,
        content: currentContentToUse
      }];
      
      // Save the initialized sections
      chapter.sections = sectionsToUse;
      await chapter.save();
    }

    // Reconstruct content from sections
    const renderedContent = sectionsToUse.length > 0 
      ? reconstructContent(sectionsToUse)
      : currentContentToUse;

    // Create response with rendered content and sections
    const chapterResponse = chapter.toObject();
    chapterResponse.currentContent = renderedContent;
    chapterResponse.sections = sectionsToUse;

    res.json({
      success: true,
      data: { chapter: chapterResponse },
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

    // Initialize sections if needed
    if (!chapter.sections || chapter.sections.length === 0) {
      if (chapter.currentContent) {
        chapter.sections = [{
          id: generateId(),
          position: 0,
          type: 'text',
          isModular: false,
          content: chapter.currentContent
        }];
      }
    }

    // Create revision if requested
    if (createRevision) {
      const contentToSave = chapter.sections && chapter.sections.length > 0
        ? reconstructContent(chapter.sections)
        : chapter.currentContent;
      
      if (contentToSave) {
        const revision = new Revision({
          chapterId: chapter._id,
          content: contentToSave,
          description: revisionDescription || 'Manual save point',
          characterOccurrences: chapter.characterOccurrences,
          dialogueBlocks: chapter.dialogueBlocks,
          dateTags: chapter.dateTags,
        });

        await revision.save();
        chapter.revisions.push(revision._id);
      }
    }

    // Update chapter
    if (title) chapter.title = title;
    if (content !== undefined) {
      // For now, keep currentContent for backward compatibility
      // In future, we might want to update the sections instead
      chapter.currentContent = content;
      
      // If sections exist, update the first non-modular section or create new one
      if (chapter.sections && chapter.sections.length > 0) {
        const firstSection = chapter.sections[0];
        if (!firstSection.isModular && firstSection.type === 'text') {
          firstSection.content = content;
        }
      }
    }

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
    const { selectionStart, selectionEnd, variantName, selectedContent } = req.body;

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

    // Initialize sections if needed (migration)
    let sections = chapter.sections || [];
    if (!sections || sections.length === 0) {
      const currentContent = chapter.currentContent || '';
      if (currentContent) {
        sections = [{
          id: generateId(),
          position: 0,
          type: 'text',
          isModular: false,
          content: currentContent
        }];
        chapter.sections = sections;
      }
    }

    if (!sections || sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No sections available in chapter',
      });
    }

    // Validate selection positions
    if (typeof selectionStart !== 'number' || typeof selectionEnd !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Selection start and end positions are required',
      });
    }

    if (selectionStart < 0 || selectionEnd < selectionStart) {
      return res.status(400).json({
        success: false,
        message: 'Invalid selection positions',
      });
    }

    if (!selectedContent) {
      return res.status(400).json({
        success: false,
        message: 'Selected content is required',
      });
    }

    // Find which section contains the selection
    const sectionInfo = findSectionByPosition(sections, selectionStart);
    
    if (!sectionInfo) {
      return res.status(400).json({
        success: false,
        message: 'Selection is outside chapter bounds',
      });
    }

    // Enforce depth limit - only allow root level for now
    if (sectionInfo.depth > 0) {
      return res.status(400).json({
        success: false,
        message: 'Creating modular sections within modular sections not yet supported',
      });
    }

    const { section, localPos } = sectionInfo;
    const sectionStart = selectionStart - localPos;
    const sectionEnd = selectionEnd - localPos;
    const sectionPos = sections.indexOf(section);

    // Split the section
    const newSections = splitSectionAt(
      sections,
      sectionPos,
      sectionStart,
      sectionEnd,
      selectedContent,
      variantName || 'Original'
    );

    // Validate the new sections
    const validation = validateSections(newSections);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid sections: ${validation.message}`,
      });
    }

    // Update chapter
    chapter.sections = newSections;
    await chapter.save();

    // Find the newly created modular section
    const newModularSection = newSections.find(s => s.isModular && s.textVariants && s.textVariants.length > 0);

    res.status(201).json({
      success: true,
      message: 'Modular section created successfully',
      data: { modularSection: newModularSection, sections: newSections },
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

    const sections = chapter.sections || [];
    
    // Find the section by ID
    const section = findSectionById(sections, moduleId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Modular section not found',
      });
    }

    // Ensure section is modular
    if (!section.isModular) {
      return res.status(400).json({
        success: false,
        message: 'Section is not modular',
      });
    }

    // Update variants based on section type
    if (section.type === 'text') {
      section.textVariants = variants;
    } else if (section.type === 'container') {
      section.containerVariants = variants;
    }

    // Validate sections
    const validation = validateSections(sections);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid sections: ${validation.message}`,
      });
    }

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

    const sections = chapter.sections || [];
    
    // Find the section by ID
    const section = findSectionById(sections, moduleId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Modular section not found',
      });
    }

    // Ensure section is modular
    if (!section.isModular) {
      return res.status(400).json({
        success: false,
        message: 'Section is not modular',
      });
    }

    // Deactivate all variants and activate the selected one
    if (section.type === 'text' && section.textVariants) {
      section.textVariants.forEach((variant) => {
        variant.isActive = variant.name === variantName;
      });
    } else if (section.type === 'container' && section.containerVariants) {
      section.containerVariants.forEach((variant) => {
        variant.isActive = variant.name === variantName;
      });
    }

    // Validate sections
    const validation = validateSections(sections);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid sections: ${validation.message}`,
      });
    }

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
 * Delete modular section - converts to non-modular
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

    const sections = chapter.sections || [];
    const sectionToDelete = findSectionById(sections, moduleId);
    
    if (!sectionToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Modular section not found',
      });
    }

    // Convert to non-modular by copying active variant
    if (sectionToDelete.type === 'text' && sectionToDelete.textVariants) {
      const activeVariant = sectionToDelete.textVariants.find(v => v.isActive);
      if (activeVariant) {
        sectionToDelete.content = activeVariant.content;
        sectionToDelete.isModular = false;
        sectionToDelete.textVariants = undefined;
      }
    } else if (sectionToDelete.type === 'container' && sectionToDelete.containerVariants) {
      const activeVariant = sectionToDelete.containerVariants.find(v => v.isActive);
      if (activeVariant) {
        sectionToDelete.children = activeVariant.children;
        sectionToDelete.isModular = false;
        sectionToDelete.containerVariants = undefined;
      }
    }

    // Validate sections
    const validation = validateSections(sections);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid sections: ${validation.message}`,
      });
    }

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

