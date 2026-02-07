import type { Chapter, Story } from "@prisma/client";

export interface RewrFile {
  version: string;
  appVersion: string;
  story: {
    id: string;
    title: string;
  };
  chapter: {
    id: string;
    title: string;
    order: number;
    content: any;
    wordCount: number;
    createdAt: string;
    updatedAt: string;
  };
  scenes: Array<{
    id: string;
    label: string;
    startPos: number;
    endPos: number;
    versions: Array<{
      id: string;
      content: any;
      createdAt: string;
    }>;
  }>;
  versions: Array<{
    id: string;
    label: string | null;
    content: any;
    createdAt: string;
  }>;
}

export function exportToRewr(
  story: Story,
  chapter: Chapter & {
    scenes: Array<{
      id: string;
      label: string;
      startPos: number;
      endPos: number;
      versions: Array<{
        id: string;
        content: any;
        createdAt: string;
      }>;
    }>;
    versions: Array<{
      id: string;
      label: string | null;
      content: any;
      createdAt: string;
    }>;
  }
): RewrFile {
  return {
    version: "1.0",
    appVersion: "Re:Write 1.0",
    story: {
      id: story.id,
      title: story.title,
    },
    chapter: {
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      content: chapter.content,
      wordCount: chapter.wordCount,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
    },
    scenes: chapter.scenes.map((scene) => ({
      id: scene.id,
      label: scene.label,
      startPos: scene.startPos,
      endPos: scene.endPos,
      versions: scene.versions.map((v) => ({
        id: v.id,
        content: v.content,
        createdAt: v.createdAt.toISOString(),
      })),
    })),
    versions: chapter.versions.map((v) => ({
      id: v.id,
      label: v.label,
      content: v.content,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

export function validateRewrFile(data: any): data is RewrFile {
  if (!data || typeof data !== "object") return false;
  if (data.version !== "1.0") return false;
  if (!data.story || !data.story.id || !data.story.title) return false;
  if (!data.chapter || !data.chapter.id || !data.chapter.title) return false;
  if (!Array.isArray(data.scenes)) return false;
  if (!Array.isArray(data.versions)) return false;
  return true;
}

export function importFromRewr(data: RewrFile) {
  if (!validateRewrFile(data)) {
    throw new Error("Invalid .rewr file format");
  }

  return {
    story: data.story,
    chapter: data.chapter,
    scenes: data.scenes,
    versions: data.versions,
  };
}

