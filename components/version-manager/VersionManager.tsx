"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { VersionList } from "./VersionList";
import { VersionDiff } from "./VersionDiff";
import type { ChapterVersion } from "./types";

interface VersionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  onRestored?: (content: any) => void;
}

export function VersionManager({
  open,
  onOpenChange,
  chapterId,
  onRestored,
}: VersionManagerProps) {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [selectedVersion1, setSelectedVersion1] = useState<ChapterVersion | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<ChapterVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && chapterId) {
      loadVersions();
    }
  }, [open, chapterId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters/${chapterId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
        if (data.length > 0) {
          setSelectedVersion1(data[0]);
          if (data.length > 1) setSelectedVersion2(data[1]);
        }
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)} title="Version History">
      {/* 2-column: narrow version list | wide diff */}
      <div className="grid grid-cols-[220px_1fr] h-full divide-x overflow-hidden">
        <div className="overflow-y-auto">
          <VersionList
            versions={versions}
            selectedVersion1={selectedVersion1}
            selectedVersion2={selectedVersion2}
            onVersion1Select={setSelectedVersion1}
            onVersion2Select={setSelectedVersion2}
            loading={loading}
            chapterId={chapterId}
            onVersionCreated={loadVersions}
            onRestored={onRestored}
          />
        </div>
        <div className="overflow-hidden">
          <VersionDiff
            version1={selectedVersion1}
            version2={selectedVersion2}
            chapterId={chapterId}
          />
        </div>
      </div>
    </SidePanel>
  );
}
