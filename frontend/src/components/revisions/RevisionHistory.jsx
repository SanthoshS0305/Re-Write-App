import React, { useState, useEffect } from 'react';
import { revisionAPI } from '../../services/api';
import RevisionComparison from './RevisionComparison';
import ConfirmDialog from '../common/ConfirmDialog';

const RevisionHistory = ({ chapterId }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision1, setSelectedRevision1] = useState(null);
  const [selectedRevision2, setSelectedRevision2] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [revisionToRestore, setRevisionToRestore] = useState(null);
  const [revisionCache, setRevisionCache] = useState({});

  useEffect(() => {
    fetchRevisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // Handle escape key to close comparison modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showComparison) {
        setShowComparison(false);
      }
    };

    if (showComparison) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showComparison]);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const response = await revisionAPI.getRevisions(chapterId);
      setRevisions(response.data.data.revisions);
    } catch (error) {
      console.error('Error fetching revisions:', error);
    }
    setLoading(false);
  };

  const handleRestore = (revisionId) => {
    setRevisionToRestore(revisionId);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!revisionToRestore) return;

    setShowRestoreConfirm(false);
    try {
      await revisionAPI.restoreRevision(chapterId, revisionToRestore);
      window.location.reload();
    } catch (error) {
      console.error('Error restoring revision:', error);
      alert('Failed to restore revision');
    }
    setRevisionToRestore(null);
  };

  const cancelRestore = () => {
    setRevisionToRestore(null);
    setShowRestoreConfirm(false);
  };

  const handleCompare = () => {
    if (selectedRevision1 && selectedRevision2) {
      setShowComparison(true);
    } else {
      alert('Please select two revisions to compare');
    }
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
  };

  // Pre-fetch revision data when selected
  const prefetchRevision = async (revisionId) => {
    // Skip if already cached
    if (revisionCache[revisionId]) {
      return;
    }

    try {
      const response = await revisionAPI.getRevision(revisionId);
      const revision = response.data.data.revision;
      setRevisionCache(prev => ({
        ...prev,
        [revisionId]: revision
      }));
    } catch (error) {
      console.error('Error pre-fetching revision:', error);
    }
  };

  return (
    <div className="revision-history">
      <div className="revision-header">
        <h3>Revision History</h3>
        <button
          onClick={handleCompare}
          className="btn btn-primary btn-sm"
          disabled={!selectedRevision1 || !selectedRevision2}
        >
          Compare Selected
        </button>
      </div>

      {loading ? (
        <p>Loading revisions...</p>
      ) : revisions.length === 0 ? (
        <p className="empty-state">No revisions yet. Save a revision to see it here.</p>
      ) : (
        <div className="revision-list">
          {revisions.map((revision) => (
            <div key={revision._id} className="revision-item">
              <div className="revision-select">
                <input
                  type="checkbox"
                  checked={selectedRevision1 === revision._id || selectedRevision2 === revision._id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (!selectedRevision1) {
                        setSelectedRevision1(revision._id);
                        prefetchRevision(revision._id); // Pre-fetch data immediately
                      } else if (!selectedRevision2) {
                        setSelectedRevision2(revision._id);
                        prefetchRevision(revision._id); // Pre-fetch data immediately
                      }
                    } else {
                      if (selectedRevision1 === revision._id) {
                        setSelectedRevision1(null);
                      } else if (selectedRevision2 === revision._id) {
                        setSelectedRevision2(null);
                      }
                    }
                  }}
                  disabled={
                    selectedRevision1 &&
                    selectedRevision2 &&
                    selectedRevision1 !== revision._id &&
                    selectedRevision2 !== revision._id
                  }
                />
              </div>
              <div className="revision-info">
                <div className="revision-description">{revision.description}</div>
                <div className="revision-meta">
                  <span>{new Date(revision.timestamp).toLocaleString()}</span>
                  <span>{revision.wordCount} words</span>
                </div>
              </div>
              <div className="revision-actions">
                <button
                  onClick={() => handleRestore(revision._id)}
                  className="btn btn-secondary btn-sm"
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="Restore Revision"
        message="Are you sure you want to restore this revision? Your current content will be saved as a new revision before restoring."
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
        confirmText="Restore"
      />

      {showComparison && selectedRevision1 && selectedRevision2 && (
        <div className="comparison-modal-overlay" onClick={handleCloseComparison}>
          <div className="comparison-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="comparison-close-button" 
              onClick={handleCloseComparison}
              aria-label="Close comparison"
            >
              ✕
            </button>
            <RevisionComparison
              revision1Id={selectedRevision1}
              revision2Id={selectedRevision2}
              revisionCache={revisionCache}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionHistory;

