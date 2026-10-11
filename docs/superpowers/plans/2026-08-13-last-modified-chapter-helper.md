# Last-Modified-Chapter Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure, unit-tested helper that picks a story's most-recently-modified chapter, shared by the story-hub and dashboard-redesign work that both depend on it.

**Architecture:** A single pure function in `lib/dashboard/`, following the exact style of the existing `lib/dashboard/sort-search.ts` module (pure functions, no side effects, `types/dashboard.ts` types).

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- Branch: `chapter-nav-helper`, created off `dashboard/all`.
- Run `pnpm test:run` before committing — must show all files passing, not just the new one.
- **Do not merge this branch yourself.** After the task below is complete and tests pass, stop and let the user review and approve before merging into `dashboard/all`. The story-hub and dashboard-redesign plans both depend on this function existing on `dashboard/all` before their work starts.

---

### Task 1: `getLastModifiedChapter`

**Files:**
- Create: `lib/dashboard/chapter-nav.ts`
- Test: `__tests__/dashboard/lib/chapter-nav.test.ts`

**Interfaces:**
- Consumes: `Story`, `Chapter` types from `types/dashboard.ts` (`Chapter` has `id: string`, `title: string`, `order: number`, `wordCount: number | null`, `storyId: string`, `createdAt: string`, `updatedAt: string`; `Story` has `chapters: Chapter[]` among other fields).
- Produces: `getLastModifiedChapter(story: Story): Chapter | null` — used by `StoryCard` (dashboard-redesign and story-hub plans) to pick which chapter a card/thumbnail points at.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/dashboard/lib/chapter-nav.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/dashboard/lib/chapter-nav.test.ts`
Expected: FAIL — `Cannot find module '@/lib/dashboard/chapter-nav'`

- [ ] **Step 3: Write the implementation**

```typescript
// lib/dashboard/chapter-nav.ts
import type { Story, Chapter } from "@/types/dashboard";

export function getLastModifiedChapter(story: Story): Chapter | null {
  if (story.chapters.length === 0) return null;

  return [...story.chapters].sort((a, b) => {
    const byUpdatedAt = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (byUpdatedAt !== 0) return byUpdatedAt;
    return a.order - b.order;
  })[0];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run __tests__/dashboard/lib/chapter-nav.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass (no regressions).

- [ ] **Step 6: Commit**

```bash
git add lib/dashboard/chapter-nav.ts __tests__/dashboard/lib/chapter-nav.test.ts
git commit -m "feat(dashboard): add getLastModifiedChapter helper

Picks a story's most-recently-modified chapter (ties broken by
order ascending), for the story-hub and dashboard-redesign work
that both need to resolve which chapter a story tile/thumbnail
points at."
```

- [ ] **Step 7: Stop for review**

Report to the user that the branch is ready: tests pass, one commit. Wait for their approval before merging into `dashboard/all`.
