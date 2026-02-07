"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Chapter } from "@prisma/client";

interface ChapterListProps {
  chapters: Chapter[];
  storyId: string;
  onChapterDeleted: (chapterId: string) => void;
}

export function ChapterList({
  chapters,
  storyId,
  onChapterDeleted,
}: ChapterListProps) {
  const handleDelete = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onChapterDeleted(chapterId);
      }
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter) => (
        <Card key={chapter.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{chapter.title}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{chapter.title}"? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(chapter.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardTitle>
            <CardDescription>
              {chapter.wordCount} words • Order: {chapter.order}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/editor/${chapter.id}`}>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Open Chapter
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

