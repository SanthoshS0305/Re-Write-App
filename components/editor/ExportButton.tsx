"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToRewr } from "@/lib/utils/rewr-format";
import { saveAs } from "file-saver";

interface ExportButtonProps {
  chapterId: string;
}

export function ExportButton({ chapterId }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      // Fetch chapter with all related data
      const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
      if (!chapterResponse.ok) return;

      const chapter = await chapterResponse.json();

      const scenesResponse = await fetch(`/api/chapters/${chapterId}/scenes`);
      const scenes = scenesResponse.ok ? await scenesResponse.json() : [];

      const versionsResponse = await fetch(`/api/chapters/${chapterId}/versions`);
      const versions = versionsResponse.ok ? await versionsResponse.json() : [];

      const rewrData = exportToRewr(chapter.story, {
        ...chapter,
        scenes,
        versions,
      });

      const blob = new Blob([JSON.stringify(rewrData, null, 2)], {
        type: "application/json",
      });

      const filename = `${chapter.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.rewr`;
      saveAs(blob, filename);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
}

