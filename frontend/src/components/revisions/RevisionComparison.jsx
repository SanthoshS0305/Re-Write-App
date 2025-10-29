import React, { useState, useEffect, useRef } from 'react';
import { revisionAPI } from '../../services/api';
import { highlightHtmlDiff } from '../../utils/diffUtils';

const RevisionComparison = ({ revision1Id, revision2Id }) => {
  const [revision1, setRevision1] = useState(null);
  const [revision2, setRevision2] = useState(null);
  const [loading, setLoading] = useState(true);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    fetchRevisionsAndCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision1Id, revision2Id]);

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
      const [res1, res2] = await Promise.all([
        revisionAPI.getRevision(revision1Id),
        revisionAPI.getRevision(revision2Id),
      ]);

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
    } catch (error) {
      console.error('Error fetching revisions:', error);
    }
    setLoading(false);
  };

  const getHighlightedContent = (side) => {
    if (!revision1 || !revision2) return '';
    return highlightHtmlDiff(
      revision1.content, 
      revision2.content, 
      side
    );
  };

  if (loading) {
    return <p>Loading comparison...</p>;
  }

  if (!revision1 || !revision2) {
    return <p>Error loading revisions</p>;
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
              dangerouslySetInnerHTML={{ __html: getHighlightedContent('old') }}
            />
          </div>
        </div>
        <div className="comparison-column">
          <div className="comparison-content" ref={rightColumnRef}>
            <div 
              className="comparison-html-content"
              dangerouslySetInnerHTML={{ __html: getHighlightedContent('new') }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionComparison;

