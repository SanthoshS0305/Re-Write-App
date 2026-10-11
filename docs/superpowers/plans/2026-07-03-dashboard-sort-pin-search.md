# Dashboard Sort/Pin/Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alphabetical/length/recent sorting, pinning, and title-based search (story + chapter, with a best-match/story/chapter filter) to the Re:Write dashboard, with chapter-title matches opening the editor directly.

**Architecture:** Two new `Story` fields (`pinned`, `lastAccessedAt`) back a boolean-partition pin scheme and a recency sort. Search and sort are pure client-side functions over the already-fetched story list (no new search endpoint). The existing `PATCH /api/stories/[id]` route is extended to accept a partial `{ title?, pinned? }` body instead of requiring `title`. Work happens across three role-scoped git worktrees (`dashboard/backend`, `dashboard/frontend`, `dashboard/testing`) merged into `dashboard/all`, mirroring how the `login` feature was assembled.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7 + PostgreSQL/Supabase, Clerk auth, TanStack React Query 5, Tailwind CSS 4 + shadcn/ui, Vitest + React Testing Library, pnpm.

## Global Constraints

- Package manager is **pnpm** (enforced repo-wide) — never use `npm`/`yarn` commands.
- Brand colors must be referenced via CSS variables (`var(--dark-green)`, `var(--aqua)`, etc.) from `app/globals.css`, never hardcoded hex, per the `rewrite-design` skill.
- The logo colon (`:`) is always black, never aqua or mint-green.
- Backend code must never touch React components/pages beyond the specific server-fetch lines described in each task; frontend code must never touch API routes or the Prisma schema; only the testing role writes test files — this division is enforced by `.claude/agents/backend.md`, `frontend.md`, `testing.md`.
- Every commit must run `pnpm lint` clean first, and must go through the `code-review` skill with `--fix` before it's made, per each agent's own instructions.
- Never use `--no-verify` or skip git hooks.
- Prisma test conventions in this repo mock `@/lib/db/prisma` at the module boundary directly (see `__tests__/dashboard/api/stories-id.test.ts`) — follow that existing pattern for new API tests, not the stricter "never mock Prisma" note in the older `__tests__/auth-server.test.ts` (superseded in practice by the dashboard test suite).
- All new UI must render correctly with the tokens in `app/globals.css` (`--dark-green`, `--dark-green-highlight`, `--aqua`, `--light-gray`, `--green-highlight`, `font-display` / Joan serif). The `rewrite-frontend` agent invokes the `rewrite-design` skill itself before any visual decision — treat the JSX in this plan as a structural/functional reference, not a pixel-final spec.

---

## Phase 0 — Orchestrator: integrate prior work and prepare branches

These two tasks are git/infrastructure work performed directly by the orchestrating session, not dispatched to a subagent.

### Task 1: Bring `dashboard/testing`'s prior work into `dev`

**Context:** `dashboard/backend`, `dashboard/frontend`, and `dashboard/testing` already contain a completed prior iteration (API `{ data }`-wrapper refactor, a React Query rewrite of the dashboard components, and their test suite) that was never merged into `dev`. `dashboard/testing` already represents the fully-integrated result of merging backend + frontend + fixing up the tests (see its own history: it merged `dashboard/backend`, then `dashboard/frontend`, then a fixup commit). `dev` currently lacks all of this.

**Files:** None created — this is a branch integration step.

- [ ] **Step 1: Rebase `dashboard/testing` onto `dev`**

```bash
git checkout dashboard/testing
git rebase dev
```

Expected: rebase completes cleanly. `dashboard/testing`'s unique commits only touch `app/api/stories/**`, `app/api/chapters/**`, `components/dashboard/**`, `types/dashboard.ts`, and `__tests__/dashboard/**` — files `dev` has not independently modified — so no conflicts are expected. If a conflict does appear, resolve it by keeping `dashboard/testing`'s version for dashboard-specific files and `dev`'s version for anything outside the dashboard feature area (e.g. `.claude/agents/*.md`), then `git rebase --continue`.

- [ ] **Step 2: Merge the rebased branch into `dev`**

```bash
git checkout dev
git merge dashboard/testing --no-ff -m "merge(dashboard): bring dashboard/testing (backend+frontend+tests) into dev"
```

- [ ] **Step 3: Verify the merged `dev` branch**

```bash
pnpm install
pnpm lint
pnpm test:run
pnpm build
```

