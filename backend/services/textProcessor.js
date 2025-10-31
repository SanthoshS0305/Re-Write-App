/**
 * Service for text processing operations
 */

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Calculate word count from text
 */
const calculateWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Calculate word count delta between two texts
 */
const calculateWordCountDelta = (oldText, newText) => {
  const oldCount = calculateWordCount(oldText);
  const newCount = calculateWordCount(newText);
  return newCount - oldCount;
};

/**
 * Detect dialogue blocks in text (simple implementation)
 * Returns array of dialogue blocks with start/end offsets
 */
const detectDialogueBlocks = (text) => {
  const dialogueBlocks = [];
  const regex = /"([^"]*)"/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    dialogueBlocks.push({
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      characterId: null, // To be assigned by context
      confidence: 0.8,
    });
  }

  return dialogueBlocks;
};

/**
 * Find all occurrences of character markup in text
 * Searches for patterns like <char:name /> or <char:name.alias />
 */
const findCharacterOccurrences = (text, characterId) => {
  const positions = [];
  const regex = new RegExp(`<char:${characterId}(?:\\.[\\w]+)?\\s*/>`, 'gi');
  let match;

  while ((match = regex.exec(text)) !== null) {
    positions.push(match.index);
  }

  return positions;
};

/**
 * Parse all character markups in text
 */
const parseCharacterMarkups = (text) => {
  const markups = [];
  const regex = /<char:([\w]+)(?:\.([\w]+))?\s*\/>/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    markups.push({
      characterId: match[1],
      alias: match[2] || null,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    });
  }

  return markups;
};

/**
 * Validate modular section boundaries
 * Ensure sections don't overlap (now checks paragraph indices)
 */
const validateModularSections = (sections) => {
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const range1 = { start: sections[i].startParagraphIndex, end: sections[i].endParagraphIndex };
      const range2 = { start: sections[j].startParagraphIndex, end: sections[j].endParagraphIndex };
      
      // Check if ranges overlap
      const hasOverlap = !(range1.end < range2.start || range2.end < range1.start);
      
      if (hasOverlap) {
        return {
          valid: false,
          message: 'Modular sections cannot overlap',
        };
      }
    }
  }

  return { valid: true };
};

/**
 * Extract text content between offsets
 */
const extractTextRange = (text, startOffset, endOffset) => {
  return text.substring(startOffset, endOffset);
};

/**
 * Apply active variants to chapter content
 * Replaces paragraphs at modular section indices with active variant content
 * NOTE: Works with paragraph indices (0-based) instead of character offsets
 */
const applyActiveVariants = (content, modularSections) => {
  if (!modularSections || modularSections.length === 0) {
    return content;
  }

  // Parse paragraphs from HTML - more robust approach
  const splitByParagraphs = (html) => {
    if (!html) return [];
    // Match all <p>...</p> tags with their positions, handling nested tags
    const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/g;
    const paragraphs = [];
    const positions = [];
    let match;
    
    while ((match = paragraphRegex.exec(html)) !== null) {
      paragraphs.push(match[0]);
      positions.push({ start: match.index, end: match.index + match[0].length });
    }
    
    return { paragraphs, positions };
  };

  const { paragraphs, positions } = splitByParagraphs(content);
  
  if (paragraphs.length === 0) {
    return content;
  }

  // Sort sections by end paragraph index (backwards to preserve indices while replacing)
  const sortedSections = [...modularSections]
    .filter(section => section.variants && section.variants.length > 0)
    .sort((a, b) => b.endParagraphIndex - a.endParagraphIndex);

  for (const section of sortedSections) {
    const activeVariant = section.variants.find(v => v.isActive);
    
    if (!activeVariant) {
      continue;
    }

    // Parse variant content into paragraphs
    const variantParagraphs = activeVariant.content.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
    
    // Replace paragraphs in the range with variant content
    const startIdx = section.startParagraphIndex;
    const endIdx = Math.min(section.endParagraphIndex, paragraphs.length - 1);
    
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < paragraphs.length) {
        const variantIdx = Math.min(i - startIdx, variantParagraphs.length - 1);
        paragraphs[i] = variantParagraphs[variantIdx] || '';
      }
    }
  }

  // Reconstruct HTML by replacing paragraphs at their original positions
  // Start from the end to preserve positions
  let result = content;
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    // Use original positions from first parse
    const before = result.substring(0, pos.start);
    const after = result.substring(pos.end);
    result = before + paragraphs[i] + after;
  }

  return result;
};

/**
 * Reconstruct content from sections tree
 * Recursively builds HTML from sections array with active variants applied
 * @param {Array} sections - Array of section objects
 * @param {number} depth - Current depth in tree (max 3 for safety)
 * @param {number} maxDepth - Maximum allowed depth
 * @returns {string} Reconstructed HTML content
 */
