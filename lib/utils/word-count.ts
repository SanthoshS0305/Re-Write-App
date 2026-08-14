import { JSONContent } from "@tiptap/core";

export function countWords(content: JSONContent | null | undefined): number {
  if (!content) return 0;

  let wordCount = 0;

  function traverse(node: JSONContent) {
    if (node.type === "text" && node.text) {
      const words = node.text.trim().split(/\s+/).filter((w) => w.length > 0);
      wordCount += words.length;
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return wordCount;
}

export function countCharacters(content: JSONContent | null | undefined): number {
  if (!content) return 0;

  let charCount = 0;

  function traverse(node: JSONContent) {
    if (node.type === "text" && node.text) {
      charCount += node.text.length;
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return charCount;
}

export function extractPreviewText(
  content: JSONContent | null | undefined,
  maxLength: number
): string {
  if (!content) return "";

  const parts: string[] = [];

  function traverse(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return parts.join(" ").slice(0, maxLength);
}

