"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen } from "lucide-react";
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
} from "@/components/ui/dialog";
import type { Story } from "@prisma/client";
import type { Chapter } from "@prisma/client";

type StoryWithChapters = Story & {
  chapters: Chapter[];
};

interface StoryCardProps {
  story: StoryWithChapters;
  onDelete: (storyId: string) => void;
}

export function StoryCard({ story, onDelete }: StoryCardProps) {
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(story.id);
      }
    } catch (error) {
      console.error("Failed to delete story:", error);
    }
  };

  const chapterCount = story.chapters.length;
  const lastUpdated = new Date(story.updatedAt).toLocaleDateString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{story.title}</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Story</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{story.title}"? This will
                  also delete all chapters in this story. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
        <CardDescription>
          {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/stories/${story.id}`} className="w-full">
          <Button className="w-full" variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Open Story
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

