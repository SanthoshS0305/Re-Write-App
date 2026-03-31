"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { SceneList } from "./SceneList";
import { SceneVersions } from "./SceneVersions";
import { SceneDiff } from "./SceneDiff";
import type { Scene, SceneVersion } from "./types";
import type { Editor as TiptapEditor } from "@tiptap/react";

interface SceneManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  editor?: TiptapEditor | null;
  onSceneDeleted?: () => void;
  onVersionApplied?: (sceneId: string, content: any, startPos: number, endPos: number) => void;
}

export function SceneManager({
  open,
  onOpenChange,
  chapterId,
  editor,
  onSceneDeleted,
  onVersionApplied,
}: SceneManagerProps) {
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
    if (selectedScene) loadScenes();
  };

  const handleSceneDelete = async (sceneId: string) => {
    try {
      const response = await fetch(`/api/scenes/${sceneId}`, { method: "DELETE" });
      if (response.ok) {
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        if (selectedScene?.id === sceneId) {
          setSelectedScene(null);
          setSelectedVersion(null);
        }
        onSceneDeleted?.();
      }
    } catch (error) {
      console.error("Failed to delete scene:", error);
    }
  };

  const handleVersionApplied = (sceneId: string, content: any) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    loadScenes();
    onVersionApplied?.(sceneId, content, scene.startPos, scene.endPos);
  };

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)} title="Scene Manager">
      {/* 2-column layout: narrow scene list | wide version+diff */}
      <div className="grid grid-cols-[200px_1fr] h-full divide-x overflow-hidden">
        {/* Scene list */}
        <div className="overflow-y-auto">
          <SceneList
            scenes={scenes}
            selectedScene={selectedScene}
            onSceneSelect={handleSceneSelected}
            onSceneDelete={handleSceneDelete}
            loading={loading}
          />
        </div>

        {/* Versions + Diff stacked */}
        <div className="flex flex-col overflow-hidden divide-y">
          <div className="h-[240px] shrink-0 overflow-y-auto">
            <SceneVersions
              scene={selectedScene}
              selectedVersion={selectedVersion}
              onVersionSelect={handleVersionSelected}
              onVersionCreated={handleVersionCreated}
              editor={editor}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SceneDiff
              scene={selectedScene}
              version={selectedVersion}
              chapterId={chapterId}
              onVersionApplied={handleVersionApplied}
            />
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
