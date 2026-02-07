"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { EditorToolbar } from "./EditorToolbar";
import { SceneCreationButton } from "./SceneCreationButton";
import { useEffect, useState } from "react";
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

export function Editor({ content, onUpdate, chapterId, onSceneManagerOpen, onVersionManagerOpen, showToolbarInHeader = false, onEditorReady }: EditorProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);

  const editor = useEditor({
    extensions: editorExtensions,
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-[30px] py-[40px] text-white text-[20px] font-display",
      },
    },
  });

  // Load scenes
  useEffect(() => {
    if (!chapterId) return;

    const loadScenes = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterId}/scenes`);
        if (response.ok) {
          const data = await response.json();
          setScenes(data);
          
          // Update scene extension storage
          if (editor) {
            const sceneExtension = editor.extensionManager.extensions.find(
              (ext) => ext.name === "scene"
            );
            if (sceneExtension) {
              sceneExtension.storage.scenes = data;
              editor.view.dispatch(editor.state.tr);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load scenes:", error);
      }
    };

    loadScenes();
  }, [chapterId, editor]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      // Only update if content is actually different
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

  const handleSceneCreated = async () => {
    // Reload scenes
    try {
      const response = await fetch(`/api/chapters/${chapterId}/scenes`);
      if (response.ok) {
        const data = await response.json();
        setScenes(data);
        
        if (editor) {
          const sceneExtension = editor.extensionManager.extensions.find(
            (ext) => ext.name === "scene"
          );
          if (sceneExtension) {
            sceneExtension.storage.scenes = data;
            editor.view.dispatch(editor.state.tr);
          }
        }
      }
    } catch (error) {
      console.error("Failed to reload scenes:", error);
    }
  };

  if (!editor) {
    return <div className="flex items-center justify-center h-96">Loading editor...</div>;
  }

  return (
    <div className="relative h-full">
      {!showToolbarInHeader && (
        <EditorToolbar editor={editor} chapterId={chapterId} onSceneManagerOpen={onSceneManagerOpen} onVersionManagerOpen={onVersionManagerOpen} />
      )}
      <div className="relative h-full">
        <EditorContent editor={editor} />
        <SceneCreationButton
          editor={editor}
          chapterId={chapterId}
          onSceneCreated={handleSceneCreated}
        />
      </div>
    </div>
  );
}

