import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [loadedChapterId, setLoadedChapterId] = useState(null);
  
  // Use refs to track chapter ID and save queue
  const loadedChapterIdRef = useRef(null);
  const isLoadingContentRef = useRef(false);
  const saveQueueRef = useRef({ pending: null, inProgress: false });
  const abortControllerRef = useRef(null);

  // Google Docs-style immediate save with queuing
  const handleAutoSave = useCallback(async (content, chapterId) => {
    // If a save is in progress, queue this save
    if (saveQueueRef.current.inProgress) {
      saveQueueRef.current.pending = { content, chapterId };
      return;
    }

    // Verify we're still on the same chapter
    if (loadedChapterIdRef.current !== chapterId) {
      console.log('Auto-save cancelled: chapter changed');
      return;
    }

    try {
      saveQueueRef.current.inProgress = true;
      setSaving(true);

      await updateChapter(chapterId, { content });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
      saveQueueRef.current.inProgress = false;

      // If there's a pending save, execute it now
      if (saveQueueRef.current.pending) {
        const { content: pendingContent, chapterId: pendingChapterId } = saveQueueRef.current.pending;
        saveQueueRef.current.pending = null;
        
        // Only execute pending save if we're still on the same chapter
        if (loadedChapterIdRef.current === pendingChapterId) {
          handleAutoSave(pendingContent, pendingChapterId);
        }
      }
    }
  }, [updateChapter]);

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
      // Skip updates when we're loading chapter content programmatically
      if (isLoadingContentRef.current) {
        return;
      }
      
      const newContent = editor.getHTML();
      const currentChapterId = loadedChapterIdRef.current;
      
      // Google Docs style: Save immediately with queuing
      // The handleAutoSave function will queue this if a save is in progress
      handleAutoSave(newContent, currentChapterId);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none',
        'data-placeholder': 'Start writing here...',
      },
      handleKeyDown: (view, event) => {
        const { state } = view;
        const { selection, doc } = state;
        const { $from } = selection;
        
        // Handle Tab key for indentation (0.5 inch)
        if (event.key === 'Tab') {
          event.preventDefault();
          
          const { schema, tr } = state;
          
          // Create a text node with special indent marker
          const indentNode = schema.text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'); // 6 non-breaking spaces ≈ 0.5in at 12pt
          view.dispatch(tr.replaceSelectionWith(indentNode, false));
          
          return true;
        }
        
        // Handle Backspace to delete entire indent at once
        if (event.key === 'Backspace' && selection.empty) {
          const textBefore = doc.textBetween(Math.max(0, $from.pos - 6), $from.pos);
          
          // Check if the 6 characters before cursor are all non-breaking spaces (an indent)
          if (textBefore === '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0') {
            event.preventDefault();
            const tr = state.tr.delete($from.pos - 6, $from.pos);
            view.dispatch(tr);
            return true;
          }
        }
        
        // Handle Delete key to remove entire indent at once (when cursor is before indent)
        if (event.key === 'Delete' && selection.empty) {
          const textAfter = doc.textBetween($from.pos, Math.min(doc.content.size, $from.pos + 6));
          
          // Check if the 6 characters after cursor are all non-breaking spaces (an indent)
          if (textAfter === '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0') {
            event.preventDefault();
            const tr = state.tr.delete($from.pos, $from.pos + 6);
            view.dispatch(tr);
            return true;
          }
        }
        
        return false;
      },
    },
  });

  // Fetch chapter on mount and when chapter changes
  useEffect(() => {
    if (chapterId) {
      // Clear save queue when switching chapters
      saveQueueRef.current = { pending: null, inProgress: false };
      
      // Reset tracking
      loadedChapterIdRef.current = null;
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
      const chapterContent = currentChapter.currentContent || '';
      
      // Set flag to prevent onUpdate from firing during programmatic content load
      isLoadingContentRef.current = true;
      
      editor.commands.setContent(chapterContent);
      setLastSaved(new Date(currentChapter.updatedAt));
      setLoadedChapterId(currentChapter._id);
      loadedChapterIdRef.current = currentChapter._id;
      
      // Clear the flag after setContent completes
      setTimeout(() => {
        isLoadingContentRef.current = false;
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, editor, chapterId]);

  const handleManualSave = useCallback(() => {
    setShowSavePrompt(true);
  }, []);

  const handleQuickSave = useCallback(async () => {
    if (!currentChapter || !editor) return;
    
    // Clear save queue and do immediate save
    saveQueueRef.current = { pending: null, inProgress: false };
    
    setSaving(true);
    await updateChapter(currentChapter._id, {
      content: editor.getHTML(),
      createRevision: false, // Quick save, no revision
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [currentChapter, editor, updateChapter]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+S or Cmd+Shift+S - Save Revision (with dialog)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleManualSave();
      }
      // Ctrl+S or Cmd+S - Quick Save (no dialog)
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, handleQuickSave]);

  const confirmSave = async (description) => {
    if (!currentChapter || loadedChapterId !== currentChapter._id) return;

    // Clear save queue before manual save with revision
    saveQueueRef.current = { pending: null, inProgress: false };

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

  const handleTitleUpdate = async (newTitle) => {
    if (!currentChapter || !newTitle.trim()) return;
    
    await updateChapter(currentChapter._id, { title: newTitle });
    // Refresh the story to update sidebar
    if (storyId) {
      fetchStory(storyId);
    }
  };

  if (!currentChapter) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  const wordCount = calculateWordCount(editor?.getText() || '');

  return (
    <div className="editor-page">
      <EditorToolbar 
        editor={editor}
        chapterTitle={currentChapter.title}
        saving={saving}
        lastSaved={lastSaved}
        wordCount={wordCount}
        onSaveRevision={handleManualSave}
        onToggleRevisions={() => setShowRevisions(!showRevisions)}
        showRevisions={showRevisions}
        onTitleUpdate={handleTitleUpdate}
      />
      
      <div className="editor-page-content">
        <Sidebar />
        <div className="editor-container">
          {showRevisions ? (
            <div className="revisions-panel">
              <RevisionHistory chapterId={chapterId} />
            </div>
          ) : (
            <div className="editor-content-wrapper">
              <EditorContent editor={editor} className="editor-content" />
            </div>
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
    </div>
  );
};

export default TextEditor;

