"use client";

import { useState, useEffect } from "react";
import { Editor } from "./Editor";
import { EditorToolbar } from "./EditorToolbar";
import { SceneManager } from "@/components/scene-manager/SceneManager";
import { VersionManager } from "@/components/version-manager/VersionManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { JSONContent } from "@tiptap/core";
import type { Chapter, Story } from "@prisma/client";
import type { Editor as TiptapEditor } from "@tiptap/react";

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
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");
  const [isOnline, setIsOnline] = useState(true);
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false);
  const [isVersionManagerOpen, setIsVersionManagerOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("synced");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useAutoSave({
    content,
    chapterId: initialChapter.id,
    enabled: isOnline,
  });

  const wordCount = countWords(content);
  const charCount = countCharacters(content);

  const handleContentUpdate = (newContent: JSONContent) => {
    setContent(newContent);
    if (isOnline) {
      setSyncStatus("syncing");
      // Status will be updated by auto-save hook or manual save
      setTimeout(() => setSyncStatus("synced"), 1000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bg-dark-mint-green inset-0" />
        <img 
          src="/images/forest_bg.jpg" 
          alt="" 
          className="absolute max-w-none object-cover opacity-40 w-full h-full"
        />
      </div>

      <div className="relative z-10">
        {/* Toolbar */}
        <header className="bg-dark-green shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-[120px] flex items-center gap-[10px] px-[10px]">
        {/* Logo */}
        <div className="flex items-center justify-center h-full px-[10px] shrink-0">
          <div className="font-display text-[64px] text-aqua leading-none">
            <span>Re</span>
            <span>:</span>
          </div>
        </div>

        {/* Chapter/Dropdowns Section */}
        <div className="flex flex-col gap-[5px] px-[10px] shrink-0">
          {/* Chapter Name Input */}
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
          
          {/* Menu Items */}
          <div className="flex gap-[10px] font-display text-[24px] text-white">
            <button className="hover:opacity-80 transition-opacity">File</button>
            <button className="hover:opacity-80 transition-opacity">Edit</button>
            <button 
              className="hover:opacity-80 transition-opacity"
              onClick={() => setIsSceneManagerOpen(true)}
            >
              Scenes
            </button>
            <button 
              className="hover:opacity-80 transition-opacity"
              onClick={() => setIsVersionManagerOpen(true)}
            >
              Versions
            </button>
          </div>
        </div>

        {/* Primary Toolbar - Formatting Tools */}
        <div className="flex-1 flex items-center justify-center">
          {editorInstance && (
            <EditorToolbar 
              editor={editorInstance} 
              chapterId={initialChapter.id}
              onSceneManagerOpen={() => setIsSceneManagerOpen(true)}
              onVersionManagerOpen={() => setIsVersionManagerOpen(true)}
            />
          )}
        </div>

        {/* Scene Manager Button */}
        <button
          onClick={() => setIsSceneManagerOpen(true)}
          className="bg-dark-green-highlight flex items-center justify-center px-4 py-4 rounded-[30px] shrink-0 h-[63px] hover:opacity-90 transition-opacity"
        >
          <span className="font-display text-[24px] text-white whitespace-nowrap">
            Scene Manager
          </span>
        </button>

        {/* Version History Button */}
        <button
          onClick={() => setIsVersionManagerOpen(true)}
          className="bg-dark-green-highlight flex items-center justify-center px-4 py-4 rounded-[30px] shrink-0 h-[63px] hover:opacity-90 transition-opacity"
        >
          <span className="font-display text-[24px] text-white whitespace-nowrap">
            Version History
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex justify-center py-[40px] px-[30px]">
        <div className="w-[800px] bg-dark-page shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] min-h-[940px] rounded-lg overflow-hidden">
          <Editor
            content={content}
            onUpdate={handleContentUpdate}
            chapterId={initialChapter.id}
            onSceneManagerOpen={() => setIsSceneManagerOpen(true)}
            onVersionManagerOpen={() => setIsVersionManagerOpen(true)}
            showToolbarInHeader={true}
            onEditorReady={setEditorInstance}
          />
        </div>
      </main>

      <SceneManager
        open={isSceneManagerOpen}
        onOpenChange={setIsSceneManagerOpen}
        chapterId={initialChapter.id}
      />
      <VersionManager
        open={isVersionManagerOpen}
        onOpenChange={setIsVersionManagerOpen}
        chapterId={initialChapter.id}
      />

        {/* Attribution */}
        <div className="pb-4 text-center">
          <p className="attribution text-xs text-white/60 leading-relaxed max-w-4xl mx-auto px-4">
            &quot;<a rel="noopener noreferrer" href="https://www.flickr.com/photos/91171136@N03/10003026715" className="text-aqua hover:underline">Serra de Sintra, Portugal</a>&quot; by <a rel="noopener noreferrer" href="https://www.flickr.com/photos/91171136@N03" className="text-aqua hover:underline">Joao Ferrao dos Santos</a> is licensed under <a rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc/2.0/?ref=openverse" className="text-aqua hover:underline inline-flex items-center gap-1">CC BY-NC 2.0 <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" className="h-4 w-4 inline" alt="CC" /><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" className="h-4 w-4 inline" alt="BY" /><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" className="h-4 w-4 inline" alt="NC" /></a>.
          </p>
        </div>
      </div>
    </div>
  );
}

