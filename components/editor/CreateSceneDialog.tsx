"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";

interface CreateSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  startPos: number;
  endPos: number;
  editor: Editor;
  onSceneCreated: () => void;
  anchorY?: number;
}

export function CreateSceneDialog({
  open,
  onOpenChange,
  chapterId,
  startPos,
  endPos,
  editor,
  onSceneCreated,
  anchorY,
}: CreateSceneDialogProps) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLabel("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const selectedContent = editor.state.doc.slice(startPos, endPos).toJSON();
      const response = await fetch(`/api/chapters/${chapterId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), startPos, endPos, content: selectedContent }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create scene");
        return;
      }
      onSceneCreated();
      setLabel("");
      onOpenChange(false);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Position to the left of the 800px centered canvas
  // Canvas left edge = 50vw - 400px; popup appears just outside it
  const panelWidth = 280;
  const topOffset = anchorY != null ? anchorY - 80 : window.innerHeight / 2 - 80;

  const panel = (
    <>
      {/* Backdrop to close on outside click */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 49 }}
        onClick={() => onOpenChange(false)}
      />
      <div
        style={{
          position: "fixed",
          zIndex: 50,
          top: topOffset,
          left: `calc(50vw + 416px)`,
          width: panelWidth,
          backgroundColor: "var(--dark-green)",
          border: "1px solid var(--dark-green-highlight)",
          borderRadius: 10,
          padding: "20px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <p
          style={{
            fontFamily: "Joan, serif",
            fontSize: 20,
            color: "var(--light-gray)",
            marginBottom: 4,
          }}
        >
          Create Scene
        </p>
        <p
          style={{
            fontFamily: "Joan, serif",
            fontSize: 13,
            color: "var(--light-gray)",
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          Give this scene a label.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            ref={inputRef}
            placeholder="Scene label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            style={{
              backgroundColor: "var(--mint-green)",
              border: "2px solid black",
              borderRadius: 16,
              padding: "6px 12px",
              fontFamily: "Joan, serif",
              fontSize: 16,
              color: "black",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#f87171", fontSize: 13, fontFamily: "Joan, serif" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                background: "none",
                border: "none",
                fontFamily: "Joan, serif",
                fontSize: 14,
                color: "var(--light-gray)",
                opacity: 0.7,
                cursor: "pointer",
                padding: "6px 10px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "var(--green-highlight)",
                border: "2px solid black",
                borderRadius: 16,
                padding: "6px 16px",
                fontFamily: "Joan, serif",
                fontSize: 14,
                color: "black",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Creating..." : "Create Scene"}
            </button>
          </div>
        </form>
      </div>
    </>
  );

  return typeof window !== "undefined" ? createPortal(panel, document.body) : null;
}
