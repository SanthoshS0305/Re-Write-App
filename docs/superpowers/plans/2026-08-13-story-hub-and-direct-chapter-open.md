# Story Hub Page + Direct-to-Chapter Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard tiles open straight into the editor on the story's last-modified chapter (auto-creating one if none exist); the story detail route stays but becomes a "story hub" — narrow chapter rail, description, and a chapter-referencing outline — reachable only from the editor's story-title link.

**Architecture:** Extend the existing partial-update pattern on `PATCH /api/stories/[id]` for two new fields. Rebuild `StoryDetailContent` around three focused components (chapter rail, description field, outline editor) instead of the current single-purpose `ChapterList`. The outline is a second, trimmed-down Tiptap instance with a custom inline node, following the same extension pattern as the existing `SceneExtension`.

**Tech Stack:** Next.js 16 App Router, Prisma, Tiptap 3 (`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, plus new `@tiptap/suggestion` and `tippy.js`), TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-13-story-hub-and-direct-chapter-open-design.md`

## Global Constraints

- Branch: `story-hub/all`, created off `dashboard/all` **after** `chapter-nav-helper` has been merged into it — this plan's Task 3 consumes `getLastModifiedChapter` from `lib/dashboard/chapter-nav.ts`, which must already exist.
- Run `pnpm test:run` after every task — must show all files passing, not just the new/changed one.
- Any UI work (new components, restyling) must follow the `rewrite-design` skill's tokens (colors, `font-display`, existing card/pill/border conventions) — invoke that skill before making visual decisions if unsure of a value.
- After each task's tests pass, commit with a `feat(dashboard):` / `fix(dashboard):` message per this project's commit convention (see root `CLAUDE.md`).
- Do not merge this branch into `dashboard/all` without explicit user approval.
- **Known cross-branch conflict:** the dashboard-redesign plan (`2026-08-13-dashboard-google-docs-redesign.md`) also modifies `components/dashboard/StoryCard.tsx` on its own concurrent branch — that plan changes the card's visual structure and action menu, this plan (Task 3) changes its navigation logic. Both branches touch the same file in different, non-overlapping regions, but merging both into `dashboard/all` will still require manual conflict resolution — expect this, it isn't a sign either plan is wrong.

---

### Task 1: Schema — `Story.description` / `Story.outline`

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `types/dashboard.ts`

**Interfaces:**
- Produces: `Story.description: string | null`, `Story.outline: unknown | null` (Prisma `Json?`) — consumed by Task 2 (API) and Task 9 (story hub content).

- [ ] **Step 1: Add the fields to the schema**

In `prisma/schema.prisma`, in `model Story`, add two nullable fields alongside the existing ones:

```prisma
model Story {
  id             String    @id @default(uuid())
  title          String
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  chapters       Chapter[]
  pinned         Boolean   @default(false)
  lastAccessedAt DateTime  @default(now())
  description    String?
  outline        Json?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

- [ ] **Step 2: Push the schema and regenerate the client**

Run: `pnpm prisma:push`
Run: `pnpm prisma:generate`
Expected: both succeed with no errors; `@prisma/client` types now include `description`/`outline` on `Story`.

- [ ] **Step 3: Update the shared dashboard type**

In `types/dashboard.ts`, add the two fields to `Story`:

```typescript
export type Story = {
  id: string;
  title: string;
  userId: string;
  pinned: boolean;
  lastAccessedAt: string;
  description: string | null;
  outline: unknown;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};
```

- [ ] **Step 4: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass — this is a type-only/schema change, nothing should break.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma types/dashboard.ts
git commit -m "feat(db): add description and outline fields to Story"
```

---

### Task 2: Extend `PATCH /api/stories/[id]` for description/outline

**Files:**
- Modify: `app/api/stories/[id]/route.ts`
- Modify: `__tests__/dashboard/api/stories-id.test.ts`

**Interfaces:**
- Consumes: `Story.description`, `Story.outline` from Task 1.
- Produces: `PATCH /api/stories/[id]` body may now include `description?: string` and `outline?: object`, in addition to the existing `title?`/`pinned?`. At least one of the four must be present. Consumed by Task 10's `useStoryAutoSave`.

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/dashboard/api/stories-id.test.ts`, inside the `describe('PATCH /api/stories/[id]', ...)` block (reuse the existing `AUTH_SESSION`, `makeStory`, `makeParams`, `mockTransaction` already defined in that file):

```typescript
it('updates description via transaction and returns updated story wrapped in { data }', async () => {
  const updated = makeStory({ description: 'A story about the sea.' })
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
  mockTransaction.mockImplementationOnce(async (fn: (tx: {
    story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  }) => Promise<unknown>) =>
    fn({
      story: {
        findFirst: vi.fn().mockResolvedValueOnce(makeStory()),
        update: vi.fn().mockResolvedValueOnce(updated),
      },
    })
  )

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'A story about the sea.' }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })
  const body = await res.json()

  expect(res.status).toBe(200)
  expect(body.data).toMatchObject({ description: 'A story about the sea.' })
})

