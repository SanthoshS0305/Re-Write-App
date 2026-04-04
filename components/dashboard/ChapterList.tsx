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
import type { Chapter } from "@prisma/client";

interface ChapterListProps {
  chapters: Chapter[];
  storyId: string;
  onChapterDeleted: (chapterId: string) => void;
}

export function ChapterList({ chapters, storyId, onChapterDeleted }: ChapterListProps) {
  const handleDelete = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}`, { method: "DELETE" });
      if (response.ok) onChapterDeleted(chapterId);
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {chapters.map((chapter, index) => (
        <Link key={chapter.id} href={`/editor/${chapter.id}`} className="block">
        <div
          className="flex items-center gap-4 rounded-[10px] px-6 py-4 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.2)] transition-transform duration-150 hover:scale-[1.005] cursor-pointer"
          style={{ backgroundColor: "var(--dark-green)" }}
        >
          {/* Chapter number */}
          <span
            className="font-display text-[20px] shrink-0 w-8 text-center"
            style={{ color: "var(--aqua)", opacity: 0.7 }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Divider */}
          <div className="w-px self-stretch" style={{ backgroundColor: "var(--dark-green-highlight)" }} />

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[22px] leading-tight truncate" style={{ color: "var(--light-gray)" }}>
              {chapter.title}
            </p>
            <p className="font-display text-[14px] mt-0.5" style={{ color: "var(--aqua)", opacity: 0.6 }}>
              {chapter.wordCount ?? 0} words
            </p>
          </div>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{ color: "var(--light-gray)", opacity: 0.4 }}
                onClick={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent
              style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle
                  className="font-display text-[24px]"
                  style={{ color: "var(--light-gray)" }}
                >
                  Delete Chapter
                </AlertDialogTitle>
                <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
                  Are you sure you want to delete &ldquo;{chapter.title}&rdquo;? This action cannot be
                  undone.
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
                  onClick={() => handleDelete(chapter.id)}
                  className="font-display rounded-[20px] border-[2px] border-black"
                  style={{ backgroundColor: "#c0392b", color: "white" }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        </Link>
      ))}
    </div>
  );
}
