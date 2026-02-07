"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";
import { ChapterList } from "@/components/dashboard/ChapterList";
import { CreateChapterDialog } from "@/components/dashboard/CreateChapterDialog";
import type { Story } from "@prisma/client";
import type { Chapter } from "@prisma/client";

type StoryWithChapters = Story & {
  chapters: Chapter[];
};

interface StoryDetailContentProps {
  story: StoryWithChapters;
}

export function StoryDetailContent({ story: initialStory }: StoryDetailContentProps) {
  const [story, setStory] = useState(initialStory);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleChapterCreated = (newChapter: Chapter) => {
    setStory({
      ...story,
      chapters: [...story.chapters, newChapter].sort((a, b) => a.order - b.order),
    });
    setIsCreateDialogOpen(false);
  };

  const handleChapterDeleted = (chapterId: string) => {
    setStory({
      ...story,
      chapters: story.chapters.filter((c) => c.id !== chapterId),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{story.title}</h1>
              <p className="text-muted-foreground mt-1">
                {story.chapters.length}{" "}
                {story.chapters.length === 1 ? "chapter" : "chapters"}
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Chapter
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {story.chapters.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              This story doesn't have any chapters yet.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Chapter
            </Button>
          </div>
        ) : (
          <ChapterList
            chapters={story.chapters}
            storyId={story.id}
            onChapterDeleted={handleChapterDeleted}
          />
        )}

        <CreateChapterDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          storyId={story.id}
          onChapterCreated={handleChapterCreated}
        />
      </main>
    </div>
  );
}

