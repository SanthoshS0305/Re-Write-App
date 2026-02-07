"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Scene } from "./types";

interface SceneListProps {
  scenes: Scene[];
  selectedScene: Scene | null;
  onSceneSelect: (scene: Scene) => void;
  loading: boolean;
}

export function SceneList({
  scenes,
  selectedScene,
  onSceneSelect,
  loading,
}: SceneListProps) {
  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading scenes...</div>;
  }

  if (scenes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No scenes created yet. Select text in the editor to create a scene.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Scenes</h3>
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {scenes.map((scene) => (
            <Button
              key={scene.id}
              variant={selectedScene?.id === scene.id ? "default" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => onSceneSelect(scene)}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{scene.label}</span>
                <span className="text-xs text-muted-foreground">
                  {scene.versions.length} version{scene.versions.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

