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

type ChapterWithStory = Chapter & {
  story: Story;
};

interface EditorPageContentProps {
  chapter: ChapterWithStory;
}

export function EditorPageContent({ chapter: initialChapter }: EditorPageContentProps) {
  const [content, setContent] = useState<JSONContent>(
    (initialChapter.content as JSONContent) || {
      type: "doc",
      content: [{ type: "paragraph" }],
    }
  );
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false);
  const [isVersionManagerOpen, setIsVersionManagerOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            sceneExt.storage.scenes = data;
            sceneExt.storage.pendingPositionUpdates = [];
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bg-dark-mint-green inset-0" />
        <img
          src="/images/forest_bg.jpg"
          alt=""
          className="absolute max-w-none object-cover opacity-40 w-full h-full"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-dark-green shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-[120px] flex items-center gap-[10px] px-[10px]">
          {/* Logo */}
          <div className="flex items-center justify-center h-full px-[10px] shrink-0">
            <div className="font-display text-[64px] text-aqua leading-none">
              <span>Re</span>
              <span>:</span>
            </div>
          </div>

          {/* Chapter name + menu */}
          <div className="flex flex-col gap-[5px] px-[10px] shrink-0">
            <div className="flex gap-5 items-end py-[5px] w-[313px]">
              <div className="bg-mint-green border border-white rounded-[20px] flex-1 flex items-center px-[10px] min-h-[41px]">
                <span className="font-display text-[32px] text-black bg-transparent w-full">
                  {initialChapter.title}
                </span>
              </div>
              <div className="w-[41px] h-[41px] rounded-full bg-white/20 shrink-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/40" />
              </div>
            </div>

            <div className="flex gap-[10px] font-display text-[24px] text-white">
              {/* File menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="hover:opacity-80 transition-opacity">
                  File
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportChapter}>
                    Export Chapter (.rewr)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    Open Local File (.rewr)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="hover:opacity-80 transition-opacity"
                onClick={openSceneManager}
              >
                Scenes
              </button>
              <button
                className="hover:opacity-80 transition-opacity"
                onClick={openVersionManager}
              >
                Versions
              </button>
            </div>
          </div>

          {/* Formatting toolbar */}
          <div className="flex-1 flex items-center justify-center">
            {editorInstance && (
              <EditorToolbar
                editor={editorInstance}
                chapterId={initialChapter.id}
                onSceneManagerOpen={openSceneManager}
                onVersionManagerOpen={openVersionManager}
              />
            )}
          </div>

          {/* Status + quick-access buttons */}
          <div className="flex items-center gap-3 shrink-0 pr-2">
            <div className="flex flex-col items-end gap-1">
              <AutoSaveIndicator status={syncStatus} />
              <span className="text-xs text-white/60">{wordCount} words</span>
            </div>
            <button
              onClick={openSceneManager}
              className="bg-dark-green-highlight flex items-center justify-center px-4 py-4 rounded-[30px] h-[63px] hover:opacity-90 transition-opacity"
            >
              <span className="font-display text-[24px] text-white whitespace-nowrap">
                Scene Manager
              </span>
            </button>
            <button
              onClick={openVersionManager}
              className="bg-dark-green-highlight flex items-center justify-center px-4 py-4 rounded-[30px] h-[63px] hover:opacity-90 transition-opacity"
            >
              <span className="font-display text-[24px] text-white whitespace-nowrap">
                Version History
              </span>
            </button>
          </div>
        </header>

        {/* Main editor area — shifts left when a panel is open */}
        <main
          className="flex justify-center py-[40px] px-[30px] transition-all duration-300"
          style={{
            marginRight:
              isSceneManagerOpen || isVersionManagerOpen ? "640px" : "0px",
          }}
        >
          <div className="w-[800px] bg-dark-page shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] min-h-[940px] rounded-lg overflow-hidden">
            <Editor
              content={content}
              onUpdate={handleContentUpdate}
              chapterId={initialChapter.id}
              onSceneManagerOpen={openSceneManager}
              onVersionManagerOpen={openVersionManager}
              showToolbarInHeader={true}
              onEditorReady={setEditorInstance}
            />
          </div>
        </main>

        {/* Attribution */}
        <div
          className="pb-4 text-center transition-all duration-300"
          style={{
            marginRight:
              isSceneManagerOpen || isVersionManagerOpen ? "640px" : "0px",
          }}
        >
          <p className="attribution text-xs text-white/60 leading-relaxed max-w-4xl mx-auto px-4">
            &quot;
            <a
              rel="noopener noreferrer"
              href="https://www.flickr.com/photos/91171136@N03/10003026715"
              className="text-aqua hover:underline"
            >
              Serra de Sintra, Portugal
            </a>
            &quot; by{" "}
            <a
              rel="noopener noreferrer"
              href="https://www.flickr.com/photos/91171136@N03"
              className="text-aqua hover:underline"
            >
              Joao Ferrao dos Santos
            </a>{" "}
            is licensed under{" "}
            <a
              rel="noopener noreferrer"
              href="https://creativecommons.org/licenses/by-nc/2.0/?ref=openverse"
              className="text-aqua hover:underline inline-flex items-center gap-1"
            >
              CC BY-NC 2.0{" "}
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
                className="h-4 w-4 inline"
                alt="CC"
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
                className="h-4 w-4 inline"
                alt="BY"
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/nc.svg"
                className="h-4 w-4 inline"
                alt="NC"
              />
            </a>
            .
          </p>
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
