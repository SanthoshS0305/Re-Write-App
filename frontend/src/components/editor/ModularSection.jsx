import React, { useState } from 'react';

// Placeholder component for modular sections
// Full implementation would require custom TipTap extensions
const ModularSection = ({ section, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeVariant, setActiveVariant] = useState(
    section.variants.find((v) => v.isActive) || section.variants[0]
  );

  const handleActivateVariant = (variantName) => {
    const variant = section.variants.find((v) => v.name === variantName);
    if (variant) {
      setActiveVariant(variant);
      if (onUpdate) {
        onUpdate(section.id, variantName);
      }
    }
  };

  return (
    <div className="modular-section">
      <div className="modular-section-header">
        <select
          value={activeVariant.name}
          onChange={(e) => handleActivateVariant(e.target.value)}
          className="variant-selector"
        >
          {section.variants.map((variant) => (
            <option key={variant.name} value={variant.name}>
              {variant.name}
            </option>
          ))}
        </select>
        <button onClick={() => setIsEditing(!isEditing)} className="btn btn-sm">
          {isEditing ? 'Close' : 'Manage Variants'}
        </button>
        {onDelete && (
          <button onClick={() => onDelete(section.id)} className="btn btn-danger btn-sm">
            Delete Section
          </button>
        )}
      </div>

      {isEditing && (
        <div className="variant-manager">
          <h4>Variants</h4>
          {section.variants.map((variant) => (
            <div key={variant.name} className="variant-item">
              <strong>{variant.name}</strong>
              {variant.isActive && <span className="badge">Active</span>}
              <p>{variant.content.substring(0, 100)}...</p>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm">+ Add Variant</button>
        </div>
      )}

      <div className="modular-section-content">
        <div dangerouslySetInnerHTML={{ __html: activeVariant.content }} />
      </div>
    </div>
  );
};

export default ModularSection;

