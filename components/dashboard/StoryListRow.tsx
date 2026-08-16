"use client";

import Link from "next/link";
import { Pin } from "lucide-react";
import { StoryActionsMenu } from "@/components/dashboard/StoryActionsMenu";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
import type { Story } from "@/types/dashboard";

interface StoryListRowProps {
  story: Story;
}

export function StoryListRow({ story }: StoryListRowProps) {
  const chapterCount = story.chapters.length;
  const thumbnailChapter = getLastModifiedChapter(story);
  const lastUpdated = new Date(story.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/dashboard/stories/${story.id}`} className="block">
      <div
        className="rounded-[8px] overflow-hidden flex flex-col transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--dark-green)" }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: "var(--aqua)" }} />
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="shrink-0 rounded p-1 overflow-hidden"
            style={{ width: 32, height: 42, backgroundColor: "var(--light-gray)" }}
            aria-hidden="true"
          >
            {thumbnailChapter?.previewText && (
              <p className="font-display leading-none" style={{ fontSize: 4, color: "#333" }}>
                {thumbnailChapter.previewText}
              </p>
            )}
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {story.pinned && (
              <span data-testid="pin-badge" style={{ color: "var(--aqua)" }} role="img" aria-label="Pinned">
                <Pin className="h-4 w-4" fill="currentColor" />
              </span>
            )}
            <span className="font-display text-[18px] truncate" style={{ color: "var(--light-gray)" }}>
              {story.title}
            </span>
          </div>
          <span className="font-display text-[16px] shrink-0" style={{ color: "var(--aqua)", opacity: 0.7 }}>
            {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
          </span>
          <span className="font-display text-[16px] shrink-0" style={{ color: "var(--light-gray)", opacity: 0.6, width: 76 }}>
            {lastUpdated}
          </span>
          <StoryActionsMenu story={story} />
        </div>
      </div>
    </Link>
  );
}
