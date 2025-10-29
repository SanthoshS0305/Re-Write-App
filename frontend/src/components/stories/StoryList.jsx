import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStory from '../../hooks/useStory';
import LoadingSpinner from '../common/LoadingSpinner';
import StoryForm from './StoryForm';
import ConfirmDialog from '../common/ConfirmDialog';

const StoryList = () => {
  const { stories, loading, fetchStories, deleteStory } = useStory();
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id) => {
    setStoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (storyToDelete) {
      await deleteStory(storyToDelete);
      setStoryToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setStoryToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingStory(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStory(null);
  };

  if (loading && stories.length === 0) {
    return <LoadingSpinner message="Loading stories..." />;
  }

  return (
    <div className="story-list-container">
      <div className="page-header">
        <h1>My Stories</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          + New Story
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="empty-state">
          <p>No stories yet. Create your first story to get started!</p>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Story
          </button>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((story) => (
            <div 
              key={story._id} 
              className="story-card"
              onClick={() => navigate(`/stories/${story._id}`)}
            >
              <div className="story-card-content">
                <h3>{story.title}</h3>
                <p className="story-description">
                  {story.description || 'No description'}
                </p>
                <div className="story-meta">
                  <span>{story.chapters?.length || 0} chapters</span>
                  <span>
                    Updated {new Date(story.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="story-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEdit(story)}
                  className="btn btn-secondary btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(story._id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StoryForm story={editingStory} onClose={handleCloseForm} />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Story"
        message="Are you sure you want to delete this story? All chapters will be lost. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default StoryList;

