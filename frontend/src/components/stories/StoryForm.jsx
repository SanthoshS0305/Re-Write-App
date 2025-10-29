import React, { useState, useEffect } from 'react';
import useStory from '../../hooks/useStory';

const StoryForm = ({ story, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { createStory, updateStory } = useStory();

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || '');
    }
  }, [story]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = { title, description };
    const result = story
      ? await updateStory(story._id, data)
      : await createStory(data);

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{story ? 'Edit Story' : 'Create New Story'}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={loading}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : story ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoryForm;

