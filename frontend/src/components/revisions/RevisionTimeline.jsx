import React from 'react';

// Placeholder component for revision timeline visualization
const RevisionTimeline = ({ revisions }) => {
  return (
    <div className="revision-timeline">
      <h4>Timeline View</h4>
      <p className="info-text">Visual timeline representation coming soon</p>
      <div className="timeline-placeholder">
        {revisions && revisions.length > 0 ? (
          <div className="timeline-simple">
            {revisions.map((revision, index) => (
              <div key={revision._id} className="timeline-node">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-description">{revision.description}</span>
                  <span className="timeline-date">
                    {new Date(revision.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No revisions to display</p>
        )}
      </div>
    </div>
  );
};

export default RevisionTimeline;

