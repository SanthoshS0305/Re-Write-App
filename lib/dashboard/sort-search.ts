import type { Story } from "@/types/dashboard";

export type SortCriterion = "alphabetical" | "length" | "recent";
export type SearchFilterMode = "best" | "story" | "chapter";

export type SearchResult =
  | { type: "story"; story: Story }
  | { type: "chapter"; story: Story; chapter: Story["chapters"][number] };

function totalWordCount(story: Story): number {
  return story.chapters.reduce((sum, chapter) => sum + (chapter.wordCount ?? 0), 0);
}

function compareByCriterion(a: Story, b: Story, criterion: SortCriterion): number {
  switch (criterion) {
    case "alphabetical":
      return a.title.localeCompare(b.title);
    case "length":
      return totalWordCount(b) - totalWordCount(a);
    case "recent":
      return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
  }
}

export function sortStories(stories: Story[], criterion: SortCriterion): Story[] {
  const pinned = stories.filter((s) => s.pinned).sort((a, b) => compareByCriterion(a, b, criterion));
  const unpinned = stories.filter((s) => !s.pinned).sort((a, b) => compareByCriterion(a, b, criterion));
  return [...pinned, ...unpinned];
}

type MatchTier = 0 | 1 | 2;

function matchTier(text: string, query: string): MatchTier | null {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (normalizedText === normalizedQuery) return 0;
  if (normalizedText.startsWith(normalizedQuery)) return 1;
  if (normalizedText.includes(normalizedQuery)) return 2;
  return null;
}

export function searchStories(
  stories: Story[],
  query: string,
  filterMode: SearchFilterMode
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const results: { result: SearchResult; tier: MatchTier }[] = [];

  for (const story of stories) {
    if (filterMode === "best" || filterMode === "story") {
      const tier = matchTier(story.title, trimmed);
      if (tier !== null) {
        results.push({ result: { type: "story", story }, tier });
      }
    }

    if (filterMode === "best" || filterMode === "chapter") {
      for (const chapter of story.chapters) {
        const tier = matchTier(chapter.title, trimmed);
        if (tier !== null) {
          results.push({ result: { type: "chapter", story, chapter }, tier });
        }
      }
    }
  }

  return results
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      const aTitle = a.result.type === "story" ? a.result.story.title : a.result.chapter.title;
      const bTitle = b.result.type === "story" ? b.result.story.title : b.result.chapter.title;
      return aTitle.localeCompare(bTitle);
    })
    .map((r) => r.result);
}
