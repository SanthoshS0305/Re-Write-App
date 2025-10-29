import React from 'react';
import { Link, useParams } from 'react-router-dom';
import useStory from '../../hooks/useStory';

const Sidebar = () => {
  const { storyId, chapterId } = useParams();
  const { currentStory } = useStory();

  if (!currentStory) return null;

  return (
    <aside className="sidebar">
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
    </aside>
  );
};

export default Sidebar;

