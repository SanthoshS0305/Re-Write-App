"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save } from "lucide-react";
import type { Scene, SceneVersion } from "./types";
import { useEditor } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";

interface SceneVersionsProps {
  scene: Scene | null;
  selectedVersion: SceneVersion | null;
  onVersionSelect: (version: SceneVersion) => void;
  onVersionCreated: () => void;
}

export function SceneVersions({
  scene,
  selectedVersion,
  onVersionSelect,
  onVersionCreated,
}: SceneVersionsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const editor = useEditor({
    extensions: editorExtensions,
    content: scene ? (scene.versions[0]?.content || { type: "doc", content: [] }) : null,
  });

  if (!scene) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a scene to view versions
      </div>
    );
  }

  const handleCreateVersion = async () => {
    if (!editor || !scene) return;

    setLoading(true);
    try {
      const content = editor.getJSON();
      const response = await fetch(`/api/scenes/${scene.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newVersion = await response.json();
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Versions</h3>
        <Button
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!editor}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as New Version
        </Button>
      </div>
      <ScrollArea className="h-full">
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
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
            <DialogDescription>
              Save the current scene content as a new version
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will create a new version of the scene with the current content.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
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

