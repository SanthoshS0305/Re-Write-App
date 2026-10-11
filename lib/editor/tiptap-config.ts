import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { SceneExtension } from "./scene-plugin";

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    link: {
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline",
      },
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing your story...",
  }),
  SceneExtension,
];
