"use client";

import { Download } from "lucide-react";
import { exportToRewr } from "@/lib/utils/rewr-format";
import { saveAs } from "file-saver";

interface ExportButtonProps {
  chapterId: string;
}

export function ExportButton({ chapterId }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
      if (!chapterResponse.ok) return;
      const chapter = await chapterResponse.json();

      const scenesResponse = await fetch(`/api/chapters/${chapterId}/scenes`);
      const scenes = scenesResponse.ok ? await scenesResponse.json() : [];

      const versionsResponse = await fetch(`/api/chapters/${chapterId}/versions`);
      const versions = versionsResponse.ok ? await versionsResponse.json() : [];

      const rewrData = exportToRewr(chapter.story, { ...chapter, scenes, versions });
      const blob = new Blob([JSON.stringify(rewrData, null, 2)], { type: "application/json" });
      const filename = `${chapter.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.rewr`;
      saveAs(blob, filename);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="font-display hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: "var(--dark-green-highlight)",
        border: "none",
        borderRadius: 16,
        padding: "6px 14px",
        color: "var(--light-gray)",
        fontSize: 13,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Download style={{ width: 14, height: 14 }} />
      Export
    </button>
  );
}
