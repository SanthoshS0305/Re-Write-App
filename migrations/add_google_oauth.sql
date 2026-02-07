-- Migration: Add Google OAuth support
-- This migration makes password optional and adds image field for OAuth users

-- Step 1: Add the image column (nullable)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Step 2: Make password nullable (for OAuth users who don't have passwords)
-- Note: This will allow NULL values for existing users, but existing users will keep their passwords
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Verify the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'User' AND column_name IN ('password', 'image');

