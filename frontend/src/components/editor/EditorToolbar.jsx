import React, { useState, useRef, useEffect } from 'react';

const EditorToolbar = ({ editor }) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showSpacingDropdown, setShowSpacingDropdown] = useState(false);
  
  const fontDropdownRef = useRef(null);
  const sizeDropdownRef = useRef(null);
  const spacingDropdownRef = useRef(null);

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
    <div className="editor-toolbar">
      {/* Font Family Dropdown */}
      <div className="toolbar-dropdown" ref={fontDropdownRef}>
        <button
          className="toolbar-dropdown-button"
          onClick={() => setShowFontDropdown(!showFontDropdown)}
          title="Font Family"
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
          onClick={() => setShowSizeDropdown(!showSizeDropdown)}
          title="Font Size"
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
          onClick={() => setShowSpacingDropdown(!showSpacingDropdown)}
          title="Line Spacing"
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
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>

      <div className="toolbar-divider"></div>

      {/* Heading Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
        title="Heading 3"
      >
        H3
      </button>

      <div className="toolbar-divider"></div>

      {/* List Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'active' : ''}
        title="Bullet List"
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'active' : ''}
        title="Numbered List"
      >
        1. List
      </button>

      <div className="toolbar-divider"></div>

      {/* Horizontal Rule Button */}
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        ―
      </button>
    </div>
  );
};

export default EditorToolbar;

