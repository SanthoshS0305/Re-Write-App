"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VersionList } from "./VersionList";
import { VersionDiff } from "./VersionDiff";
import type { ChapterVersion } from "./types";

interface VersionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
}

export function VersionManager({ open, onOpenChange, chapterId }: VersionManagerProps) {
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
          if (data.length > 1) {
            setSelectedVersion2(data[1]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionCreated = () => {
    loadVersions();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version Manager</DialogTitle>
          <DialogDescription>
            Manage and compare document versions
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          <div className="border-r overflow-y-auto">
            <VersionList
              versions={versions}
              selectedVersion1={selectedVersion1}
              selectedVersion2={selectedVersion2}
              onVersion1Select={setSelectedVersion1}
              onVersion2Select={setSelectedVersion2}
              loading={loading}
              chapterId={chapterId}
              onVersionCreated={handleVersionCreated}
            />
          </div>
          <div className="col-span-2 overflow-y-auto">
            <VersionDiff
              version1={selectedVersion1}
              version2={selectedVersion2}
              chapterId={chapterId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

