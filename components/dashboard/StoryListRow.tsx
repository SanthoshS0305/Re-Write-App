"use client";

import Link from "next/link";
import { Pin, MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
import type { Story } from "@/types/dashboard";

interface StoryListRowProps {
  story: Story;
}

export function StoryListRow({ story }: StoryListRowProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete story");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !story.pinned }),
      });
      if (!response.ok) throw new Error("Failed to update pin state");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const chapterCount = story.chapters.length;
  const thumbnailChapter = getLastModifiedChapter(story);
  const lastUpdated = new Date(story.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/dashboard/stories/${story.id}`} className="block">
      <div
        className="flex items-center gap-3 rounded-[8px] px-4 py-2 transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--dark-green)" }}
      >
        <div
          className="shrink-0 rounded"
          style={{ width: 28, height: 36, backgroundColor: "var(--light-gray)" }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {story.pinned && (
            <span data-testid="pin-badge" style={{ color: "var(--aqua)" }} aria-hidden="true">
              <Pin className="h-3 w-3" fill="currentColor" />
            </span>
          )}
          <span className="font-display text-[14px] truncate" style={{ color: "var(--light-gray)" }}>
            {story.title}
          </span>
        </div>
        <span className="font-display text-[12px] shrink-0" style={{ color: "var(--aqua)", opacity: 0.7 }}>
          {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
        </span>
        <span className="font-display text-[12px] shrink-0" style={{ color: "var(--light-gray)", opacity: 0.6, width: 60 }}>
          {lastUpdated}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.preventDefault()}
              aria-label="Story options"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--light-gray)" }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                pinMutation.mutate();
              }}
              style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}
            >
              {story.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  style={{ color: "#f87171", fontFamily: "Joan, serif", cursor: "pointer" }}
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent
                style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
              >
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
                    onClick={() => deleteMutation.mutate()}
                    className="font-display rounded-[20px] border-[2px] border-black"
                    style={{ backgroundColor: "#c0392b", color: "white" }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
