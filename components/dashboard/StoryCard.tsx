"use client";

import Link from "next/link";
import { Pin } from "lucide-react";
import { StoryActionsMenu } from "@/components/dashboard/StoryActionsMenu";
import { getLastModifiedChapter } from "@/lib/dashboard/chapter-nav";
import type { Story } from "@/types/dashboard";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
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

        <div className="flex items-center gap-4 p-6">
          {/* Document thumbnail */}
          <div
            className="shrink-0 rounded p-1.5 overflow-hidden"
            style={{ width: 70, height: 92, backgroundColor: "var(--light-gray)" }}
            aria-hidden="true"
          >
            {thumbnailChapter?.previewText && (
              <p className="font-display text-[7px] leading-snug" style={{ color: "#333" }}>
                {thumbnailChapter.previewText}
              </p>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0 gap-4">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              {story.pinned && (
                <span
                  data-testid="pin-badge"
                  className="shrink-0"
                  style={{ color: "var(--aqua)" }}
                  role="img"
                  aria-label="Pinned"
                >
                  <Pin className="h-3 w-3" fill="currentColor" />
                </span>
              )}
              <h3
                className="font-display text-[28px] leading-tight truncate"
                style={{ color: "var(--light-gray)" }}
              >
                {story.title}
              </h3>
              <StoryActionsMenu story={story} />
            </div>

            {/* Meta */}
            <div className="flex gap-4 font-display text-[20px]" style={{ color: "var(--aqua)", opacity: 0.8 }}>
              <span>{chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "var(--light-gray)", opacity: 0.5 }}>{lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
