"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  onRestored?: (content: any) => void;
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
  onRestored,
}: VersionListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreateVersion = async () => {
    setSaving(true);
    try {
      const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
      if (!chapterResponse.ok) return;
      const chapter = await chapterResponse.json();
      const scenesResponse = await fetch(`/api/chapters/${chapterId}/scenes`);
      const scenes = scenesResponse.ok ? await scenesResponse.json() : [];

      const response = await fetch(`/api/chapters/${chapterId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || null, content: chapter.content, scenesState: scenes }),
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
    if (!confirm(`Restore version from ${new Date(version.createdAt).toLocaleString()}?`)) return;
    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: version.content }),
      });
      if (response.ok) onRestored?.(version.content);
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        Loading versions...
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 className="font-display" style={{ color: "var(--light-gray)", fontSize: 18 }}>Versions</h3>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="font-display"
          style={{
            backgroundColor: "var(--dark-green-highlight)",
            border: "none",
            borderRadius: 16,
            padding: "6px 12px",
            color: "var(--light-gray)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Save style={{ width: 14, height: 14 }} />
          Save Version
        </button>
      </div>

      <ScrollArea className="h-full">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {versions.map((version) => (
            <div key={version.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Primary select button */}
              <button
                onClick={() => onVersion1Select(version)}
                className="font-display"
                style={{
                  textAlign: "left",
                  background: selectedVersion1?.id === version.id ? "var(--dark-green-highlight)" : "none",
                  border: selectedVersion1?.id === version.id ? "1px solid var(--aqua)" : "1px solid transparent",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span style={{ color: "var(--light-gray)", fontSize: 14, fontWeight: 500 }}>
                  {version.label || new Date(version.createdAt).toLocaleString()}
                </span>
                <span style={{ color: "var(--aqua)", fontSize: 12, opacity: 0.7 }}>
                  {version.wordCount} words · {new Date(version.createdAt).toLocaleDateString()}
                </span>
              </button>

              {/* Compare + Restore row */}
              <div style={{ display: "flex", gap: 6, paddingLeft: 4 }}>
                <button
                  onClick={() => onVersion2Select(version)}
                  className="font-display"
                  style={{
                    flex: 1,
                    background: selectedVersion2?.id === version.id ? "var(--dark-green-highlight)" : "none",
                    border: selectedVersion2?.id === version.id
                      ? "1px solid var(--aqua)"
                      : "1px solid var(--dark-green-highlight)",
                    borderRadius: 12,
                    padding: "4px 10px",
                    color: "var(--light-gray)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Compare
                </button>
                <button
                  onClick={() => handleRestoreVersion(version)}
                  className="font-display"
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderRadius: 12,
                    padding: "4px 10px",
                    color: "var(--light-gray)",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    opacity: 0.7,
                  }}
                >
                  <RotateCcw style={{ width: 12, height: 12 }} />
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)", borderRadius: 12 }}>
          <DialogHeader>
            <DialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 22 }}>
              Save Version
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0" }}>
            <label className="font-display" style={{ color: "var(--light-gray)", fontSize: 16, opacity: 0.8 }}>
              Version Label (optional)
            </label>
            <input
              placeholder="First Draft"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="font-display"
              style={{
                backgroundColor: "var(--mint-green)",
                border: "3px solid black",
                borderRadius: 20,
                padding: "10px 18px",
                fontSize: 16,
                color: "black",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(false)}
              className="font-display"
              style={{
                backgroundColor: "var(--dark-green-highlight)",
                border: "none",
                borderRadius: 20,
                padding: "10px 20px",
                color: "var(--light-gray)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateVersion}
              disabled={saving}
              className="font-display"
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "3px solid black",
                borderRadius: 20,
                padding: "10px 20px",
                color: "black",
                fontSize: 16,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Version"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