it('accepts an empty string description (clearing it is valid)', async () => {
  const updated = makeStory({ description: '' })
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
  mockTransaction.mockImplementationOnce(async (fn: (tx: {
    story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  }) => Promise<unknown>) =>
    fn({
      story: {
        findFirst: vi.fn().mockResolvedValueOnce(makeStory()),
        update: vi.fn().mockResolvedValueOnce(updated),
      },
    })
  )

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: '' }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })

  expect(res.status).toBe(200)
})

it('rejects a non-string description', async () => {
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 42 }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })
  const body = await res.json()

  expect(res.status).toBe(400)
  expect(body.error).toBe('Description must be a string')
})

it('updates outline via transaction and returns updated story wrapped in { data }', async () => {
  const outline = { type: 'doc', content: [{ type: 'paragraph' }] }
  const updated = makeStory({ outline })
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
  mockTransaction.mockImplementationOnce(async (fn: (tx: {
    story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  }) => Promise<unknown>) =>
    fn({
      story: {
        findFirst: vi.fn().mockResolvedValueOnce(makeStory()),
        update: vi.fn().mockResolvedValueOnce(updated),
      },
    })
  )

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outline }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })
  const body = await res.json()

  expect(res.status).toBe(200)
  expect(body.data).toMatchObject({ outline })
})

it('rejects a non-object outline', async () => {
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outline: 'not an object' }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })
  const body = await res.json()

  expect(res.status).toBe(400)
  expect(body.error).toBe('Outline must be an object')
})

it('saves description and outline together in one request', async () => {
  const outline = { type: 'doc', content: [] }
  const updated = makeStory({ description: 'Two fields at once', outline })
  mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
  mockTransaction.mockImplementationOnce(async (fn: (tx: {
    story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  }) => Promise<unknown>) =>
    fn({
      story: {
        findFirst: vi.fn().mockResolvedValueOnce(makeStory()),
        update: vi.fn().mockResolvedValueOnce(updated),
      },
    })
  )

  const req = new Request('http://localhost/api/stories/story-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Two fields at once', outline }),
  })
  const res = await PATCH(req, { params: makeParams('story-1') })

  expect(res.status).toBe(200)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/api/stories-id.test.ts`
Expected: FAIL — the route doesn't recognize `description`/`outline` yet, so those bodies hit the existing "at least one of title or pinned is required" 400 path instead of succeeding.

- [ ] **Step 3: Extend the route**

In `app/api/stories/[id]/route.ts`, replace the `PATCH` handler's body-parsing and validation block:

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, pinned, description, outline } = body as {
      title?: unknown;
      pinned?: unknown;
      description?: unknown;
      outline?: unknown;
    };

    if (
      title === undefined &&
      pinned === undefined &&
      description === undefined &&
      outline === undefined
    ) {
      return NextResponse.json(
        { error: "At least one of title, pinned, description, or outline is required" },
        { status: 400 }
      );
    }

    const data: {
      title?: string;
      pinned?: boolean;
      description?: string;
      outline?: Prisma.InputJsonValue;
    } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }
      data.title = title.trim();
    }

    if (pinned !== undefined) {
      if (typeof pinned !== "boolean") {
        return NextResponse.json(
          { error: "Pinned must be a boolean" },
          { status: 400 }
        );
      }
      data.pinned = pinned;
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          { error: "Description must be a string" },
          { status: 400 }
        );
      }
      data.description = description;
    }

    if (outline !== undefined) {
      if (typeof outline !== "object" || outline === null || Array.isArray(outline)) {
        return NextResponse.json(
          { error: "Outline must be an object" },
          { status: 400 }
        );
      }
      data.outline = outline as Prisma.InputJsonValue;
    }

    const story = await prisma.$transaction(async (tx) => {
      const existing = await tx.story.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existing) return null;

      return tx.story.update({
        where: { id },
        data: title === undefined ? { ...data, updatedAt: existing.updatedAt } : data,
      });
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ data: story });
  } catch (error) {
    console.error("Error updating story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Add `Prisma` to the existing imports at the top of the file: `import { Prisma } from "@prisma/client";`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/api/stories-id.test.ts`
Expected: PASS — all tests in the file, including the 6 new ones and the pre-existing `title`/`pinned` ones (unaffected).

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/stories/[id]/route.ts __tests__/dashboard/api/stories-id.test.ts
git commit -m "feat(api): support description/outline updates on PATCH /api/stories/[id]"
```

---

### Task 3: `StoryCard` opens the last-modified chapter directly

**Files:**
- Modify: `components/dashboard/StoryCard.tsx`
- Modify: `__tests__/dashboard/components/StoryCard.test.tsx`

**Interfaces:**
- Consumes: `getLastModifiedChapter(story: Story): Chapter | null` from `lib/dashboard/chapter-nav.ts` (already on `dashboard/all` — see Global Constraints).
- Produces: no new exports; `StoryCard`'s click behavior changes from linking to `/dashboard/stories/[id]` to either linking directly to `/editor/[chapterId]` or (zero-chapter case) creating a chapter first.

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/dashboard/components/StoryCard.test.tsx`, as a new top-level `describe` block (reuse the existing `makeStory`, `createWrapper` helpers already in that file):

