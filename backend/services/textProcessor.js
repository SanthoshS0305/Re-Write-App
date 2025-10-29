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
 * Ensure sections don't overlap
 */
const validateModularSections = (sections) => {
  const sorted = [...sections].sort((a, b) => a.startOffset - b.startOffset);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endOffset > sorted[i + 1].startOffset) {
      return {
        valid: false,
        message: 'Modular sections cannot overlap',
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

module.exports = {
  calculateWordCount,
  calculateWordCountDelta,
  detectDialogueBlocks,
  findCharacterOccurrences,
  parseCharacterMarkups,
  validateModularSections,
  extractTextRange,
};

