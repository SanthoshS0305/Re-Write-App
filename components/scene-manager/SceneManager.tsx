"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SceneList } from "./SceneList";
import { SceneVersions } from "./SceneVersions";
import { SceneDiff } from "./SceneDiff";
import type { Scene, SceneVersion } from "./types";

interface SceneManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
}

export function SceneManager({ open, onOpenChange, chapterId }: SceneManagerProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SceneVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && chapterId) {
      loadScenes();
    }
  }, [open, chapterId]);

  const loadScenes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters/${chapterId}/scenes`);
      if (response.ok) {
        const data = await response.json();
        setScenes(data);
        if (data.length > 0 && !selectedScene) {
          setSelectedScene(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load scenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSceneSelected = (scene: Scene) => {
    setSelectedScene(scene);
    setSelectedVersion(null);
  };

  const handleVersionSelected = (version: SceneVersion) => {
    setSelectedVersion(version);
  };

  const handleVersionCreated = () => {
    if (selectedScene) {
      loadScenes();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Scene Manager</DialogTitle>
          <DialogDescription>
            Manage scenes and their versions in this chapter
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          <div className="border-r overflow-y-auto">
            <SceneList
              scenes={scenes}
              selectedScene={selectedScene}
              onSceneSelect={handleSceneSelected}
              loading={loading}
            />
          </div>
          <div className="border-r overflow-y-auto">
            <SceneVersions
              scene={selectedScene}
              selectedVersion={selectedVersion}
              onVersionSelect={handleVersionSelected}
              onVersionCreated={handleVersionCreated}
            />
          </div>
          <div className="overflow-y-auto">
            <SceneDiff
              scene={selectedScene}
              version={selectedVersion}
              chapterId={chapterId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

