"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { EditorToolbar } from "./EditorToolbar";
import { SceneCreationButton } from "./SceneCreationButton";
import { useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Scene } from "@/lib/editor/scene-plugin";

interface EditorProps {
  content: JSONContent;
  onUpdate: (content: JSONContent) => void;
  chapterId: string;
  onSceneManagerOpen?: () => void;
  onVersionManagerOpen?: () => void;
  showToolbarInHeader?: boolean;
  onEditorReady?: (editor: any) => void;
}

export function Editor({
  content,
  onUpdate,
  chapterId,
  onSceneManagerOpen,
  onVersionManagerOpen,
  showToolbarInHeader = false,
  onEditorReady,
}: EditorProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const positionSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());

      // Debounce persisting scene positions after document changes
      const sceneExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "scene"
      );
      if (!sceneExt) return;

      const pending = sceneExt.storage.pendingPositionUpdates as
        | { id: string; startPos: number; endPos: number }[]
        | undefined;
      if (!pending || pending.length === 0) return;

      if (positionSyncTimer.current) clearTimeout(positionSyncTimer.current);
      positionSyncTimer.current = setTimeout(async () => {
        const updates = sceneExt.storage
          .pendingPositionUpdates as { id: string; startPos: number; endPos: number }[];
        (sceneExt.storage as any).pendingPositionUpdates = [];
        for (const { id, startPos, endPos } of updates) {
          try {
            await fetch(`/api/scenes/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ startPos, endPos }),
            });
          } catch (err) {
            console.error("Failed to sync scene position:", err);
          }
        }
        // Refresh local scenes state from storage
        setScenes([...(sceneExt.storage.scenes as Scene[])]);
      }, 800);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-[30px] py-[40px] text-[20px] font-display text-black dark:text-white",
      },
    },
  });

  // Load scenes on mount
  useEffect(() => {
    if (!chapterId) return;

    const loadScenes = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterId}/scenes`);
        if (response.ok) {
          const data = await response.json();
          setScenes(data);
          updateEditorScenes(data);
        }
      } catch (error) {
        console.error("Failed to load scenes:", error);
      }
    };

    loadScenes();
  }, [chapterId, editor]);

  // Update editor content when prop changes externally (e.g. version restore)
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Expose editor instance to parent
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  function updateEditorScenes(data: Scene[]) {
    if (!editor) return;
    const sceneExt = editor.extensionManager.extensions.find(
      (ext) => ext.name === "scene"
    );
    if (sceneExt) {
      (sceneExt.storage as any).scenes = data;
      (sceneExt.storage as any).pendingPositionUpdates = [];
      editor.view.dispatch(editor.state.tr);
    }
  }

  const handleSceneCreated = async () => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/scenes`);
      if (response.ok) {
        const data = await response.json();
        setScenes(data);
        updateEditorScenes(data);
      }
    } catch (error) {
      console.error("Failed to reload scenes:", error);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {!showToolbarInHeader && (
        <EditorToolbar
          editor={editor}
          chapterId={chapterId}
          onSceneManagerOpen={onSceneManagerOpen}
          onVersionManagerOpen={onVersionManagerOpen}
        />
      )}
      <div className="relative h-full">
        <EditorContent editor={editor} />
        <SceneCreationButton
          editor={editor}
          chapterId={chapterId}
          scenes={scenes}
          onSceneCreated={handleSceneCreated}
        />
      </div>
    </div>
  );
}
