"use client";

import Link from "next/link";
import type { Story } from "@/types/dashboard";

interface ChapterResultRowProps {
  chapter: Story["chapters"][number];
  story: Story;
}

export function ChapterResultRow({ chapter, story }: ChapterResultRowProps) {
  return (
    <div
      className="rounded-[8px] overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--dark-green)" }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: "var(--aqua)" }} />
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="shrink-0 rounded p-1 overflow-hidden"
          style={{ width: 32, height: 42, backgroundColor: "var(--light-gray)" }}
          aria-hidden="true"
        >
          {chapter.previewText && (
            <p className="font-display leading-none" style={{ fontSize: 4, color: "#333" }}>
              {chapter.previewText}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <Link
            href={`/dashboard/stories/${story.id}`}
            className="font-display text-[18px] truncate transition-opacity hover:opacity-80"
            style={{ color: "var(--light-gray)" }}
          >
            {story.title}
          </Link>
          <Link
            href={`/editor/${chapter.id}`}
            className="font-display text-[16px] truncate transition-opacity hover:opacity-80"
            style={{ color: "var(--aqua)", opacity: 0.8 }}
          >
            {chapter.title}
          </Link>
        </div>
      </div>
    </div>
  );
}
