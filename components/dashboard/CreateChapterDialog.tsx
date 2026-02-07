"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Chapter } from "@prisma/client";

interface CreateChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  onChapterCreated: (chapter: Chapter) => void;
}

export function CreateChapterDialog({
  open,
  onOpenChange,
  storyId,
  onChapterCreated,
}: CreateChapterDialogProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, storyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create chapter");
        return;
      }

      const newChapter = await response.json();
      onChapterCreated(newChapter);
      setTitle("");
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
          <DialogTitle>Create New Chapter</DialogTitle>
          <DialogDescription>
            Give your chapter a title. You can start writing after creating it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title</Label>
              <Input
                id="title"
                placeholder="Chapter 1: The Beginning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              {loading ? "Creating..." : "Create Chapter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

