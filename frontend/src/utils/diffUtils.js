/**
 * Simple text diff utility
 * Compares two texts and returns an array of diff objects
 */

/**
 * Calculate line-by-line diff between two texts
 * Returns array of {type: 'added'|'removed'|'unchanged', line: string}
 */
export const calculateLineDiff = (oldText, newText) => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diff = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining lines are additions
      diff.push({ type: 'added', line: newLines[j], lineNumber: j + 1 });
      j++;
    } else if (j >= newLines.length) {
      // Remaining lines are deletions
      diff.push({ type: 'removed', line: oldLines[i], lineNumber: i + 1 });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines match
      diff.push({ type: 'unchanged', line: oldLines[i], lineNumber: i + 1 });
      i++;
      j++;
    } else {
      // Lines differ - simple heuristic: check if next lines match
      if (i + 1 < oldLines.length && oldLines[i + 1] === newLines[j]) {
        // Current old line was removed
        diff.push({ type: 'removed', line: oldLines[i], lineNumber: i + 1 });
        i++;
      } else if (j + 1 < newLines.length && oldLines[i] === newLines[j + 1]) {
        // Current new line was added
        diff.push({ type: 'added', line: newLines[j], lineNumber: j + 1 });
        j++;
      } else {
        // Both lines changed
        diff.push({ type: 'removed', line: oldLines[i], lineNumber: i + 1 });
        diff.push({ type: 'added', line: newLines[j], lineNumber: j + 1 });
        i++;
        j++;
      }
    }
  }

  return diff;
};

/**
 * Calculate character-level diff for inline changes
 */
export const calculateCharDiff = (oldText, newText) => {
  const result = [];
  let i = 0;
  let j = 0;

  while (i < oldText.length || j < newText.length) {
    if (i >= oldText.length) {
      result.push({ type: 'added', char: newText[j] });
      j++;
    } else if (j >= newText.length) {
      result.push({ type: 'removed', char: oldText[i] });
      i++;
    } else if (oldText[i] === newText[j]) {
      result.push({ type: 'unchanged', char: oldText[i] });
      i++;
      j++;
    } else {
      result.push({ type: 'removed', char: oldText[i] });
      result.push({ type: 'added', char: newText[j] });
      i++;
      j++;
    }
  }

  return result;
};

/**
 * Format diff for side-by-side display
 */
export const formatSideBySideDiff = (oldText, newText) => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);
  const sideBySide = [];

  for (let i = 0; i < maxLines; i++) {
    sideBySide.push({
      left: {
        line: oldLines[i] || '',
        lineNumber: i < oldLines.length ? i + 1 : null,
      },
      right: {
        line: newLines[i] || '',
        lineNumber: i < newLines.length ? i + 1 : null,
      },
      isDifferent: oldLines[i] !== newLines[i],
    });
  }

  return sideBySide;
};

/**
 * Calculate word count
 */
export const calculateWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Calculate word count delta
 */
export const calculateWordCountDelta = (oldText, newText) => {
  const oldCount = calculateWordCount(oldText);
  const newCount = calculateWordCount(newText);
  return newCount - oldCount;
};

/**
 * Strip HTML tags from text
 */
const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Extract word and punctuation separately
 */
const splitWordAndPunctuation = (word) => {
  const match = word.match(/^(.+?)([.,;:!?]+)?$/);
  if (match) {
    return {
      word: match[1],
      punctuation: match[2] || ''
    };
  }
  return { word: word, punctuation: '' };
};

/**
 * Normalize word for comparison (without punctuation)
 */
const normalizeWord = (word) => {
  const { word: baseWord } = splitWordAndPunctuation(word);
  return baseWord.toLowerCase();
};

/**
 * Determine the type of difference between two words
 * Returns: 'none', 'punctuation', or 'word'
 */
const getDifferenceType = (word1, word2) => {
  const split1 = splitWordAndPunctuation(word1);
  const split2 = splitWordAndPunctuation(word2);
  
  const base1 = split1.word.toLowerCase();
  const base2 = split2.word.toLowerCase();
  
  if (base1 === base2 && split1.punctuation === split2.punctuation) {
    return 'none'; // Identical
  } else if (base1 === base2) {
    return 'punctuation'; // Only punctuation differs
  } else {
    return 'word'; // Word content differs
  }
};

/**
 * Simple LCS (Longest Common Subsequence) implementation
 * Used for sequence-based diff similar to GitHub
 * Compares normalized words but tracks original indices
 */
const computeLCS = (arr1, arr2) => {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Normalize words for comparison
  const norm1 = arr1.map(normalizeWord);
  const norm2 = arr2.map(normalizeWord);
  
  // Build LCS table using normalized words (ignoring punctuation)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (norm1[i - 1] === norm2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find the actual LCS and differences
  const result = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i === 0) {
      result.unshift({ 
        type: 'added', 
        word: arr2[j - 1], 
        oldIndex: null, 
        newIndex: j - 1,
        diffType: 'word'
      });
      j--;
    } else if (j === 0) {
      result.unshift({ 
        type: 'removed', 
        word: arr1[i - 1], 
        oldIndex: i - 1, 
        newIndex: null,
        diffType: 'word'
      });
      i--;
    } else if (norm1[i - 1] === norm2[j - 1]) {
      // Same word base - check if punctuation differs
      const diffType = getDifferenceType(arr1[i - 1], arr2[j - 1]);
      result.unshift({ 
        type: diffType === 'none' ? 'common' : 'punctuation-change',
        word: arr1[i - 1],
        newWord: arr2[j - 1],
        oldIndex: i - 1, 
        newIndex: j - 1,
        diffType: diffType
      });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.unshift({ 
        type: 'removed', 
        word: arr1[i - 1], 
        oldIndex: i - 1, 
        newIndex: null,
        diffType: 'word'
      });
      i--;
    } else {
      result.unshift({ 
        type: 'added', 
        word: arr2[j - 1], 
        oldIndex: null, 
        newIndex: j - 1,
        diffType: 'word'
      });
      j--;
    }
  }
  
  return result;
};

