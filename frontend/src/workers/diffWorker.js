/* eslint-disable no-restricted-globals */

/**
 * Web Worker for performing expensive diff calculations off the main thread
 * This prevents UI blocking during large document comparisons
 */

/**
 * Strip HTML tags from text
 */
const stripHtml = (html) => {
  // In worker context, we can't use DOM APIs, so use regex
  return html.replace(/<[^>]*>/g, '');
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
 */
const getDifferenceType = (word1, word2) => {
  const split1 = splitWordAndPunctuation(word1);
  const split2 = splitWordAndPunctuation(word2);
  
  const base1 = split1.word.toLowerCase();
  const base2 = split2.word.toLowerCase();
  
  if (base1 === base2 && split1.punctuation === split2.punctuation) {
    return 'none';
  } else if (base1 === base2) {
    return 'punctuation';
  } else {
    return 'word';
  }
};

/**
 * Simple LCS (Longest Common Subsequence) implementation
 */
const computeLCS = (arr1, arr2) => {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  const norm1 = arr1.map(normalizeWord);
  const norm2 = arr2.map(normalizeWord);
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (norm1[i - 1] === norm2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
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
 * Highlight differences in HTML content
 */
const highlightHtmlDiff = (oldHtml, newHtml, side) => {
  const oldText = stripHtml(oldHtml);
  const newText = stripHtml(newHtml);
  
  if (oldText.trim() === newText.trim()) {
    return side === 'old' ? oldHtml : newHtml;
  }
  
  const oldWords = oldText.split(/\s+/).filter(Boolean);
  const newWords = newText.split(/\s+/).filter(Boolean);
  
  const diff = computeLCS(oldWords, newWords);
  
  const highlightMap = new Map();
  
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
  
  if (highlightMap.size === 0) {
    return side === 'old' ? oldHtml : newHtml;
  }
  
  const words = side === 'old' ? oldWords : newWords;
  const sourceHtml = side === 'old' ? oldHtml : newHtml;
  
  const ranges = [];
  const punctuationHighlights = [];
  const sortedIndices = Array.from(highlightMap.keys()).sort((a, b) => a - b);
  
  for (const index of sortedIndices) {
    const item = highlightMap.get(index);
    
    if (item.diffType === 'punctuation') {
      punctuationHighlights.push({ index, item });
    } else {
      if (ranges.length === 0 || ranges[ranges.length - 1].end !== index - 1) {
        ranges.push({ start: index, end: index, items: [item] });
      } else {
        ranges[ranges.length - 1].end = index;
        ranges[ranges.length - 1].items.push(item);
      }
    }
  }
  
  let result = sourceHtml;
  const className = side === 'old' ? 'diff-removed' : 'diff-added';
  
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i];
    const wordsInRange = words.slice(range.start, range.end + 1);
    
    const contextBefore = words.slice(Math.max(0, range.start - 3), range.start);
    const contextAfter = words.slice(range.end + 1, Math.min(words.length, range.end + 4));
    
    const beforePattern = contextBefore.length > 0 
      ? contextBefore.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+') + '\\s+'
      : '';
    const afterPattern = contextAfter.length > 0
      ? '\\s+' + contextAfter.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
      : '';
    
    const phrasePattern = wordsInRange.map(w => `(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('(\\s+)');
    
    const contextRegex = new RegExp(
      beforePattern + phrasePattern + afterPattern,
      'i'
    );
    
    const match = result.match(contextRegex);
    if (match) {
      let highlightedPhrase = match[0];
      for (const word of wordsInRange) {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b(${escapedWord})\\b`, 'i');
        highlightedPhrase = highlightedPhrase.replace(wordRegex, `<span class="${className}">$1</span>`);
      }
      
      result = result.substring(0, match.index) + highlightedPhrase + result.substring(match.index + match[0].length);
    }
  }
  
  for (const { item } of punctuationHighlights) {
    const { word: baseWord, punctuation } = splitWordAndPunctuation(item.word);
    
    if (punctuation) {
      const punctClassName = item.type === 'removed-punct' ? 'diff-removed' : 'diff-added';
      const escapedBase = baseWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedPunct = punctuation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const regex = new RegExp(`(${escapedBase})(${escapedPunct})`, 'i');
      result = result.replace(regex, `$1<span class="${punctClassName}">$2</span>`);
    }
  }
  
  return result;
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { id, oldHtml, newHtml, side } = event.data;
  
  try {
    const result = highlightHtmlDiff(oldHtml, newHtml, side);
    self.postMessage({ id, result, error: null });
  } catch (error) {
    self.postMessage({ id, result: null, error: error.message });
  }
});

