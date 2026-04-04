"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/tiptap-config";
import { DiffMatchPatch } from "diff-match-patch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractTextFromJSON } from "@/lib/utils/extract-text";
import type { ChapterVersion } from "./types";

interface VersionDiffProps {
  version1: ChapterVersion | null;
  version2: ChapterVersion | null;
  chapterId: string;
}

export function VersionDiff({ version1, version2, chapterId }: VersionDiffProps) {
  const editor1 = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: version1?.content || null,
    editable: false,
  });

  const editor2 = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: version2?.content || null,
    editable: false,
  });

  useEffect(() => {
    if (editor1 && version1) editor1.commands.setContent(version1.content);
  }, [version1, editor1]);

  useEffect(() => {
    if (editor2 && version2) editor2.commands.setContent(version2.content);
  }, [version2, editor2]);

  if (!version1 && !version2) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select versions from the list to compare
      </div>
    );
  }

  // Single version preview
  if (!version2) {
    return (
      <div className="p-4 flex flex-col h-full">
        <h3 className="font-semibold mb-1">
          {version1?.label || new Date(version1!.createdAt).toLocaleString()}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{version1?.wordCount} words</p>
        <ScrollArea className="flex-1">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <EditorContent editor={editor1} />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Generate inline diff on the text content of both versions
  const generateDiffHtml = (): string => {
    const dmp = new DiffMatchPatch();
    const text1 = extractTextFromJSON(version1?.content);
    const text2 = extractTextFromJSON(version2.content);
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
    return html;
  };

  const wordDelta = (version2.wordCount ?? 0) - (version1?.wordCount ?? 0);

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      {/* Version labels */}
      <div className="grid grid-cols-2 gap-4 mb-3 shrink-0">
        <div>
          <p className="font-semibold text-sm truncate">
            {version1?.label || new Date(version1!.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{version1?.wordCount} words</p>
        </div>
        <div>
          <p className="font-semibold text-sm truncate">
            {version2.label || new Date(version2.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {version2.wordCount} words{" "}
            {wordDelta !== 0 && (
              <span className={wordDelta > 0 ? "text-green-600" : "text-red-500"}>
                ({wordDelta > 0 ? "+" : ""}{wordDelta})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Inline diff view */}
      <ScrollArea className="flex-1">
        <div
          className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: generateDiffHtml() }}
        />
      </ScrollArea>
    </div>
  );
}
