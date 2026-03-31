"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function SceneList({
  scenes,
  selectedScene,
  onSceneSelect,
  onSceneDelete,
  loading,
}: SceneListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading scenes...
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No scenes created yet. Select text in the editor to create a scene.
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <h3 className="font-semibold mb-4">Scenes</h3>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {scenes.map((scene) => (
              <div key={scene.id} className="flex items-center gap-1">
                <Button
                  variant={selectedScene?.id === scene.id ? "default" : "ghost"}
                  className="flex-1 justify-start text-left"
                  onClick={() => onSceneSelect(scene)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{scene.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {scene.versions.length} version
                      {scene.versions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setDeletingId(scene.id)}
                  title="Delete scene"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scene?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scene and all its versions. The
              text in the document is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  onSceneDelete(deletingId);
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
