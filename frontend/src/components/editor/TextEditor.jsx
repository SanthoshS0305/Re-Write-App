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
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle, FontSize, LineHeight } from './extensions';
import useStory from '../../hooks/useStory';
import useDebounce from '../../hooks/useDebounce';
import LoadingSpinner from '../common/LoadingSpinner';
import Sidebar from '../layout/Sidebar';
import PromptDialog from '../common/PromptDialog';
import RevisionHistory from '../revisions/RevisionHistory';
import EditorToolbar from './EditorToolbar';
import { calculateWordCount } from '../../utils/diffUtils';

const TextEditor = () => {
  const { storyId, chapterId } = useParams();
  const { currentChapter, fetchChapter, updateChapter, fetchStory } = useStory();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [content, setContent] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [loadedChapterId, setLoadedChapterId] = useState(null);

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
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
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

  // Fetch chapter on mount and when chapter changes
  useEffect(() => {
    if (chapterId) {
      // Reset content when switching chapters to prevent stale auto-saves
      setContent('');
      fetchChapter(chapterId);
    }
    if (storyId) {
      fetchStory(storyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, storyId]);

  // Set editor content when chapter loads or changes
  useEffect(() => {
    if (currentChapter && editor && currentChapter._id !== loadedChapterId) {
      editor.commands.setContent(currentChapter.currentContent || '');
      setContent(currentChapter.currentContent || '');
      setLastSaved(new Date(currentChapter.updatedAt));
      setLoadedChapterId(currentChapter._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, editor, chapterId]);

  // Auto-save on debounced content change
  useEffect(() => {
    if (
      debouncedContent && 
      currentChapter && 
      loadedChapterId === currentChapter._id &&
      debouncedContent !== currentChapter.currentContent
    ) {
      handleAutoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, loadedChapterId]);

  const handleAutoSave = async () => {
    if (!currentChapter || loadedChapterId !== currentChapter._id) return;

    setSaving(true);
    await updateChapter(currentChapter._id, { content: debouncedContent });
    setSaving(false);
    setLastSaved(new Date());
  };

  const handleManualSave = () => {
    setShowSavePrompt(true);
  };

  const confirmSave = async (description) => {
    if (!currentChapter || loadedChapterId !== currentChapter._id) return;

    setShowSavePrompt(false);
    setSaving(true);
    await updateChapter(currentChapter._id, {
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
            <EditorToolbar editor={editor} />

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