```typescript
describe('StoryCard navigation', () => {
  it('links directly to the last-modified chapter when chapters exist', () => {
    const older = { id: 'ch-older', title: 'Ch 1', order: 1, wordCount: 10, storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
    const newer = { id: 'ch-newer', title: 'Ch 2', order: 2, wordCount: 10, storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' }
    render(<StoryCard story={makeStory({ chapters: [older, newer] })} />, { wrapper: createWrapper() })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/editor/ch-newer')
  })

  it('creates a chapter and navigates on click when the story has no chapters', async () => {
    const user = userEvent.setup()
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'new-chapter-id' } }),
    } as Response)

    render(<StoryCard story={makeStory({ id: 'story-empty', chapters: [] })} />, { wrapper: createWrapper() })

    const trigger = screen.getByRole('button', { name: /open story/i })
    await user.click(trigger)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chapters',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Chapter 1', storyId: 'story-empty' }),
        })
      )
    })
  })
})
```

This test file needs `mockPush` and a mocked `next/navigation` `useRouter` — add near the top of the file, alongside the existing `vi.mock('next/link', ...)`:

```typescript
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
```

And a third assertion in the zero-chapter test, after the `waitFor` above:

```typescript
    expect(mockPush).toHaveBeenCalledWith('/editor/new-chapter-id')
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryCard.test.tsx`
Expected: FAIL — `StoryCard` still links to `/dashboard/stories/[id]` unconditionally; there's no "Open story" button role for the zero-chapter case.

- [ ] **Step 3: Implement the navigation change**

In `components/dashboard/StoryCard.tsx`, add imports:

```typescript
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
```