Expected: all four commands exit 0. If `pnpm build` fails on an unrelated pre-existing issue, note it but do not fix it as part of this task — only fix build failures caused by the merge itself.

- [ ] **Step 4: Stop before pushing**

Do **not** run `git push` on `dev`. Confirm with the user before pushing this merge to `origin/dev`, since `dev` is a shared integration branch.

---

### Task 2: Reset the dashboard/\* branches and prepare worktrees for the new feature

**Context:** With the prior iteration now merged into `dev`, the `dashboard/all`, `dashboard/backend`, `dashboard/frontend`, `dashboard/testing` branch names are free to be reused for the new sort/pin/search feature, starting from the updated `dev` tip.

**Files:** None created — branch and worktree setup.

- [ ] **Step 1: Reset the four branches to the new `dev` tip**

```bash
git branch -f dashboard/all dev
git branch -f dashboard/backend dev
git branch -f dashboard/frontend dev
```

(`dashboard/testing` is reset later, in Phase 3, once `dashboard/all` has backend + frontend merged into it — leave it pointed at its current commit for now.)

- [ ] **Step 2: Create worktrees for the backend and frontend roles**

```bash
git worktree add .claude/worktrees/dashboard-backend dashboard/backend
git worktree add .claude/worktrees/dashboard-frontend dashboard/frontend
```

- [ ] **Step 3: Copy local environment config and install dependencies in each worktree**

```bash
cp .env.local .claude/worktrees/dashboard-backend/.env.local
cp .env.local .claude/worktrees/dashboard-frontend/.env.local

(cd .claude/worktrees/dashboard-backend && pnpm install)
(cd .claude/worktrees/dashboard-frontend && pnpm install)
```

Expected: both `pnpm install` runs exit 0 with no lockfile changes (no new dependencies are introduced by this feature).

- [ ] **Step 4: Verify both worktrees build**

```bash
(cd .claude/worktrees/dashboard-backend && pnpm lint)
(cd .claude/worktrees/dashboard-frontend && pnpm lint)
```

