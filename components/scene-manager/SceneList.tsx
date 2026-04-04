"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import type { Scene } from "./types";

interface SceneListProps {
  scenes: Scene[];
  selectedScene: Scene | null;
  onSceneSelect: (scene: Scene) => void;
  onSceneDelete: (sceneId: string) => void;
  loading: boolean;
}

export function SceneList({ scenes, selectedScene, onSceneSelect, onSceneDelete, loading }: SceneListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        Loading scenes...
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        No scenes created yet. Select text in the editor to create a scene.
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 16 }}>
        <h3 className="font-display" style={{ color: "var(--light-gray)", fontSize: 18, marginBottom: 12 }}>Scenes</h3>
        <ScrollArea className="h-full">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {scenes.map((scene) => (
              <div key={scene.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => onSceneSelect(scene)}
                  className="font-display"
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: selectedScene?.id === scene.id ? "var(--dark-green-highlight)" : "none",
                    border: selectedScene?.id === scene.id ? "1px solid var(--aqua)" : "1px solid transparent",
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span style={{ color: "var(--light-gray)", fontSize: 15 }}>{scene.label}</span>
                  <span style={{ color: "var(--aqua)", fontSize: 12, opacity: 0.7 }}>
                    {scene.versions.length} version{scene.versions.length !== 1 ? "s" : ""}
                  </span>
                </button>
                <button
                  onClick={() => setDeletingId(scene.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--light-gray)",
                    opacity: 0.4,
                    padding: 6,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  className="hover:opacity-70 transition-opacity"
                  title="Delete scene"
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 22 }}>
              Delete scene?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
              This will permanently delete the scene and all its versions. The text in the document is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-display rounded-[20px]"
              style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) { onSceneDelete(deletingId); setDeletingId(null); } }}
              className="font-display rounded-[20px] border-[2px] border-black"
              style={{ backgroundColor: "#c0392b", color: "white" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
