"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { DiffMatchPatch } from "diff-match-patch";
import { extractTextFromJSON } from "@/lib/utils/extract-text";
import type { Scene, SceneVersion } from "./types";

interface SceneDiffProps {
  scene: Scene | null;
  version: SceneVersion | null;
  chapterId: string;
  onVersionApplied?: (sceneId: string, content: any) => void;
}

export function SceneDiff({ scene, version, chapterId, onVersionApplied }: SceneDiffProps) {
  const [diffHtml, setDiffHtml] = useState<string>("");
  const [showDiff, setShowDiff] = useState(false);
  const [applying, setApplying] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: version?.content || null,
    editable: false,
  });

  useEffect(() => {
    if (version && editor) {
      editor.commands.setContent(version.content);
      setDiffHtml("");
      setShowDiff(false);
    }
  }, [version, editor]);

  const handleShowDiff = async () => {
    if (!version) return;
    let currentContent: any = null;
    try {
      const res = await fetch(`/api/chapters/${chapterId}`);
      if (res.ok) {
        const ch = await res.json();
        currentContent = ch.content;
      }
    } catch {
      return;
    }

    const dmp = new DiffMatchPatch();
    const text1 = extractTextFromJSON(currentContent);
    const text2 = extractTextFromJSON(version.content);
    const diffs = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diffs);

    let html = "";
    diffs.forEach(([op, text]) => {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      if (op === 1) {
        html += `<ins style="background:rgba(52,193,138,0.2);text-decoration:none">${escaped}</ins>`;
      } else if (op === -1) {
        html += `<del style="background:rgba(192,57,43,0.2)">${escaped}</del>`;
      } else {
        html += escaped;
      }
    });

    setDiffHtml(html);
    setShowDiff(true);
  };

  const handleApplyVersion = async () => {
    if (!scene || !version) return;
    setApplying(true);
    try {
      const response = await fetch(`/api/scenes/${scene.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      if (response.ok) {
        onVersionApplied?.(scene.id, version.content);
      }
    } catch (error) {
      console.error("Failed to apply version:", error);
    } finally {
      setApplying(false);
    }
  };

  if (!scene) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        Select a scene to view details
      </div>
    );
  }

  if (!version) {
    return (
      <div className="p-4 font-display" style={{ color: "var(--light-gray)", opacity: 0.6, fontSize: 14 }}>
        Select a version to preview
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
        <h3 className="font-display" style={{ color: "var(--light-gray)", fontSize: 18 }}>Preview</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={showDiff ? () => setShowDiff(false) : handleShowDiff}
            className="font-display"
            style={{
              backgroundColor: "var(--dark-green-highlight)",
              border: "none",
              borderRadius: 16,
              padding: "6px 12px",
              color: "var(--light-gray)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {showDiff ? "Hide Diff" : "Show Diff"}
          </button>
          <button
            onClick={handleApplyVersion}
            disabled={applying}
            className="font-display"
            style={{
              backgroundColor: "var(--green-highlight)",
              border: "2px solid black",
              borderRadius: 16,
              padding: "6px 12px",
              color: "black",
              fontSize: 13,
              cursor: applying ? "not-allowed" : "pointer",
              opacity: applying ? 0.7 : 1,
            }}
          >
            {applying ? "Applying..." : "Apply Version"}
          </button>
        </div>
      </div>
      <ScrollArea style={{ flex: 1 }}>
        {showDiff && diffHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none leading-relaxed font-display"
            style={{ color: "var(--light-gray)" }}
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none" style={{ color: "var(--light-gray)" }}>
            <EditorContent editor={editor} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
