"use client";

import Link from "next/link";
import type { Story } from "@/types/dashboard";

interface ChapterResultTileProps {
  chapter: Story["chapters"][number];
  story: Story;
}

export function ChapterResultTile({ chapter, story }: ChapterResultTileProps) {
  return (
    <Link href={`/editor/${chapter.id}`} className="block">
      <div
        className="rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
        style={{ backgroundColor: "var(--dark-green)" }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: "var(--green-highlight)" }} />
        <div className="flex flex-col flex-1 p-6 gap-2">
          <h3
            className="font-display text-[28px] leading-tight"
            style={{ color: "var(--light-gray)" }}
          >
            {chapter.title}
          </h3>
          <p className="font-display text-[16px]" style={{ color: "var(--aqua)", opacity: 0.8 }}>
            from {story.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
