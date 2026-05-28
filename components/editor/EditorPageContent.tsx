"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "./Editor";
import { EditorToolbar } from "./EditorToolbar";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { SceneManager } from "@/components/scene-manager/SceneManager";
import { VersionManager } from "@/components/version-manager/VersionManager";
import { ConflictResolutionDialog } from "@/components/offline/ConflictResolutionDialog";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { countWords } from "@/lib/utils/word-count";
import { validateRewrFile, importFromRewr } from "@/lib/utils/rewr-format";
import type { JSONContent } from "@tiptap/core";
import type { Chapter, Story } from "@prisma/client";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import Link from "next/link";

type ChapterWithStory = Chapter & {
  story: Story;
};

interface EditorPageContentProps {
  chapter: ChapterWithStory;
}

export function EditorPageContent({ chapter: initialChapter }: EditorPageContentProps) {
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState<JSONContent>(
    (initialChapter.content as JSONContent) || {
      type: "doc",
      content: [{ type: "paragraph" }],
    }
  );
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false);
  const [isVersionManagerOpen, setIsVersionManagerOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const [chapterTitle, setChapterTitle] = useState(initialChapter.title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom scrollbar state
  const mainRef = useRef<HTMLDivElement>(null);
  const [scrollMeta, setScrollMeta] = useState({ scrollTop: 0, scrollHeight: 1, clientHeight: 1 });
  const [sbHover, setSbHover] = useState(false);
  const [tooltipY, setTooltipY] = useState(0);

  const PAGE_HEIGHT = 1123;
  const PAGE_GAP = 20;
  const PAGE_STEP = PAGE_HEIGHT + PAGE_GAP;

  const handleScroll = () => {
    const el = mainRef.current;
    if (!el) return;
    setScrollMeta({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
  };

  const { scrollTop, scrollHeight, clientHeight } = scrollMeta;
  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  const thumbHeight = Math.max(40, (clientHeight / Math.max(1, scrollHeight)) * clientHeight);
  const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbHeight);
  const totalPages = Math.max(1, Math.ceil(scrollHeight / PAGE_STEP));
  const hoverPage = Math.max(1, Math.min(totalPages, Math.floor(((tooltipY / clientHeight) * maxScroll) / PAGE_STEP) + 1));

  const handleTitleRename = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === initialChapter.title) return;
    try {
      await fetch(`/api/chapters/${initialChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    } catch (err) {
      console.error("Failed to rename chapter:", err);
    }
  };

  // Offline sync — replaces manual online/offline detection
  const { isOnline, isSyncing, conflicts, handleConflictResolution } = useOfflineSync();

  // Auto-save with offline awareness
  useAutoSave({ content, chapterId: initialChapter.id, isOnline });

  const syncStatus: "synced" | "syncing" | "offline" = !isOnline
    ? "offline"
    : isSyncing
    ? "syncing"
    : "synced";

  const wordCount = countWords(content);

  // When only one panel can be open at a time
  const openSceneManager = () => {
    setIsVersionManagerOpen(false);
    setIsSceneManagerOpen(true);
  };
  const openVersionManager = () => {
    setIsSceneManagerOpen(false);
    setIsVersionManagerOpen(true);
  };

  const handleContentUpdate = (newContent: JSONContent) => {
    setContent(newContent);
  };

  // Scene version applied in-place
  const handleVersionApplied = (
    sceneId: string,
    versionContent: any,
    startPos: number,
    endPos: number
  ) => {
    if (!editorInstance) return;
    const nodes = versionContent?.content ?? [];
    editorInstance
      .chain()
      .focus()
      .deleteRange({ from: startPos, to: endPos })
      .insertContentAt(startPos, nodes)
      .run();
  };

  // Chapter version restored in-place
  const handleVersionRestored = (restoredContent: any) => {
    if (editorInstance) {
      editorInstance.commands.setContent(restoredContent);
    }
    setContent(restoredContent);
  };

  // Scene deleted — reload editor scenes
  const handleSceneDeleted = () => {
    if (editorInstance) {
      const sceneExt = editorInstance.extensionManager.extensions.find(
        (ext) => ext.name === "scene"
      );
      if (sceneExt) {
        // Refetch scenes from server
        fetch(`/api/chapters/${initialChapter.id}/scenes`)
          .then((r) => r.json())
          .then((data) => {
            (sceneExt.storage as any).scenes = data;
            (sceneExt.storage as any).pendingPositionUpdates = [];
            editorInstance.view.dispatch(editorInstance.state.tr);
          })
          .catch(console.error);
      }
    }
  };

  // Export chapter as .rewr
  const handleExportChapter = async () => {
    try {
      const response = await fetch(`/api/chapters/${initialChapter.id}/export`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${initialChapter.title}.rewr`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Import .rewr file into editor
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!validateRewrFile(data)) {
          alert("Invalid .rewr file.");
          return;
        }
        const parsed = importFromRewr(data);
        if (editorInstance && parsed.chapter.content) {
          editorInstance.commands.setContent(parsed.chapter.content);
          setContent(parsed.chapter.content);
        }
      } catch {
        alert("Failed to parse .rewr file.");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Background — fixed behind everything */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--dark-mint-green)" }} />
        <img
          src="/images/forest_bg.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
      </div>

      {/* Header — persistent, never scrolls */}
      <header
        className="shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-[10px] px-[10px] overflow-clip shrink-0"
        style={{ backgroundColor: "var(--dark-green)", minHeight: "120px", maxHeight: "120px", position: "relative", zIndex: 10 }}
      >
          {/* Logo */}
          <div className="flex items-center justify-center h-full px-[10px] shrink-0">
            <Link href="/dashboard">
              <img src="/images/icon.png" alt="Re:Write" style={{ height: 96, width: 96, borderRadius: 16, cursor: "pointer", display: "block" }} />
            </Link>
          </div>

          {/* Chapter name + menu */}
          <div className="flex flex-col gap-[5px] px-[10px] shrink-0">
            <div className="flex gap-[5px] items-center py-[5px]">
              <input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                onBlur={(e) => handleTitleRename(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                className="font-display whitespace-nowrap px-[10px] rounded-[20px] min-h-[41px] outline-none"
                style={{
                  backgroundColor: "var(--mint-green)",
                  border: "1px solid white",
                  color: "black",
                  fontSize: 18,
                  minWidth: 120,
                  width: `${Math.max(chapterTitle.length, 8)}ch`,
                  maxWidth: 260,
                }}
              />
            </div>

            <div className="flex gap-[10px] font-display items-center" style={{ color: "white", fontSize: 16 }}>
              {/* Story name — links back to story */}
              <Link
                href={`/dashboard/stories/${initialChapter.story.id}`}
                style={{ color: "var(--aqua)", fontFamily: "inherit", fontSize: "inherit", textDecoration: "none" }}
                className="hover:opacity-70 transition-opacity whitespace-nowrap"
              >
                {initialChapter.story.title}
              </Link>
              <span style={{ opacity: 0.3 }}>|</span>

              {/* File menu */}
              <DropdownMenu>
                <DropdownMenuTrigger style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "white", fontFamily: "inherit", fontSize: "inherit", opacity: 1 }} className="hover:opacity-70 transition-opacity">
                  File
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}>
                  <DropdownMenuItem onClick={handleExportChapter} style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}>
                    Export Chapter (.rewr)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}>
                    Open Local File (.rewr)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "white", fontFamily: "inherit", fontSize: "inherit" }}
                className="hover:opacity-70 transition-opacity"
                onClick={openSceneManager}
              >
                Scenes
              </button>
              <button
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "white", fontFamily: "inherit", fontSize: "inherit" }}
                className="hover:opacity-70 transition-opacity"
                onClick={openVersionManager}
              >
                Versions
              </button>
            </div>
          </div>

          {/* Save indicator + word count + Formatting toolbar */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {/* Status — left of toolbar */}
            <div className="flex flex-col items-center shrink-0" style={{ gap: 2 }}>
              <AutoSaveIndicator status={syncStatus} textHidden />
              <span className="font-display" style={{ color: "white", opacity: 0.6, fontSize: 10 }}>{wordCount}w</span>
            </div>
            {editorInstance && (
              <EditorToolbar
                editor={editorInstance}
                chapterId={initialChapter.id}
                onSceneManagerOpen={openSceneManager}
                onVersionManagerOpen={openVersionManager}
              />
            )}
          </div>

          {/* Quick-access buttons */}
          <div className="flex items-center gap-3 shrink-0 pr-2">
            <button
              onClick={openSceneManager}
              className="flex items-center justify-center px-4 rounded-[30px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--dark-green-highlight)", padding: "12px 16px" }}
            >
              <span className="font-display whitespace-nowrap" style={{ fontSize: 16, color: "white" }}>
                Scene Manager
              </span>
            </button>
            <button
              onClick={openVersionManager}
              className="flex items-center justify-center rounded-[30px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--dark-green-highlight)", padding: "12px 16px" }}
            >
              <span className="font-display whitespace-nowrap" style={{ fontSize: 16, color: "white" }}>
                Version History
              </span>
            </button>
          </div>
        </header>

      {/* Scrollable editor area + custom scrollbar wrapper */}
      <div
        className="transition-all duration-300"
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          zIndex: 5,
          marginRight: isSceneManagerOpen || isVersionManagerOpen ? "640px" : "0px",
        }}
      >
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="editor-scroll"
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            display: "flex",
            justifyContent: "center",
            padding: "40px 50px 40px 30px",
          }}
        >
          <div
            className="w-[800px] relative"
            style={{
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              backgroundColor: resolvedTheme === "dark"
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(255, 255, 255, 0.92)",
              alignSelf: "flex-start",
              minHeight: `${PAGE_STEP}px`,
            }}
          >
            <Editor
              content={content}
              onUpdate={handleContentUpdate}
              chapterId={initialChapter.id}
              onSceneManagerOpen={openSceneManager}
              onVersionManagerOpen={openVersionManager}
              showToolbarInHeader={true}
              onEditorReady={setEditorInstance}
            />
            {/* Page break overlay — pointer-events:none so it doesn't block editing */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage: resolvedTheme === "dark"
                  ? `repeating-linear-gradient(to bottom, transparent 0, transparent ${PAGE_HEIGHT}px, rgba(30,46,43,0.95) ${PAGE_HEIGHT}px, rgba(30,46,43,0.95) ${PAGE_STEP}px)`
                  : `repeating-linear-gradient(to bottom, transparent 0, transparent ${PAGE_HEIGHT}px, rgba(180,230,222,0.95) ${PAGE_HEIGHT}px, rgba(180,230,222,0.95) ${PAGE_STEP}px)`,
                zIndex: 2,
              }}
            />
          </div>
        </main>

        {/* Custom scrollbar */}
        <div
          style={{
            position: "absolute",
            right: 6,
            top: 8,
            bottom: 8,
            width: 8,
            zIndex: 20,
            cursor: "pointer",
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipY(e.clientY - rect.top);
          }}
          onMouseEnter={() => setSbHover(true)}
          onMouseLeave={() => setSbHover(false)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const frac = (e.clientY - rect.top) / rect.height;
            if (mainRef.current) mainRef.current.scrollTop = frac * maxScroll;
          }}
        >
          {/* Track */}
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4 }} />
          {/* Thumb */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: thumbTop,
              height: thumbHeight,
              backgroundColor: sbHover ? "rgba(63,208,201,0.75)" : "rgba(255,255,255,0.3)",
              borderRadius: 4,
              transition: "background-color 0.15s",
            }}
          />
          {/* Page number tooltip */}
          {sbHover && (
            <div
              className="font-display"
              style={{
                position: "absolute",
                right: 14,
                top: Math.max(0, tooltipY - 14),
                backgroundColor: "var(--dark-green)",
                border: "1px solid var(--dark-green-highlight)",
                color: "var(--light-gray)",
                fontSize: 13,
                padding: "3px 10px",
                borderRadius: 8,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 30,
              }}
            >
              Page {hoverPage} / {totalPages}
            </div>
          )}
        </div>
      </div>

      {/* Side panels (outside the shifted content area) */}
      <SceneManager
        open={isSceneManagerOpen}
        onOpenChange={setIsSceneManagerOpen}
        chapterId={initialChapter.id}
        editor={editorInstance}
        onSceneDeleted={handleSceneDeleted}
        onVersionApplied={handleVersionApplied}
      />
      <VersionManager
        open={isVersionManagerOpen}
        onOpenChange={setIsVersionManagerOpen}
        chapterId={initialChapter.id}
        onRestored={handleVersionRestored}
      />

      {/* Conflict resolution dialog */}
      <ConflictResolutionDialog
        conflict={conflicts[0] ?? null}
        onResolve={handleConflictResolution}
        onClose={() => {
          // If user closes without resolving, treat as "keep server"
          if (conflicts[0]) {
            handleConflictResolution(conflicts[0], "server");
          }
        }}
      />

      {/* Hidden file input for .rewr import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".rewr"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
  );
}
