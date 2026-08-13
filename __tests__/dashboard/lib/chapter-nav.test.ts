import { describe, it, expect } from 'vitest'
import { getLastModifiedChapter } from '@/lib/dashboard/chapter-nav'
import type { Story } from '@/types/dashboard'

const makeChapter = (overrides: Partial<Story['chapters'][number]> = {}): Story['chapters'][number] => ({
  id: 'chapter-1',
  title: 'Chapter One',
  order: 1,
  wordCount: 100,
  storyId: 'story-1',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  ...overrides,
})

const makeStory = (overrides: Partial<Story> = {}): Story => ({
  id: 'story-1',
  title: 'Story One',
  userId: 'user-1',
  pinned: false,
  lastAccessedAt: new Date('2024-01-01').toISOString(),
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  chapters: [],
  ...overrides,
})

describe('getLastModifiedChapter', () => {
  it('returns null when the story has no chapters', () => {
    expect(getLastModifiedChapter(makeStory({ chapters: [] }))).toBeNull()
  })

  it('returns the only chapter when there is exactly one', () => {
    const chapter = makeChapter()
    expect(getLastModifiedChapter(makeStory({ chapters: [chapter] }))).toEqual(chapter)
  })

  it('returns the chapter with the latest updatedAt', () => {
    const older = makeChapter({ id: 'older', order: 1, updatedAt: new Date('2024-01-01').toISOString() })
    const newer = makeChapter({ id: 'newer', order: 2, updatedAt: new Date('2024-06-01').toISOString() })
    const result = getLastModifiedChapter(makeStory({ chapters: [older, newer] }))
    expect(result?.id).toBe('newer')
  })

  it('breaks ties by order ascending when updatedAt is identical', () => {
    const tie = new Date('2024-01-01').toISOString()
    const second = makeChapter({ id: 'second', order: 2, updatedAt: tie })
    const first = makeChapter({ id: 'first', order: 1, updatedAt: tie })
    const result = getLastModifiedChapter(makeStory({ chapters: [second, first] }))
    expect(result?.id).toBe('first')
  })

  it('does not mutate the original chapters array', () => {
    const older = makeChapter({ id: 'older', order: 1, updatedAt: new Date('2024-01-01').toISOString() })
    const newer = makeChapter({ id: 'newer', order: 2, updatedAt: new Date('2024-06-01').toISOString() })
    const story = makeStory({ chapters: [older, newer] })
    getLastModifiedChapter(story)
    expect(story.chapters).toEqual([older, newer])
  })
})
