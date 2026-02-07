"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Editor } from "@tiptap/react";

interface CreateSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  startPos: number;
  endPos: number;
  editor: Editor;
  onSceneCreated: () => void;
}

export function CreateSceneDialog({
  open,
  onOpenChange,
  chapterId,
  startPos,
  endPos,
  editor,
  onSceneCreated,
}: CreateSceneDialogProps) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get the selected content as ProseMirror JSON
      const selectedContent = editor.state.doc.slice(startPos, endPos).toJSON();

      const response = await fetch(`/api/chapters/${chapterId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          startPos,
          endPos,
          content: selectedContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create scene");
        return;
      }

      const newScene = await response.json();
      onSceneCreated();
      setLabel("");
      onOpenChange(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Scene</DialogTitle>
          <DialogDescription>
            Give this scene a label. The selected text will become a scene.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Scene Label</Label>
              <Input
                id="label"
                placeholder="Opening Scene"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Scene"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

