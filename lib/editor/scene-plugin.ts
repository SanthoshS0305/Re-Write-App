import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface Scene {
  id: string;
  label: string;
  startPos: number;
  endPos: number;
}

export const SceneExtension = Extension.create({
  name: "scene",

  addStorage() {
    return {
      scenes: [] as Scene[],
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: new PluginKey("scene"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, set, oldState, newState) {
            const scenes = extension.storage.scenes as Scene[];
            if (!scenes || scenes.length === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];

            scenes.forEach((scene) => {
              const { startPos, endPos } = scene;

              // Only create decorations if positions are valid
              if (startPos >= 0 && endPos <= newState.doc.content.size && startPos < endPos) {
                // Create a decoration that spans the entire scene
                decorations.push(
                  Decoration.inline(startPos, endPos, {
                    class: "scene-content",
                    style: "position: relative;",
                  })
                );
              }
            });

            return DecorationSet.create(newState.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
