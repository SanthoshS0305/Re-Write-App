export interface ChapterVersion {
  id: string;
  label: string | null;
  content: any; // ProseMirror JSON
  wordCount: number;
  scenesState: any;
  chapterId: string;
  createdAt: string;
}

