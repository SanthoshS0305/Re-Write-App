export type Chapter = {
  id: string;
  title: string;
  order: number;
  wordCount: number | null;
  previewText: string;
  storyId: string;
  createdAt: string;
  updatedAt: string;
};

export type Story = {
  id: string;
  title: string;
  userId: string;
  pinned: boolean;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};
