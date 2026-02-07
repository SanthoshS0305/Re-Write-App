# Re:Write

A web-based collaborative writing application with advanced version control features, specifically designed for creative writers who need granular control over their story versions and scene revisions.

## Features

- **Rich Text Editing**: Full-featured editor with formatting (bold, italic, underline, headings, lists, links)
- **Scene Management**: Create scenes from selected text with visual indicators and version control
- **Document Versioning**: Save and restore document versions with diff comparison
- **Offline Support**: Write offline with automatic sync when connection is restored
- **Import/Export**: Export chapters as `.rewr` files and import them back
- **Dark Mode**: Beautiful dark mode support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Editor**: Tiptap 2.1+ (ProseMirror)
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **Authentication**: Auth.js (NextAuth.js v5)
- **State Management**: TanStack Query, Zustand
- **Offline**: IndexedDB via `idb` library
- **Version Control**: diff-match-patch, jsondiffpatch

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- PostgreSQL database (via Supabase)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reWriteApp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-key-here"

# Google OAuth (optional, for Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

**For Google OAuth support (manual database update required):**
If you're adding Google OAuth support, you need to manually update your database schema:

**Option 1: Using Prisma (recommended if it works):**
```bash
npx prisma db push
```

**Option 2: Manual SQL migration:**
If Prisma commands fail, run this SQL directly in your database:
```sql
-- Add image column for OAuth users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Make password nullable (OAuth users don't have passwords)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
```

You can find the complete migration SQL in `migrations/add_google_oauth.sql`.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api              # API routes
  /dashboard        # Dashboard pages
  /editor           # Editor pages
  /login            # Authentication pages
  /signup

/components
  /ui               # shadcn/ui components
  /editor           # Editor components
  /scene-manager    # Scene management UI
  /version-manager  # Version management UI
  /dashboard        # Dashboard components
  /offline          # Offline sync components

/lib
  /db               # Database clients (Prisma, Supabase)
  /offline           # IndexedDB and sync logic
  /editor            # Tiptap configuration
  /utils             # Utility functions

/prisma
  schema.prisma     # Database schema
```

## Usage

### Creating a Story

1. Sign up or log in
2. Click "New Story" on the dashboard
3. Enter a story title

### Creating Chapters

1. Open a story
2. Click "New Chapter"
3. Enter a chapter title
4. Start writing in the editor

### Creating Scenes

1. Select text in the editor
2. Click "Create Scene" button
3. Enter a scene label
4. The scene will be marked with blue corner brackets

### Managing Scene Versions

1. Click "Scene Manager" in the toolbar
2. Select a scene
3. View versions and create new ones
4. Use "Apply Version" to restore a previous version

### Document Versioning

1. Click "Versions" in the toolbar
2. Click "Save Version" to create a snapshot
3. Compare versions side-by-side
4. Restore any previous version

### Export/Import

- **Export**: Click "Export" in the editor toolbar to download a `.rewr` file
- **Import**: Click "Import" on the dashboard and select a `.rewr` file

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:studio` - Open Prisma Studio

### Database Management

- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open database GUI

## License

ISC

