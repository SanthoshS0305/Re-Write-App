"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { CreateSceneDialog } from "./CreateSceneDialog";
import type { Editor } from "@tiptap/react";
import type { Scene } from "@/lib/editor/scene-plugin";

interface SceneCreationButtonProps {
  editor: Editor;
  chapterId: string;
  scenes: Scene[];
  onSceneCreated: () => void;
}

export function SceneCreationButton({
  editor,
  chapterId,
  scenes,
  onSceneCreated,
}: SceneCreationButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selection, setSelection] = useState<{
    from: number;
    to: number;
    midY: number;
  } | null>(null);

  useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        try {
          const fromCoords = editor.view.coordsAtPos(from);
          const toCoords = editor.view.coordsAtPos(to);
          const midY = (fromCoords.top + toCoords.bottom) / 2;
          setSelection({ from, to, midY });
        } catch {
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

  if (!selection) return null;

  const overlapsScene = scenes.some(
    (s) => selection.from < s.endPos && selection.to > s.startPos
  );

  // Position to the right of the centered 800px editor canvas
  // Canvas right edge = 50vw + 400px; add 16px gap
  const buttonRight = `calc(50vw - 400px - 16px)`;

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: buttonRight,
          top: selection.midY - 18,
          zIndex: 50,
          transform: "translateX(100%)",
        }}
      >
        <button
          onClick={() => !overlapsScene && setIsDialogOpen(true)}
          disabled={overlapsScene}
          title={overlapsScene ? "Selection overlaps an existing scene" : "Create scene from selection"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: overlapsScene ? "var(--dark-mint-green)" : "var(--green-highlight)",
            border: "2px solid black",
            borderRadius: 20,
            padding: "4px 12px",
            cursor: overlapsScene ? "not-allowed" : "pointer",
            fontFamily: "Joan, serif",
            fontSize: 14,
            color: "black",
            opacity: overlapsScene ? 0.6 : 1,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          {overlapsScene ? "Overlaps scene" : "Create Scene"}
        </button>
      </div>

      <CreateSceneDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        chapterId={chapterId}
        startPos={selection.from}
        endPos={selection.to}
        editor={editor}
        onSceneCreated={onSceneCreated}
        anchorY={selection.midY}
      />
    </>
  );
}