const reconstructContent = (sections, depth = 0, maxDepth = 3) => {
  if (!sections || sections.length === 0) {
    return '';
  }
  
  if (depth > maxDepth) {
    console.warn(`Maximum depth ${maxDepth} exceeded in reconstructContent`);
    return '';
  }
  
  return sections.map(section => {
    if (section.type === 'text') {
      // Text section
      if (section.isModular && section.textVariants && section.textVariants.length > 0) {
        const activeVariant = section.textVariants.find(v => v.isActive);
        return activeVariant ? activeVariant.content : '';
      }
      return section.content || '';
    } else if (section.type === 'container') {
      // Container section
      if (section.isModular && section.containerVariants && section.containerVariants.length > 0) {
        const activeVariant = section.containerVariants.find(v => v.isActive);
        if (activeVariant && activeVariant.children) {
          return reconstructContent(activeVariant.children, depth + 1, maxDepth);
        }
      }
      if (section.children) {
        return reconstructContent(section.children, depth + 1, maxDepth);
      }
      return '';
    }
    return '';
  }).join('');
};

/**
 * Find section containing a character position
 * @param {Array} sections - Array of sections to search
 * @param {number} charPosition - Character position to find
 * @param {number} startOffset - Starting character offset in the full document
 * @param {number} depth - Current depth
 * @returns {Object|null} { section, localPos, depth } or null
 */
const findSectionByPosition = (sections, charPosition, startOffset = 0, depth = 0) => {
  if (!sections || sections.length === 0) return null;
  
  let currentOffset = startOffset;
  
  for (const section of sections) {
    let sectionLength = 0;
    let sectionContent = '';
    
    if (section.type === 'text') {
      if (section.isModular && section.textVariants && section.textVariants.length > 0) {
        const activeVariant = section.textVariants.find(v => v.isActive);
        sectionContent = activeVariant ? activeVariant.content : '';
      } else {
        sectionContent = section.content || '';
      }
      sectionLength = sectionContent.length;
    } else if (section.type === 'container') {
      // For container, calculate length of children
      let childrenContent = '';
      if (section.isModular && section.containerVariants && section.containerVariants.length > 0) {
        const activeVariant = section.containerVariants.find(v => v.isActive);
        if (activeVariant && activeVariant.children) {
          childrenContent = reconstructContent(activeVariant.children, depth + 1);
        }
      } else if (section.children) {
        childrenContent = reconstructContent(section.children, depth + 1);
      }
      sectionLength = childrenContent.length;
      
      // Check if position is within this container
      if (charPosition >= currentOffset && charPosition < currentOffset + sectionLength) {
        // Position is in this container, search children
        if (section.isModular && section.containerVariants && section.containerVariants.length > 0) {
          const activeVariant = section.containerVariants.find(v => v.isActive);
          if (activeVariant && activeVariant.children) {
            const result = findSectionByPosition(activeVariant.children, charPosition, currentOffset, depth + 1);
            if (result) return result;
          }
        } else if (section.children) {
          const result = findSectionByPosition(section.children, charPosition, currentOffset, depth + 1);
          if (result) return result;
        }
        return { section, localPos: charPosition - currentOffset, depth };
      }
      
      currentOffset += sectionLength;
      continue;
    }
    
    // Check if position is within this section
    if (charPosition >= currentOffset && charPosition <= currentOffset + sectionLength) {
      return { section, localPos: charPosition - currentOffset, depth };
    }
    
    currentOffset += sectionLength;
  }
  
  return null;
};

/**
 * Split a section at character positions
 * Returns new sections array with the section split into [before, modular, after]
 * @param {Array} sections - Array of all sections
 * @param {number} targetSectionPos - Position in sections array of section to split
 * @param {number} selectionStart - Character position within the section to start split
 * @param {number} selectionEnd - Character position within the section to end split
 * @param {string} selectedContent - HTML content of the selection
 * @param {string} variantName - Name for the new modular section variant
 * @param {number} depth - Current depth (limit to 0)
 * @returns {Array} New sections array with split applied
 */
