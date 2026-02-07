"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, RotateCcw } from "lucide-react";
import type { ChapterVersion } from "./types";

interface VersionListProps {
  versions: ChapterVersion[];
  selectedVersion1: ChapterVersion | null;
  selectedVersion2: ChapterVersion | null;
  onVersion1Select: (version: ChapterVersion) => void;
  onVersion2Select: (version: ChapterVersion) => void;
  loading: boolean;
  chapterId: string;
  onVersionCreated: () => void;
}

export function VersionList({
  versions,
  selectedVersion1,
  selectedVersion2,
  onVersion1Select,
  onVersion2Select,
  loading,
  chapterId,
  onVersionCreated,
}: VersionListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreateVersion = async () => {
    setSaving(true);
    try {
      // Get current chapter content
      const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
      if (!chapterResponse.ok) return;

      const chapter = await chapterResponse.json();
      const scenesResponse = await fetch(`/api/chapters/${chapterId}/scenes`);
      const scenes = scenesResponse.ok ? await scenesResponse.json() : [];

      const response = await fetch(`/api/chapters/${chapterId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || null,
          content: chapter.content,
          scenesState: scenes,
        }),
      });

      if (response.ok) {
        onVersionCreated();
        setIsCreateDialogOpen(false);
        setLabel("");
      }
    } catch (error) {
      console.error("Failed to create version:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (version: ChapterVersion) => {
    if (!confirm(`Restore version from ${new Date(version.createdAt).toLocaleString()}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: version.content,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading versions...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Versions</h3>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Save className="h-4 w-4 mr-2" />
          Save Version
        </Button>
      </div>
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="space-y-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant={selectedVersion1?.id === version.id ? "default" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => onVersion1Select(version)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {version.label || new Date(version.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {version.wordCount} words • {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
                <Button
                  variant={selectedVersion2?.id === version.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => onVersion2Select(version)}
                >
                  Compare
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleRestoreVersion(version)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Save the current chapter state as a new version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Version Label (optional)</Label>
              <Input
                id="label"
                placeholder="First Draft"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={saving}>
              {saving ? "Saving..." : "Save Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

