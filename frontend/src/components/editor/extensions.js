import { Extension } from '@tiptap/core';
import TextStyleExtension from '@tiptap/extension-text-style';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';

// Re-export TextStyle for use in TextEditor
export const TextStyle = TextStyleExtension;

// Custom extension to add fontSize attribute to textStyle
export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ commands }) => {
        return commands.setMark('textStyle', { fontSize });
      },
      unsetFontSize: () => ({ commands }) => {
        return commands.setMark('textStyle', { fontSize: null });
      },
    };
  },
});

// Custom extension to add lineHeight attribute to textStyle
export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: lineHeight => ({ commands }) => {
        return commands.setMark('textStyle', { lineHeight });
      },
      unsetLineHeight: () => ({ commands }) => {
        return commands.setMark('textStyle', { lineHeight: null });
      },
    };
  },
});

// Custom extension to add visual decorations for modular sections
export const ModularSectionDecoration = Extension.create({
  name: 'modularSectionDecoration',

  addOptions() {
    return {
      modularSections: [],
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('modularSectionDecoration');
    const options = this.options;

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorationSet) => {
            // Get modular sections from ref if it's a ref, otherwise use the value directly
            const modularSections = options.modularSections?.current || options.modularSections || [];
            
            if (!modularSections.length) {
              return DecorationSet.empty;
            }

            const decorations = [];
            const doc = tr.doc;

            // TODO: Implement character position-based decoration for modular sections
            // This requires calculating section boundaries from the sections array
            // For now, decorations are disabled
            // const modularSections = modularSections.filter(s => s.isModular);
            
            return DecorationSet.create(doc, decorations);
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
