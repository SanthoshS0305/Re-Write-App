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

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
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

        {thumbnailChapter?.previewText && (
          <div
            className="mx-3 mt-3 rounded p-2 overflow-hidden"
            style={{ backgroundColor: "var(--light-gray)", height: 56 }}
          >
            <p className="font-display text-[9px] leading-snug" style={{ color: "#333" }}>
              {thumbnailChapter.previewText}
            </p>
          </div>
        )}

        <div className="flex flex-col flex-1 p-6 gap-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            {story.pinned && (
              <span
                data-testid="pin-badge"
                className="shrink-0"
                style={{ color: "var(--aqua)" }}
                aria-hidden="true"
              >
                <Pin className="h-3 w-3" fill="currentColor" />
              </span>
            )}
            <h3
              className="font-display text-[28px] leading-tight"
              style={{ color: "var(--light-gray)" }}
            >
              {story.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.preventDefault()}
                  aria-label="Story options"
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
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
                      <AlertDialogTitle className="font-display" style={{ color: "var(--light-gray)" }}>
                        Delete Story
                      </AlertDialogTitle>
                      <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
                        Are you sure you want to delete &ldquo;{story.title}&rdquo;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        className="font-display"
                        style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="font-display"
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
