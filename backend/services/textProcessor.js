/**
 * Service for text processing operations
 */

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
  const sorted = [...sections].sort((a, b) => a.paragraphIndex - b.paragraphIndex);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].paragraphIndex === sorted[i + 1].paragraphIndex) {
      return {
        valid: false,
        message: 'Modular sections cannot overlap (same paragraph)',
      };
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
    // Match all <p>...</p> tags with their positions
    const paragraphRegex = /<p[^>]*>.*?<\/p>/gs;
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

  // Sort sections by paragraph index (backwards to preserve indices while replacing)
  const sortedSections = [...modularSections]
    .filter(section => section.variants && section.variants.length > 0)
    .sort((a, b) => b.paragraphIndex - a.paragraphIndex);

  for (const section of sortedSections) {
    const activeVariant = section.variants.find(v => v.isActive);
    
    if (!activeVariant || section.paragraphIndex >= paragraphs.length) {
      continue;
    }

    // Replace the paragraph at the given index
    paragraphs[section.paragraphIndex] = activeVariant.content;
  }

  // Reconstruct HTML by replacing paragraphs at their original positions
  let result = content;
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    const before = result.substring(0, pos.start);
    const after = result.substring(pos.end);
    result = before + paragraphs[i] + after;
  }

  return result;
};

module.exports = {
  calculateWordCount,
  calculateWordCountDelta,
  detectDialogueBlocks,
  findCharacterOccurrences,
  parseCharacterMarkups,
  validateModularSections,
  extractTextRange,
  applyActiveVariants,
};

