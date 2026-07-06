import { describe, it, expect } from 'vitest'
import { sortStories, searchStories } from '@/lib/dashboard/sort-search'
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

describe('sortStories', () => {
  it('sorts alphabetically by title', () => {
    const stories = [makeStory({ id: 'b', title: 'Banana' }), makeStory({ id: 'a', title: 'Apple' })]
    const result = sortStories(stories, 'alphabetical')
    expect(result.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('sorts by total chapter word count descending for length', () => {
    const short = makeStory({ id: 'short', chapters: [makeChapter({ wordCount: 50 })] })
    const long = makeStory({
      id: 'long',
      chapters: [makeChapter({ wordCount: 500 }), makeChapter({ id: 'c2', wordCount: 500 })],
    })
    const result = sortStories([short, long], 'length')
    expect(result.map((s) => s.id)).toEqual(['long', 'short'])
  })

  it('sorts by lastAccessedAt descending for recent', () => {
    const older = makeStory({ id: 'older', lastAccessedAt: new Date('2024-01-01').toISOString() })
    const newer = makeStory({ id: 'newer', lastAccessedAt: new Date('2024-06-01').toISOString() })
    const result = sortStories([older, newer], 'recent')
    expect(result.map((s) => s.id)).toEqual(['newer', 'older'])
  })

  it('always places pinned stories before unpinned, regardless of criterion', () => {
    const unpinnedA = makeStory({ id: 'a', title: 'Apple', pinned: false })
    const pinnedZ = makeStory({ id: 'z', title: 'Zebra', pinned: true })
    const result = sortStories([unpinnedA, pinnedZ], 'alphabetical')
    expect(result.map((s) => s.id)).toEqual(['z', 'a'])
  })

  it('sorts within the pinned and unpinned partitions independently', () => {
    const stories = [
      makeStory({ id: 'pinned-b', title: 'Bravo', pinned: true }),
      makeStory({ id: 'pinned-a', title: 'Alpha', pinned: true }),
      makeStory({ id: 'unpinned-b', title: 'Bravo2', pinned: false }),
      makeStory({ id: 'unpinned-a', title: 'Alpha2', pinned: false }),
    ]
    const result = sortStories(stories, 'alphabetical')
    expect(result.map((s) => s.id)).toEqual(['pinned-a', 'pinned-b', 'unpinned-a', 'unpinned-b'])
  })
})

describe('searchStories', () => {
  it('returns no results for an empty query', () => {
    expect(searchStories([makeStory()], '', 'best')).toEqual([])
    expect(searchStories([makeStory()], '   ', 'best')).toEqual([])
  })

  it('matches story titles in story filter mode', () => {
    const story = makeStory({ title: 'The Great Adventure' })
    const results = searchStories([story], 'great', 'story')
    expect(results).toEqual([{ type: 'story', story }])
  })

  it('does not match chapter titles in story filter mode', () => {
    const story = makeStory({ title: 'Unrelated', chapters: [makeChapter({ title: 'Great Chapter' })] })
    const results = searchStories([story], 'great', 'story')
    expect(results).toEqual([])
  })

  it('matches chapter titles in chapter filter mode', () => {
    const chapter = makeChapter({ title: 'The Escape' })
    const story = makeStory({ title: 'Unrelated', chapters: [chapter] })
    const results = searchStories([story], 'escape', 'chapter')
    expect(results).toEqual([{ type: 'chapter', story, chapter }])
  })

  it('does not match story titles in chapter filter mode', () => {
    const story = makeStory({ title: 'Great Story', chapters: [] })
    const results = searchStories([story], 'great', 'chapter')
    expect(results).toEqual([])
  })

  it('matches both story and chapter titles in best mode', () => {
    const chapter = makeChapter({ title: 'Great Chapter' })
    const storyA = makeStory({ id: 'a', title: 'Great Story', chapters: [] })
    const storyB = makeStory({ id: 'b', title: 'Unrelated', chapters: [chapter] })
    const results = searchStories([storyA, storyB], 'great', 'best')
    expect(results).toHaveLength(2)
    expect(results).toContainEqual({ type: 'story', story: storyA })
    expect(results).toContainEqual({ type: 'chapter', story: storyB, chapter })
  })

  it('ranks exact matches above starts-with matches above contains matches', () => {
    const exact = makeStory({ id: 'exact', title: 'Great' })
    const startsWith = makeStory({ id: 'starts', title: 'Great Escape' })
    const contains = makeStory({ id: 'contains', title: 'The Great Escape' })
    const results = searchStories([contains, startsWith, exact], 'great', 'story')
    expect(results.map((r) => (r as { story: Story }).story.id)).toEqual(['exact', 'starts', 'contains'])
  })

  it('is case-insensitive', () => {
    const story = makeStory({ title: 'GREAT ADVENTURE' })
    const results = searchStories([story], 'great', 'story')
    expect(results).toEqual([{ type: 'story', story }])
  })
})