const splitSectionAt = (sections, targetSectionPos, selectionStart, selectionEnd, selectedContent, variantName, depth = 0) => {
  if (depth > 0) {
    throw new Error('Creating modular sections within modular sections not yet supported');
  }
  
  const sectionToSplit = sections[targetSectionPos];
  
  if (!sectionToSplit || sectionToSplit.type !== 'text') {
    throw new Error('Can only split text sections at root level');
  }
  
  // Get the full content of the section
  let fullContent = '';
  if (sectionToSplit.isModular && sectionToSplit.textVariants && sectionToSplit.textVariants.length > 0) {
    const activeVariant = sectionToSplit.textVariants.find(v => v.isActive);
    fullContent = activeVariant ? activeVariant.content : sectionToSplit.content || '';
  } else {
    fullContent = sectionToSplit.content || '';
  }
  
  if (selectionStart < 0 || selectionEnd > fullContent.length || selectionStart >= selectionEnd) {
    throw new Error('Invalid selection positions');
  }
  
  // Split the content
  const beforeContent = fullContent.substring(0, selectionStart);
  const afterContent = fullContent.substring(selectionEnd);
  
  // Create new sections array
  const newSections = [...sections];
  
  const sectionsToInsert = [];
  
  // Before section (if any content)
  if (beforeContent.trim()) {
    sectionsToInsert.push({
      id: generateId(),
      position: targetSectionPos,
      type: 'text',
      isModular: false,
      content: beforeContent
    });
  }
  
  // Modular section (the selected portion)
  sectionsToInsert.push({
    id: generateId(),
    position: targetSectionPos + (beforeContent.trim() ? 1 : 0),
    type: 'text',
    isModular: true,
    textVariants: [
      {
        id: generateId(),
        name: variantName || 'Original',
        content: selectedContent,
        isActive: true
      }
    ]
  });
  
  // After section (if any content)
  if (afterContent.trim()) {
    sectionsToInsert.push({
      id: generateId(),
      position: targetSectionPos + (beforeContent.trim() ? 2 : 1),
      type: 'text',
      isModular: false,
      content: afterContent
    });
  }
  
  // Replace the original section with the new sections
  newSections.splice(targetSectionPos, 1, ...sectionsToInsert);
  
  // Update positions for remaining sections
  newSections.forEach((section, index) => {
    section.position = index;
  });
  
  return newSections;
};

/**
 * Find section by ID in sections tree (recursive)
 * @param {Array} sections - Array of sections to search
 * @param {string} sectionId - ID to find
 * @returns {Object|null} Found section or null
 */
const findSectionById = (sections, sectionId) => {
  if (!sections || !Array.isArray(sections)) return null;
  
  for (const section of sections) {
    if (section.id === sectionId) {
      return section;
    }
    
    // Recursively search in variants if modular
    if (section.type === 'text' && section.textVariants) {
      for (const variant of section.textVariants) {
        // Variants don't have children, skip
      }
    } else if (section.type === 'container' && section.containerVariants) {
      for (const variant of section.containerVariants) {
        if (variant.children) {
          const found = findSectionById(variant.children, sectionId);
          if (found) return found;
        }
      }
    }
    
    // Also check non-modular children
    if (section.children) {
      const found = findSectionById(section.children, sectionId);
      if (found) return found;
    }
  }
  
  return null;
};

/**
 * Validate sections array
 * @param {Array} sections - Array of sections to validate
 * @param {number} depth - Current depth
 * @param {number} maxDepth - Maximum allowed depth
 * @returns {Object} { valid: boolean, message?: string }
 */
const validateSections = (sections, depth = 0, maxDepth = 3) => {
  if (!sections || !Array.isArray(sections)) {
    return { valid: false, message: 'Sections must be an array' };
  }
  
  if (depth > maxDepth) {
    return { valid: false, message: `Maximum depth ${maxDepth} exceeded` };
  }
  
  // Check positions are sequential
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].position !== i) {
      return { valid: false, message: `Section at index ${i} has incorrect position: ${sections[i].position}` };
    }
  }
  
  // Validate each section
  for (const section of sections) {
    if (!section.id) {
      return { valid: false, message: 'Section missing id' };
    }
    
    if (!section.type || !['text', 'container'].includes(section.type)) {
      return { valid: false, message: `Section ${section.id} has invalid type` };
    }
    
    if (section.type === 'text') {
      // Text sections: must have content OR textVariants
      const hasContent = section.content !== undefined && section.content !== null;
      const hasVariants = section.textVariants && section.textVariants.length > 0;
      
      if (!hasContent && !hasVariants) {
        return { valid: false, message: `Text section ${section.id} has no content` };
      }
      
      // If modular, must have exactly one active variant
      if (section.isModular && hasVariants) {
        const activeVariants = section.textVariants.filter(v => v.isActive);
        if (activeVariants.length === 0) {
          return { valid: false, message: `Text section ${section.id} has no active variant` };
        }
        if (activeVariants.length > 1) {
          return { valid: false, message: `Text section ${section.id} has multiple active variants` };
        }
      }
    } else if (section.type === 'container') {
      // Container sections: recursively validate children
      let childrenToValidate = [];
      
      if (section.isModular && section.containerVariants && section.containerVariants.length > 0) {
        const activeVariant = section.containerVariants.find(v => v.isActive);
        if (activeVariant && activeVariant.children) {
          childrenToValidate = activeVariant.children;
        }
      } else if (section.children) {
        childrenToValidate = section.children;
      }
      
      if (childrenToValidate.length > 0) {
        const childValidation = validateSections(childrenToValidate, depth + 1, maxDepth);
        if (!childValidation.valid) {
          return childValidation;
        }
      }
    }
  }
  
  return { valid: true };
};

module.exports = {
  generateId,
  calculateWordCount,
  calculateWordCountDelta,
  detectDialogueBlocks,
  findCharacterOccurrences,
  parseCharacterMarkups,
  validateModularSections,
  extractTextRange,
  applyActiveVariants,
  reconstructContent,
  findSectionByPosition,
  splitSectionAt,
  findSectionById,
  validateSections,
};

