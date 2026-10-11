-- Enable Row Level Security on all app tables.
--
-- The app accesses data only through Prisma, connecting as the `postgres` role,
-- which owns these tables and has BYPASSRLS, so it is unaffected.
-- With RLS enabled and no policies, Supabase's `anon` and `authenticated` roles
-- (used by the Data API / anon key) are denied all access by default.
--
-- `prisma db push` does not manage RLS: re-run this after adding new tables.
-- Usage: npm run db:rls

BEGIN;

ALTER TABLE public."User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Story"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Chapter"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Scene"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SceneVersion"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChapterVersion" ENABLE ROW LEVEL SECURITY;

COMMIT;
