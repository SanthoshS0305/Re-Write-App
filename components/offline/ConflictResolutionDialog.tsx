"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import type { SyncConflict } from "@/lib/offline/sync";

interface ConflictResolutionDialogProps {
  conflict: SyncConflict | null;
  onResolve: (conflict: SyncConflict, resolution: "local" | "server" | "merge", mergedData?: any) => void;
  onClose: () => void;
}

export function ConflictResolutionDialog({ conflict, onResolve, onClose }: ConflictResolutionDialogProps) {
  const [resolution, setResolution] = useState<"local" | "server" | "merge">("local");
  const [mergedContent, setMergedContent] = useState<any>(null);

  const localEditor = useEditor({ immediatelyRender: false, extensions: editorExtensions, content: conflict?.localData?.content || null, editable: false });
  const serverEditor = useEditor({ immediatelyRender: false, extensions: editorExtensions, content: conflict?.serverData?.content || null, editable: false });
  const mergedEditor = useEditor({ immediatelyRender: false, extensions: editorExtensions, content: mergedContent || conflict?.localData?.content || null, editable: resolution === "merge" });

  useEffect(() => {
    if (conflict && resolution === "merge" && !mergedContent) {
      setMergedContent(conflict.localData.content);
    }
  }, [conflict, resolution, mergedContent]);

  if (!conflict) return null;

  const handleSubmit = () => {
    if (resolution === "merge" && mergedEditor) {
      onResolve(conflict, "merge", { ...conflict.localData, content: mergedEditor.getJSON() });
    } else {
      onResolve(conflict, resolution);
    }
    onClose();
  };

  const resolutionOptions: { value: "local" | "server" | "merge"; label: string }[] = [
    { value: "local", label: "Keep Local" },
    { value: "server", label: "Keep Server" },
    { value: "merge", label: "Manual Merge" },
  ];

  return (
    <Dialog open={!!conflict} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)", borderRadius: 12, maxWidth: "90vw", width: "1100px", height: "80vh", display: "flex", flexDirection: "column" }}>
        <DialogHeader>
          <DialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 24 }}>
            Resolve Conflict
          </DialogTitle>
          <p className="font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
            Choose how to resolve the conflict between local and server versions
          </p>
        </DialogHeader>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, overflow: "hidden" }}>
          {/* Local */}
          <div style={{ borderRight: "1px solid var(--dark-green-highlight)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h3 className="font-display" style={{ color: "var(--aqua)", fontSize: 15, marginBottom: 8 }}>Local Version</h3>
            <ScrollArea style={{ flex: 1 }}>
              <div className="prose prose-sm dark:prose-invert max-w-none" style={{ color: "var(--light-gray)" }}>
                <EditorContent editor={localEditor} />
              </div>
            </ScrollArea>
          </div>

          {/* Server */}
          <div style={{ borderRight: "1px solid var(--dark-green-highlight)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h3 className="font-display" style={{ color: "var(--aqua)", fontSize: 15, marginBottom: 8 }}>Server Version</h3>
            <ScrollArea style={{ flex: 1 }}>
              <div className="prose prose-sm dark:prose-invert max-w-none" style={{ color: "var(--light-gray)" }}>
                <EditorContent editor={serverEditor} />
              </div>
            </ScrollArea>
          </div>

          {/* Merged */}
          {resolution === "merge" && (
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <h3 className="font-display" style={{ color: "var(--aqua)", fontSize: 15, marginBottom: 8 }}>Merged (Editable)</h3>
              <ScrollArea style={{ flex: 1 }}>
                <div className="prose prose-sm dark:prose-invert max-w-none" style={{ color: "var(--light-gray)" }}>
                  <EditorContent editor={mergedEditor} />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--dark-green-highlight)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {resolutionOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResolution(opt.value)}
                className="font-display"
                style={{
                  backgroundColor: resolution === opt.value ? "var(--dark-green-highlight)" : "none",
                  border: resolution === opt.value ? "1px solid var(--aqua)" : "1px solid var(--dark-green-highlight)",
                  borderRadius: 20,
                  padding: "8px 16px",
                  color: "var(--light-gray)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="font-display"
            style={{
              backgroundColor: "var(--green-highlight)",
              border: "3px solid black",
              borderRadius: 20,
              padding: "10px 24px",
              color: "black",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Resolve
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
