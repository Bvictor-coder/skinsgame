import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';

/**
 * ScoreCardAccessor Component
 * 
 * This component provides access to the scorecard for a specific group,
 * either directly navigating to it for the scorekeeper or displaying
 * a link that can be shared with the scorekeeper.
 */
const ScoreCardAccessor = ({ gameId, groupIndex, group }) => {
  const [isScorekeeperUser, setIsScorekeeperUser] = useState(false);
  const [scorekeeperInfo, setScorekeeperInfo] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if current user is the scorekeeper
    const checkIfScorekeeper = async () => {
      const currentUser = dataSync.getCurrentUser();
      
      if (currentUser && group.scorekeeperId === currentUser.id) {
        setIsScorekeeperUser(true);
      }
      
      // Get scorekeeper details
      if (group.scorekeeperId) {
        const allPlayers = await dataSync.getFriends();
        const scorekeeper = allPlayers.find(p => p.id === group.scorekeeperId);
        if (scorekeeper) {
          setScorekeeperInfo(scorekeeper);
        }
      }
    };
    
    checkIfScorekeeper();
  }, [group]);
  
  // Generate a direct link to the scorecard page
  const getScorecardLink = () => {
    // Add safety check for SSR environments
    if (typeof window === 'undefined') {
      return `/scorecard/${gameId}/${groupIndex}`;
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/scorecard/${gameId}/${groupIndex}`;
  };
  
  // Copy the scorecard link to clipboard
  const copyLinkToClipboard = () => {
    const link = getScorecardLink();
    
    // Add safety check for clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
        });
    } else {
      // Fallback for browsers without clipboard API
      console.error('Clipboard API not available');
      
      // Still set copied state briefly to provide user feedback
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };
  
  // Navigate directly to the scorecard
  const goToScorecard = () => {
    navigate(`/scorecard/${gameId}/${groupIndex}`);
  };
  
  return (
    <div className="scorecard-accessor">
      {isScorekeeperUser ? (
        <button 
          className="btn btn-primary"
          onClick={goToScorecard}
        >
          Enter Scores
        </button>
      ) : (
        <div className="scorekeeper-info">
          <div>Scorekeeper: <strong>{scorekeeperInfo?.name || 'Not assigned'}</strong></div>
          <button 
            className="btn btn-secondary copy-link-btn"
            onClick={copyLinkToClipboard}
            disabled={!group.scorekeeperId}
          >
            {linkCopied ? 'Link Copied!' : 'Copy Scorecard Link'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreCardAccessor;