(`useMutation`/`useQueryClient` are likely already imported — don't duplicate.)

Inside the `StoryCard` component function, add:

```typescript
const router = useRouter();
const lastChapter = getLastModifiedChapter(story);

const createFirstChapterMutation = useMutation({
  mutationFn: async () => {
    const response = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Chapter 1", storyId: story.id }),
    });
    if (!response.ok) throw new Error("Failed to create chapter");
    const json = await response.json();
    return json.data as { id: string };
  },
  onSuccess: (chapter) => {
    router.push(`/editor/${chapter.id}`);
  },
});
```

Replace the outer `<Link href={\`/dashboard/stories/${story.id}\`} className="block">` wrapper (and its matching closing `</Link>`) with a conditional: when `lastChapter` exists, keep the same `Link`/`className="block"` wrapper but point it at `` `/editor/${lastChapter.id}` `` instead; when it's `null`, use a `<button type="button">` with the same `className="block"` styling, `aria-label="Open story"`, and `onClick={() => createFirstChapterMutation.mutate()}` in place of the `Link`. Keep everything currently nested inside that wrapper (title, pin button, delete dialog) exactly as-is in both branches — only the outer element and its navigation behavior change.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/dashboard/components/StoryCard.test.tsx`
Expected: PASS — all tests in the file, including the pre-existing pin/delete ones (unaffected by this change) and the 2 new navigation ones.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass. Check `DashboardContent.test.tsx` specifically — it renders `StoryCard` with stories that have chapters, so its existing assertions about story titles rendering should be unaffected; if any test there asserted a link `href` of `/dashboard/stories/...`, update it to the new `/editor/[chapterId]` target.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/StoryCard.tsx __tests__/dashboard/components/StoryCard.test.tsx
git commit -m "feat(dashboard): open the last-modified chapter directly from a story tile

Zero-chapter stories create a first chapter on click instead of
landing on an empty chapter-select page."
```

---

### Task 4: Chapter rail — narrow, restyled `ChapterList` with "+ New Chapter"

**Files:**
- Modify (rename via `git mv`): `components/dashboard/ChapterList.tsx` → `components/dashboard/ChapterRail.tsx`
- Test: `__tests__/dashboard/components/ChapterRail.test.tsx` (new)

**Interfaces:**
- Consumes: `CreateChapterDialog` (existing, unmodified — `components/dashboard/CreateChapterDialog.tsx`), `Chapter` type from `types/dashboard.ts`.
- Produces: `ChapterRail({ chapters, storyId }: { chapters: Chapter[]; storyId: string })` — a narrower column than the current `ChapterList`, with an "+ New Chapter" trigger at the top. Consumed by Task 9 (story hub content rewrite).

- [ ] **Step 1: Rename the file**

```bash
git mv components/dashboard/ChapterList.tsx components/dashboard/ChapterRail.tsx
```

- [ ] **Step 2: Write the failing test**

```typescript
// __tests__/dashboard/components/ChapterRail.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChapterRail } from '@/components/dashboard/ChapterRail'
import type { Chapter } from '@/types/dashboard'

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

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const CHAPTERS: Chapter[] = [
  { id: 'ch-1', title: 'The Escape', order: 1, wordCount: 500, storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'ch-2', title: 'Quiet Mountains', order: 2, wordCount: 300, storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
]

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'ch-new' } }) } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChapterRail', () => {
  it('renders each chapter title, linking to its editor page', () => {
    render(<ChapterRail chapters={CHAPTERS} storyId="story-1" />, { wrapper: createWrapper() })
    const link = screen.getByRole('link', { name: /the escape/i })
    expect(link).toHaveAttribute('href', '/editor/ch-1')
    expect(screen.getByText('Quiet Mountains')).toBeInTheDocument()
  })

  it('renders a "New Chapter" trigger that opens the create-chapter dialog', async () => {
    const user = userEvent.setup()
    render(<ChapterRail chapters={CHAPTERS} storyId="story-1" />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /new chapter/i }))

    expect(screen.getByText('Create New Chapter')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/dashboard/components/ChapterRail.test.tsx`
Expected: FAIL — `Cannot find module '@/components/dashboard/ChapterRail'` (it's still exported as `ChapterList`), and there's no "New Chapter" trigger yet.

- [ ] **Step 4: Restyle and extend the component**

In `components/dashboard/ChapterRail.tsx`:

1. Rename the exported function from `ChapterList` to `ChapterRail`, and its props type from `ChapterListProps` to `ChapterRailProps`.
2. Narrow the row layout: reduce the chapter number/title/word-count row's horizontal padding (`px-6 py-4` → `px-4 py-3`), drop the title font size from `22px` to `18px`, and wrap the whole list in a `flex-col` container with a fixed narrower width context (the parent — Task 9 — controls the actual column width; this component itself should just avoid assuming full-page width, i.e. drop any `max-w-*` or wide-row assumptions already present).
3. Add the import `import { CreateChapterDialog } from "@/components/dashboard/CreateChapterDialog";` and `import { useState } from "react";` and `import { Plus } from "lucide-react";`.
4. At the top of the `ChapterRail` function body, add:

```typescript
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
```

5. Render a compact trigger button above the chapter list (inside the returned JSX, before the `.map`):

```tsx
<button
  onClick={() => setIsCreateDialogOpen(true)}
  className="flex items-center gap-2 rounded-[20px] px-4 py-2 font-display text-[14px] text-black border-[2px] border-black transition-opacity hover:opacity-90 mb-3"
  style={{ backgroundColor: "var(--green-highlight)" }}
>
  <Plus className="h-4 w-4" />
  New Chapter
</button>
```

6. After the closing `</div>` of the outer `flex flex-col gap-3` container, render:

```tsx
<CreateChapterDialog
  open={isCreateDialogOpen}
  onOpenChange={setIsCreateDialogOpen}
  storyId={storyId}
/>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run __tests__/dashboard/components/ChapterRail.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass. `grep -rn "ChapterList" app components __tests__` should return nothing — if `StoryDetailContent.tsx` still imports `ChapterList`, that's fixed in Task 9; leave it broken for now (it'll be caught by `tsc`/build, not by these tests, since `StoryDetailContent` has no test file).

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/ChapterRail.tsx __tests__/dashboard/components/ChapterRail.test.tsx
git rm __tests__/dashboard/components/ChapterList.test.tsx 2>/dev/null || true
git commit -m "refactor(dashboard): rename ChapterList to ChapterRail, narrow it, add New Chapter trigger"
```

---

### Task 5: Install outline editor dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:**
- Produces: `@tiptap/suggestion` and `tippy.js` available for Task 6/7.

- [ ] **Step 1: Install**

Run: `pnpm add @tiptap/suggestion tippy.js`
Expected: both added to `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 2: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass (adding a dependency shouldn't affect anything yet).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add @tiptap/suggestion and tippy.js for outline chapter mentions"
```

---

### Task 6: `ChapterMentionList` — the "@" popup

**Files:**
- Create: `components/story-hub/ChapterMentionList.tsx`
- Test: `__tests__/story-hub/ChapterMentionList.test.tsx`

**Interfaces:**
- Produces: `ChapterMentionList`, a `forwardRef` component taking `{ items: ChapterOption[]; command: (item: ChapterOption) => void }` and exposing `{ onKeyDown(props: { event: KeyboardEvent }): boolean }` via ref. `ChapterOption = { id: string; title: string }`, exported from this file. Consumed by Task 7's Tiptap suggestion `render()`.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/story-hub/ChapterMentionList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChapterMentionList, type ChapterMentionListRef } from '@/components/story-hub/ChapterMentionList'

const ITEMS = [
  { id: 'ch-1', title: 'The Escape' },
  { id: 'ch-2', title: 'Quiet Mountains' },
]

describe('ChapterMentionList', () => {
  it('renders every item title', () => {
    render(<ChapterMentionList items={ITEMS} command={vi.fn()} />)
    expect(screen.getByText('The Escape')).toBeInTheDocument()
    expect(screen.getByText('Quiet Mountains')).toBeInTheDocument()
  })

  it('shows a "no matching chapters" message when items is empty', () => {
    render(<ChapterMentionList items={[]} command={vi.fn()} />)
    expect(screen.getByText(/no matching chapters/i)).toBeInTheDocument()
  })

  it('calls command with the clicked item', async () => {
    const user = userEvent.setup()
    const command = vi.fn()
    render(<ChapterMentionList items={ITEMS} command={command} />)

    await user.click(screen.getByText('Quiet Mountains'))

    expect(command).toHaveBeenCalledWith(ITEMS[1])
  })

  it('selects the next item on ArrowDown and confirms it on Enter via the ref', () => {
    const command = vi.fn()
    const ref = createRef<ChapterMentionListRef>()
    render(<ChapterMentionList ref={ref} items={ITEMS} command={command} />)

    ref.current!.onKeyDown({ event: { key: 'ArrowDown' } as KeyboardEvent })
    ref.current!.onKeyDown({ event: { key: 'Enter' } as KeyboardEvent })

    expect(command).toHaveBeenCalledWith(ITEMS[1])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/story-hub/ChapterMentionList.test.tsx`
Expected: FAIL — `Cannot find module '@/components/story-hub/ChapterMentionList'`.

- [ ] **Step 3: Write the implementation**

```typescript
// components/story-hub/ChapterMentionList.tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface ChapterOption {
  id: string;
  title: string;
}

interface ChapterMentionListProps {
  items: ChapterOption[];
  command: (item: ChapterOption) => void;
}

export interface ChapterMentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const ChapterMentionList = forwardRef<ChapterMentionListRef, ChapterMentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          command(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div
          className="font-display"
          style={{
            backgroundColor: "var(--dark-green)",
            border: "1px solid var(--dark-green-highlight)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "var(--light-gray)",
            opacity: 0.6,
            fontSize: 14,
          }}
        >
          No matching chapters
        </div>
      );
    }

    return (
      <div
        className="font-display"
        style={{
          backgroundColor: "var(--dark-green)",
          border: "1px solid var(--dark-green-highlight)",
          borderRadius: 8,
          padding: 4,
          minWidth: 200,
        }}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => command(item)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              background: index === selectedIndex ? "var(--dark-green-highlight)" : "transparent",
              color: "var(--light-gray)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
    );
  }
);
ChapterMentionList.displayName = "ChapterMentionList";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/story-hub/ChapterMentionList.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add components/story-hub/ChapterMentionList.tsx __tests__/story-hub/ChapterMentionList.test.tsx
git commit -m "feat(story-hub): add ChapterMentionList popup for the outline's @-mention picker"
```

---

### Task 7: `ChapterReferenceExtension` — the Tiptap node

**Files:**
- Create: `lib/story-hub/chapter-reference-extension.ts`
- Test: `__tests__/story-hub/chapter-reference-extension.test.ts`

**Interfaces:**
- Consumes: `ChapterMentionList`, `ChapterOption` from Task 6.
- Produces: `ChapterReferenceExtension` (a Tiptap `Node`, configurable via `.configure({ chapters: ChapterOption[] })`), name `"chapterReference"`. Consumed by Task 8's `lib/story-hub/tiptap-config.ts`.

- [ ] **Step 1: Write the failing test**

This test mounts a real Tiptap `Editor` (no React) in the jsdom test environment and asserts on its rendered DOM — a pattern this codebase hasn't used before, but `@tiptap/core`'s `Editor` works standalone outside React.

```typescript
// __tests__/story-hub/chapter-reference-extension.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { ChapterReferenceExtension } from '@/lib/story-hub/chapter-reference-extension'

const CHAPTERS = [
  { id: 'ch-1', title: 'The Escape' },
  { id: 'ch-2', title: 'Quiet Mountains' },
]

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

function makeEditor() {
  editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      ChapterReferenceExtension.configure({ chapters: CHAPTERS }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
  })
  return editor
}

describe('ChapterReferenceExtension', () => {
  it('renders a live chapter reference as a link with the current title', () => {
    const e = makeEditor()
    e.commands.insertContentAt(1, {
      type: 'chapterReference',
      attrs: { chapterId: 'ch-2', chapterTitle: 'Old Title' },
    })

    const link = e.view.dom.querySelector('a[data-chapter-reference]')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/editor/ch-2')
    expect(link?.textContent).toBe('Quiet Mountains')
  })

  it('renders a reference to a deleted chapter as non-clickable, using the stored title', () => {
    const e = makeEditor()
    e.commands.insertContentAt(1, {
      type: 'chapterReference',
      attrs: { chapterId: 'ch-does-not-exist', chapterTitle: 'Gone Chapter' },
    })

    const node = e.view.dom.querySelector('[data-chapter-reference]')
    expect(node).not.toBeNull()
    expect(node?.hasAttribute('href')).toBe(false)
    expect(node?.textContent).toBe('Gone Chapter (deleted)')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/story-hub/chapter-reference-extension.test.ts`
Expected: FAIL — `Cannot find module '@/lib/story-hub/chapter-reference-extension'`. (`@tiptap/extension-document`, `@tiptap/extension-paragraph`, `@tiptap/extension-text` are transitive deps of `@tiptap/starter-kit`, already installed — if this import fails instead with a module-not-found for one of those three, run `pnpm add @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text` before continuing.)

- [ ] **Step 3: Write the implementation**

```typescript
// lib/story-hub/chapter-reference-extension.ts
import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import {
  ChapterMentionList,
  type ChapterMentionListRef,
  type ChapterOption,
} from "@/components/story-hub/ChapterMentionList";

export type { ChapterOption };

export interface ChapterReferenceOptions {
  chapters: ChapterOption[];
}

export const ChapterReferenceExtension = Node.create<ChapterReferenceOptions>({
  name: "chapterReference",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      chapters: [],
    };
  },

  addAttributes() {
    return {
      chapterId: { default: null },
      chapterTitle: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "[data-chapter-reference]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-chapter-reference": "" }),
      node.attrs.chapterTitle,
    ];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const chapterRefExtension = editor.extensionManager.extensions.find(
        (ext) => ext.name === "chapterReference"
      );
      const chapters = (chapterRefExtension?.options.chapters ?? []) as ChapterOption[];
      const live = chapters.find((c) => c.id === node.attrs.chapterId);

      const dom = document.createElement(live ? "a" : "span");
      dom.setAttribute("data-chapter-reference", "");
      dom.style.cssText =
        "display:inline-flex;align-items:center;padding:2px 10px;border-radius:12px;" +
        "font-family:Joan, serif;font-size:14px;text-decoration:none;";

      if (live) {
        (dom as HTMLAnchorElement).href = `/editor/${live.id}`;
        dom.textContent = live.title;
        dom.style.backgroundColor = "var(--dark-green-highlight)";
        dom.style.color = "var(--aqua)";
        dom.style.cursor = "pointer";
      } else {
        dom.textContent = `${node.attrs.chapterTitle} (deleted)`;
        dom.style.color = "var(--light-gray)";
        dom.style.opacity = "0.4";
        dom.style.cursor = "default";
        dom.style.border = "1px dashed var(--light-gray)";
      }

      return { dom };
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    const suggestionOptions: Omit<SuggestionOptions, "editor"> = {
      char: "@",
      allowSpaces: false,
      items: ({ query }) =>
        extension.options.chapters
          .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8),
      render: () => {
        let component: ReactRenderer<ChapterMentionListRef>;
        let popup: TippyInstance[];

        return {
          onStart: (props) => {
            component = new ReactRenderer(ChapterMentionList, {
              props,
              editor: props.editor,
            });
            if (!props.clientRect) return;
            popup = tippy("body", {
              getReferenceClientRect: () => props.clientRect!() as DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },
          onUpdate: (props) => {
            component.updateProps(props);
            if (!props.clientRect) return;
            popup[0].setProps({
              getReferenceClientRect: () => props.clientRect!() as DOMRect,
            });
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              popup[0].hide();
              return true;
            }
            return component.ref?.onKeyDown(props) ?? false;
          },
          onExit: () => {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
      command: ({ editor, range, props }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            {
              type: "chapterReference",
              attrs: { chapterId: props.id, chapterTitle: props.title },
            },
            { type: "text", text: " " },
          ])
          .run();
      },
    };

    return [Suggestion({ editor: this.editor, ...suggestionOptions })];
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run __tests__/story-hub/chapter-reference-extension.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add lib/story-hub/chapter-reference-extension.ts __tests__/story-hub/chapter-reference-extension.test.ts
git commit -m "feat(story-hub): add ChapterReferenceExtension Tiptap node for outline @-mentions

Resolves against the live chapter list at render time; a reference
to a deleted chapter renders greyed-out and non-clickable using its
stored title snapshot."
```

---

### Task 8: `OutlineEditor` component

**Files:**
- Create: `lib/story-hub/tiptap-config.ts`
- Create: `components/story-hub/OutlineEditor.tsx`
- Test: `__tests__/story-hub/OutlineEditor.test.tsx`

**Interfaces:**
- Consumes: `ChapterReferenceExtension`, `ChapterOption` from Task 7.
- Produces: `OutlineEditor({ content, chapters, onUpdate }: { content: JSONContent; chapters: ChapterOption[]; onUpdate: (content: JSONContent) => void })`. Consumed by Task 9.

- [ ] **Step 1: Write the extension list**

```typescript
// lib/story-hub/tiptap-config.ts
import StarterKit from "@tiptap/starter-kit";
import { ChapterReferenceExtension, type ChapterOption } from "./chapter-reference-extension";

export function buildOutlineExtensions(chapters: ChapterOption[]) {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      strike: false,
      link: false,
      underline: false,
    }),
    ChapterReferenceExtension.configure({ chapters }),
  ];
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// __tests__/story-hub/OutlineEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { OutlineEditor } from '@/components/story-hub/OutlineEditor'

const CHAPTERS = [{ id: 'ch-1', title: 'The Escape' }]

describe('OutlineEditor', () => {
  it('renders the editor and calls onUpdate with JSON content after typing', async () => {
    const onUpdate = vi.fn()
    render(
      <OutlineEditor
        content={{ type: 'doc', content: [{ type: 'paragraph', content: [] }] }}
        chapters={CHAPTERS}
        onUpdate={onUpdate}
      />
    )

    const editable = await screen.findByRole('textbox')
    editable.textContent = 'Some outline text'
    editable.dispatchEvent(new InputEvent('input', { bubbles: true }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run __tests__/story-hub/OutlineEditor.test.tsx`
Expected: FAIL — `Cannot find module '@/components/story-hub/OutlineEditor'`.

- [ ] **Step 4: Write the implementation**

```tsx
// components/story-hub/OutlineEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { buildOutlineExtensions } from "@/lib/story-hub/tiptap-config";
import type { ChapterOption } from "@/lib/story-hub/chapter-reference-extension";

interface OutlineEditorProps {
  content: JSONContent;
  chapters: ChapterOption[];
  onUpdate: (content: JSONContent) => void;
}

export function OutlineEditor({ content, chapters, onUpdate }: OutlineEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildOutlineExtensions(chapters),
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] font-display text-[16px]",
      },
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run __tests__/story-hub/OutlineEditor.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 7: Commit**

```bash
git add lib/story-hub/tiptap-config.ts components/story-hub/OutlineEditor.tsx __tests__/story-hub/OutlineEditor.test.tsx
git commit -m "feat(story-hub): add OutlineEditor — trimmed Tiptap instance with chapter mentions"
```

---

### Task 9: `useStoryAutoSave` hook

**Files:**
- Create: `hooks/useStoryAutoSave.ts`
- Test: `__tests__/story-hub/useStoryAutoSave.test.ts`

**Interfaces:**
- Consumes: `PATCH /api/stories/[id]` from Task 2 (`description?`, `outline?` body).
- Produces: `useStoryAutoSave({ storyId, description, outline, interval? }): void`. Consumed by Task 10.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/story-hub/useStoryAutoSave.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStoryAutoSave } from '@/hooks/useStoryAutoSave'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: {} }) } as Response)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useStoryAutoSave', () => {
  it('does not save immediately on mount', () => {
    renderHook(() =>
      useStoryAutoSave({
        storyId: 'story-1',
        description: 'Initial',
        outline: { type: 'doc', content: [] },
        interval: 2000,
      })
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('saves only the changed field after the debounce interval', async () => {
    const { rerender } = renderHook(
      ({ description }) =>
        useStoryAutoSave({
          storyId: 'story-1',
          description,
          outline: { type: 'doc', content: [] },
          interval: 2000,
        }),
      { initialProps: { description: 'Initial' } }
    )

    rerender({ description: 'Changed' })
    await vi.advanceTimersByTimeAsync(2000)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stories/story-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ description: 'Changed' }),
      })
    )
  })

  it('coalesces description and outline into one request when both change within the debounce window', async () => {
    const outlineA = { type: 'doc', content: [] }
    const outlineB = { type: 'doc', content: [{ type: 'paragraph' }] }
    const { rerender } = renderHook(
      ({ description, outline }) =>
        useStoryAutoSave({ storyId: 'story-1', description, outline, interval: 2000 }),
      { initialProps: { description: 'Initial', outline: outlineA } }
    )

    rerender({ description: 'Changed', outline: outlineB })
    await vi.advanceTimersByTimeAsync(2000)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stories/story-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ description: 'Changed', outline: outlineB }),
      })
    )
  })

  it('does not save when nothing changed', async () => {
    const { rerender } = renderHook(
      ({ description }) =>
        useStoryAutoSave({
          storyId: 'story-1',
          description,
          outline: { type: 'doc', content: [] },
          interval: 2000,
        }),
      { initialProps: { description: 'Same' } }
    )

    rerender({ description: 'Same' })
    await vi.advanceTimersByTimeAsync(2000)

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run __tests__/story-hub/useStoryAutoSave.test.ts`
Expected: FAIL — `Cannot find module '@/hooks/useStoryAutoSave'`.

- [ ] **Step 3: Write the implementation**

```typescript
// hooks/useStoryAutoSave.ts
import { useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/core";

interface UseStoryAutoSaveOptions {
  storyId: string;
  description: string;
  outline: JSONContent;
  interval?: number;
}

export function useStoryAutoSave({
  storyId,
  description,
  outline,
  interval = 2000,
}: UseStoryAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({
    description,
    outline: JSON.stringify(outline),
  });

  useEffect(() => {
    const outlineString = JSON.stringify(outline);
    const descriptionChanged = description !== lastSavedRef.current.description;
    const outlineChanged = outlineString !== lastSavedRef.current.outline;

    if (!descriptionChanged && !outlineChanged) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      const body: { description?: string; outline?: JSONContent } = {};
      if (descriptionChanged) body.description = description;
      if (outlineChanged) body.outline = outline;

      try {
        const response = await fetch(`/api/stories/${storyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          lastSavedRef.current = { description, outline: outlineString };
        }
      } catch {
        // Network failure — next content change re-diffs against the last
        // successfully saved snapshot and retries both fields if needed.
      }
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [description, outline, storyId, interval]);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run __tests__/story-hub/useStoryAutoSave.test.ts`
Expected: PASS — all 4 tests.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add hooks/useStoryAutoSave.ts __tests__/story-hub/useStoryAutoSave.test.ts
git commit -m "feat(story-hub): add useStoryAutoSave — debounced, coalesced description+outline save"
```

