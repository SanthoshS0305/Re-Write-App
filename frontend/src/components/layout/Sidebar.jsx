import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useStory from '../../hooks/useStory';

const Sidebar = () => {
  const { storyId, chapterId } = useParams();
  const { currentStory } = useStory();
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!currentStory) return null;

  return (
    <>
      {/* Floating toggle button when sidebar is collapsed */}
      {isCollapsed && (
        <button 
          className="sidebar-toggle-floating"
          onClick={() => setIsCollapsed(false)}
          aria-label="Open sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Overlay backdrop when sidebar is open */}
      {!isCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {!isCollapsed && (
          <>
            <button 
              className="sidebar-toggle-close"
              onClick={() => setIsCollapsed(true)}
              aria-label="Close sidebar"
            >
              ←
            </button>

            <div className="sidebar-header">
              <Link to="/stories" className="sidebar-back">
                ← Back to Stories
              </Link>
              <h3>{currentStory.title}</h3>
            </div>

            <div className="sidebar-section">
              <h4>Chapters</h4>
              <ul className="chapter-list">
                {currentStory.chapters && currentStory.chapters.length > 0 ? (
                  currentStory.chapters.map((chapter) => (
                    <li
                      key={chapter._id}
                      className={chapterId === chapter._id ? 'active' : ''}
                    >
                      <Link to={`/stories/${storyId}/chapters/${chapter._id}`}>
                        {chapter.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="empty-state">No chapters yet</li>
                )}
              </ul>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

