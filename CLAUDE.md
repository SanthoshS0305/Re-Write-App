# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Re:Write** is a web-based collaborative writing application with document version control, scene management, offline support, and import/export functionality.

## Commands

```bash
# Development
npm run dev                  # Start dev server at http://localhost:3000
npm run build                # Production build
npm run lint                 # Run ESLint

# Database
npm run prisma:generate      # Generate Prisma client (required after schema changes)
npm run prisma:push          # Push schema to database (no migration files)
npm run prisma:studio        # Open Prisma GUI
```

No test suite is configured.

## Commit Guidelines

After every major feature implementation, prompt the user to commit with a ready-to-use commit message. Do not run `git commit` directly — the user reviews and commits manually.

**When to prompt:**
- A new page, route, or UI component is complete
- An API route or database operation is implemented
- A hook, utility, or library module is finished
- A bug fix that affects observable behavior is applied
- Any significant refactor that changes how something works

**How to prompt:**
Suggest the commit with a fully written message the user can copy directly:

```
feat(editor): add scene management panel with drag-and-drop reordering

- Added ScenePanel component with collapsible sidebar layout
- Scenes can be reordered via drag-and-drop using @dnd-kit
- Scene titles update live as the editor content changes
- Panel state (open/closed) persisted in localStorage
```

Types: `feat`, `fix`, `refactor`, `style`, `chore`
Scope: the area affected, e.g. `editor`, `auth`, `dashboard`, `offline`, `api`, `db`

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
GOOGLE_CLIENT_ID="..."       # Optional, for OAuth
GOOGLE_CLIENT_SECRET="..."   # Optional
```

## Architecture

### Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** components
- **Tiptap 3** (ProseMirror-based) rich text editor with a custom `SceneExtension`
- **Prisma 7** ORM → PostgreSQL via **Supabase**
- **NextAuth v5** (JWT sessions, Credentials + Google OAuth)
- **TanStack React Query** for async state; **Zustand** for client state
- **IndexedDB** (`idb`) for offline storage

### Data Model
Hierarchical: `User → Story → Chapter → Scene`, with `ChapterVersion` and `SceneVersion` tables for version history. Chapter content is stored as ProseMirror JSON. Cascade deletes flow down the hierarchy.

### Authentication & Authorization
- `lib/auth.ts` — NextAuth config (Credentials + Google providers, bcryptjs hashing)
- `lib/auth-server.ts` — server-side session helper
- `middleware.ts` — guards `/dashboard/*` and `/editor/*` routes
- All API routes verify session ownership before any database operation

### API Routes (`app/api/`)
Pattern: check session → verify ownership → validate inputs → Prisma query → JSON response. Routes exist for `stories/`, `chapters/`, `scenes/`, and `auth/`.

### Editor (`app/editor/[chapterId]/`)
- `lib/editor/tiptap-config.ts` — Tiptap extensions setup
- `lib/editor/scene-plugin.ts` — custom scene extension for scene markup
- `hooks/useAutoSave.ts` — debounced auto-save (30s default) via PATCH `/api/chapters/{id}/autosave`

### Offline Support
- `lib/offline/idb.ts` — IndexedDB schema (stores: stories, chapters, scenes, versions, syncQueue)
- `lib/offline/sync.ts` — conflict detection by timestamp, resolution strategies (local/server/merge)
- `hooks/useOfflineSync.ts` — manages online/offline state and sync coordination

### Custom File Format
`lib/utils/rewr-format.ts` — handles import/export of `.rewr` files (custom format for stories with metadata).

### Providers
`components/providers.tsx` wraps the app with `SessionProvider`, `QueryClientProvider`, and `ThemeProvider` (dark/light mode via `next-themes`).

### Styling
Custom Tailwind color palette: `dark-green`, `mint-green`, `aqua`, `light-gray`, `green-highlight`, `green-lowlight`. Fonts: Inter (body), Joan (display/serif). Dark mode uses class strategy.
