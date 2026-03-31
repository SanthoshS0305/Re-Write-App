"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function SceneVersions({
  scene,
  selectedVersion,
  onVersionSelect,
  onVersionCreated,
  editor,
}: SceneVersionsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!scene) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
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
        // Extract scene content directly from the live editor document
        const slice = editor.state.doc.slice(scene.startPos, scene.endPos);
        content = { type: "doc", content: slice.toJSON().content ?? [] };
      } else {
        // Fallback: snapshot the latest known version content
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
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Versions</h3>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Save className="h-4 w-4 mr-2" />
          Save as New Version
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {scene.versions.map((version) => (
            <Button
              key={version.id}
              variant={selectedVersion?.id === version.id ? "default" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => onVersionSelect(version)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
                {version.id === scene.currentVersion && (
                  <span className="text-xs text-muted-foreground">Current</span>
                )}
              </div>
            </Button>
          ))}
          {scene.versions.length === 0 && (
            <p className="text-sm text-muted-foreground">No versions saved yet.</p>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
            <DialogDescription>
              Snapshot the current scene text as a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This captures the scene&apos;s current content from the editor.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={loading}>
              {loading ? "Saving..." : "Save Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
