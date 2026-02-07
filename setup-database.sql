-- Re:Write Database Schema
-- Run this SQL in your Supabase SQL Editor or PostgreSQL client

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create Story table
CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Chapter table
CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "storyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Scene table
CREATE TABLE IF NOT EXISTS "Scene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "startPos" INTEGER NOT NULL,
    "endPos" INTEGER NOT NULL,
    "chapterId" TEXT NOT NULL,
    "currentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scene_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create SceneVersion table
CREATE TABLE IF NOT EXISTS "SceneVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" JSONB NOT NULL,
    "sceneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SceneVersion_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ChapterVersion table
CREATE TABLE IF NOT EXISTS "ChapterVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "content" JSONB NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "scenesState" JSONB NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChapterVersion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Story_userId_idx" ON "Story"("userId");
CREATE INDEX IF NOT EXISTS "Chapter_storyId_idx" ON "Chapter"("storyId");
CREATE INDEX IF NOT EXISTS "Scene_chapterId_idx" ON "Scene"("chapterId");
CREATE INDEX IF NOT EXISTS "SceneVersion_sceneId_idx" ON "SceneVersion"("sceneId");
CREATE INDEX IF NOT EXISTS "ChapterVersion_chapterId_idx" ON "ChapterVersion"("chapterId");

