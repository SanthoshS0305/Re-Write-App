export type Chapter = {
  id: string;
  title: string;
  order: number;
  wordCount: number | null;
  storyId: string;
  createdAt: string;
  updatedAt: string;
};

export type Story = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};
