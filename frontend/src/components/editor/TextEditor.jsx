import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import useStory from '../../hooks/useStory';
import useDebounce from '../../hooks/useDebounce';
import LoadingSpinner from '../common/LoadingSpinner';
import Sidebar from '../layout/Sidebar';
import PromptDialog from '../common/PromptDialog';
import RevisionHistory from '../revisions/RevisionHistory';
import { calculateWordCount } from '../../utils/diffUtils';

const TextEditor = () => {
  const { storyId, chapterId } = useParams();
  const { currentChapter, fetchChapter, updateChapter, fetchStory } = useStory();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [content, setContent] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const debouncedContent = useDebounce(content, 2000);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none',
        'data-placeholder': 'Start writing here...',
      },
    },
  });

  // Fetch chapter on mount
  useEffect(() => {
    if (chapterId) {
      fetchChapter(chapterId);
    }
    if (storyId) {
      fetchStory(storyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, storyId]);

  // Set editor content when chapter loads (only on initial load)
  useEffect(() => {
    if (currentChapter && editor && !content) {
      editor.commands.setContent(currentChapter.currentContent || '');
      setContent(currentChapter.currentContent || '');
      setLastSaved(new Date(currentChapter.updatedAt));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, editor]);

  // Auto-save on debounced content change
  useEffect(() => {
    if (debouncedContent && currentChapter && debouncedContent !== currentChapter.currentContent) {
      handleAutoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent]);

  const handleAutoSave = async () => {
    if (!currentChapter) return;

    setSaving(true);
    await updateChapter(chapterId, { content: debouncedContent });
    setSaving(false);
    setLastSaved(new Date());
  };

  const handleManualSave = () => {
    setShowSavePrompt(true);
  };

  const confirmSave = async (description) => {
    if (!currentChapter) return;

    setShowSavePrompt(false);
    setSaving(true);
    await updateChapter(chapterId, {
      content: editor.getHTML(),
      createRevision: true,
      revisionDescription: description || 'Manual save point',
    });
    setSaving(false);
    setLastSaved(new Date());
  };

  const cancelSave = () => {
    setShowSavePrompt(false);
  };

  if (!currentChapter) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  const wordCount = calculateWordCount(editor?.getText() || '');

  return (
    <div className="editor-page">
      <Sidebar />
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-title">
            <h2>{currentChapter.title}</h2>
            <div className="editor-status">
              {saving && <span className="status-saving">Saving...</span>}
              {!saving && lastSaved && (
                <span className="status-saved">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <span className="word-count">{wordCount} words</span>
            </div>
          </div>
          <div className="editor-actions">
            <button onClick={handleManualSave} className="btn btn-primary btn-sm" disabled={saving}>
              Save Revision
            </button>
            <button
              onClick={() => setShowRevisions(!showRevisions)}
              className="btn btn-secondary btn-sm"
            >
              {showRevisions ? 'Hide Revisions' : 'View Revisions'}
            </button>
          </div>
        </div>

        {showRevisions ? (
          <div className="revisions-panel">
            <RevisionHistory chapterId={chapterId} />
          </div>
        ) : (
          <>
            <div className="editor-toolbar">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'active' : ''}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'active' : ''}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <div className="toolbar-divider"></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor?.isActive('heading', { level: 3 }) ? 'active' : ''}
            title="Heading 3"
          >
            H3
          </button>
          <div className="toolbar-divider"></div>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'active' : ''}
            title="Numbered List"
          >
            1. List
          </button>
          <div className="toolbar-divider"></div>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            ―
          </button>
        </div>

            <div className="editor-content-wrapper">
              <EditorContent editor={editor} className="editor-content" />
            </div>
          </>
        )}

        <PromptDialog
          isOpen={showSavePrompt}
          title="Save Revision"
          message="Enter a description for this save point (optional):"
          placeholder="e.g., Finished chapter intro"
          onConfirm={confirmSave}
          onCancel={cancelSave}
        />
      </div>
    </div>
  );
};

export default TextEditor;

