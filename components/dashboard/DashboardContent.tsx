"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { StoryCard } from "@/components/dashboard/StoryCard";
import { CreateStoryDialog } from "@/components/dashboard/CreateStoryDialog";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import { Upload, LogOut, Plus } from "lucide-react";
import type { Story, Chapter } from "@prisma/client";

type StoryWithChapters = Story & { chapters: Chapter[] };

interface DashboardContentProps {
  stories: StoryWithChapters[];
}

export function DashboardContent({ stories: initialStories }: DashboardContentProps) {
  const { signOut } = useClerk();
  const [stories, setStories] = useState(initialStories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleStoryCreated = (newStory: StoryWithChapters) => {
    setStories([newStory, ...stories]);
    setIsCreateDialogOpen(false);
  };

  const handleStoryDeleted = (storyId: string) => {
    setStories(stories.filter((s) => s.id !== storyId));
  };

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
          {/* Logo */}
          <div className="flex items-center justify-center h-full px-[10px] shrink-0">
            <span className="font-display leading-none" style={{ fontSize: "48px", color: "var(--aqua)" }}>
              Re:
            </span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
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

          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                You don't have any stories yet.
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
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} onDelete={handleStoryDeleted} />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateStoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onStoryCreated={handleStoryCreated}
      />
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}
