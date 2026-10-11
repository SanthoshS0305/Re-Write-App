"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Chapter } from "@/types/dashboard";

interface CreateChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
}

export function CreateChapterDialog({ open, onOpenChange, storyId }: CreateChapterDialogProps) {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (chapterTitle: string): Promise<Chapter> => {
      const response = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: chapterTitle, storyId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create chapter");
      }
      const json = await response.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
      setTitle("");
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) mutation.reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) mutation.mutate(title.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          backgroundColor: "var(--dark-green)",
          border: "1px solid var(--dark-green-highlight)",
          borderRadius: 12,
          maxWidth: 480,
        }}
      >
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
            {mutation.isError && (
              <p className="font-display" style={{ color: "#f87171", fontSize: 14 }}>
                {mutation.error instanceof Error ? mutation.error.message : "An error occurred. Please try again."}
              </p>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
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
              disabled={mutation.isPending}
              className="font-display"
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "3px solid black",
                borderRadius: 20,
                padding: "10px 20px",
                color: "black",
                fontSize: 16,
                cursor: mutation.isPending ? "not-allowed" : "pointer",
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              {mutation.isPending ? "Creating..." : "Create Chapter"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
