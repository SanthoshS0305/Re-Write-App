"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import type { SyncConflict } from "@/lib/offline/sync";

interface ConflictResolutionDialogProps {
  conflict: SyncConflict | null;
  onResolve: (
    conflict: SyncConflict,
    resolution: "local" | "server" | "merge",
    mergedData?: any
  ) => void;
  onClose: () => void;
}

export function ConflictResolutionDialog({
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  const [resolution, setResolution] = useState<"local" | "server" | "merge">("local");
  const [mergedContent, setMergedContent] = useState<any>(null);

  const localEditor = useEditor({
    extensions: editorExtensions,
    content: conflict?.localData?.content || null,
    editable: false,
  });

  const serverEditor = useEditor({
    extensions: editorExtensions,
    content: conflict?.serverData?.content || null,
    editable: false,
  });

  const mergedEditor = useEditor({
    extensions: editorExtensions,
    content: mergedContent || conflict?.localData?.content || null,
    editable: resolution === "merge",
  });

  useEffect(() => {
    if (conflict && resolution === "merge" && !mergedContent) {
      setMergedContent(conflict.localData.content);
    }
  }, [conflict, resolution, mergedContent]);

  if (!conflict) return null;

  const handleSubmit = () => {
    if (resolution === "merge" && mergedEditor) {
      onResolve(conflict, "merge", {
        ...conflict.localData,
        content: mergedEditor.getJSON(),
      });
    } else {
      onResolve(conflict, resolution);
    }
    onClose();
  };

  return (
    <Dialog open={!!conflict} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resolve Conflict</DialogTitle>
          <DialogDescription>
            Choose how to resolve the conflict between local and server versions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          <div className="border-r overflow-y-auto">
            <h3 className="font-semibold mb-2">Local Version</h3>
            <ScrollArea className="h-full">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <EditorContent editor={localEditor} />
              </div>
            </ScrollArea>
          </div>

          <div className="border-r overflow-y-auto">
            <h3 className="font-semibold mb-2">Server Version</h3>
            <ScrollArea className="h-full">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <EditorContent editor={serverEditor} />
              </div>
            </ScrollArea>
          </div>

          {resolution === "merge" && (
            <div className="overflow-y-auto">
              <h3 className="font-semibold mb-2">Merged Version (Editable)</h3>
              <ScrollArea className="h-full">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <EditorContent editor={mergedEditor} />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant={resolution === "local" ? "default" : "outline"}
              onClick={() => setResolution("local")}
            >
              Keep Local
            </Button>
            <Button
              variant={resolution === "server" ? "default" : "outline"}
              onClick={() => setResolution("server")}
            >
              Keep Server
            </Button>
            <Button
              variant={resolution === "merge" ? "default" : "outline"}
              onClick={() => setResolution("merge")}
            >
              Manual Merge
            </Button>
          </div>
          <Button onClick={handleSubmit}>Resolve</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

