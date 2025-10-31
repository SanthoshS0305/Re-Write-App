import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStory from '../../hooks/useStory';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import CharacterManager from './CharacterManager';

const ChapterList = () => {
  const { storyId } = useParams();
  const { currentStory, loading, fetchStory, createChapter, deleteChapter } = useStory();
  const [showForm, setShowForm] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('chapters'); // 'chapters' or 'characters'
  const navigate = useNavigate();

  useEffect(() => {
    if (storyId) {
      fetchStory(storyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;

    setCreating(true);
    const result = await createChapter(storyId, { title: chapterTitle });
    setCreating(false);

    if (result.success) {
      setChapterTitle('');
      setShowForm(false);
      navigate(`/stories/${storyId}/chapters/${result.chapter._id}`);
    }
  };

  const handleDeleteChapter = (chapterId) => {
    setChapterToDelete(chapterId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (chapterToDelete) {
      await deleteChapter(chapterToDelete);
      setChapterToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setChapterToDelete(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading story..." />;
  }

  if (!currentStory) {
    return <div>Story not found</div>;
  }

  return (
    <div className="chapter-list-page">
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>{currentStory.title}</h1>
            <p className="story-description">{currentStory.description}</p>
          </div>
          {activeTab === 'chapters' && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              + New Chapter
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            Chapters
          </button>
          <button
            className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            Characters
          </button>
        </div>

        {/* Chapters Tab */}
        {activeTab === 'chapters' && (
          <>
            {showForm && (
              <div className="chapter-form-inline">
                <form onSubmit={handleCreateChapter}>
                  <input
                    type="text"
                    placeholder="Chapter title..."
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    maxLength={200}
                    disabled={creating}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary btn-sm"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {currentStory.chapters && currentStory.chapters.length > 0 ? (
              <div className="chapter-list">
                {currentStory.chapters.map((chapter, index) => (
                  <div 
                    key={chapter._id} 
                    className="chapter-item"
                    onClick={() => navigate(`/stories/${storyId}/chapters/${chapter._id}`)}
                  >
                    <div className="chapter-info">
                      <span className="chapter-number">Chapter {index + 1}</span>
                      <h3>{chapter.title}</h3>
                      <span className="chapter-meta">
                        Updated {new Date(chapter.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="chapter-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteChapter(chapter._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No chapters yet. Create your first chapter to start writing!</p>
              </div>
            )}
          </>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <CharacterManager
            storyId={storyId}
            characters={currentStory.characters || []}
            onUpdate={fetchStory}
          />
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Chapter"
          message="Are you sure you want to delete this chapter? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          isDanger={true}
        />
      </div>
    </div>
  );
};

export default ChapterList;

