export interface Scene {
  id: string;
  label: string;
  startPos: number;
  endPos: number;
  chapterId: string;
  currentVersion: string | null;
  versions: SceneVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface SceneVersion {
  id: string;
  content: any; // ProseMirror JSON
  sceneId: string;
  createdAt: string;
}

