"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Chapter } from "@prisma/client";

interface CreateChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  onChapterCreated: (chapter: Chapter) => void;
}

export function CreateChapterDialog({ open, onOpenChange, storyId, onChapterCreated }: CreateChapterDialogProps) {
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
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)", borderRadius: 12, maxWidth: 480 }}>
        <DialogHeader>
          <DialogTitle className="font-display" style={{ color: "var(--light-gray)", fontSize: 24 }}>
            Create New Chapter
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "12px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="font-display" style={{ color: "var(--light-gray)", fontSize: 16, opacity: 0.8 }}>
                Chapter Title
              </label>
              <input
                placeholder="Chapter 1: The Beginning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="font-display"
                style={{
                  backgroundColor: "var(--mint-green)",
                  border: "3px solid black",
                  borderRadius: 20,
                  padding: "10px 18px",
                  fontSize: 18,
                  color: "black",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
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
              type="submit"
              disabled={loading}
              className="font-display"
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "3px solid black",
                borderRadius: 20,
                padding: "10px 20px",
                color: "black",
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating..." : "Create Chapter"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
