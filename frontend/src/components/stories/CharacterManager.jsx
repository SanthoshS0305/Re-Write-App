import React, { useState } from 'react';
import { storyAPI } from '../../services/api';

const CharacterManager = ({ storyId, characters, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [formData, setFormData] = useState({
    primaryName: '',
    aliases: '',
    color: '#3b82f6',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({
      primaryName: '',
      aliases: '',
      color: '#3b82f6',
    });
    setEditingCharacter(null);
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.primaryName.trim()) return;

    setProcessing(true);
    setError(null);

    try {
      const data = {
        primaryName: formData.primaryName.trim(),
        aliases: formData.aliases.split(',').map((a) => a.trim()).filter(Boolean),
        color: formData.color,
      };

      if (editingCharacter) {
        await storyAPI.updateCharacter(storyId, editingCharacter.id, data);
      } else {
        await storyAPI.createCharacter(storyId, data);
      }

      // Refresh story data
      if (onUpdate) {
        await onUpdate();
      }

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save character');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (character) => {
    setEditingCharacter(character);
    setFormData({
      primaryName: character.primaryName,
      aliases: character.aliases.join(', '),
      color: character.color || '#3b82f6',
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (characterId) => {
    if (!window.confirm('Are you sure you want to delete this character?')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await storyAPI.deleteCharacter(storyId, characterId);
      if (onUpdate) {
        await onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete character');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="character-manager">
      <div className="character-manager-header">
        <h3>Characters</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary btn-sm"
          disabled={processing}
        >
          {showForm ? 'Cancel' : '+ Add Character'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="character-form">
          <div className="form-group">
            <label>Character Name</label>
            <input
              type="text"
              value={formData.primaryName}
              onChange={(e) => setFormData({ ...formData, primaryName: e.target.value })}
              placeholder="e.g., John Smith"
              maxLength={100}
              disabled={processing}
              required
            />
          </div>

          <div className="form-group">
            <label>Aliases (comma-separated)</label>
            <input
              type="text"
              value={formData.aliases}
              onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
              placeholder="e.g., John, J, Smith"
              disabled={processing}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                disabled={processing}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
                disabled={processing}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={processing}>
              {processing ? 'Saving...' : editingCharacter ? 'Update' : 'Create'}
            </button>
            {editingCharacter && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary btn-sm"
                disabled={processing}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {characters && characters.length > 0 ? (
        <div className="character-list">
          {characters.map((character) => (
            <div key={character.id} className="character-item">
              <div className="character-info">
                <div
                  className="character-color-indicator"
                  style={{ backgroundColor: character.color }}
                />
                <div>
                  <strong>{character.primaryName}</strong>
                  {character.aliases && character.aliases.length > 0 && (
                    <div className="character-aliases">
                      Aliases: {character.aliases.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="character-actions">
                <button
                  onClick={() => handleEdit(character)}
                  className="btn btn-secondary btn-sm"
                  disabled={processing}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(character.id)}
                  className="btn btn-danger btn-sm"
                  disabled={processing}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No characters yet. Add characters to track them in your story.</p>
        </div>
      )}
    </div>
  );
};

export default CharacterManager;

