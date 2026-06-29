"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ChapterList } from "@/components/dashboard/ChapterList";
import { CreateChapterDialog } from "@/components/dashboard/CreateChapterDialog";
import type { Story } from "@/types/dashboard";

interface StoryDetailContentProps {
  storyId: string;
}

async function fetchStory(storyId: string): Promise<Story> {
  const res = await fetch(`/api/stories/${storyId}`);
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error("Failed to fetch story");
  const json = await res.json();
  return json.data;
}

export function StoryDetailContent({ storyId }: StoryDetailContentProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: story, isLoading, isError, error } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () => fetchStory(storyId),
  });

  useEffect(() => {
    if (isError && error instanceof Error && error.message === "not_found") {
      router.push("/dashboard");
    }
  }, [isError, error, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--dark-mint-green)" }}
      >
        <p className="font-display text-[20px]" style={{ color: "var(--light-gray)", opacity: 0.5 }}>
          Loading...
        </p>
      </div>
    );
  }

  if (isError || !story) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--dark-mint-green)" }} />
        <img
          src="/images/forest_bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="flex items-center gap-[10px] px-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] shrink-0"
          style={{ backgroundColor: "var(--dark-green)", minHeight: "80px" }}
        >
          <div className="flex items-center justify-center h-full px-[10px] shrink-0">
            <span className="font-display leading-none" style={{ fontSize: "48px" }}>
              <span style={{ color: "var(--aqua)" }}>Re</span>
              <span style={{ color: "black" }}>:</span>
              <span style={{ color: "var(--light-gray)" }}>Write</span>
            </span>
          </div>
          <div className="flex-1" />
          <Link href="/dashboard">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] transition-opacity hover:opacity-80"
              style={{ color: "var(--light-gray)", backgroundColor: "var(--dark-green-highlight)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
        </header>

        {/* Main */}
        <main className="flex-1 px-12 py-10">
          {/* Page heading */}
          <div className="fade-up mb-10 flex items-end justify-between">
            <div>
              <p className="font-display text-[20px] mb-1" style={{ color: "var(--aqua)" }}>
                {story.chapters.length} {story.chapters.length === 1 ? "chapter" : "chapters"}
              </p>
              <h1 className="font-display text-[56px] leading-none" style={{ color: "var(--light-gray)" }}>
                {story.title}
              </h1>
            </div>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 rounded-[30px] px-6 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--green-highlight)" }}
            >
              <Plus className="h-5 w-5" />
              New Chapter
            </button>
          </div>

          {story.chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                This story doesn&apos;t have any chapters yet.
              </p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="rounded-[30px] px-8 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--green-highlight)" }}
              >
                Create Your First Chapter
              </button>
            </div>
          ) : (
            <ChapterList chapters={story.chapters} storyId={story.id} />
          )}
        </main>
      </div>

      <CreateChapterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        storyId={story.id}
      />
    </div>
  );
}