---

### Task 10: Rewrite `StoryDetailContent` into the story hub layout

**Files:**
- Modify: `components/dashboard/StoryDetailContent.tsx`
- Modify: `types/dashboard.ts` (if `Chapter`'s reference shape needs no change — verify only; likely no edit needed here beyond Task 1's `Story` change)

**Interfaces:**
- Consumes: `ChapterRail` (Task 4), `OutlineEditor` (Task 8), `useStoryAutoSave` (Task 9), `Story.description`/`Story.outline` (Task 1).
- Produces: the rewritten `StoryDetailContent({ storyId }: { storyId: string })`, same external signature as today — no callers need to change.

- [ ] **Step 1: Rewrite the component**

Replace the contents of `components/dashboard/StoryDetailContent.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ChapterRail } from "@/components/dashboard/ChapterRail";
import { OutlineEditor } from "@/components/story-hub/OutlineEditor";
import { useStoryAutoSave } from "@/hooks/useStoryAutoSave";
import type { Story } from "@/types/dashboard";
import type { JSONContent } from "@tiptap/core";

interface StoryDetailContentProps {
  storyId: string;
}

const EMPTY_OUTLINE: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

async function fetchStory(storyId: string): Promise<Story> {
  const res = await fetch(`/api/stories/${storyId}`);
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error("Failed to fetch story");
  const json = await res.json();
  return json.data;
}

export function StoryDetailContent({ storyId }: StoryDetailContentProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [outline, setOutline] = useState<JSONContent>(EMPTY_OUTLINE);
  const [initialized, setInitialized] = useState(false);

  const { data: story, isLoading, isError, error } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () => fetchStory(storyId),
  });

  useEffect(() => {
    if (isError && error instanceof Error && error.message === "not_found") {
      router.push("/dashboard");
    }
  }, [isError, error, router]);

  useEffect(() => {
    if (story && !initialized) {
      setDescription(story.description ?? "");
      setOutline((story.outline as JSONContent) ?? EMPTY_OUTLINE);
      setInitialized(true);
    }
  }, [story, initialized]);

  useStoryAutoSave({ storyId, description, outline });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--dark-mint-green)" }}
      >
        <p className="font-display text-[20px]" style={{ color: "var(--light-gray)", opacity: 0.5 }}>
          Loading...
        </p>
      </div>
    );
  }

  if (isError || !story) return null;

  const chapterOptions = story.chapters.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--dark-mint-green)" }} />
        <img
          src="/images/forest_bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header
          className="flex items-center gap-[10px] px-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] shrink-0"
          style={{ backgroundColor: "var(--dark-green)", minHeight: "80px" }}
        >
          <div className="flex items-center justify-center h-full px-[10px] shrink-0">
            <span className="font-display leading-none" style={{ fontSize: "48px" }}>
              <span style={{ color: "var(--aqua)" }}>Re</span>
              <span style={{ color: "black" }}>:</span>
              <span style={{ color: "var(--light-gray)" }}>Write</span>
            </span>
          </div>
          <div className="flex-1" />
          <Link href="/dashboard">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] transition-opacity hover:opacity-80"
              style={{ color: "var(--light-gray)", backgroundColor: "var(--dark-green-highlight)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
        </header>

        <main className="flex-1 px-12 py-10 flex gap-8">
          <aside style={{ width: 240, flexShrink: 0 }}>
            <ChapterRail chapters={story.chapters} storyId={story.id} />
          </aside>

          <div className="flex-1 flex flex-col gap-8 min-w-0">
            <div>
              <h1 className="font-display text-[40px] leading-none mb-6" style={{ color: "var(--light-gray)" }}>
                {story.title}
              </h1>
              <p className="font-display text-[16px] mb-2" style={{ color: "var(--aqua)" }}>
                Description
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this story about?"
                className="font-display w-full rounded-[10px] p-4"
                style={{
                  backgroundColor: "var(--dark-green)",
                  color: "var(--light-gray)",
                  border: "1px solid var(--dark-green-highlight)",
                  minHeight: 100,
                  resize: "vertical",
                }}
              />
            </div>

            <div className="flex-1">
              <p className="font-display text-[16px] mb-2" style={{ color: "var(--aqua)" }}>
                Outline
              </p>
              <div
                className="rounded-[10px] p-4"
                style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
              >
                <OutlineEditor content={outline} chapters={chapterOptions} onUpdate={setOutline} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the full suite**

Run: `pnpm test:run`
Expected: all files pass. This file has no dedicated test (matching the pre-existing convention — `StoryDetailContent`/`ChapterList` had none before this plan either), but this step catches any import/type errors surfaced through other tests or the TypeScript check in the next step.

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors introduced by this file (pre-existing unrelated errors from other parts of the codebase, if any, are not this task's concern).

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/StoryDetailContent.tsx
git commit -m "feat(story-hub): rebuild StoryDetailContent as chapter rail + description + outline"
```

---

## Self-Review Notes

- **Spec coverage:** narrow chapter rail with delete (Task 4, unchanged delete logic carried over from `ChapterList`) ✓; "+ New Chapter" retained (Task 4) ✓; description plain-text autosaved (Tasks 9–10) ✓; outline Tiptap with bullets/numbering/line breaks (Task 8, via `StarterKit` defaults minus the disabled extensions) ✓; chapter-mention node with live/broken resolution (Task 7) ✓; dashboard tile → direct chapter open + auto-create (Task 3) ✓; schema fields (Task 1) ✓; API (Task 2) ✓.
- **Type consistency verified:** `ChapterOption` defined once in `ChapterMentionList.tsx` (Task 6), re-exported from `chapter-reference-extension.ts` (Task 7), imported from there everywhere else (Tasks 8, 10) — no duplicate/divergent definitions.
