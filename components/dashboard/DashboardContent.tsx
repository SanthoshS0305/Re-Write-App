"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { StoryCard } from "@/components/dashboard/StoryCard";
import { CreateStoryDialog } from "@/components/dashboard/CreateStoryDialog";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { BookOpen, LogOut, Upload } from "lucide-react";
import type { Story } from "@prisma/client";
import type { Chapter } from "@prisma/client";

type StoryWithChapters = Story & {
  chapters: Chapter[];
};

interface DashboardContentProps {
  stories: StoryWithChapters[];
}

export function DashboardContent({ stories: initialStories }: DashboardContentProps) {
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Re:Write</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Your Stories</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              New Story
            </Button>
          </div>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You don't have any stories yet.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={handleStoryDeleted}
              />
            ))}
          </div>
        )}

        <CreateStoryDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onStoryCreated={handleStoryCreated}
        />
        <ImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
        />
      </main>
    </div>
  );
}

