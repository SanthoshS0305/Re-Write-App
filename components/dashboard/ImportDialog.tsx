"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { importFromRewr, validateRewrFile } from "@/lib/utils/rewr-format";
import { useRouter } from "next/navigation";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".rewr")) {
      setError("Please select a .rewr file");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateRewrFile(data)) {
        setError("Invalid .rewr file format");
        return;
      }

      setPreview(importFromRewr(data));
      setError("");
    } catch (err) {
      setError("Failed to parse file. Please ensure it's a valid .rewr file.");
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      // Create story if needed
      const storyResponse = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: preview.story.title }),
      });

      if (!storyResponse.ok) {
        throw new Error("Failed to create story");
      }

      const story = await storyResponse.json();

      // Create chapter
      const chapterResponse = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: preview.chapter.title,
          storyId: story.id,
          content: preview.chapter.content,
        }),
      });

      if (!chapterResponse.ok) {
        throw new Error("Failed to create chapter");
      }

      const chapter = await chapterResponse.json();

      // Import scenes and versions would be done via separate API calls
      // For now, just redirect to the editor
      router.push(`/editor/${chapter.id}`);
      onOpenChange(false);
    } catch (err) {
      setError("Failed to import. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Chapter</DialogTitle>
          <DialogDescription>
            Select a .rewr file to import a chapter
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select .rewr file</Label>
            <Input
              id="file"
              type="file"
              accept=".rewr"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </div>
          {preview && (
            <div className="border rounded p-4 space-y-2">
              <h4 className="font-semibold">Preview</h4>
              <p className="text-sm">
                <strong>Story:</strong> {preview.story.title}
              </p>
              <p className="text-sm">
                <strong>Chapter:</strong> {preview.chapter.title}
              </p>
              <p className="text-sm">
                <strong>Scenes:</strong> {preview.scenes.length}
              </p>
              <p className="text-sm">
                <strong>Versions:</strong> {preview.versions.length}
              </p>
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

