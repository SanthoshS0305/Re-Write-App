import { useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/core";

interface UseAutoSaveOptions {
  content: JSONContent;
  chapterId: string;
  enabled?: boolean;
  interval?: number;
}

export function useAutoSave({
  content,
  chapterId,
  enabled = true,
  interval = 30000, // 30 seconds
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    const contentString = JSON.stringify(content);
    
    // Only save if content has changed
    if (contentString === lastSavedRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterId}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (response.ok) {
          lastSavedRef.current = contentString;
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, chapterId, enabled, interval]);
}

