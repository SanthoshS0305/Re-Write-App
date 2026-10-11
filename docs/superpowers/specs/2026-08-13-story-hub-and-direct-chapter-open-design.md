# Story Hub Page + Direct-to-Chapter Dashboard Navigation — Design

## Context

Today, clicking a story tile on the dashboard (`StoryCard`) links to
`app/dashboard/stories/[storyId]/page.tsx`, which renders `StoryDetailContent` →
`ChapterList` — a full-width list of chapter rows (with per-row delete) and a "New
Chapter" button. This is the only place a chapter can be deleted.

This spec keeps that route but changes both its purpose and its audience:

- The dashboard tile no longer opens this page. It opens the story's most recently
  modified chapter directly in the editor (auto-creating a first chapter if the story
  has none).
- The route becomes a **story hub** — description, outline (with chapter references),
  and a narrow chapter list — reachable only via the story-title link that already
  exists in the editor header (`EditorPageContent.tsx`, currently
  `<Link href="/dashboard/stories/${story.id}">`, unchanged).

## Goals

- Remove the extra click between the dashboard and writing: opening a story tile goes
  straight into the editor, on the chapter you last touched.
- Give each story a home for planning material — a free-text description and an
  outline that can reference specific chapters — without losing the existing
  chapter-delete capability.
- No dead ends: a story with zero chapters still opens straight into the editor, on a
  freshly created first chapter.

## Data model

Add to `Story` in `prisma/schema.prisma`:

```prisma
model Story {
  // ...existing fields
  description String?
  outline     Json?
}
```

Both nullable — existing stories have neither. `outline` is a ProseMirror JSON
document, same shape convention as `Chapter.content`; treated as an empty doc
(`{ type: "doc", content: [{ type: "paragraph" }] }`) client-side when `null`.

No new tables. Chapter references inside the outline are **soft references** — the
outline node stores a chapter id (see Frontend), not a foreign key. Deleting a chapter
does not touch the outline; the reference just fails to resolve at render time.

## Backend

- **Extend** `PATCH /api/stories/[id]` (`app/api/stories/[id]/route.ts`) again, adding
  `description?: string` and `outline?: object` to the existing partial-update body
  (which already handles `title` and `pinned`). Same validation shape: if present,
  `description` must be a string (empty string allowed — clearing the field is valid,
  unlike `title`); `outline` must be a JSON object. At least one of the four fields
  must be present, same as today. Reuses the existing ownership-scoped transaction —
  no new route.
- **No new endpoint for chapter-reference resolution.** The story hub page already
  loads the story's full chapter list (id, title, order) for the narrow rail. The
  outline's chapter-mention node resolves against that same in-memory list — if a
  referenced id isn't in it, the node renders as broken/greyed, non-clickable.
- **Chapter auto-create on first open** reuses the existing `POST /api/chapters`
  unchanged (already does ownership check, `order` computation, empty-content
  default) — called from the client when a tile with zero chapters is clicked.

## Frontend

### Dashboard: `StoryCard` navigation

- `lib/dashboard/chapter-nav.ts` (new, pure, unit-tested): `getLastModifiedChapter(story)`
  returns the chapter with the latest `updatedAt`, or `null` if the story has no
  chapters. Ties broken by `order` ascending (lowest/earliest chapter wins), so the
  result is deterministic given identical timestamps.
- `StoryCard` branches on that result:
  - **Has chapters** — the card is a `<Link href={"/editor/" + chapter.id}>` as
    before, just pointed at the resolved chapter instead of the story-hub route.
  - **No chapters** — the card becomes a clickable element (not a `Link`, since the
    destination doesn't exist yet) whose `onClick` fires a mutation calling
    `POST /api/chapters` with a default title ("Chapter 1"), then
    `router.push("/editor/" + newChapter.id)` on success.

### Story hub page (`app/dashboard/stories/[storyId]/page.tsx`, `StoryDetailContent` rewritten)

Layout: narrow chapter list docked left (same visual language as `ChapterList` today,
narrower column, ordered by `order` ascending, same delete-with-confirm action as
today — no rename here, since rename doesn't exist on this page today either; chapter
titles are still only editable from the editor's title pill). The rail keeps a compact
"+ New Chapter" affordance at its top or bottom (reusing the existing
`CreateChapterDialog`) — the dashboard-tile auto-create only covers the *zero-chapter*
case; a story that already has chapters still needs a way to add more, and this page
is the only place that exists now that the old full-width "New Chapter" button's page
is being replaced. Remaining width holds:

- **Description** — plain `<textarea>`, debounce-autosaved via the extended PATCH
  above, same debounce pattern as `useAutoSave` for chapters.
- **Outline** — a lightweight Tiptap instance: `Document`, `Paragraph`, `Text`,
  `Bold`, `Italic`, `BulletList`/`OrderedList`/`ListItem`, `HardBreak`, plus a new
  custom `ChapterReferenceExtension` (same pattern as the existing `SceneExtension` in
  `lib/editor/scene-plugin.ts`) — no heading/blockquote/code/link/underline, no
  formatting toolbar beyond what's needed for the above. Debounce-autosaved via the
  same extended PATCH, storing ProseMirror JSON in `Story.outline`.
  - Typing `@` opens a small popup listing the story's chapters (filterable by typing),
    matching Tiptap's standard mention-suggestion pattern. Selecting one inserts an
    inline node with `{ chapterId, chapterTitle }` attrs — `chapterTitle` is a display
    fallback only; resolution and click-through always check the live chapter list by
    id first.
  - Rendered node: a clickable pill showing the chapter's *current* title (from the
    live list, not the stored snapshot) linking to `/editor/[chapterId]`. If the id
    isn't found in the live list, render greyed-out and non-clickable, using the
    stored snapshot title with a "(deleted)" suffix.
- A single autosave hook watches `{ description, outlineJSON }` and PATCHes whichever
  field(s) are dirty after the debounce window, coalescing both into one request if
  both changed within the window.

## Testing

- `lib/dashboard/chapter-nav.test.ts`: returns the latest-`updatedAt` chapter, `null`
  for an empty list, ties broken by `order` (deterministic).
- `StoryCard` component test: links directly to the last-modified chapter when
  chapters exist; on a zero-chapter story, click creates a chapter then navigates.
- `PATCH /api/stories/[id]` test: accepts `description`/`outline` individually and
  together, empty-string `description` is valid, invalid `outline` type is rejected.
- `ChapterReferenceExtension` test: resolves a valid chapter id to a live title/link;
  renders a missing id as greyed/non-clickable with the stored fallback title.

## Branches / worktrees

New branch off `dashboard/all` (per the user's "new branches" instruction) — this spec
covers one deliverable (story hub + direct-open navigation); the dashboard visual
redesign (sub-project B) is a separate spec and a separate branch.
