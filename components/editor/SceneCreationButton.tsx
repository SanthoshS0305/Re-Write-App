"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateSceneDialog } from "./CreateSceneDialog";
import type { Editor } from "@tiptap/react";

interface SceneCreationButtonProps {
  editor: Editor;
  chapterId: string;
  onSceneCreated: () => void;
}

export function SceneCreationButton({
  editor,
  chapterId,
  onSceneCreated,
}: SceneCreationButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selection, setSelection] = useState<{ from: number; to: number; coords: { top: number; left: number } } | null>(null);

  useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        try {
          const coords = editor.view.coordsAtPos(from);
          setSelection({ from, to, coords });
        } catch (e) {
          setSelection(null);
        }
      } else {
        setSelection(null);
      }
    };

    editor.on("selectionUpdate", updateSelection);
    editor.on("update", updateSelection);

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("update", updateSelection);
    };
  }, [editor]);

  if (!selection) {
    return null;
  }

  const handleCreateScene = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div
        className="fixed z-50"
        style={{
          top: selection.coords.top - 40,
          left: selection.coords.left,
        }}
      >
        <Button
          size="sm"
          onClick={handleCreateScene}
          className="shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Scene
        </Button>
      </div>
      <CreateSceneDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        chapterId={chapterId}
        startPos={selection.from}
        endPos={selection.to}
        editor={editor}
        onSceneCreated={onSceneCreated}
      />
    </>
  );
}

