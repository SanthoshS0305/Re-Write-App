import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';

const EditorToolbar = ({ 
  editor, 
  chapterTitle, 
  saving, 
  lastSaved, 
  wordCount,
  onSaveRevision,
  onToggleRevisions,
  showRevisions,
  onTitleUpdate
}) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showSpacingDropdown, setShowSpacingDropdown] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapterTitle);
  
  const fontDropdownRef = useRef(null);
  const sizeDropdownRef = useRef(null);
  const spacingDropdownRef = useRef(null);
  const titleInputRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditedTitle(chapterTitle);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== chapterTitle) {
      onTitleUpdate(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(chapterTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update edited title when prop changes
  useEffect(() => {
    setEditedTitle(chapterTitle);
  }, [chapterTitle]);

  const fonts = [
    'Times New Roman',
    'Cambria',
    'Aptos',
    'Merriweather',
    'Baskerville',
    'Arial',
    'Georgia',
    'Comic Sans MS',
    'Helvetica',
    'Cochin',
    'Garamond',
    'Futura',
  ];

  const fontSizes = [
    { label: '10pt', value: '10pt' },
    { label: '11pt', value: '11pt' },
    { label: '12pt', value: '12pt' },
    { label: '14pt', value: '14pt' },
    { label: '16pt', value: '16pt' },
    { label: '18pt', value: '18pt' },
    { label: '20pt', value: '20pt' },
    { label: '24pt', value: '24pt' },
    { label: '28pt', value: '28pt' },
    { label: '32pt', value: '32pt' },
    { label: '36pt', value: '36pt' },
  ];

  const spacingOptions = [
    { label: 'Single', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setShowFontDropdown(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target)) {
        setShowSizeDropdown(false);
      }
      if (spacingDropdownRef.current && !spacingDropdownRef.current.contains(event.target)) {
        setShowSpacingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setFontFamily = (font) => {
    editor.chain().focus().setFontFamily(font).run();
    setShowFontDropdown(false);
  };

  const setFontSize = (size) => {
    editor.chain().focus().setFontSize(size).run();
    setShowSizeDropdown(false);
  };

  const setLineSpacing = (spacing) => {
    editor.chain().focus().setLineHeight(spacing).run();
    setShowSpacingDropdown(false);
  };

  const getCurrentFont = () => {
    const fontFamily = editor?.getAttributes('textStyle').fontFamily;
    return fontFamily || 'Default';
  };

  const getCurrentSize = () => {
    const fontSize = editor?.getAttributes('textStyle').fontSize;
    return fontSize || '12pt';
  };

  const getCurrentSpacing = () => {
    const lineHeight = editor?.getAttributes('textStyle').lineHeight;
    return lineHeight || '1.15';
  };

  if (!editor) return null;

  return (
    <div className="editor-toolbar-container">
      {/* Merged Navbar/Header Row */}
      <div className="editor-navbar">
        <div className="editor-navbar-left">
          <Link to="/" className="navbar-brand">
            Re:Write
          </Link>
          <span className="navbar-separator">|</span>
          {isEditingTitle ? (
            <div className="title-edit-container">
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleSave}
                className="title-edit-input"
                maxLength={200}
              />
            </div>
          ) : (
            <h2 
              className="editor-chapter-title editable-title" 
              onClick={handleTitleClick}
              title="Click to edit chapter title"
            >
              {chapterTitle}
            </h2>
          )}
          <div className="editor-status">
            <span className="word-count">{wordCount} words</span>
            {saving && <span className="status-saving">Saving...</span>}
          </div>
        </div>
        
        <div className="editor-navbar-right">
          <Link to="/stories" className="navbar-link">
            My Stories
          </Link>
          <span className="navbar-user">{user?.email}</span>
          <IconButton 
            onClick={toggleDarkMode} 
            color="inherit"
            size="small"
            aria-label="toggle dark mode"
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="editor-toolbar">
        {/* Formatting Controls Wrapper - This gets disabled */}
        <div className={`toolbar-formatting-controls ${showRevisions ? 'toolbar-disabled' : ''}`}>
        {/* Font Family Dropdown */}
        <div className="toolbar-dropdown" ref={fontDropdownRef}>
        <button
          className="toolbar-dropdown-button"
          onClick={() => !showRevisions && setShowFontDropdown(!showFontDropdown)}
          title="Font Family"
          disabled={showRevisions}
        >
          <span className="dropdown-label">{getCurrentFont()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showFontDropdown && (
          <div className="toolbar-dropdown-menu">
            {fonts.map((font) => (
              <button
                key={font}
                className="toolbar-dropdown-item"
                onClick={() => setFontFamily(font)}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Dropdown */}
      <div className="toolbar-dropdown" ref={sizeDropdownRef}>
        <button
          className="toolbar-dropdown-button"
          onClick={() => !showRevisions && setShowSizeDropdown(!showSizeDropdown)}
          title="Font Size"
          disabled={showRevisions}
        >
          <span className="dropdown-label">{getCurrentSize()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showSizeDropdown && (
          <div className="toolbar-dropdown-menu">
            {fontSizes.map((size) => (
              <button
                key={size.value}
                className="toolbar-dropdown-item"
                onClick={() => setFontSize(size.value)}
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line Spacing Dropdown */}
      <div className="toolbar-dropdown" ref={spacingDropdownRef}>
        <button
          className="toolbar-dropdown-button"
          onClick={() => !showRevisions && setShowSpacingDropdown(!showSpacingDropdown)}
          title="Line Spacing"
          disabled={showRevisions}
        >
          <span className="dropdown-label">Spacing: {getCurrentSpacing()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showSpacingDropdown && (
          <div className="toolbar-dropdown-menu">
            {spacingOptions.map((spacing) => (
              <button
                key={spacing.value}
                className="toolbar-dropdown-item"
                onClick={() => setLineSpacing(spacing.value)}
              >
                {spacing.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-divider"></div>

      {/* Text Formatting Buttons */}
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
        title="Bold (Ctrl+B)"
        disabled={showRevisions}
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
        title="Italic (Ctrl+I)"
        disabled={showRevisions}
      >
        <em>I</em>
      </button>

      <div className="toolbar-divider"></div>

      {/* Heading Buttons */}
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
        title="Heading 1"
        disabled={showRevisions}
      >
        H1
      </button>
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        title="Heading 2"
        disabled={showRevisions}
      >
        H2
      </button>
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
        title="Heading 3"
        disabled={showRevisions}
      >
        H3
      </button>

      <div className="toolbar-divider"></div>

      {/* List Buttons */}
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'active' : ''}
        title="Bullet List"
        disabled={showRevisions}
      >
        • List
      </button>
      <button
        onClick={() => !showRevisions && editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'active' : ''}
        title="Numbered List"
        disabled={showRevisions}
      >
        1. List
      </button>

      <div className="toolbar-divider"></div>

      {/* Horizontal Rule Button */}
      <button
        onClick={() => !showRevisions && editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
        disabled={showRevisions}
      >
        ―
      </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Revision Buttons - Always Enabled */}
      <button 
        onClick={onSaveRevision} 
        className="btn btn-primary btn-sm toolbar-revision-btn" 
        disabled={saving}
        title="Save Revision Point"
      >
        Save Revision
      </button>
      <button
        onClick={onToggleRevisions}
        className="btn btn-secondary btn-sm toolbar-revision-btn"
        title={showRevisions ? 'Hide Revisions' : 'View Revisions'}
      >
        {showRevisions ? 'Hide Revisions' : 'View Revisions'}
      </button>
      </div>
    </div>
  );
};

export default EditorToolbar;

