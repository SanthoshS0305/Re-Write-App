# Dashboard Redesign (Google Docs-Inspired) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote search to a prominent row, add a grid/list view toggle, show a per-card text-snippet thumbnail, and consolidate pin/delete into a "⋮" menu with a pin badge — without changing the existing search/sort/pin logic.

**Architecture:** A new precomputed `Chapter.previewText` field (kept separate from the intentionally content-free dashboard list payload) feeds card/row thumbnails via the last-modified-chapter helper. `StoryCard` and a new `StoryListRow` share the same data and actions, switched by a `localStorage`-persisted view-mode hook.

**Tech Stack:** Next.js 16 App Router, Prisma, TanStack Query, Radix `DropdownMenu`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-13-dashboard-google-docs-redesign-design.md`

## Global Constraints

- Branch: `dashboard-redesign/all`, created off `dashboard/all` **after** `chapter-nav-helper` has been merged into it — Task 4 consumes `getLastModifiedChapter` from `lib/dashboard/chapter-nav.ts`.
- Run `pnpm test:run` after every task — must show all files passing, not just the new/changed one.
- Any UI work must follow the `rewrite-design` skill's tokens (colors, `font-display`, existing card/pill/border conventions).
- The dashboard search input must keep its existing `aria-label="Search stories and chapters"` — `__tests__/dashboard/components/DashboardContent.test.tsx` depends on it.
- After each task's tests pass, commit with a `feat(dashboard):` message per this project's commit convention.
- Do not merge this branch into `dashboard/all` without explicit user approval.
- **Known cross-branch conflict:** the story-hub plan (`2026-08-13-story-hub-and-direct-chapter-open.md`) also modifies `components/dashboard/StoryCard.tsx` on its own concurrent branch — that plan changes the card's navigation logic (Task 3), this plan changes its visual structure and action menu (Task 5). Both branches touch the same file in different, non-overlapping regions, but merging both into `dashboard/all` will still require manual conflict resolution — expect this, it isn't a sign either plan is wrong.
- **Do not assume `Story.description`/`Story.outline` exist** — those fields are added by the story-hub branch's schema change, not this one. Test fixtures in this plan build `Story` objects without them.

---

### Task 1: Schema — `Chapter.previewText`

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `types/dashboard.ts`

**Interfaces:**
- Produces: `Chapter.previewText: string` (Prisma `String @default("")`), consumed by Task 2's write path and Task 3's read path.

- [ ] **Step 1: Add the field**

In `prisma/schema.prisma`, `model Chapter`, add:

```prisma
model Chapter {
  id            String           @id @default(uuid())
  title         String
  order         Int
  content       Json
  wordCount     Int              @default(0)
  previewText   String           @default("")
  storyId       String
  story         Story            @relation(fields: [storyId], references: [id], onDelete: Cascade)
  scenes        Scene[]
  versions      ChapterVersion[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}
```

- [ ] **Step 2: Push the schema and regenerate the client**

Run: `pnpm prisma:push`
Run: `pnpm prisma:generate`
Expected: both succeed with no errors.

- [ ] **Step 3: Add the field to the shared type**

In `types/dashboard.ts`, add `previewText: string;` to `Chapter`:

```typescript
export type Chapter = {
  id: string;
  title: string;
  order: number;
  wordCount: number | null;
  previewText: string;
  storyId: string;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 4: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass — this adds a field with a default, nothing existing should break. (Existing test fixtures that build `Chapter` objects without `previewText` will now be missing a required TS property; if `tsc` flags any, this is expected — those fixtures get updated in later tasks that touch the same test files. If a fixture in a file this plan never otherwise touches breaks the build, add `previewText: ''` to it now.)

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma types/dashboard.ts
git commit -m "feat(db): add previewText field to Chapter"
```

---

### Task 2: `extractPreviewText`

**Files:**
- Modify: `lib/utils/word-count.ts`
- Modify: `__tests__/dashboard/lib/word-count.test.ts` (create if it doesn't already exist — check first with `find __tests__ -iname "*word-count*"`)

**Interfaces:**
- Consumes: `JSONContent` (from `@tiptap/core`, already used by `countWords`/`countCharacters` in this file).
- Produces: `extractPreviewText(content: JSONContent | null | undefined, maxLength: number): string`. Consumed by Task 3's autosave route.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/dashboard/lib/word-count.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/lib/word-count.test.ts`
Expected: FAIL — `extractPreviewText` is not exported from `@/lib/utils/word-count`.

- [ ] **Step 3: Write the implementation**

Add to `lib/utils/word-count.ts` (alongside the existing `countWords`/`countCharacters`):

```typescript
export function extractPreviewText(
  content: JSONContent | null | undefined,
  maxLength: number
): string {
  if (!content) return "";

  const parts: string[] = [];

  function traverse(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return parts.join(" ").slice(0, maxLength);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/lib/word-count.test.ts`
Expected: PASS — all 5 tests. Note the 3rd test expects `"First paragraph. Second paragraph."` — this works because `traverse` pushes each paragraph's already-punctuated text as one part and `parts.join(" ")` adds the space between them.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add lib/utils/word-count.ts __tests__/dashboard/lib/word-count.test.ts
git commit -m "feat(dashboard): add extractPreviewText for chapter thumbnail snippets"
```

---

### Task 3: Wire `previewText` into the API

**Files:**
- Modify: `app/api/stories/route.ts`
- Modify: `app/api/stories/[id]/route.ts`
- Modify: `app/api/chapters/route.ts`
- Modify: `app/api/chapters/[id]/autosave/route.ts`
- Modify: `__tests__/dashboard/api/chapters-id.test.ts` or the autosave-specific test file — run `find __tests__ -iname "*autosave*"` first; if none exists, create `__tests__/dashboard/api/chapters-autosave.test.ts`.

**Interfaces:**
- Consumes: `extractPreviewText` from Task 2.
- Produces: `previewText` present on every `Chapter` returned from `GET /api/stories`, `GET /api/stories/[id]`, `POST /api/chapters`; recomputed on every `PATCH /api/chapters/[id]/autosave`.

- [ ] **Step 1: Add `previewText` to `CHAPTER_DASHBOARD_SELECT`**

In **each** of `app/api/stories/route.ts`, `app/api/stories/[id]/route.ts`, and `app/api/chapters/route.ts`, change:

```typescript
const CHAPTER_DASHBOARD_SELECT = {
  id: true,
  title: true,
  order: true,
  wordCount: true,
  storyId: true,
  createdAt: true,
  updatedAt: true,
} as const;
```

to:

```typescript
const CHAPTER_DASHBOARD_SELECT = {
  id: true,
  title: true,
  order: true,
  wordCount: true,
  previewText: true,
  storyId: true,
  createdAt: true,
  updatedAt: true,
} as const;
```

- [ ] **Step 2: Check for an existing autosave test file**

Run: `find __tests__ -iname "*autosave*"`

If a file is found, add the test in Step 3 to it, reusing its existing mocks/setup. If none is found, create `__tests__/dashboard/api/chapters-autosave.test.ts` with this full content (mirroring the mock style already used in `__tests__/dashboard/api/stories-id.test.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/chapters/[id]/autosave/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const { mockChapterFindFirst, mockChapterUpdate } = vi.hoisted(() => ({
  mockChapterFindFirst: vi.fn(),
  mockChapterUpdate: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    chapter: {
      findFirst: mockChapterFindFirst,
      update: mockChapterUpdate,
    },
  },
}))

const AUTH_SESSION = { user: { id: 'test-user-id', email: 'test@example.com', name: 'Test' } }
const makeParams = (id: string) => Promise.resolve({ id })

describe('PATCH /api/chapters/[id]/autosave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('recomputes previewText from content and saves it alongside wordCount', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce({ id: 'chapter-1', storyId: 'story-1' })
    mockChapterUpdate.mockResolvedValueOnce({ id: 'chapter-1' })

    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    }

    const req = new Request('http://localhost/api/chapters/chapter-1/autosave', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    await PATCH(req, { params: makeParams('chapter-1') })

    expect(mockChapterUpdate).toHaveBeenCalledWith({
      where: { id: 'chapter-1' },
      data: expect.objectContaining({
        content,
        wordCount: 2,
        previewText: 'Hello world',
      }),
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/dashboard/api/chapters-autosave.test.ts` (adjust the path if you added to an existing file instead)
Expected: FAIL — the assertion on `previewText` fails because the route doesn't compute it yet.

- [ ] **Step 4: Update the autosave route**

In `app/api/chapters/[id]/autosave/route.ts`, add the import and compute the field:

```typescript
import { countWords, extractPreviewText } from "@/lib/utils/word-count";
```

(Replace the existing `import { countWords } from "@/lib/utils/word-count";` with the above.)

Change:

```typescript
const wordCount = countWords(content);

const chapter = await prisma.chapter.update({
  where: { id },
  data: {
    content,
    wordCount,
  },
});
```

to:

```typescript
const wordCount = countWords(content);
const previewText = extractPreviewText(content, 200);

const chapter = await prisma.chapter.update({
  where: { id },
  data: {
    content,
    wordCount,
    previewText,
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run __tests__/dashboard/api/chapters-autosave.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass. `POST /api/chapters` needs no code change — `previewText` defaults to `""` via the schema default when omitted from `create` data, and the `select` clause from Step 1 already returns it.

- [ ] **Step 7: Commit**

```bash
git add app/api/stories/route.ts "app/api/stories/[id]/route.ts" app/api/chapters/route.ts "app/api/chapters/[id]/autosave/route.ts" __tests__/dashboard/api/chapters-autosave.test.ts
git commit -m "feat(api): include previewText in dashboard chapter selects, recompute on autosave"
```

---

### Task 4: `useViewPreference` hook

**Files:**
- Create: `hooks/useViewPreference.ts`
- Test: `__tests__/dashboard/hooks/useViewPreference.test.ts`

**Interfaces:**
- Produces: `useViewPreference(): { view: "grid" | "list"; setView: (view: "grid" | "list") => void }`. Consumed by Task 7.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/dashboard/hooks/useViewPreference.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewPreference } from '@/hooks/useViewPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('useViewPreference', () => {
  it('defaults to grid when nothing is stored', () => {
    const { result } = renderHook(() => useViewPreference())
    expect(result.current.view).toBe('grid')
  })

  it('persists the chosen view to localStorage', () => {
    const { result } = renderHook(() => useViewPreference())

    act(() => result.current.setView('list'))

    expect(result.current.view).toBe('list')
    expect(localStorage.getItem('rewrite:dashboard-view')).toBe('list')
  })

  it('restores a previously stored preference on mount', () => {
    localStorage.setItem('rewrite:dashboard-view', 'list')

    const { result } = renderHook(() => useViewPreference())

    expect(result.current.view).toBe('list')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/hooks/useViewPreference.test.ts`
Expected: FAIL — `Cannot find module '@/hooks/useViewPreference'`.

- [ ] **Step 3: Write the implementation**

```typescript
// hooks/useViewPreference.ts
import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "rewrite:dashboard-view";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "grid";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
}

export function useViewPreference() {
  const [view, setViewState] = useState<ViewMode>("grid");

  useEffect(() => {
    setViewState(readStoredView());
  }, []);

  const setView = (next: ViewMode) => {
    setViewState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return { view, setView };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/hooks/useViewPreference.test.ts`
Expected: PASS — all 3 tests.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add hooks/useViewPreference.ts __tests__/dashboard/hooks/useViewPreference.test.ts
git commit -m "feat(dashboard): add useViewPreference — localStorage-persisted grid/list toggle"
```

---

### Task 5: `StoryCard` — thumbnail, pin badge, "⋮" menu

**Files:**
- Modify: `components/dashboard/StoryCard.tsx`
- Modify: `__tests__/dashboard/components/StoryCard.test.tsx`

**Interfaces:**
- Consumes: `getLastModifiedChapter` (`lib/dashboard/chapter-nav.ts`, already on `dashboard/all`), `Chapter.previewText` (Task 3).
- Produces: same `StoryCard({ story }: { story: Story })` signature — only its internal markup and menu structure change.

- [ ] **Step 1: Update the existing tests for the new menu structure**

In `__tests__/dashboard/components/StoryCard.test.tsx`, the existing `describe('StoryCard', ...)` and `describe('StoryCard pin toggle', ...)` blocks reference a directly-clickable "Delete" text/button and separately-rendered pin button. Update them to go through the new "⋮" trigger first. Replace the whole file's two describe blocks (`'StoryCard'` and `'StoryCard pin toggle'`) with:

```typescript
describe('StoryCard', () => {
  it('renders the story title', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    expect(screen.getByText('My Great Story')).toBeInTheDocument()
  })

  it('renders correct chapter count for zero chapters', () => {
    render(<StoryCard story={makeStory({ chapters: [] })} />, { wrapper: createWrapper() })
    expect(screen.getByText('0 chapters')).toBeInTheDocument()
  })

  it('renders correct chapter count for one chapter with singular form', () => {
    const story = makeStory({
      chapters: [{ id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('renders correct chapter count for multiple chapters', () => {
    const story = makeStory({
      chapters: [
        { id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-2', title: 'Chapter 2', order: 2, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-3', title: 'Chapter 3', order: 3, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      ],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('3 chapters')).toBeInTheDocument()
  })

  it('renders the previewText of the last-modified chapter as a thumbnail', () => {
    const story = makeStory({
      chapters: [
        { id: 'ch-1', title: 'Ch 1', order: 1, wordCount: 5, previewText: 'Old text', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-2', title: 'Ch 2', order: 2, wordCount: 5, previewText: 'Newest text', storyId: 'story-1', createdAt: '2024-06-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
      ],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('Newest text')).toBeInTheDocument()
  })

  it('opens the "⋮" menu and deletes via DELETE /api/stories/[id]', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Delete'))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stories/story-abc', { method: 'DELETE' })
    })
  })
})

describe('StoryCard pin toggle', () => {
  it('shows a pin badge only when the story is pinned', () => {
    const { rerender } = render(<StoryCard story={makeStory({ pinned: false })} />, { wrapper: createWrapper() })
    expect(screen.queryByTestId('pin-badge')).not.toBeInTheDocument()

    rerender(<StoryCard story={makeStory({ pinned: true })} />)
    expect(screen.getByTestId('pin-badge')).toBeInTheDocument()
  })

  it('calls PATCH /api/stories/[id] with pinned: true from the "⋮" menu when unpinned', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: false })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Pin'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ pinned: true }) })
      )
    })
  })

  it('calls PATCH /api/stories/[id] with pinned: false from the "⋮" menu when pinned', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: true })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Unpin'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ pinned: false }) })
      )
    })
  })
})
```

Also update the file's `vi.mock('@/components/ui/alert-dialog', ...)` block — it stays as-is (still needed for the delete confirmation), but add a mock for the dropdown menu right after it, since Radix's `DropdownMenu` uses portals that don't render reliably in jsdom without one:

```typescript
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}))
```

And update the `makeStory` helper at the top of the file to include a `chapters: []` default if it doesn't already have one (check the existing helper — it does, per the current file: `chapters: []`). No change needed there.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryCard.test.tsx`
Expected: FAIL — no "story options" button, no `pin-badge` test id, no thumbnail text yet.

- [ ] **Step 3: Implement the card changes**

In `components/dashboard/StoryCard.tsx`:

1. Replace the `lucide-react` import line with:

```typescript
import { Pin, MoreVertical } from "lucide-react";
```

2. Add imports:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
```

3. Inside the component, after `const chapterCount = story.chapters.length;`, add:

```typescript
const thumbnailChapter = getLastModifiedChapter(story);
```

4. Add a thumbnail block as the first child inside the card's content wrapper (immediately after the aqua top-hairline `<div>`, before the title row):

```tsx
{thumbnailChapter?.previewText && (
  <div
    className="mx-3 mt-3 rounded p-2 overflow-hidden"
    style={{ backgroundColor: "var(--light-gray)", height: 56 }}
  >
    <p className="font-display text-[9px] leading-snug" style={{ color: "#333" }}>
      {thumbnailChapter.previewText}
    </p>
  </div>
)}
```

5. Add the pin badge, rendered only when `story.pinned`, positioned near the title (e.g. right before the title text, inside the title row):

```tsx
{story.pinned && (
  <span
    data-testid="pin-badge"
    className="shrink-0"
    style={{ color: "var(--aqua)" }}
    aria-hidden="true"
  >
    <Pin className="h-3 w-3" fill="currentColor" />
  </span>
)}
```

6. Replace the two existing always-visible controls — the standalone pin `<button>` (added for the pin-toggle feature) and the `AlertDialog`/`AlertDialogTrigger` delete icon button — with a single "⋮" trigger. Keep the `AlertDialog` itself (for the delete confirmation step) but move its trigger inside a `DropdownMenuItem`:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button
      onClick={(e) => e.preventDefault()}
      aria-label="Story options"
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
      style={{ color: "var(--light-gray)" }}
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
  >
    <DropdownMenuItem
      onClick={(e) => {
        e.preventDefault();
        pinMutation.mutate();
      }}
      style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}
    >
      {story.pinned ? "Unpin" : "Pin"}
    </DropdownMenuItem>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          style={{ color: "#f87171", fontFamily: "Joan, serif", cursor: "pointer" }}
        >
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent
        style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display" style={{ color: "var(--light-gray)" }}>
            Delete Story
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
            Are you sure you want to delete &ldquo;{story.title}&rdquo;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="font-display"
            style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="font-display"
            style={{ backgroundColor: "#c0392b", color: "white" }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DropdownMenuContent>
</DropdownMenu>
```

This reuses the exact `AlertDialogHeader`/`AlertDialogTitle`/etc. markup and `deleteMutation` already present in the file — only the trigger moved from a standalone icon button into a `DropdownMenuItem`. Remove the old standalone pin `<button>` and the old standalone `AlertDialog`/`AlertDialogTrigger` delete icon block that this replaces.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass. If `DashboardContent.test.tsx`'s `STORIES` fixture objects build `Chapter`s without `previewText`, add `previewText: ''` to each — `tsc`/the test run will surface this as a type error or missing-field issue if so.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/StoryCard.tsx __tests__/dashboard/components/StoryCard.test.tsx
git commit -m "feat(dashboard): add thumbnail + pin badge to StoryCard, consolidate actions into a \"...\" menu"
```

---

### Task 6: `StoryListRow` component

**Files:**
- Create: `components/dashboard/StoryListRow.tsx`
- Test: `__tests__/dashboard/components/StoryListRow.test.tsx`

**Interfaces:**
- Consumes: `getLastModifiedChapter` (`lib/dashboard/chapter-nav.ts`), same pin/delete mutation pattern as `StoryCard`.
- Produces: `StoryListRow({ story }: { story: Story })`. Consumed by Task 7.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/dashboard/components/StoryListRow.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoryListRow } from '@/components/dashboard/StoryListRow'
import type { Story } from '@/types/dashboard'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const makeStory = (overrides: Partial<Story> = {}): Story => ({
  id: 'story-1',
  title: 'My Great Story',
  userId: 'test-user-id',
  pinned: false,
  lastAccessedAt: new Date('2024-01-15').toISOString(),
  chapters: [],
  createdAt: new Date('2024-01-15').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
  ...overrides,
})

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'story-1' } }) } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StoryListRow', () => {
  it('renders the story title and chapter count', () => {
    const story = makeStory({
      chapters: [{ id: 'ch-1', title: 'Ch 1', order: 1, wordCount: 5, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    render(<StoryListRow story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('My Great Story')).toBeInTheDocument()
    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('shows a pin badge only when pinned', () => {
    const { rerender } = render(<StoryListRow story={makeStory({ pinned: false })} />, { wrapper: createWrapper() })
    expect(screen.queryByTestId('pin-badge')).not.toBeInTheDocument()

    rerender(<StoryListRow story={makeStory({ pinned: true })} />)
    expect(screen.getByTestId('pin-badge')).toBeInTheDocument()
  })

  it('calls DELETE /api/stories/[id] via the "⋮" menu', async () => {
    const user = userEvent.setup()
    render(<StoryListRow story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Delete'))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stories/story-abc', { method: 'DELETE' })
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryListRow.test.tsx`
Expected: FAIL — `Cannot find module '@/components/dashboard/StoryListRow'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/dashboard/StoryListRow.tsx
"use client";

import Link from "next/link";
import { Pin, MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
import type { Story } from "@/types/dashboard";

interface StoryListRowProps {
  story: Story;
}

export function StoryListRow({ story }: StoryListRowProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete story");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !story.pinned }),
      });
      if (!response.ok) throw new Error("Failed to update pin state");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const chapterCount = story.chapters.length;
  const thumbnailChapter = getLastModifiedChapter(story);
  const lastUpdated = new Date(story.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/dashboard/stories/${story.id}`} className="block">
      <div
        className="flex items-center gap-3 rounded-[8px] px-4 py-2 transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--dark-green)" }}
      >
        <div
          className="shrink-0 rounded"
          style={{ width: 28, height: 36, backgroundColor: "var(--light-gray)" }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {story.pinned && (
            <span data-testid="pin-badge" style={{ color: "var(--aqua)" }} aria-hidden="true">
              <Pin className="h-3 w-3" fill="currentColor" />
            </span>
          )}
          <span className="font-display text-[14px] truncate" style={{ color: "var(--light-gray)" }}>
            {story.title}
          </span>
        </div>
        <span className="font-display text-[12px] shrink-0" style={{ color: "var(--aqua)", opacity: 0.7 }}>
          {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
        </span>
        <span className="font-display text-[12px] shrink-0" style={{ color: "var(--light-gray)", opacity: 0.6, width: 60 }}>
          {lastUpdated}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.preventDefault()}
              aria-label="Story options"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--light-gray)" }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                pinMutation.mutate();
              }}
              style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}
            >
              {story.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  style={{ color: "#f87171", fontFamily: "Joan, serif", cursor: "pointer" }}
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent
                style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display" style={{ color: "var(--light-gray)" }}>
                    Delete Story
                  </AlertDialogTitle>
                  <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
                    Are you sure you want to delete &ldquo;{story.title}&rdquo;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="font-display"
                    style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="font-display"
                    style={{ backgroundColor: "#c0392b", color: "white" }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
```

Note: `thumbnailChapter` is computed but intentionally unused in the rendered markup — list rows show a plain placeholder square (per spec: too small to hold readable text), not `previewText`. Remove the `thumbnailChapter` line if your linter flags it as unused, or keep it if you'd rather use it for a future `title` tooltip attribute on the square — either is fine, it's not asserted by the tests above.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryListRow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/StoryListRow.tsx __tests__/dashboard/components/StoryListRow.test.tsx
git commit -m "feat(dashboard): add StoryListRow for the new list view"
```

---

### Task 7: `DashboardContent` — search row, view toggle, view switching

**Files:**
- Modify: `components/dashboard/DashboardContent.tsx`
- Modify: `__tests__/dashboard/components/DashboardContent.test.tsx`

**Interfaces:**
- Consumes: `useViewPreference` (Task 4), `StoryListRow` (Task 6).
- Produces: same `DashboardContent()` signature — no callers change.

- [ ] **Step 1: Write the failing test**

Add to `__tests__/dashboard/components/DashboardContent.test.tsx`, as a new `describe` block (reuse the file's existing `STORIES` fixture, `createWrapper`, and `beforeEach`/`afterEach` fetch mock — if `STORIES`' chapter objects don't already include `previewText`, add `previewText: ''` to each):

```typescript
describe('DashboardContent view toggle', () => {
  it('defaults to grid view, showing story cards', async () => {
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')
    expect(screen.getByRole('link', { name: /the great adventure/i })).toBeInTheDocument()
  })

  it('switches to list view when the list toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.click(screen.getByRole('button', { name: /list view/i }))

    // Still renders the story, just via StoryListRow instead of StoryCard
    expect(screen.getByText('The Great Adventure')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/dashboard/components/DashboardContent.test.tsx`
Expected: FAIL — no "list view" button exists yet.

- [ ] **Step 3: Implement the layout changes**

In `components/dashboard/DashboardContent.tsx`:

1. Add imports:

```typescript
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { StoryListRow } from "@/components/dashboard/StoryListRow";
import { useViewPreference } from "@/hooks/useViewPreference";
```

2. Inside the component, add:

```typescript
const { view, setView } = useViewPreference();
```

3. Restyle the existing "Controls: search + filter + sort" block. Keep the exact same `Input` element and its `aria-label="Search stories and chapters"` unchanged (do not touch that prop). Restructure the surrounding markup so the search input is visually prominent (wider, its own row) and add the grid/list toggle to that row:

```tsx
<div className="fade-up mb-8 flex flex-wrap items-center gap-4">
  <div className="flex items-center gap-2" style={{ flex: "1 1 480px", maxWidth: 480 }}>
    <Search className="h-4 w-4 shrink-0" style={{ color: "var(--light-gray)" }} />
    <Input
      placeholder="Search stories and chapters..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      aria-label="Search stories and chapters"
    />
  </div>

  <Select value={filterMode} onValueChange={(v) => setFilterMode(v as SearchFilterMode)}>
    <SelectTrigger className="w-[160px]" aria-label="Search filter">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="best">Best match</SelectItem>
      <SelectItem value="story">Story title</SelectItem>
      <SelectItem value="chapter">Chapter title</SelectItem>
    </SelectContent>
  </Select>

  <Select value={sortCriterion} onValueChange={(v) => setSortCriterion(v as SortCriterion)}>
    <SelectTrigger className="w-[160px]" aria-label="Sort stories">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="recent">Recent</SelectItem>
      <SelectItem value="alphabetical">Alphabetical</SelectItem>
      <SelectItem value="length">Length</SelectItem>
    </SelectContent>
  </Select>

  <div className="flex items-center gap-1 shrink-0">
    <button
      onClick={() => setView("grid")}
      aria-label="Grid view"
      className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
      style={{ color: "var(--light-gray)", opacity: view === "grid" ? 1 : 0.5 }}
    >
      <LayoutGrid className="h-4 w-4" />
    </button>
    <button
      onClick={() => setView("list")}
      aria-label="List view"
      className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
      style={{ color: "var(--light-gray)", opacity: view === "list" ? 1 : 0.5 }}
    >
      <ListIcon className="h-4 w-4" />
    </button>
  </div>
</div>
```

4. In the non-searching render branch (where `displayedStories.map((story) => <StoryCard key={story.id} story={story} />)` currently lives), switch on `view`:

```tsx
<div className={view === "grid" ? "fade-up fade-up-delay-1 grid grid-cols-1 md:grid-cols-2 gap-6" : "fade-up fade-up-delay-1 flex flex-col gap-2"}>
  {displayedStories.map((story) =>
    view === "grid" ? (
      <StoryCard key={story.id} story={story} />
    ) : (
      <StoryListRow key={story.id} story={story} />
    )
  )}
</div>
```

Leave the searching branch (the `isSearching` conditional rendering `StoryCard`/`ChapterResultTile` search results) exactly as it is today — per the spec, search results keep their current single-list presentation regardless of the grid/list toggle.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/components/DashboardContent.test.tsx`
Expected: PASS — all tests in the file, including the pre-existing search tests (unaffected — the `aria-label` didn't change) and the 2 new view-toggle ones.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/DashboardContent.tsx __tests__/dashboard/components/DashboardContent.test.tsx
git commit -m "feat(dashboard): promote search bar, add grid/list view toggle to DashboardContent"
```

---

## Self-Review Notes

- **Spec coverage:** prominent search row + view toggle (Task 7) ✓; thumbnail previews via precomputed `previewText` (Tasks 1–3) ✓; grid/list toggle persisted (Task 4) ✓; "⋮" menu replacing icons, pin badge (Tasks 5–6) ✓; pinned-first ordering unchanged (no task touches `sortStories`) ✓.
- **Type consistency verified:** `Chapter.previewText: string` (Task 1) matches every fixture/mock built across Tasks 3, 5, 6, 7 — all include the field as a required property, none use `previewText?:`.
- **Ambiguity resolved:** `StoryListRow`'s square thumbnail intentionally does not render `previewText` (too small to be legible per the spec) — flagged explicitly in Task 6, Step 3, so a future reader doesn't "fix" it as a bug.
