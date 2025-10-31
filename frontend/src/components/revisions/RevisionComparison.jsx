import React, { useState, useEffect, useRef } from 'react';
import { revisionAPI } from '../../services/api';
import { highlightHtmlDiff } from '../../utils/diffUtils';
import LoadingSpinner from '../common/LoadingSpinner';

const RevisionComparison = ({ revision1Id, revision2Id, revisionCache = {} }) => {
  const [revision1, setRevision1] = useState(null);
  const [revision2, setRevision2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [highlightedOldContent, setHighlightedOldContent] = useState('');
  const [highlightedNewContent, setHighlightedNewContent] = useState('');
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isSyncingRef = useRef(false);
  const workerRef = useRef(null);

  // Initialize Web Worker for diff calculation
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../../workers/diffWorker.js', import.meta.url));
    } catch (error) {
      console.error('Failed to initialize Web Worker:', error);
      // Worker will remain null, and we'll handle it in the diff calculation effect
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    fetchRevisionsAndCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision1Id, revision2Id, revisionCache]);

  // Calculate diff using Web Worker when revisions are loaded
  useEffect(() => {
    if (!revision1 || !revision2) return;

    setLoading(true);

    // If Web Worker is available, use it for better performance
    if (workerRef.current) {
      let oldCompleted = false;
      let newCompleted = false;

      const checkBothComplete = () => {
        if (oldCompleted && newCompleted) {
          setLoading(false);
        }
      };

      const handleMessage = (event) => {
        const { id, result, error } = event.data;
        
        if (error) {
          console.error('Worker error:', error);
          setLoading(false);
          return;
        }

        if (id === 'old') {
          setHighlightedOldContent(result);
          oldCompleted = true;
          checkBothComplete();
        } else if (id === 'new') {
          setHighlightedNewContent(result);
          newCompleted = true;
          checkBothComplete();
        }
      };

      workerRef.current.addEventListener('message', handleMessage);

      // Send both diff calculations to worker
      workerRef.current.postMessage({
        id: 'old',
        oldHtml: revision1.content,
        newHtml: revision2.content,
        side: 'old'
      });

      workerRef.current.postMessage({
        id: 'new',
        oldHtml: revision1.content,
        newHtml: revision2.content,
        side: 'new'
      });

      return () => {
        workerRef.current?.removeEventListener('message', handleMessage);
      };
    } else {
      // Fallback: calculate on main thread (will block UI for large docs)
      console.warn('Web Worker not available, using main thread for diff calculation');
      try {
        const oldContent = highlightHtmlDiff(revision1.content, revision2.content, 'old');
        const newContent = highlightHtmlDiff(revision1.content, revision2.content, 'new');
        setHighlightedOldContent(oldContent);
        setHighlightedNewContent(newContent);
      } catch (error) {
        console.error('Diff calculation error:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [revision1, revision2]);

  // Set up synchronized scrolling
  useEffect(() => {
    const leftColumn = leftColumnRef.current;
    const rightColumn = rightColumnRef.current;

    if (!leftColumn || !rightColumn) return;

    const handleLeftScroll = () => {
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        const scrollPercentage = leftColumn.scrollTop / (leftColumn.scrollHeight - leftColumn.clientHeight);
        rightColumn.scrollTop = scrollPercentage * (rightColumn.scrollHeight - rightColumn.clientHeight);
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      }
    };

    const handleRightScroll = () => {
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        const scrollPercentage = rightColumn.scrollTop / (rightColumn.scrollHeight - rightColumn.clientHeight);
        leftColumn.scrollTop = scrollPercentage * (leftColumn.scrollHeight - leftColumn.clientHeight);
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      }
    };

    leftColumn.addEventListener('scroll', handleLeftScroll);
    rightColumn.addEventListener('scroll', handleRightScroll);

    return () => {
      leftColumn.removeEventListener('scroll', handleLeftScroll);
      rightColumn.removeEventListener('scroll', handleRightScroll);
    };
  }, [revision1, revision2]);

  const fetchRevisionsAndCompare = async () => {
    setLoading(true);
    try {
      // Check cache first, only fetch if not cached
      const fetchPromises = [];
      
      if (revisionCache[revision1Id]) {
        fetchPromises.push(Promise.resolve({ data: { data: { revision: revisionCache[revision1Id] } } }));
      } else {
        fetchPromises.push(revisionAPI.getRevision(revision1Id));
      }
      
      if (revisionCache[revision2Id]) {
        fetchPromises.push(Promise.resolve({ data: { data: { revision: revisionCache[revision2Id] } } }));
      } else {
        fetchPromises.push(revisionAPI.getRevision(revision2Id));
      }

      const [res1, res2] = await Promise.all(fetchPromises);

      const rev1 = res1.data.data.revision;
      const rev2 = res2.data.data.revision;

      // Ensure revision1 is the older one, revision2 is the newer one
      if (new Date(rev1.timestamp) < new Date(rev2.timestamp)) {
        setRevision1(rev1);
        setRevision2(rev2);
      } else {
        setRevision1(rev2);
        setRevision2(rev1);
      }
      // Note: loading state will be set to false by the Web Worker effect
    } catch (error) {
      console.error('Error fetching revisions:', error);
      setLoading(false);
    }
  };

  if (loading) {
    const message = revision1 && revision2 
      ? "Analyzing differences..." 
      : "Loading comparison...";
    return (
      <div className="revision-comparison">
        <LoadingSpinner message={message} />
      </div>
    );
  }

  if (!revision1 || !revision2) {
    return (
      <div className="revision-comparison">
        <div className="error-message">
          <p>Error loading revisions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="revision-comparison">
      <div className="comparison-header">
        <h3>Revision Comparison</h3>
        <div className="comparison-info">
          <div className="revision-info-box">
            <h4>Version 1 - {revision1.description} (Old)</h4>
            <div className="revision-meta-inline">
              <small>{new Date(revision1.timestamp).toLocaleString()}</small>
              <span className="meta-separator">•</span>
              <small>{revision1.wordCount} words</small>
            </div>
          </div>
          <div className="revision-info-box">
            <h4>Version 2 - {revision2.description} (New)</h4>
            <div className="revision-meta-inline">
              <small>{new Date(revision2.timestamp).toLocaleString()}</small>
              <span className="meta-separator">•</span>
              <small>{revision2.wordCount} words</small>
            </div>
          </div>
        </div>
      </div>

      <div className="comparison-view">
        <div className="comparison-column">
          <div className="comparison-content" ref={leftColumnRef}>
            <div 
              className="comparison-html-content"
              dangerouslySetInnerHTML={{ __html: highlightedOldContent }}
            />
          </div>
        </div>
        <div className="comparison-column">
          <div className="comparison-content" ref={rightColumnRef}>
            <div 
              className="comparison-html-content"
              dangerouslySetInnerHTML={{ __html: highlightedNewContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionComparison;

