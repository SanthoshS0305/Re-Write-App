import { describe, it, expect } from 'vitest'
import { extractPreviewText } from '@/lib/utils/word-count'

describe('extractPreviewText', () => {
  it('returns an empty string for null/undefined content', () => {
    expect(extractPreviewText(null, 200)).toBe('')
    expect(extractPreviewText(undefined, 200)).toBe('')
  })

  it('returns an empty string for a doc with no text', () => {
    const content = { type: 'doc', content: [{ type: 'paragraph' }] }
    expect(extractPreviewText(content, 200)).toBe('')
  })

  it('concatenates text across multiple paragraphs in document order', () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph.' }] },
      ],
    }
    expect(extractPreviewText(content, 200)).toBe('First paragraph. Second paragraph.')
  })

  it('truncates to maxLength', () => {
    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(300) }] }],
    }
    const result = extractPreviewText(content, 200)
    expect(result).toHaveLength(200)
  })

  it('does not truncate content shorter than maxLength', () => {
    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'short' }] }],
    }
    expect(extractPreviewText(content, 200)).toBe('short')
  })
})
