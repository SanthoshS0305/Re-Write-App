"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { DiffMatchPatch } from "diff-match-patch";
import type { Scene, SceneVersion } from "./types";

interface SceneDiffProps {
  scene: Scene | null;
  version: SceneVersion | null;
  chapterId: string;
}

export function SceneDiff({ scene, version, chapterId }: SceneDiffProps) {
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [diffHtml, setDiffHtml] = useState<string>("");
  const [showDiff, setShowDiff] = useState(false);
  const [compareVersion, setCompareVersion] = useState<SceneVersion | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: version?.content || null,
    editable: false,
  });

  useEffect(() => {
    if (version && editor) {
      editor.commands.setContent(version.content);
    }
  }, [version, editor]);

  useEffect(() => {
    if (scene && !currentContent) {
      // Load current scene content from chapter
      const loadCurrentContent = async () => {
        try {
          const response = await fetch(`/api/chapters/${chapterId}`);
          if (response.ok) {
            const chapter = await response.json();
            // Extract scene content from chapter content
            // This is simplified - in reality, you'd need to extract based on startPos/endPos
            setCurrentContent(chapter.content);
          }
        } catch (error) {
          console.error("Failed to load current content:", error);
        }
      };
      loadCurrentContent();
    }
  }, [scene, chapterId, currentContent]);

  const handleShowDiff = () => {
    if (!version || !currentContent) return;

    const dmp = new DiffMatchPatch();
    const text1 = JSON.stringify(currentContent, null, 2);
    const text2 = JSON.stringify(version.content, null, 2);
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
        // Insertion
        html += `<span class="bg-green-200 dark:bg-green-900">${escaped}</span>`;
      } else if (op === -1) {
        // Deletion
        html += `<span class="bg-red-200 dark:bg-red-900">${escaped}</span>`;
      } else {
        html += escaped;
      }
    });

    setDiffHtml(html);
    setShowDiff(true);
  };

  const handleApplyVersion = async () => {
    if (!scene || !version) return;

    try {
      const response = await fetch(`/api/scenes/${scene.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });

      if (response.ok) {
        // Reload or update UI
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to apply version:", error);
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Preview</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleShowDiff}>
            Show Diff
          </Button>
          <Button size="sm" onClick={handleApplyVersion}>
            Apply Version
          </Button>
        </div>
      </div>
      <ScrollArea className="h-full">
        {showDiff && diffHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
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

