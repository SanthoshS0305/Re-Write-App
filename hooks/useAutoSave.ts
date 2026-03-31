import { useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/core";
import { saveToIndexedDB, addToSyncQueue } from "@/lib/offline/idb";

interface UseAutoSaveOptions {
  content: JSONContent;
  chapterId: string;
  isOnline?: boolean;
  interval?: number;
}

export function useAutoSave({
  content,
  chapterId,
  isOnline = true,
  interval = 30000, // 30 seconds
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const contentString = JSON.stringify(content);

    // Only save if content has changed
    if (contentString === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      const cachedData = {
        id: chapterId,
        content,
        updatedAt: new Date().toISOString(),
      };

      if (isOnline) {
        try {
          const response = await fetch(`/api/chapters/${chapterId}/autosave`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });

          if (response.ok) {
            // Mirror to IndexedDB so offline reads are up to date
            await saveToIndexedDB("chapters", chapterId, cachedData);
            lastSavedRef.current = contentString;
          }
        } catch {
          // Network failed — queue for sync
          await saveToIndexedDB("chapters", chapterId, cachedData);
          await addToSyncQueue("chapters", "chapters", "update", cachedData);
          lastSavedRef.current = contentString;
        }
      } else {
        // Offline — save locally and queue for later sync
        await saveToIndexedDB("chapters", chapterId, cachedData);
        await addToSyncQueue("chapters", "chapters", "update", cachedData);
        lastSavedRef.current = contentString;
      }
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, chapterId, isOnline, interval]);
}
