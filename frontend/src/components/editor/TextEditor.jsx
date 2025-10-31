import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { DOMSerializer } from 'prosemirror-model';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import FontFamily from '@tiptap/extension-font-family';
import { DashboardCustomize, Dashboard } from '@mui/icons-material';
import { TextStyle, FontSize, LineHeight } from './extensions';
import useStory from '../../hooks/useStory';
import LoadingSpinner from '../common/LoadingSpinner';
import Sidebar from '../layout/Sidebar';
import PromptDialog from '../common/PromptDialog';
import RevisionHistory from '../revisions/RevisionHistory';
import EditorToolbar from './EditorToolbar';
import { calculateWordCount } from '../../utils/diffUtils';
import { chapterAPI } from '../../services/api';

const TextEditor = () => {
  const { storyId, chapterId } = useParams();
  const { currentChapter, fetchChapter, updateChapter, fetchStory } = useStory();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [showVariantDetails, setShowVariantDetails] = useState(false);
  const [pendingVariant, setPendingVariant] = useState(null); // { paragraphIndex, selectedHTML }
  const [loadedChapterId, setLoadedChapterId] = useState(null);
  const [selectionRange, setSelectionRange] = useState(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [overlappingSection, setOverlappingSection] = useState(null);
  const [floatingButtonPos, setFloatingButtonPos] = useState({ top: 0, left: 0 });
  
  // Use refs to track chapter ID and save queue
  const loadedChapterIdRef = useRef(null);
  const isLoadingContentRef = useRef(false);
  const saveQueueRef = useRef({ pending: null, inProgress: false });
  const abortControllerRef = useRef(null);
  const editorWrapperRef = useRef(null);
  const editorContentRef = useRef(null);
  const currentChapterRef = useRef(null);
  const showVariantDialogRef = useRef(false);
  const showVariantSelectorRef = useRef(false);

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
    onSelectionUpdate: ({ editor }) => {
      // Update selection state for variant button
      const { from, to, empty } = editor.state.selection;
      
      // Only show button if there's an actual selection (not just a cursor)
      if (!empty && from !== to) {
        setHasSelection(true);
        setSelectionRange({ from, to });
        
        // Calculate position for floating button - use the start position
        const coords = editor.view.coordsAtPos(from);
        if (coords && editorWrapperRef.current) {
          const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
          const editorRect = editorContentRef.current?.getBoundingClientRect();
          
          // Position button on the wrapper's edge, outside the editor
          const buttonWidth = 40; // Icon-only button width
          const top = coords.top - wrapperRect.top - 10; // Adjust for circular button
          
          // If we have editor rect, place to left of editor edge
          // Otherwise, fall back to wrapper edge
          const left = editorRect 
            ? Math.max(0, (editorRect.left - wrapperRect.left) - buttonWidth - 8)
            : 0;
          
          setFloatingButtonPos({ top, left });
        }
        
        // Check if selection overlaps with existing modular section by paragraph index
        const doc = editor.state.doc;
        let paragraphIndex = 0;
        doc.nodesBetween(0, from, (node, pos) => {
          if (node.type.name === 'paragraph') {
            paragraphIndex++;
          }
        });
        paragraphIndex = Math.max(0, paragraphIndex - 1);
        
        const overlapping = currentChapterRef.current?.modularSections?.find(section =>
          section.paragraphIndex === paragraphIndex
        );
        
        setOverlappingSection(overlapping || null);
      } else {
        // Only clear hasSelection if dialog/selector are not open
        if (!showVariantDialogRef.current && !showVariantSelectorRef.current) {
          setHasSelection(false);
        }
        // Don't clear selectionRange here - keep it for confirmVariant
        setOverlappingSection(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none',
        'data-placeholder': 'Start writing here...',
      },
      handleClick: (view, pos, event) => {
        // Check if clicked text overlaps with a modular section
        const coords = view.coordsAtPos(pos);
        if (coords && editorWrapperRef.current && currentChapterRef.current) {
          const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
          const clickY = coords.top - wrapperRect.top;
          
          // Check if clicked within existing variant regions by paragraph index
          const doc = view.state.doc;
          let paragraphIndex = 0;
          doc.nodesBetween(0, pos, (node, pos) => {
            if (node.type.name === 'paragraph') {
              paragraphIndex++;
            }
          });
          paragraphIndex = Math.max(0, paragraphIndex - 1);
          
          const overlapping = currentChapterRef.current.modularSections?.find(section =>
            section.paragraphIndex === paragraphIndex
          );
          
          if (overlapping) {
            setOverlappingSection(overlapping);
            const buttonWidth = 40;
            const editorRect = editorContentRef.current?.getBoundingClientRect();
            const left = editorRect
              ? Math.max(0, (editorRect.left - wrapperRect.left) - buttonWidth - 8)
              : 0;
            setFloatingButtonPos({ top: clickY - 10, left });
            setHasSelection(true);
          } else {
            // Clear if clicking outside of variant section
            setOverlappingSection(null);
          }
        }
        return false;
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

  // Update chapter ref for click handler
  useEffect(() => {
    currentChapterRef.current = currentChapter;
  }, [currentChapter]);

  // Update dialog refs for onSelectionUpdate
  useEffect(() => {
    showVariantDialogRef.current = showVariantDialog;
  }, [showVariantDialog]);

  useEffect(() => {
    showVariantSelectorRef.current = showVariantSelector;
  }, [showVariantSelector]);

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

  const confirmVariant = async (variantName) => {
    if (!editor || !currentChapter) return;
    
    // Use stored selection range if available, otherwise get from editor
    const { from, to } = selectionRange || editor.state.selection;
    
    // Get selected text and HTML
    const selectedText = editor.state.doc.textBetween(from, to);
    // Serialize the selected slice to HTML using ProseMirror's DOMSerializer
    const slice = editor.state.doc.slice(from, to);
    const serializer = DOMSerializer.fromSchema(editor.state.schema);
    const container = document.createElement('div');
    container.appendChild(serializer.serializeFragment(slice.content));
    const selectedHTML = container.innerHTML;
    
    // Calculate paragraph index by counting paragraphs before the selection
    // Get all paragraphs up to the selection start
    const doc = editor.state.doc;
    let paragraphIndex = 0;
    doc.nodesBetween(0, from, (node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphIndex++;
      }
    });
    
    // Subtract 1 because index is 0-based and we just counted the paragraph we're in
    paragraphIndex = Math.max(0, paragraphIndex - 1);
    
    try {
      const response = await chapterAPI.createModularSection(currentChapter._id, {
        paragraphIndex: paragraphIndex,
        variantName: variantName || 'Original',
        variantContent: selectedHTML,
      });
      
      // Get the created section
      const createdSection = response.data.data.modularSection;
      
      setShowVariantDialog(false);
      setShowVariantSelector(false);
      setHasSelection(false);
      
      // Refresh the chapter to show the new section in sidebar
      await fetchChapter(currentChapter._id);
      
      // Set overlapping section and open details panel
      setOverlappingSection(createdSection);
      setShowVariantDetails(true);
    } catch (error) {
      console.error('Failed to create variant:', error);
      alert('Failed to create variant. Please try again.');
    }
  };

  const cancelVariant = () => {
    setShowVariantDialog(false);
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
        <div className={`editor-container ${showVariantDetails ? 'has-variant-panel' : ''}`}>
          {showRevisions ? (
            <div className="revisions-panel">
              <RevisionHistory chapterId={chapterId} />
            </div>
          ) : (
            <div className="editor-content-wrapper" ref={editorWrapperRef}>
              {(hasSelection || overlappingSection) && !showVariantSelector && (
                <button
                  className="variant-floating-button"
                  style={{
                    position: 'absolute',
                    top: `${floatingButtonPos.top}px`,
                    left: `${floatingButtonPos.left}px`,
                  }}
                  onClick={() => {
                    if (overlappingSection) {
                      setShowVariantDetails(true);
                    } else {
                      // Prepare pending variant and open sidebar
                      const range = selectionRange || editor.state.selection;
                      const { from, to } = range;
                      const slice = editor.state.doc.slice(from, to);
                      const serializer = DOMSerializer.fromSchema(editor.state.schema);
                      const container = document.createElement('div');
                      container.appendChild(serializer.serializeFragment(slice.content));
                      const selectedHTML = container.innerHTML;
                      
                      const doc = editor.state.doc;
                      let paragraphIndex = 0;
                      doc.nodesBetween(0, from, (node, pos) => {
                        if (node.type.name === 'paragraph') {
                          paragraphIndex++;
                        }
                      });
                      paragraphIndex = Math.max(0, paragraphIndex - 1);
                      
                      setPendingVariant({ paragraphIndex, selectedHTML });
                      setShowVariantDetails(true);
                    }
                  }}
                  title={overlappingSection ? 'Manage Variants' : 'Create Variant'}
                >
                  {overlappingSection ? <Dashboard /> : <DashboardCustomize />}
                </button>
              )}
              <div className="editor-content" ref={editorContentRef}>
                <EditorContent editor={editor} />
              </div>
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
          
          <PromptDialog
            isOpen={showVariantDialog}
            title="Create Variant"
            message="Enter a name for this variant:"
            placeholder="e.g., Happy Ending, POV 1, Fight Version A"
            onConfirm={confirmVariant}
            onCancel={cancelVariant}
            defaultValue="Original"
          />
        </div>

        {/* Variant Details Panel */}
        {showVariantDetails && (overlappingSection || pendingVariant) && (
          <div className="variant-details-panel">
            <div className="variant-details-header">
              <h3>Variants</h3>
              <button
                onClick={() => {
                  setShowVariantDetails(false);
                  setPendingVariant(null);
                }}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <div className="variant-details-content">
              {/* Show existing variants */}
              {overlappingSection && overlappingSection.variants.map((variant) => (
                <div
                  key={variant.name}
                  className={`variant-item ${variant.isActive ? 'active' : ''}`}
                >
                  <div className="variant-item-header">
                    <span className="variant-name">{variant.name}</span>
                    {variant.isActive && <span className="badge">Active</span>}
                  </div>
                  <div className="variant-content-preview">
                    {variant.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {variant.content.replace(/<[^>]*>/g, '').length > 150 && '...'}
                  </div>
                  <div className="variant-item-actions">
                    <button
                      onClick={async () => {
                        await chapterAPI.activateVariant(chapterId, overlappingSection.id, variant.name);
                        await fetchChapter(currentChapter._id);
                      }}
                      className="btn btn-primary btn-xs"
                      disabled={variant.isActive}
                    >
                      Activate
                    </button>
                    <button
                      onClick={async () => {
                        const section = currentChapter.modularSections.find(s => s.id === overlappingSection.id);
                        const variantToDuplicate = section.variants.find(v => v.name === variant.name);
                        const newVariantName = `${variantToDuplicate.name} (Copy)`;
                        const updatedVariants = [
                          ...section.variants,
                          {
                            name: newVariantName,
                            content: variantToDuplicate.content,
                            isActive: false,
                          },
                        ];
                        await chapterAPI.updateModularSection(chapterId, overlappingSection.id, { variants: updatedVariants });
                        await fetchChapter(currentChapter._id);
                      }}
                      className="btn btn-secondary btn-xs"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this variant?')) return;
                        const section = currentChapter.modularSections.find(s => s.id === overlappingSection.id);
                        const updatedVariants = section.variants.filter(v => v.name !== variant.name);
                        await chapterAPI.updateModularSection(chapterId, overlappingSection.id, { variants: updatedVariants });
                        await fetchChapter(currentChapter._id);
                      }}
                      className="btn btn-danger btn-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Inline create variant input for pending variant */}
              {pendingVariant && (
                <div className="variant-item new-variant">
                  <div className="variant-item-header">
                    <input
                      type="text"
                      placeholder="Enter variant name..."
                      className="variant-name-input"
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const variantName = e.target.value.trim() || 'Original';
                          try {
                            if (pendingVariant.moduleId) {
                              // Adding variant to existing section
                              const section = currentChapter.modularSections.find(s => s.id === pendingVariant.moduleId);
                              const updatedVariants = [
                                ...section.variants,
                                {
                                  name: variantName,
                                  content: pendingVariant.selectedHTML,
                                  isActive: false,
                                },
                              ];
                              await chapterAPI.updateModularSection(chapterId, pendingVariant.moduleId, { variants: updatedVariants });
                              await fetchChapter(currentChapter._id);
                              setPendingVariant(null);
                            } else {
                              // Creating new section
                              const response = await chapterAPI.createModularSection(currentChapter._id, {
                                paragraphIndex: pendingVariant.paragraphIndex,
                                variantName: variantName,
                                variantContent: pendingVariant.selectedHTML,
                              });
                              
                              // Get the created section from response
                              const createdSection = response.data.data.modularSection;
                              
                              // Refresh chapter to get updated data
                              await fetchChapter(currentChapter._id);
                              
                              // Set overlapping section to keep button visible
                              setOverlappingSection(createdSection);
                              setPendingVariant(null);
                            }
                          } catch (error) {
                            console.error('Failed to create variant:', error);
                            console.error('Error response:', error.response?.data);
                            alert('Failed to create variant: ' + (error.response?.data?.message || error.message || 'Unknown error'));
                          }
                        } else if (e.key === 'Escape') {
                          setPendingVariant(null);
                        }
                      }}
                    />
                  </div>
                  <div className="variant-content-preview">
                    {pendingVariant.selectedHTML.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {pendingVariant.selectedHTML.replace(/<[^>]*>/g, '').length > 150 && '...'}
                  </div>
                </div>
              )}
              
              {/* Add variant button for existing sections */}
              {overlappingSection && !pendingVariant && (
                <button
                  onClick={() => {
                    // Set up pending variant for existing section using active variant as template
                    const activeVariant = overlappingSection.variants.find(v => v.isActive) || overlappingSection.variants[0];
                    setPendingVariant({
                      moduleId: overlappingSection.id,
                      selectedHTML: activeVariant.content,
                    });
                  }}
                  className="btn btn-primary"
                >
                  + Add Variant
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextEditor;