Expected: both exit 0 (identical to `dev`'s state, since neither branch has diverged yet).

---

## Phase 1 — Backend (`rewrite-backend` agent, worktree `.claude/worktrees/dashboard-backend`, branch `dashboard/backend`)

### Task 3: Add `pinned` and `lastAccessedAt` to the Story data model

**Files:**
- Modify: `prisma/schema.prisma:23-31`
- Modify: `types/dashboard.ts`

**Interfaces:**
- Produces: `Story.pinned: boolean`, `Story.lastAccessedAt: DateTime` (Prisma) and `Story.pinned: boolean`, `Story.lastAccessedAt: string` (the `types/dashboard.ts` client type consumed by every dashboard component).

- [ ] **Step 1: Edit the Prisma schema**

In `prisma/schema.prisma`, replace the `Story` model:

```prisma
model Story {
  id        String    @id @default(uuid())
  title     String
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  chapters  Chapter[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

with:

```prisma
model Story {
  id             String    @id @default(uuid())
  title          String
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  chapters       Chapter[]
  pinned         Boolean   @default(false)
  lastAccessedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

- [ ] **Step 2: Regenerate the Prisma client**

```bash
pnpm prisma:generate
```

Expected: exits 0.

- [ ] **Step 3: Verify the generated types include the new fields**

```bash
grep -c "pinned" node_modules/.prisma/client/index.d.ts
```

Expected: a non-zero count.

- [ ] **Step 4: Update the client-side `Story` type**

In `types/dashboard.ts`, replace:

```ts
export type Story = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};
```

with:

```ts
export type Story = {
  id: string;
  title: string;
  userId: string;
  pinned: boolean;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exits 0. (This will show errors in `components/dashboard/*` files that construct or expect a `Story` without the new fields — that's expected and resolved in Phase 2; do not fix frontend files from this task.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma types/dashboard.ts
git commit -m "$(cat <<'EOF'
feat(db): add pinned and lastAccessedAt fields to Story

Backs dashboard pin-to-top and recent-access sorting. Requires
`pnpm prisma:push` to apply to the database — not run automatically.
EOF
)"
```

---

### Task 4: Extend `PATCH /api/stories/[id]` for partial updates and bump `lastAccessedAt` on `GET`

**Files:**
- Modify: `app/api/stories/[id]/route.ts:40-44` (GET), `app/api/stories/[id]/route.ts:66-86` (PATCH)

**Interfaces:**
- Consumes: `prisma.story.update`, `prisma.$transaction` (existing Prisma client).
- Produces: `PATCH /api/stories/[id]` now accepts `{ title?: string, pinned?: boolean }` (at least one required) and returns `{ data: Story }`; `GET /api/stories/[id]` has the side effect of bumping `lastAccessedAt` for the fetched story.

- [ ] **Step 1: Add the recency bump to `GET`**

In `app/api/stories/[id]/route.ts`, replace:

```ts
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ data: story });
  } catch (error) {
    console.error("Error fetching story:", error);
```

with:

```ts
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    try {
      await prisma.story.update({
        where: { id },
        data: { lastAccessedAt: new Date() },
      });
    } catch (accessError) {
      console.error("Error bumping lastAccessedAt:", accessError);
    }

    return NextResponse.json({ data: story });
  } catch (error) {
    console.error("Error fetching story:", error);
```

(Only the first occurrence — inside `GET` — changes. Leave the `PATCH` and `DELETE` handlers' matching `catch` blocks alone for now.)

- [ ] **Step 2: Extend the `PATCH` handler's validation and update call**

Replace:

```ts
    const { title } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const story = await prisma.$transaction(async (tx) => {
      const existing = await tx.story.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existing) return null;

      return tx.story.update({
        where: { id },
        data: { title: title.trim() },
      });
    });
```

with:

```ts
    const body = await request.json();
    const { title, pinned } = body as { title?: unknown; pinned?: unknown };

    if (title === undefined && pinned === undefined) {
      return NextResponse.json(
        { error: "At least one of title or pinned is required" },
        { status: 400 }
      );
    }

    const data: { title?: string; pinned?: boolean } = {};

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

    const story = await prisma.$transaction(async (tx) => {
      const existing = await tx.story.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existing) return null;

      return tx.story.update({
        where: { id },
        data,
      });
    });
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/api/stories/\[id\]/route.ts
git commit -m "$(cat <<'EOF'
feat(api): support partial pinned/title updates, bump lastAccessedAt on GET

PATCH /api/stories/[id] now accepts { title?, pinned? } (at least one
required) instead of requiring title. GET bumps the fetched story's
lastAccessedAt as a best-effort side effect for recency sorting.
EOF
)"
```

---

### Task 5: Bump `lastAccessedAt` when a chapter is opened directly in the editor

**Files:**
- Modify: `app/editor/[chapterId]/page.tsx:30-34`

**Interfaces:**
- Consumes: `chapter.storyId` (from the existing `prisma.chapter.findFirst` call in this file).

- [ ] **Step 1: Add the recency bump before rendering**

In `app/editor/[chapterId]/page.tsx`, replace:

```ts
  if (!chapter) {
    redirect("/dashboard");
  }

  return <EditorPageContent chapter={chapter} />;
}
```

with:

```ts
  if (!chapter) {
    redirect("/dashboard");
  }

  try {
    await prisma.story.update({
      where: { id: chapter.storyId },
      data: { lastAccessedAt: new Date() },
    });
  } catch (accessError) {
    console.error("Error bumping lastAccessedAt:", accessError);
  }

  return <EditorPageContent chapter={chapter} />;
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/editor/\[chapterId\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(editor): bump story lastAccessedAt when a chapter is opened directly

Ensures chapters opened straight from dashboard search still count as
a story access for recency sorting, matching the chapter-select path.
EOF
)"
```

This is the last backend task. Push `dashboard/backend` when ready for Phase 3's merge:

```bash
git push -u origin dashboard/backend
```

---

## Phase 2 — Frontend (`rewrite-frontend` agent, worktree `.claude/worktrees/dashboard-frontend`, branch `dashboard/frontend`, runs in parallel with Phase 1)

### Task 6: Create the `sortStories` / `searchStories` utility module

**Files:**
- Create: `lib/dashboard/sort-search.ts`

**Interfaces:**
- Produces:
  - `type SortCriterion = "alphabetical" | "length" | "recent"`
  - `type SearchFilterMode = "best" | "story" | "chapter"`
  - `type SearchResult = { type: "story"; story: Story } | { type: "chapter"; story: Story; chapter: Story["chapters"][number] }`
  - `sortStories(stories: Story[], criterion: SortCriterion): Story[]`
  - `searchStories(stories: Story[], query: string, filterMode: SearchFilterMode): SearchResult[]`
- Consumes: `Story` type from `@/types/dashboard` (produced by Task 3 — if working before Task 3 lands, use the field names `pinned: boolean` and `lastAccessedAt: string` directly; they are the agreed contract).

- [ ] **Step 1: Write the utility module**

Create `lib/dashboard/sort-search.ts`:

```ts
import type { Story } from "@/types/dashboard";

export type SortCriterion = "alphabetical" | "length" | "recent";
export type SearchFilterMode = "best" | "story" | "chapter";

export type SearchResult =
  | { type: "story"; story: Story }
  | { type: "chapter"; story: Story; chapter: Story["chapters"][number] };

function totalWordCount(story: Story): number {
  return story.chapters.reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0);
}

function compareByCriterion(a: Story, b: Story, criterion: SortCriterion): number {
  switch (criterion) {
    case "alphabetical":
      return a.title.localeCompare(b.title);
    case "length":
      return totalWordCount(b) - totalWordCount(a);
    case "recent":
      return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
  }
}

export function sortStories(stories: Story[], criterion: SortCriterion): Story[] {
  const pinned = stories.filter((s) => s.pinned).sort((a, b) => compareByCriterion(a, b, criterion));
  const unpinned = stories.filter((s) => !s.pinned).sort((a, b) => compareByCriterion(a, b, criterion));
  return [...pinned, ...unpinned];
}

type MatchTier = 0 | 1 | 2;

function matchTier(text: string, query: string): MatchTier | null {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (normalizedText === normalizedQuery) return 0;
  if (normalizedText.startsWith(normalizedQuery)) return 1;
  if (normalizedText.includes(normalizedQuery)) return 2;
  return null;
}

export function searchStories(
  stories: Story[],
  query: string,
  filterMode: SearchFilterMode
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const results: { result: SearchResult; tier: MatchTier }[] = [];

  for (const story of stories) {
    if (filterMode === "best" || filterMode === "story") {
      const tier = matchTier(story.title, trimmed);
      if (tier !== null) {
        results.push({ result: { type: "story", story }, tier });
      }
    }

    if (filterMode === "best" || filterMode === "chapter") {
      for (const chapter of story.chapters) {
        const tier = matchTier(chapter.title, trimmed);
        if (tier !== null) {
          results.push({ result: { type: "chapter", story, chapter }, tier });
        }
      }
    }
  }

  return results
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      const aTitle = a.result.type === "story" ? a.result.story.title : a.result.chapter.title;
      const bTitle = b.result.type === "story" ? b.result.story.title : b.result.chapter.title;
      return aTitle.localeCompare(bTitle);
    })
    .map((r) => r.result);
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exits 0. (If `types/dashboard.ts` doesn't yet have `pinned`/`lastAccessedAt` because Task 3 hasn't merged in yet, this will show a type error on `s.pinned` / `story.lastAccessedAt` — that's expected in parallel development; re-run once Phase 3 merges backend and frontend together, and fix at that point if still failing.)

- [ ] **Step 3: Manually trace three examples to sanity-check the logic**

Run a throwaway check (delete the script afterward, do not commit it):

```bash
npx tsx -e '
import { sortStories, searchStories } from "./lib/dashboard/sort-search";
const mk = (o: any) => ({ id: o.id, title: o.title, userId: "u", pinned: o.pinned ?? false, lastAccessedAt: o.lastAccessedAt ?? new Date().toISOString(), createdAt: "", updatedAt: "", chapters: o.chapters ?? [] });
console.log(sortStories([mk({id:"b",title:"Banana"}), mk({id:"a",title:"Apple",pinned:true})], "alphabetical").map(s=>s.id));
console.log(searchStories([mk({id:"1",title:"Great Escape",chapters:[{id:"c1",title:"The Great Chapter",order:1,wordCount:0,storyId:"1",createdAt:"",updatedAt:""}]})], "great", "best"));
'
```

Expected first line: `[ "a", "b" ]` (pinned first). Expected second line: both the story and the chapter as matches (best mode, `Great` matches both).

- [ ] **Step 4: Commit**

```bash
git add lib/dashboard/sort-search.ts
git commit -m "$(cat <<'EOF'
feat(dashboard): add sortStories/searchStories client-side utilities

Pure functions consumed by DashboardContent: pinned-first sorting by
alphabetical/length/recent, and tiered (exact > starts-with > contains)
search across story and chapter titles.
EOF
)"
```

---

### Task 7: Create the `ChapterResultTile` component

**Files:**
- Create: `components/dashboard/ChapterResultTile.tsx`

**Interfaces:**
- Consumes: `Story`, `Story["chapters"][number]` from `@/types/dashboard`.
- Produces: `ChapterResultTile({ chapter, story }: { chapter: Story["chapters"][number]; story: Story })` — a link to `/editor/{chapter.id}`.

- [ ] **Step 1: Write the component**

Create `components/dashboard/ChapterResultTile.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { Story } from "@/types/dashboard";

interface ChapterResultTileProps {
  chapter: Story["chapters"][number];
  story: Story;
}

export function ChapterResultTile({ chapter, story }: ChapterResultTileProps) {
  return (
    <Link href={`/editor/${chapter.id}`} className="block">
      <div
        className="rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
        style={{ backgroundColor: "var(--dark-green)" }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: "var(--green-highlight)" }} />
        <div className="flex flex-col flex-1 p-6 gap-2">
          <h3
            className="font-display text-[28px] leading-tight"
            style={{ color: "var(--light-gray)" }}
          >
            {chapter.title}
          </h3>
          <p className="font-display text-[16px]" style={{ color: "var(--aqua)", opacity: 0.8 }}>
            from {story.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ChapterResultTile.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): add ChapterResultTile for chapter search results

Links directly to /editor/[chapterId], distinct accent color from
StoryCard so chapter hits are visually distinguishable in search.
EOF
)"
```

---

### Task 8: Add a pin toggle to `StoryCard`

**Files:**
- Modify: `components/dashboard/StoryCard.tsx`

**Interfaces:**
- Consumes: `PATCH /api/stories/[id]` with body `{ pinned: boolean }` (Task 4's contract).
- Produces: a pin/unpin icon button in `StoryCard`, `aria-label` of `"Pin story"` / `"Unpin story"`.

- [ ] **Step 1: Add the pin mutation and button**

In `components/dashboard/StoryCard.tsx`, change the import line:

```tsx
import { Trash2 } from "lucide-react";
```

to:

```tsx
import { Pin, Trash2 } from "lucide-react";
```

Add a second mutation right after the existing `deleteMutation`:

```tsx
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
```

In the title row, add the pin button immediately before the existing `<AlertDialog>` trash button:

```tsx
            <button
              onClick={(e) => {
                e.preventDefault();
                pinMutation.mutate();
              }}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 mt-1"
              style={{ color: story.pinned ? "var(--aqua)" : "var(--light-gray)", opacity: story.pinned ? 1 : 0.5 }}
              aria-label={story.pinned ? "Unpin story" : "Pin story"}
            >
              <Pin className="h-4 w-4" fill={story.pinned ? "currentColor" : "none"} />
            </button>
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/StoryCard.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): add pin toggle button to StoryCard

Calls PATCH /api/stories/[id] with { pinned }, invalidates the
stories query on success — same mutate+invalidate pattern as delete.
EOF
)"
```

---

### Task 9: Wire sort control, search bar, and search results into `DashboardContent`

**Files:**
- Modify: `components/dashboard/DashboardContent.tsx`

**Interfaces:**
- Consumes: `sortStories`, `searchStories`, `SortCriterion`, `SearchFilterMode` from `@/lib/dashboard/sort-search` (Task 6); `ChapterResultTile` from `@/components/dashboard/ChapterResultTile` (Task 7); `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` from `@/components/ui/select`; `Input` from `@/components/ui/input`.

- [ ] **Step 1: Replace the full file**

Replace the entire contents of `components/dashboard/DashboardContent.tsx` with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { StoryCard } from "@/components/dashboard/StoryCard";
import { ChapterResultTile } from "@/components/dashboard/ChapterResultTile";
import { CreateStoryDialog } from "@/components/dashboard/CreateStoryDialog";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sortStories,
  searchStories,
  type SortCriterion,
  type SearchFilterMode,
} from "@/lib/dashboard/sort-search";
import { Upload, LogOut, Plus, Search } from "lucide-react";
import type { Story } from "@/types/dashboard";

async function fetchStories(): Promise<Story[]> {
  const res = await fetch("/api/stories");
  if (!res.ok) throw new Error("Failed to fetch stories");
  const json = await res.json();
  return json.data;
}

export function DashboardContent() {
  const { signOut } = useClerk();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<SearchFilterMode>("best");

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
  });

  const isSearching = searchQuery.trim().length > 0;

  const displayedStories = useMemo(
    () => sortStories(stories, sortCriterion),
    [stories, sortCriterion]
  );

  const searchResults = useMemo(
    () => searchStories(stories, searchQuery, filterMode),
    [stories, searchQuery, filterMode]
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--dark-mint-green)" }} />
        <img
          src="/images/forest_bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
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

          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--dark-green-highlight)" }}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] transition-opacity hover:opacity-80"
            style={{ color: "var(--light-gray)" }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 px-12 py-10">
          {/* Page heading */}
          <div className="fade-up mb-10 flex items-end justify-between">
            <div>
              <p className="font-display text-[20px] mb-1" style={{ color: "var(--aqua)" }}>
                Hello, Author,
              </p>
              <h2 className="font-display text-[56px] leading-none" style={{ color: "var(--light-gray)" }}>
                Your Stories
              </h2>
            </div>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 rounded-[30px] px-6 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--green-highlight)" }}
            >
              <Plus className="h-5 w-5" />
              New Story
            </button>
          </div>

          {/* Controls: search + filter + sort */}
          <div className="fade-up mb-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
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
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="font-display text-[20px]" style={{ color: "var(--light-gray)", opacity: 0.5 }}>
                Loading...
              </p>
            </div>
          ) : isSearching ? (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                  No matches for &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="fade-up fade-up-delay-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.map((result) =>
                  result.type === "story" ? (
                    <StoryCard key={`story-${result.story.id}`} story={result.story} />
                  ) : (
                    <ChapterResultTile
                      key={`chapter-${result.chapter.id}`}
                      chapter={result.chapter}
                      story={result.story}
                    />
                  )
                )}
              </div>
            )
          ) : displayedStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                You don&apos;t have any stories yet.
              </p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="rounded-[30px] px-8 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--green-highlight)" }}
              >
                Create Your First Story
              </button>
            </div>
          ) : (
            <div className="fade-up fade-up-delay-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateStoryDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <ImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/DashboardContent.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): add sort control and story/chapter search bar

Sort defaults to Recent. Search replaces the tile grid with ranked
results when a query is present; chapter matches render as
ChapterResultTile linking directly to /editor/[chapterId].
EOF
)"
```

Push `dashboard/frontend` when ready for Phase 3's merge:

```bash
git push -u origin dashboard/frontend
```

---

## Phase 3 — Orchestrator: merge backend + frontend into `dashboard/all`

### Task 10: Merge and verify

**Files:** None created — integration step.

- [ ] **Step 1: Merge both branches into `dashboard/all`**

```bash
git checkout dashboard/all
git merge dashboard/backend --no-ff -m "merge(dashboard): bring dashboard/backend into dashboard/all"
git merge dashboard/frontend --no-ff -m "merge(dashboard): bring dashboard/frontend into dashboard/all"
```

Expected: no conflicts (backend touched `prisma/schema.prisma`, `types/dashboard.ts`, `app/api/stories/[id]/route.ts`, `app/editor/[chapterId]/page.tsx`; frontend touched `lib/dashboard/sort-search.ts`, `components/dashboard/ChapterResultTile.tsx`, `components/dashboard/StoryCard.tsx`, `components/dashboard/DashboardContent.tsx` — disjoint except both edit `types/dashboard.ts`-consuming code, not the file itself).

- [ ] **Step 2: Regenerate Prisma client and verify**

```bash
pnpm install
pnpm prisma:generate
npx tsc --noEmit
pnpm lint
pnpm build
```

Expected: all exit 0. If `tsc` now fails on `lib/dashboard/sort-search.ts` (the parallel-development caveat from Task 6, Step 2), fix it directly here — the fields now exist.

- [ ] **Step 3: Create the worktree and branch for testing, based on `dashboard/all`**

```bash
git branch -f dashboard/testing dashboard/all
git worktree add .claude/worktrees/dashboard-testing dashboard/testing
cp .env.local .claude/worktrees/dashboard-testing/.env.local
(cd .claude/worktrees/dashboard-testing && pnpm install)
```

---

## Phase 4 — Testing (`rewrite-testing` agent, worktree `.claude/worktrees/dashboard-testing`, branch `dashboard/testing`)

### Task 11: Unit tests for `sortStories` / `searchStories`

**Files:**
- Create: `__tests__/dashboard/lib/sort-search.test.ts`

- [ ] **Step 1: Write the test file**

Create `__tests__/dashboard/lib/sort-search.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests**

