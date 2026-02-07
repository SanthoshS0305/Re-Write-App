"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { DiffMatchPatch } from "diff-match-patch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChapterVersion } from "./types";

interface VersionDiffProps {
  version1: ChapterVersion | null;
  version2: ChapterVersion | null;
  chapterId: string;
}

export function VersionDiff({ version1, version2, chapterId }: VersionDiffProps) {
  const editor1 = useEditor({
    extensions: editorExtensions,
    content: version1?.content || null,
    editable: false,
  });

  const editor2 = useEditor({
    extensions: editorExtensions,
    content: version2?.content || null,
    editable: false,
  });

  const generateDiff = () => {
    if (!version1 || !version2) return "";

    const dmp = new DiffMatchPatch();
    const text1 = JSON.stringify(version1.content, null, 2);
    const text2 = JSON.stringify(version2.content, null, 2);
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
        // Insertion (green)
        html += `<span class="bg-green-200 dark:bg-green-900">${escaped}</span>`;
      } else if (op === -1) {
        // Deletion (red)
        html += `<span class="bg-red-200 dark:bg-red-900">${escaped}</span>`;
      } else {
        html += escaped;
      }
    });

    return html;
  };

  if (!version1 && !version2) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select versions to compare
      </div>
    );
  }

  if (!version2) {
    return (
      <div className="p-4">
        <h3 className="font-semibold mb-4">
          {version1?.label || new Date(version1!.createdAt).toLocaleString()}
        </h3>
        <ScrollArea className="h-full">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <EditorContent editor={editor1} />
          </div>
        </ScrollArea>
      </div>
    );
  }

  const diffHtml = generateDiff();

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold">
            {version1?.label || new Date(version1!.createdAt).toLocaleString()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {version1?.wordCount} words
          </p>
        </div>
        <div>
          <h3 className="font-semibold">
            {version2?.label || new Date(version2!.createdAt).toLocaleString()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {version2?.wordCount} words
          </p>
        </div>
      </div>
      <ScrollArea className="h-full">
        {diffHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none font-mono text-xs"
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <EditorContent editor={editor1} />
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <EditorContent editor={editor2} />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

