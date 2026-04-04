"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Story, Chapter } from "@prisma/client";

type StoryWithChapters = Story & { chapters: Chapter[] };

interface StoryCardProps {
  story: StoryWithChapters;
  onDelete: (storyId: string) => void;
}

export function StoryCard({ story, onDelete }: StoryCardProps) {
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (response.ok) onDelete(story.id);
    } catch (error) {
      console.error("Failed to delete story:", error);
    }
  };

  const chapterCount = story.chapters.length;
  const lastUpdated = new Date(story.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/dashboard/stories/${story.id}`} className="block">
    <div
      className="rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
      style={{ backgroundColor: "var(--dark-green)" }}
    >
      {/* Card header accent */}
      <div className="h-1 w-full" style={{ backgroundColor: "var(--aqua)" }} />

      <div className="flex flex-col flex-1 p-6 gap-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-display text-[28px] leading-tight"
            style={{ color: "var(--light-gray)" }}
          >
            {story.title}
          </h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 mt-1"
                style={{ color: "var(--light-gray)", opacity: 0.5 }}
                onClick={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-[24px]" style={{ color: "var(--light-gray)" }}>
                  Delete Story
                </AlertDialogTitle>
                <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
                  Are you sure you want to delete &ldquo;{story.title}&rdquo;? This will also delete all
                  chapters. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="font-display rounded-[20px]"
                  style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="font-display rounded-[20px] border-[2px] border-black"
                  style={{ backgroundColor: "#c0392b", color: "white" }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Meta */}
        <div className="flex gap-4 font-display text-[16px]" style={{ color: "var(--aqua)", opacity: 0.8 }}>
          <span>{chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: "var(--light-gray)", opacity: 0.5 }}>{lastUpdated}</span>
        </div>

      </div>
    </div>
    </Link>
  );
}
