"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Save,
  Layers,
  History,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditorToolbarProps {
  editor: Editor;
  chapterId: string;
  onSceneManagerOpen?: () => void;
  onVersionManagerOpen?: () => void;
}

export function EditorToolbar({ editor, chapterId, onSceneManagerOpen, onVersionManagerOpen }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }
  const handleSave = async () => {
    const content = editor.getJSON();
    const response = await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      // Show success toast or indicator
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="bg-white flex items-start p-4 w-[891px]">
      <div className="flex flex-1 gap-12 items-start">
        {/* Text Formatting Group */}
        <div className="flex gap-6 items-start">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
          >
            <Bold className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
          >
            <Italic className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("underline") ? "bg-gray-200" : ""}`}
          >
            <Underline className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("strike") ? "bg-gray-200" : ""}`}
          >
            <span className="text-gray-700 text-sm font-bold line-through">S</span>
          </button>
        </div>

        {/* Block Formatting Group */}
        <div className="flex gap-6 items-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
              >
                <Heading1 className="h-6 w-6 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
          >
            <List className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}
          >
            <ListOrdered className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("blockquote") ? "bg-gray-200" : ""}`}
          >
            <span className="text-gray-700 text-xs">"</span>
          </button>
        </div>

        {/* Media/Content Group */}
        <div className="flex gap-6 items-start">
          <button
            type="button"
            onClick={setLink}
            className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded ${editor.isActive("link") ? "bg-gray-200" : ""}`}
          >
            <LinkIcon className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
          >
            <span className="text-gray-700 text-xs">Img</span>
          </button>
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
          >
            <span className="text-gray-700 text-xs">Vid</span>
          </button>
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
          >
            <span className="text-gray-700 text-xs">Code</span>
          </button>
        </div>
      </div>

      {/* More Options */}
      <div className="flex gap-6 items-start">
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <span className="text-gray-700 text-xs">←</span>
        </button>
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <span className="text-gray-700 text-xs">→</span>
        </button>
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <span className="text-gray-700 text-xs">⋯</span>
        </button>
      </div>
    </div>
  );
}

