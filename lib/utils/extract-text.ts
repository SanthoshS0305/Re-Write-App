import type { JSONContent } from "@tiptap/core";

/**
 * Extracts plain text from a ProseMirror JSONContent document.
 * Block nodes (paragraphs, headings) are separated by newlines.
 */
export function extractTextFromJSON(doc: JSONContent | null | undefined): string {
  if (!doc) return "";
  const parts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
    // Add a newline after block-level nodes so diffs are readable line-by-line
    const blockTypes = ["paragraph", "heading", "blockquote", "listItem", "bulletList", "orderedList", "codeBlock"];
    if (node.type && blockTypes.includes(node.type)) {
      parts.push("\n");
    }
  }

  walk(doc);
  return parts.join("").trim();
}
