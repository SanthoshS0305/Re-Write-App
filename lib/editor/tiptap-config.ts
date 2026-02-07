import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { SceneExtension } from "./scene-plugin";

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline",
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing your story...",
  }),
  SceneExtension,
];

