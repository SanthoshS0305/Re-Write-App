"use client";

import type { Editor } from "@tiptap/react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type React from "react";

interface EditorToolbarProps {
  editor: Editor;
  chapterId: string;
  onSceneManagerOpen?: () => void;
  onVersionManagerOpen?: () => void;
}

export function EditorToolbar({ editor, chapterId, onSceneManagerOpen, onVersionManagerOpen }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const btn = (active = false): React.CSSProperties => ({
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    opacity: active ? 0.45 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s",
  });

  const iconStyle: React.CSSProperties = { color: "white", width: 18, height: 18 };

  return (
    <div
      className="flex items-center gap-7 w-full"
      style={{
        backgroundColor: "var(--dark-green-highlight)",
        borderRadius: 30,
        padding: "12px 20px",
      }}
    >
      {/* Text */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <button type="button" style={btn(editor.isActive("bold"))}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("italic"))}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("underline"))}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("strike"))}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span style={{ color: "white", fontSize: 14, fontWeight: 700, textDecoration: "line-through" }}>S</span>
        </button>
      </div>

      {/* Block */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" style={btn(editor.isActive("heading"))}>
              <Heading1 style={iconStyle} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            style={{
              backgroundColor: "var(--dark-green)",
              border: "1px solid var(--dark-green-highlight)",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              padding: "6px 8px",
            }}
          >
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              style={{ background: "none", cursor: "pointer", padding: "4px 8px", color: "white", fontFamily: "Joan, serif" }}
            >
              H1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              style={{ background: "none", cursor: "pointer", padding: "4px 8px", color: "white", fontFamily: "Joan, serif" }}
            >
              H2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              style={{ background: "none", cursor: "pointer", padding: "4px 8px", color: "white", fontFamily: "Joan, serif" }}
            >
              H3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" style={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <span style={{ color: "white", fontSize: 16 }}>&ldquo;</span>
        </button>
      </div>

      {/* Media */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <button type="button" style={btn(editor.isActive("link"))} onClick={setLink}>
          <LinkIcon style={iconStyle} />
        </button>
        <button type="button" style={btn(editor.isActive("code"))}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <span style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>{"<>"}</span>
        </button>
      </div>

      {/* Undo / Redo — right-justified */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginLeft: "auto" }}>
        <button type="button"
          style={{ ...btn(), opacity: editor.can().undo() ? 1 : 0.25 }}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo">
          <span style={{ color: "white", fontSize: 16 }}>↩</span>
        </button>
        <button type="button"
          style={{ ...btn(), opacity: editor.can().redo() ? 1 : 0.25 }}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo">
          <span style={{ color: "white", fontSize: 16 }}>↪</span>
        </button>
      </div>
    </div>
  );
}
