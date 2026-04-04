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

## Design System (from Figma: XWFo3TP9n8ofaehzjwWXiH)

### Color Tokens (`app/globals.css`)
| Token | Hex | Usage |
|---|---|---|
| `--dark-green` | `#02353c` | Card/toolbar background |
| `--dark-green-highlight` | `#044c56` | Toolbar buttons, active states |
| `--dark-mint-green` | `#3b4c49` | Auth page background base |
| `--dark-page` | `#3c3c3c` | Dark mode editor canvas |
| `--aqua` | `#3fd0c9` | Logo "Re", accent headings, links |
| `--mint-green` | `#c1f6ed` | Input field backgrounds, light mode bg |
| `--light-gray` | `#f3f3f3` | Body text on dark backgrounds |
| `--green-highlight` | `#34c18a` | Primary action buttons |
| `--green-lowlight` | `#2ca274` | Secondary links |

Logo colon (`:`) is always **black** — not aqua or mint-green.

### Typography
- **Display font**: Joan (serif) — `font-display` / `.joan-regular` class
- **Logo**: 96px Joan — `Re` (aqua) `:` (black) `Write` (light-gray)
- **Welcome heading**: 64px Joan — "Hello, Author," (aqua) + page-specific text (light-gray)
- **Menu/labels**: 24px Joan, white
- **Chapter name pill**: 32px Joan
- **Body/editor text**: 20px Joan

### Screen Layouts

#### Auth Pages (Login & Signup) — `app/login/page.tsx`, `app/signup/page.tsx`
- Full-screen background: `forest_bg.jpg` at 40% opacity over `--dark-mint-green`
- Centered card: `--dark-green` bg, `rounded-[10px]`, shadow, `px-[30px] py-[40px]`
- Input fields: `--mint-green` bg, `3px solid black` border, `rounded-[20px]`, 32px Joan
- Primary button: `--green-highlight` bg, `3px solid black` border, `rounded-[30px]`, 36px Joan
- Signup has First Name + Last Name in a side-by-side row

#### Editor — `app/editor/[chapterId]/page.tsx`
- **Toolbar** (top, full-width, max-h 120px): `--dark-green` bg with drop shadow
  - Left: "Re:" logo (64px Joan, aqua)
  - Chapter name pill: `--mint-green` bg, `rounded-[20px]`, white border
  - File menu bar below: File · Edit · Scenes · Versions (24px Joan, white)
  - Center: primary formatting toolbar in `--dark-green-highlight` pill (`rounded-[30px]`, `p-[20px]`)
  - Right: "Scene Manager" + "Version History" buttons — `--dark-green-highlight`, `rounded-[30px]`, 24px Joan, white text
- **Editor canvas**: centered, `w-[800px]`, shadow
  - Dark mode: `--dark-page` (`#3c3c3c`) bg, white text
  - Light mode: white bg, black text
- **Page background**: forest image visible on left/right of canvas
  - Dark mode: `--dark-mint-green` base + forest at 40% opacity
  - Light mode: `--mint-green` base + forest at 40% opacity

### Background Images
- `public/images/forest_bg.jpg` — used on auth pages and editor background
- `public/images/woman.jpg` — original body background (global CSS fallback)
