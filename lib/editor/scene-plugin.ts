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
      pendingPositionUpdates: [] as { id: string; startPos: number; endPos: number }[],
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

            // Map positions through the transaction to keep them current
            let positionsChanged = false;
            const updatedScenes = scenes.map((scene) => {
              const newStart = tr.mapping.map(scene.startPos);
              const newEnd = tr.mapping.map(scene.endPos);
              if (newStart !== scene.startPos || newEnd !== scene.endPos) {
                positionsChanged = true;
                return { ...scene, startPos: newStart, endPos: newEnd };
              }
              return scene;
            });

            if (positionsChanged) {
              extension.storage.scenes = updatedScenes;
              // Queue position updates for persistence
              extension.storage.pendingPositionUpdates = updatedScenes.map((s) => ({
                id: s.id,
                startPos: s.startPos,
                endPos: s.endPos,
              }));
            }

            const decorations: Decoration[] = [];
            updatedScenes.forEach((scene) => {
              const { startPos, endPos } = scene;
              if (
                startPos >= 0 &&
                endPos <= newState.doc.content.size &&
                startPos < endPos
              ) {
                decorations.push(
                  Decoration.inline(startPos, endPos, {
                    class: "scene-content",
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
