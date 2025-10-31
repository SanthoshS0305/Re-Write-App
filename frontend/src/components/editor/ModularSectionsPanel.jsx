import React, { useState, useEffect } from 'react';
import { chapterAPI } from '../../services/api';

const ModularSectionsPanel = ({ chapterId, onVariantChange }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [newVariantName, setNewVariantName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (chapterId) {
      loadSections();
    }
  }, [chapterId]);

  const loadSections = async () => {
    try {
      const response = await chapterAPI.getChapter(chapterId);
      setSections(response.data.data.chapter.modularSections || []);
    } catch (err) {
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVariant = async (moduleId, variantName) => {
    try {
      await chapterAPI.activateVariant(chapterId, moduleId, variantName);
      await loadSections();
      if (onVariantChange) {
        onVariantChange();
      }
    } catch (err) {
      setError('Failed to activate variant');
    }
  };

  const handleDeleteSection = async (moduleId) => {
    if (!window.confirm('Delete this modular section?')) return;

    try {
      await chapterAPI.deleteModularSection(chapterId, moduleId);
      await loadSections();
    } catch (err) {
      setError('Failed to delete section');
    }
  };

  const handleAddVariant = async (moduleId) => {
    if (!newVariantName.trim()) return;

    try {
      const section = sections.find(s => s.id === moduleId);
      const activeVariant = section.variants.find(v => v.isActive) || section.variants[0];
      
      const updatedVariants = [
        ...section.variants,
        {
          name: newVariantName.trim(),
          content: activeVariant.content,
          isActive: false,
        },
      ];
      
      await chapterAPI.updateModularSection(chapterId, moduleId, { variants: updatedVariants });
      setNewVariantName('');
      setEditingSection(null);
      await loadSections();
    } catch (err) {
      setError('Failed to add variant');
    }
  };

  const handleDuplicateVariant = async (moduleId, variantName) => {
    try {
      const section = sections.find(s => s.id === moduleId);
      const variantToDuplicate = section.variants.find(v => v.name === variantName);
      
      if (!variantToDuplicate) return;
      
      const newVariantName = `${variantToDuplicate.name} (Copy)`;
      const updatedVariants = [
        ...section.variants,
        {
          name: newVariantName,
          content: variantToDuplicate.content,
          isActive: false,
        },
      ];
      
      await chapterAPI.updateModularSection(chapterId, moduleId, { variants: updatedVariants });
      await loadSections();
    } catch (err) {
      setError('Failed to duplicate variant');
    }
  };

  if (loading) {
    return <div className="sections-loading">Loading sections...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="sections-empty">
        <p>No modular sections yet.</p>
        <small>Select text and create a variant to get started.</small>
      </div>
    );
  }

  return (
    <div className="modular-sections-panel">
      {error && <div className="error-message">{error}</div>}
      
      {sections.map((section) => {
        const activeVariant = section.variants.find(v => v.isActive) || section.variants[0];
        
        return (
          <div key={section.id} className="section-item">
            <div className="section-header">
              <span className="section-id">Section {section.id.slice(0, 8)}</span>
              {section.variants.length > 1 && (
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="btn btn-danger btn-xs"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="section-variants">
              {section.variants.map((variant) => (
                <div key={variant.name} className="variant-button-wrapper">
                  <button
                    onClick={() => handleActivateVariant(section.id, variant.name)}
                    className={`variant-button ${variant.isActive ? 'active' : ''}`}
                  >
                    <span className="variant-name">{variant.name}</span>
                    {variant.isActive && <span className="badge">Active</span>}
                  </button>
                  <button
                    onClick={() => handleDuplicateVariant(section.id, variant.name)}
                    className="btn btn-secondary btn-xs"
                    title="Duplicate variant"
                  >
                    📋
                  </button>
                </div>
              ))}
            </div>

            {editingSection === section.id && (
              <div className="add-variant-form">
                <input
                  type="text"
                  placeholder="Variant name"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  className="form-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newVariantName.trim()) {
                      handleAddVariant(section.id);
                    }
                  }}
                />
                <div className="form-actions">
                  <button 
                    onClick={() => handleAddVariant(section.id)}
                    className="btn btn-primary btn-xs"
                    disabled={!newVariantName.trim()}
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => {
                      setEditingSection(null);
                      setNewVariantName('');
                    }}
                    className="btn btn-secondary btn-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!editingSection && (
              <button
                onClick={() => setEditingSection(section.id)}
                className="btn btn-secondary btn-xs"
              >
                + Add Variant
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModularSectionsPanel;

