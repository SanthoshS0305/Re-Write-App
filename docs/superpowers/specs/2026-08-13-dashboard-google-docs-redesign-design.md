# Dashboard Redesign (Google Docs-Inspired) — Design

## Context

`DashboardContent` currently has an inline row of controls (search input, filter
dropdown, sort dropdown) squeezed above a 2-column grid of `StoryCard`s. Cards show
title, chapter count, last-updated date, an always-visible pin icon, and an
always-visible delete icon. There's no thumbnail preview, no list view, and no visual
indicator that stands out for "this is pinned" beyond icon color.

This spec pulls four elements from the Google Docs homepage into that page: a
prominent search bar, a grid/list view toggle, per-card thumbnail previews, and a
consolidated "⋮" overflow menu — while keeping the existing search/sort/pin logic
(`lib/dashboard/sort-search.ts`) and Re:Write's visual system (dark-green surfaces,
aqua accents, Joan display font, pill radii, card shadow) unchanged.

## Goals

- Promote search to a full-width row directly below the header: a large mint-green
  pill search bar, the sort dropdown, and a grid/list view toggle — replacing today's
  cramped inline row. Header itself (logo, Import, Sign Out) is unchanged.
- Add a small plain-text thumbnail preview to each card/row, sourced from the story's
  most-recently-modified chapter.
- Add a list view (compact rows) alongside the existing grid view; the choice persists
  in `localStorage` (grid is the default when there's no stored preference).
- Replace the two always-visible pin/delete icons with a single "⋮" overflow menu
  (Pin/Unpin, Delete — same two actions, no new ones). Add a small non-interactive pin
  badge on pinned cards so pin status is still visible at a glance without opening the
  menu.
- Pinned-first ordering is unchanged — `sortStories` already partitions pinned before
  unpinned regardless of criterion; both grid and list render that same sorted array.

## Data model

Add to `Chapter` in `prisma/schema.prisma`:

```prisma
model Chapter {
  // ...existing fields
  previewText String @default("")
}
```

Plain text, capped at a fixed length (e.g. 200 characters), **not** the full
ProseMirror JSON — this is the crux of the design. `GET /api/stories` (the dashboard's
data source) intentionally excludes chapter `content` from its response to keep the
list payload light; reusing that raw content for thumbnails would undo that. A short
precomputed string avoids re-parsing ProseMirror JSON on every dashboard load and
keeps the list endpoint cheap.

## Backend

- `lib/utils/word-count.ts` gains `extractPreviewText(content, maxLength)`, using the
  same node-traversal pattern as `countWords`/`countCharacters` — concatenates text
  nodes in document order, truncates to `maxLength`.
- Everywhere chapter `content` is written, also (re)compute and store `previewText`:
  - `PATCH /api/chapters/[id]/autosave` — alongside the existing `wordCount` update.
  - `POST /api/chapters` — initial value from the (empty) default content, so `""`.
  - Version restore goes through the normal editor → autosave path already, so it's
    covered without a separate code path.
- `CHAPTER_DASHBOARD_SELECT` (shared by `app/api/stories/route.ts`,
  `app/api/stories/[id]/route.ts`, `app/api/chapters/route.ts`) adds
  `previewText: true`. Cheap string field, additive — no existing consumer breaks.

## Frontend

- **Search/sort/view row** (new, below header): mint-green pill search input
  (~480px), sort `Select` (unchanged options), and a grid/list toggle
  (`localStorage`-persisted). Purely visual promotion — `sortStories`/`searchStories`
  call sites and logic are unchanged.
- **Thumbnail source**: reuses `getLastModifiedChapter(story)` from the story-hub spec
  (`lib/dashboard/chapter-nav.ts`) to pick which chapter's `previewText` a card shows.
  This is the one piece of overlap between the two branches — sequence this branch
  after the story-hub branch merges (or duplicate the few-line helper if you'd rather
  keep them fully independent).
- **`StoryCard` (grid)**: adds a small paper-colored rectangle above the title showing
  `previewText` in small Joan text; a small pin-icon badge in a corner when
  `pinned: true` (non-interactive — the toggle stays in the menu); the pin + delete
  icon buttons are replaced by a single "⋮" trigger opening a `DropdownMenu` with
  Pin/Unpin and Delete (Delete keeps its existing confirm-dialog step).
- **New `StoryListRow` component**: compact single-line-per-story equivalent — small
  square thumbnail, title, chapter count, date, same "⋮" menu, same pin badge.
  `DashboardContent` renders `StoryCard` or `StoryListRow` per item depending on the
  active view mode; search-result rendering (`ChapterResultTile` for chapter hits)
  is unaffected by view mode — chapter results keep their current single-list
  presentation regardless of grid/list toggle.

## Testing

- `extractPreviewText`: truncates correctly, handles empty/whitespace-only content,
  strips to plain text across multiple paragraphs/nodes.
- `StoryCard`/`StoryListRow`: pin badge appears only when `pinned: true`; "⋮" menu
  opens and its Pin/Unpin and Delete items fire the same mutations the current icon
  buttons do (existing mutation tests carry over, just retargeted at the new trigger).
- View-toggle persistence: selecting a view writes to `localStorage`; reload restores
  it; default is grid when unset.
- `PATCH /api/chapters/[id]/autosave` test: asserts `previewText` is recomputed and
  saved alongside `wordCount`.

## Branches / worktrees

New branch, separate from the story-hub branch, per the user's "new branches"
instruction. Depends on `getLastModifiedChapter` from that branch for the thumbnail
source chapter — either branch this one off the story-hub branch (or off
`dashboard/all` after that branch merges), or duplicate the small helper here if full
independence is preferred.
