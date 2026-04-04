"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save } from "lucide-react";
import type { Scene, SceneVersion } from "./types";
import type { Editor as TiptapEditor } from "@tiptap/react";

interface SceneVersionsProps {
  scene: Scene | null;
  selectedVersion: SceneVersion | null;
  onVersionSelect: (version: SceneVersion) => void;
  onVersionCreated: () => void;
  editor?: TiptapEditor | null;
}

export function SceneVersions({ scene, selectedVersion, onVersionSelect, onVersionCreated, editor }: SceneVersionsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!scene) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        Select a scene to view versions
      </div>
    );
  }

  const handleCreateVersion = async () => {
    if (!scene) return;
    setLoading(true);
    try {
      let content: any;
      if (editor) {
        const slice = editor.state.doc.slice(scene.startPos, scene.endPos);
        content = { type: "doc", content: slice.toJSON().content ?? [] };
      } else {
        content = scene.versions[0]?.content ?? { type: "doc", content: [] };
      }
      const response = await fetch(`/api/scenes/${scene.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        onVersionCreated();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to create version:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}>
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

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {scene.versions.map((version) => (
            <button
              key={version.id}
              onClick={() => onVersionSelect(version)}
              className="font-display"
              style={{
                textAlign: "left",
                background: selectedVersion?.id === version.id ? "var(--dark-green-highlight)" : "none",
                border: selectedVersion?.id === version.id ? "1px solid var(--aqua)" : "1px solid transparent",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              <span style={{ color: "var(--light-gray)", fontSize: 14 }}>
                {new Date(version.createdAt).toLocaleString()}
              </span>
              {version.id === scene.currentVersion && (
                <span style={{ color: "var(--aqua)", fontSize: 12, opacity: 0.7 }}>Current</span>
              )}
            </button>
          ))}
          {scene.versions.length === 0 && (
            <p className="font-display" style={{ color: "var(--light-gray)", opacity: 0.5, fontSize: 14 }}>
              No versions saved yet.
            </p>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)", borderRadius: 12 }}>
          <DialogHeader>
            <DialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 22 }}>
              Save as New Version
            </DialogTitle>
          </DialogHeader>
          <p className="font-display" style={{ color: "var(--light-gray)", opacity: 0.7, fontSize: 14, padding: "8px 0" }}>
            This captures the scene&apos;s current content from the editor.
          </p>
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
              disabled={loading}
              className="font-display"
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "3px solid black",
                borderRadius: 20,
                padding: "10px 20px",
                color: "black",
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving..." : "Save Version"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