/**
 * Highlight differences in HTML content using GitHub-style LCS diff
 * Returns HTML with added/removed text highlighted
 */
export const highlightHtmlDiff = (oldHtml, newHtml, side) => {
  // Strip HTML to get plain text
  const oldText = stripHtml(oldHtml);
  const newText = stripHtml(newHtml);
  
  // If texts are identical, return original HTML with no highlighting
  if (oldText.trim() === newText.trim()) {
    return side === 'old' ? oldHtml : newHtml;
  }
  
  // Split into words (including punctuation as part of words)
  const oldWords = oldText.split(/\s+/).filter(Boolean);
  const newWords = newText.split(/\s+/).filter(Boolean);
  
  // Compute LCS-based diff
  const diff = computeLCS(oldWords, newWords);
  
  // Build a map of indices to highlight (with metadata about what to highlight)
  const highlightMap = new Map(); // index -> { type, fullWord, punctuationOnly }
  
  diff.forEach(item => {
    if (item.type === 'removed' && side === 'old' && item.oldIndex !== null) {
      highlightMap.set(item.oldIndex, {
        type: 'removed',
        word: item.word,
        diffType: item.diffType
      });
    } else if (item.type === 'added' && side === 'new' && item.newIndex !== null) {
      highlightMap.set(item.newIndex, {
        type: 'added',
        word: item.word,
        diffType: item.diffType
      });
    } else if (item.type === 'punctuation-change') {
      // Highlight punctuation change on appropriate side
      const wordToUse = side === 'old' ? item.word : item.newWord;
      const index = side === 'old' ? item.oldIndex : item.newIndex;
      if (index !== null) {
        highlightMap.set(index, {
          type: side === 'old' ? 'removed-punct' : 'added-punct',
          word: wordToUse,
          diffType: 'punctuation'
        });
      }
    }
  });
  
  // If no differences, return original HTML
  if (highlightMap.size === 0) {
    return side === 'old' ? oldHtml : newHtml;
  }
  
  // Get the words array for this side
  const words = side === 'old' ? oldWords : newWords;
  const sourceHtml = side === 'old' ? oldHtml : newHtml;
  
  // Group consecutive word-level changes into ranges
  const ranges = [];
  const punctuationHighlights = []; // Track punctuation-only highlights separately
  const sortedIndices = Array.from(highlightMap.keys()).sort((a, b) => a - b);
  
  for (const index of sortedIndices) {
    const item = highlightMap.get(index);
    
    if (item.diffType === 'punctuation') {
      // Handle punctuation separately
      punctuationHighlights.push({ index, item });
    } else {
      // Group consecutive word changes
      if (ranges.length === 0 || ranges[ranges.length - 1].end !== index - 1) {
        // Start new range
        ranges.push({ start: index, end: index, items: [item] });
      } else {
        // Extend existing range
        ranges[ranges.length - 1].end = index;
        ranges[ranges.length - 1].items.push(item);
      }
    }
  }
  
  // Build highlighted HTML
  let result = sourceHtml;
  
  // Process word-level ranges in reverse order
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i];
    const wordsInRange = words.slice(range.start, range.end + 1);
    const phraseToHighlight = wordsInRange.join(' ');
    const className = side === 'old' ? 'diff-removed' : 'diff-added';
    
    // Escape special regex characters
    const escapedPhrase = phraseToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Find and replace using DOM manipulation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result;
    
    const textNodes = [];
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node !== null) {
      textNodes.push(node);
      node = walker.nextNode();
    }
    
    for (const textNode of textNodes) {
      const text = textNode.textContent;
      const regex = new RegExp(escapedPhrase.replace(/\s+/g, '\\s+'), 'i');
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, `<span class="${className}">$&</span>`);
        const span = document.createElement('span');
        span.innerHTML = highlightedText;
        textNode.parentNode.replaceChild(span, textNode);
        result = tempDiv.innerHTML;
        break;
      }
    }
  }
  
  // Process punctuation-only highlights
  for (const { index, item } of punctuationHighlights) {
    const { word: baseWord, punctuation } = splitWordAndPunctuation(item.word);
    
    if (punctuation) {
      const className = item.type === 'removed-punct' ? 'diff-removed' : 'diff-added';
      
      // Escape regex characters
      const escapedBase = baseWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedPunct = punctuation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match the word with its punctuation and wrap only the punctuation
      const regex = new RegExp(`\\b(${escapedBase})(${escapedPunct})\\b`, 'gi');
      result = result.replace(regex, `$1<span class="${className}">$2</span>`);
    }
  }
  
  return result;
};

