# Dashboard: Sorting, Pinning, and Search — Design

## Context

`app/dashboard/page.tsx` and `app/dashboard/stories/[storyId]/page.tsx` (chapter-select)
already exist on `dev` with basic functionality: story tiles, create/delete/import for
stories, create/delete for chapters. Neither page has sorting, pinning, or search. This
spec covers adding those to the dashboard (story-tile) page only. The chapter-select page
is left structurally as-is — it keeps its existing chapter list ordered by `order` — except
where it's a landing target for a chapter opened directly from search.

## Goals

- Sort story tiles by alphabetical title, total length (words), or recent access.
- Let the user pin stories so they always appear above unpinned ones.
- Search across both story titles and chapter titles, with a filter to scope the search
  to best-match / story-title-only / chapter-title-only.
- Clicking a chapter-title search result opens that chapter directly in the editor,
  bypassing the chapter-select page.

## Data model

Add to `Story` in `prisma/schema.prisma`:

```prisma
model Story {
  // ...existing fields
  pinned         Boolean   @default(false)
  lastAccessedAt DateTime  @default(now())
}
```

No new tables. Pinning is a boolean partition: pinned stories always render before
unpinned ones; the active sort criterion applies independently within each partition.
No separate "pin order" field is needed.

`lastAccessedAt` updates whenever a story is opened — either by navigating into
chapter-select, or by opening one of its chapters directly from a search result.

## Backend

- **Extend** `PATCH /api/stories/[id]` (`app/api/stories/[id]/route.ts`) to accept a
  partial body: `{ title? : string, pinned? : boolean }`. At least one field must be
  present; validate types per field if present. Reuses the existing ownership-scoped
  `updateMany` (`{ id, userId }`) and 404 handling — no new route.
- **Recency bump, no new endpoint.** Both `app/dashboard/stories/[storyId]/page.tsx`
  and `app/editor/[chapterId]/page.tsx` are server components that already fetch their
  data directly via Prisma. Immediately after each existing fetch succeeds, add a
  `prisma.story.update({ where: { id: <storyId> }, data: { lastAccessedAt: new Date() } })`
  call for the relevant story (for the editor page, `chapter.storyId`). Wrap in
  try/catch — a failed recency bump must never block page render; the already-fetched
  story/chapter data still renders.
- **No new search endpoint.** The dashboard page already loads all of the user's
  stories with their chapters (id, title, order, wordCount) in one query. Search and
  sort run entirely client-side over that data — the per-user dataset is small, and
  this avoids added round-trips.

## Frontend

- `DashboardContent` gains:
  - A sort control: Alphabetical / Length / Recent, default Recent.
  - A search bar with a filter dropdown: Best match / Story title / Chapter title.
- New pure utility module, e.g. `lib/dashboard/sort-search.ts`:
  - `sortStories(stories, criterion)` — partitions pinned/unpinned; sorts each partition
    by `title.localeCompare()` (alphabetical), summed chapter `wordCount` descending
    (length), or `lastAccessedAt` descending (recent); concatenates pinned then unpinned.
  - `searchStories(stories, query, filterMode)` — case-insensitive substring matching,
    no fuzzy matching. Ranks by tier: exact match > starts-with > contains. Returns a
    discriminated union: `{ type: 'story', story }` or
    `{ type: 'chapter', chapter, story }` (parent story attached for display/link).
    `filterMode` restricts which field(s) are matched; `'best'` checks both titles and
    ranks all hits together by tier.
- When the search query is non-empty, the tile grid renders search results instead of
  the normal sorted story list: `{type: 'story'}` results render the existing
  `StoryCard`; `{type: 'chapter'}` results render a new `ChapterResultTile` (chapter
  title + parent story name) linking directly to `/editor/[chapterId]`. Empty results
  show a "No matches for '<query>'" message.
- `StoryCard` gains a pin toggle icon button. Toggling calls the extended PATCH and
  optimistically flips local state (lifted in `DashboardContent`, same pattern as the
  existing delete handler), reverting the optimistic change on request failure.
- All new UI must follow the `rewrite-design` skill's tokens (colors, `font-display`,
  existing card/pill/border conventions) — the `rewrite-frontend` agent invokes that
  skill itself before any visual decision, per its own instructions.

## Testing

- Unit tests for `sortStories` / `searchStories`: all three sort criteria, pinned
  partitioning behavior, all three filter modes, tier ranking, and best-match
  resolution across story vs. chapter hits.
- Component tests: pin toggle updates UI and fires the PATCH call (and reverts on
  failure); searching by a chapter title renders a `ChapterResultTile` with the
  correct `/editor/[chapterId]` href.
- API test: `PATCH /api/stories/[id]` accepts a `pinned`-only body, rejects an empty
  body, and enforces ownership — following existing Vitest conventions in `__tests__/`.

## Branches / worktrees

- `dashboard/all`, `dashboard/backend`, `dashboard/frontend`, `dashboard/testing`
  already exist but are far behind `dev` (which now contains all merged login/auth/UI
  work via PR #2). Rebase all four onto `dev`'s current tip before starting.
- `rewrite-backend` and `rewrite-frontend` agents work in parallel, each in its own git
  worktree on `dashboard/backend` / `dashboard/frontend` respectively. No file overlap:
  backend only adds the recency-bump call to the two server `page.tsx` files; frontend
  only touches the client `*Content` components, `StoryCard`, and new UI/utility files.
- Once both merge into `dashboard/all`, `rewrite-testing` works in a worktree on
  `dashboard/testing` against the merged result, then merges its tests back into
  `dashboard/all` — mirroring how `login/all`'s history was assembled.
- All three agents follow the Session Limit & Continuity Protocol already defined in
  their agent files / root `CLAUDE.md`: on approaching 90% context usage, finish the
  current task, halt new work, and produce a status report before timing out.