```bash
pnpm vitest run __tests__/dashboard/lib/sort-search.test.ts
```

Expected: all tests pass. If any fail, they indicate a real mismatch between the implementation and the approved spec — report it, do not alter the implementation from this task (per the testing agent's rules, source fixes belong to backend/frontend).

- [ ] **Step 3: Commit**

```bash
git add __tests__/dashboard/lib/sort-search.test.ts
git commit -m "test(dashboard): unit tests for sortStories/searchStories"
```

---

### Task 12: Pin toggle tests for `StoryCard`

**Files:**
- Modify: `__tests__/dashboard/components/StoryCard.test.tsx`

- [ ] **Step 1: Update the local `makeStory` factory**

In `__tests__/dashboard/components/StoryCard.test.tsx`, replace:

```ts
const makeStory = (overrides: Record<string, unknown> = {}) => ({
  id: 'story-1',
  title: 'My Great Story',
  userId: 'test-user-id',
  chapters: [],
  createdAt: new Date('2024-01-15').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
  ...overrides,
})
```

with:

```ts
const makeStory = (overrides: Record<string, unknown> = {}) => ({
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
```

- [ ] **Step 2: Add pin toggle tests**

Add this `describe` block at the end of the file, before the final closing (i.e. as a sibling to the existing `describe('StoryCard', ...)` block):

```ts
describe('StoryCard pin toggle', () => {
  it('renders a pin toggle button', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: /pin story/i })).toBeInTheDocument()
  })

  it('shows "Unpin story" label when the story is pinned', () => {
    render(<StoryCard story={makeStory({ pinned: true })} />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: /unpin story/i })).toBeInTheDocument()
  })

  it('calls PATCH /api/stories/[id] with pinned: true when pinning an unpinned story', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: false })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /pin story/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ pinned: true }),
        })
      )
    })
  })

  it('calls PATCH /api/stories/[id] with pinned: false when unpinning a pinned story', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: true })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /unpin story/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ pinned: false }),
        })
      )
    })
  })
})
```

- [ ] **Step 3: Run the tests**

```bash
pnpm vitest run __tests__/dashboard/components/StoryCard.test.tsx
```

Expected: all tests pass (existing delete tests plus the four new pin tests).

- [ ] **Step 4: Commit**

```bash
git add __tests__/dashboard/components/StoryCard.test.tsx
git commit -m "test(dashboard): pin toggle tests for StoryCard"
```

---

### Task 13: Search/sort tests for `DashboardContent`

**Files:**
- Create: `__tests__/dashboard/components/DashboardContent.test.tsx`

- [ ] **Step 1: Write the test file**

Create `__tests__/dashboard/components/DashboardContent.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/dashboard/CreateStoryDialog', () => ({
  CreateStoryDialog: () => null,
}))

vi.mock('@/components/dashboard/ImportDialog', () => ({
  ImportDialog: () => null,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const STORIES = [
  {
    id: 'story-1',
    title: 'The Great Adventure',
    userId: 'user-1',
    pinned: false,
    lastAccessedAt: new Date('2024-01-01').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    chapters: [
      {
        id: 'chapter-1',
        title: 'The Escape',
        order: 1,
        wordCount: 100,
        storyId: 'story-1',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString(),
      },
    ],
  },
  {
    id: 'story-2',
    title: 'Quiet Mountains',
    userId: 'user-1',
    pinned: false,
    lastAccessedAt: new Date('2024-02-01').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    chapters: [],
  },
]

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: STORIES }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DashboardContent search', () => {
  it('renders both stories when there is no search query', async () => {
    render(<DashboardContent />, { wrapper: createWrapper() })
    expect(await screen.findByText('The Great Adventure')).toBeInTheDocument()
    expect(screen.getByText('Quiet Mountains')).toBeInTheDocument()
  })

  it('renders a chapter result tile linking to the editor when a chapter title matches', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.type(screen.getByLabelText('Search stories and chapters'), 'escape')

    const link = await screen.findByRole('link', { name: /the escape/i })
    expect(link).toHaveAttribute('href', '/editor/chapter-1')
  })

  it('shows a no-matches message when nothing matches the query', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.type(screen.getByLabelText('Search stories and chapters'), 'nonexistent')

    expect(await screen.findByText(/no matches for/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
pnpm vitest run __tests__/dashboard/components/DashboardContent.test.tsx
```

Expected: all three tests pass. If the chapter-link test fails because Testing Library can't resolve an accessible name, check that `ChapterResultTile`'s chapter title text is inside the `<Link>` (it is, per Task 7) — do not change the test's intent to work around a source bug; report instead.

- [ ] **Step 3: Commit**

```bash
git add __tests__/dashboard/components/DashboardContent.test.tsx
git commit -m "test(dashboard): search and chapter-result rendering tests for DashboardContent"
```

---

### Task 14: API tests for the extended `PATCH /api/stories/[id]` and the `GET` recency bump

**Files:**
- Modify: `__tests__/dashboard/api/stories-id.test.ts`

- [ ] **Step 1: Add GET recency-bump tests**

Inside the existing `describe('GET /api/stories/[id]', ...)` block, add:

```ts
  it('bumps lastAccessedAt after a successful fetch without blocking the response', async () => {
    const story = makeStory()
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(story)
    mockStoryUpdate.mockResolvedValueOnce({ ...story, lastAccessedAt: new Date().toISOString() })

    const req = new Request('http://localhost/api/stories/story-1')
    const res = await GET(req, { params: makeParams('story-1') })

    expect(res.status).toBe(200)
    expect(mockStoryUpdate).toHaveBeenCalledWith({
      where: { id: 'story-1' },
      data: { lastAccessedAt: expect.any(Date) },
    })
  })

  it('still returns the story when the lastAccessedAt bump fails', async () => {
    const story = makeStory()
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(story)
    mockStoryUpdate.mockRejectedValueOnce(new Error('db unavailable'))

    const req = new Request('http://localhost/api/stories/story-1')
    const res = await GET(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'story-1' })
  })
```

- [ ] **Step 2: Add PATCH pinned-update tests**

Inside the existing `describe('PATCH /api/stories/[id]', ...)` block, add:

```ts
  it('updates pinned via transaction and returns updated story wrapped in { data }', async () => {
    const updated = makeStory({ pinned: true })
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
      body: JSON.stringify({ pinned: true }),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ pinned: true })
  })

  it('returns 400 when neither title nor pinned is provided', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories/story-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('At least one of title or pinned is required')
  })

  it('returns 400 when pinned is not a boolean', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories/story-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: 'yes' }),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Pinned must be a boolean')
  })
```

- [ ] **Step 3: Run the tests**

```bash
pnpm vitest run __tests__/dashboard/api/stories-id.test.ts
```

Expected: all tests pass, including the pre-existing ones (the "Title is required" empty-title test must still pass unmodified — the PATCH implementation from Task 4 preserves that exact message).

- [ ] **Step 4: Commit**

```bash
git add __tests__/dashboard/api/stories-id.test.ts
git commit -m "test(dashboard): pinned-update and lastAccessedAt-bump tests for stories/[id] route"
```

---

### Task 15: Full suite verification and merge back into `dashboard/all`

**Files:** None created — verification and integration step.

- [ ] **Step 1: Run the entire test suite on `dashboard/testing`**

```bash
pnpm lint
pnpm test:run
npx tsc --noEmit
```

Expected: all exit 0.

- [ ] **Step 2: Merge into `dashboard/all` (orchestrator)**

```bash
git checkout dashboard/all
git merge dashboard/testing --no-ff -m "merge(dashboard): bring dashboard/testing into dashboard/all"
pnpm install
pnpm lint
pnpm test:run
pnpm build
```

Expected: all exit 0.

- [ ] **Step 3: Report completion**

`dashboard/all` now has the full sort/pin/search feature: schema migration (not yet pushed to the database — run `pnpm prisma:push` manually when ready), the extended PATCH route, recency bumps, sort/search utilities, `ChapterResultTile`, the `StoryCard` pin toggle, the wired-up `DashboardContent`, and full test coverage. When ready to integrate `dashboard/all` into `dev`, use the `superpowers:finishing-a-development-branch` skill to decide between merge, PR, or further cleanup.

---

## Self-Review Notes

- **Spec coverage:** alphabetical/length/recent sort → Task 6/9; pinning → Task 3, 4, 8; search across story+chapter titles with best/story/chapter filter → Task 6, 9; chapter-title match opens the chapter directly → Task 7, 9; branches/worktrees → Phase 0 and end-of-phase push steps; 90%-usage protocol → already present in each agent's `.md` file, referenced in Global Constraints.
- **Placeholder scan:** none — every step has literal code or literal commands with expected output.
- **Type consistency:** `SortCriterion`, `SearchFilterMode`, `SearchResult` are defined once in Task 6 and consumed with identical names in Tasks 9, 11. `Story.pinned` / `Story.lastAccessedAt` defined in Task 3 and used identically in Tasks 4, 5, 6, 8, 9, 11, 12, 13, 14. `ChapterResultTile({ chapter, story })` prop names match between Task 7's definition and Task 9's usage.
