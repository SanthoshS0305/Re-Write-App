"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

    // Fetch current chapter content to compare against
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
        html += `<ins class="bg-green-100 dark:bg-green-900 no-underline">${escaped}</ins>`;
      } else if (op === -1) {
        html += `<del class="bg-red-100 dark:bg-red-900">${escaped}</del>`;
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
      <div className="p-4 text-sm text-muted-foreground">
        Select a scene to view details
      </div>
    );
  }

  if (!version) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a version to preview
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold">Preview</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={showDiff ? () => setShowDiff(false) : handleShowDiff}
          >
            {showDiff ? "Hide Diff" : "Show Diff"}
          </Button>
          <Button size="sm" onClick={handleApplyVersion} disabled={applying}>
            {applying ? "Applying..." : "Apply Version"}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {showDiff && diffHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <EditorContent editor={editor} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
