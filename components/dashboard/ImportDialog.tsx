"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    } catch {
      setError("Failed to parse file. Please ensure it's a valid .rewr file.");
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const storyResponse = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: preview.story.title }),
      });
      if (!storyResponse.ok) throw new Error("Failed to create story");
      const storyJson = await storyResponse.json();
      const story = storyJson.data;

      const chapterResponse = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: preview.chapter.title, storyId: story.id, content: preview.chapter.content }),
      });
      if (!chapterResponse.ok) throw new Error("Failed to create chapter");
      const chapterJson = await chapterResponse.json();
      const chapter = chapterJson.data;

      router.push(`/editor/${chapter.id}`);
      onOpenChange(false);
    } catch {
      setError("Failed to import. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)", borderRadius: 12, maxWidth: 480 }}>
        <DialogHeader>
          <DialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 24 }}>
            Import Chapter
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "12px 0" }}>
          {/* File picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="font-display" style={{ color: "var(--light-gray)", fontSize: 16, opacity: 0.8 }}>
              Select .rewr file
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-display"
              style={{
                backgroundColor: "var(--dark-green-highlight)",
                border: "1px solid var(--dark-green-highlight)",
                borderRadius: 20,
                padding: "10px 18px",
                color: "var(--light-gray)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Upload style={{ width: 16, height: 16 }} />
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".rewr"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div style={{ backgroundColor: "var(--dark-green-highlight)", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <p className="font-display" style={{ color: "var(--aqua)", fontSize: 14, marginBottom: 4 }}>Preview</p>
              <p className="font-display" style={{ color: "var(--light-gray)", fontSize: 14 }}>
                <span style={{ opacity: 0.6 }}>Story: </span>{preview.story.title}
              </p>
              <p className="font-display" style={{ color: "var(--light-gray)", fontSize: 14 }}>
                <span style={{ opacity: 0.6 }}>Chapter: </span>{preview.chapter.title}
              </p>
              <p className="font-display" style={{ color: "var(--light-gray)", fontSize: 14 }}>
                <span style={{ opacity: 0.6 }}>Scenes: </span>{preview.scenes.length}
              </p>
              <p className="font-display" style={{ color: "var(--light-gray)", fontSize: 14 }}>
                <span style={{ opacity: 0.6 }}>Versions: </span>{preview.versions.length}
              </p>
            </div>
          )}

          {error && (
            <p className="font-display" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="font-display"
            style={{
              backgroundColor: "var(--dark-green-highlight)",
              border: "none",
              borderRadius: 20,
              padding: "10px 20px",
              color: "var(--light-gray)",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!preview || loading}
            className="font-display"
            style={{
              backgroundColor: "var(--green-highlight)",
              border: "3px solid black",
              borderRadius: 20,
              padding: "10px 20px",
              color: "black",
              fontSize: 16,
              cursor: (!preview || loading) ? "not-allowed" : "pointer",
              opacity: (!preview || loading) ? 0.5 : 1,
            }}
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
