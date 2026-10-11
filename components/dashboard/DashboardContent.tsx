"use client";

import { useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { StoryCard } from "@/components/dashboard/StoryCard";
import { StoryListRow } from "@/components/dashboard/StoryListRow";
import { ChapterResultRow } from "@/components/dashboard/ChapterResultRow";
import { CreateStoryDialog } from "@/components/dashboard/CreateStoryDialog";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sortStories,
  searchStories,
  type SortCriterion,
  type SearchFilterMode,
} from "@/lib/dashboard/sort-search";
import { useViewPreference } from "@/hooks/useViewPreference";
import { Upload, LogOut, Plus, Search, LayoutGrid, List as ListIcon } from "lucide-react";
import type { Story } from "@/types/dashboard";

async function fetchStories(): Promise<Story[]> {
  const res = await fetch("/api/stories");
  if (!res.ok) throw new Error("Failed to fetch stories");
  const json = await res.json();
  return json.data;
}

export function DashboardContent() {
  const { signOut } = useClerk();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<SearchFilterMode>("best");
  const { view, setView } = useViewPreference();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
  });

  const isSearching = searchQuery.trim().length > 0;

  const displayedStories = useMemo(
    () => sortStories(stories, sortCriterion),
    [stories, sortCriterion]
  );

  const searchResults = useMemo(
    () => searchStories(stories, searchQuery, filterMode),
    [stories, searchQuery, filterMode]
  );

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

          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--dark-green-highlight)" }}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="flex items-center gap-2 px-4 py-2 rounded-[20px] font-display text-[18px] transition-opacity hover:opacity-80"
            style={{ color: "var(--light-gray)" }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 px-12 py-10">
          {/* Page heading */}
          <div className="fade-up mb-10 flex items-end justify-between">
            <div>
              <p className="font-display text-[20px] mb-1" style={{ color: "var(--aqua)" }}>
                Hello, Author,
              </p>
              <h2 className="font-display text-[56px] leading-none" style={{ color: "var(--light-gray)" }}>
                Your Stories
              </h2>
            </div>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 rounded-[30px] px-6 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--green-highlight)" }}
            >
              <Plus className="h-5 w-5" />
              New Story
            </button>
          </div>

          {/* Controls: search + filter + sort */}
          <div className="fade-up mb-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2" style={{ flex: "1 1 480px", maxWidth: 480 }}>
              <Search className="h-4 w-4 shrink-0" style={{ color: "var(--light-gray)" }} />
              <Input
                placeholder="Search stories and chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search stories and chapters"
              />
            </div>

            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as SearchFilterMode)}>
              <SelectTrigger className="w-[160px]" aria-label="Search filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best match</SelectItem>
                <SelectItem value="story">Story title</SelectItem>
                <SelectItem value="chapter">Chapter title</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortCriterion} onValueChange={(v) => setSortCriterion(v as SortCriterion)}>
              <SelectTrigger className="w-[160px]" aria-label="Sort stories">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="length">Length</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ color: "var(--light-gray)", opacity: view === "grid" ? 1 : 0.5 }}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ color: "var(--light-gray)", opacity: view === "list" ? 1 : 0.5 }}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="font-display text-[20px]" style={{ color: "var(--light-gray)", opacity: 0.5 }}>
                Loading...
              </p>
            </div>
          ) : isSearching ? (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                  No matches for &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="fade-up fade-up-delay-1 flex flex-col gap-2">
                {searchResults.map((result) =>
                  result.type === "story" ? (
                    <StoryListRow key={`story-${result.story.id}`} story={result.story} />
                  ) : (
                    <ChapterResultRow
                      key={`chapter-${result.chapter.id}`}
                      chapter={result.chapter}
                      story={result.story}
                    />
                  )
                )}
              </div>
            )
          ) : displayedStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <p className="font-display text-[24px]" style={{ color: "var(--light-gray)", opacity: 0.6 }}>
                You don&apos;t have any stories yet.
              </p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="rounded-[30px] px-8 py-3 font-display text-[20px] text-black border-[3px] border-black transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--green-highlight)" }}
              >
                Create Your First Story
              </button>
            </div>
          ) : (
            <div
              className={
                view === "grid"
                  ? "fade-up fade-up-delay-1 grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "fade-up fade-up-delay-1 flex flex-col gap-2"
              }
            >
              {displayedStories.map((story) =>
                view === "grid" ? (
                  <StoryCard key={story.id} story={story} />
                ) : (
                  <StoryListRow key={story.id} story={story} />
                )
              )}
            </div>
          )}
        </main>
      </div>

      <CreateStoryDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <ImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
    </div>
  );
}
