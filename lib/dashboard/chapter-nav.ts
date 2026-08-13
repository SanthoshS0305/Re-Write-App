import type { Story, Chapter } from "@/types/dashboard";

// Latest updatedAt wins; ties break toward the lowest order.
export function getLastModifiedChapter(story: Story): Chapter | null {
  if (story.chapters.length === 0) return null;

  return [...story.chapters].sort((a, b) => {
    const byUpdatedAt = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (byUpdatedAt !== 0) return byUpdatedAt;
    return a.order - b.order;
  })[0];
}
