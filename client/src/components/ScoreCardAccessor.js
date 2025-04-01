import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';
import StatusBadge from './StatusBadge';
import '../styles/ScoreCardAccessor.css';

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
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if current user is the scorekeeper and load game data
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Load game data for status checking
        const games = await dataSync.getGames();
        const currentGame = games.find(g => g.id === gameId);
        
        if (!currentGame) {
          setError("Game not found");
          setLoading(false);
          return;
        }
        
        setGame(currentGame);
        
        // Check if current user is the scorekeeper
        const currentUser = dataSync.getCurrentUser();
        console.log("Current user:", currentUser);
        console.log("Group:", group);
        
        if (currentUser && group.scorekeeperId === currentUser.id) {
          setIsScorekeeperUser(true);
        }
        
        // Get scorekeeper details
        if (group.scorekeeperId) {
          const allPlayers = await dataSync.getFriends();
          console.log("All players:", allPlayers);
          
          const scorekeeper = allPlayers.find(p => p.id === group.scorekeeperId);
          console.log("Scorekeeper:", scorekeeper);
          
          if (scorekeeper) {
            setScorekeeperInfo(scorekeeper);
          }
        } else {
          console.log("No scorekeeper assigned for this group");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error in initialization:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    };
    
    initialize();
  }, [gameId, group, groupIndex]);
  
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
  
  // Check if score entry is allowed based on game status
  const isScoreEntryAllowed = () => {
    if (!game) return false;
    
    // Only allow score entry for in_progress, open, enrollment_complete, or completed (but not finalized) games
    return ['in_progress', 'open', 'enrollment_complete', 'completed'].includes(game.status) && 
           game.status !== 'finalized';
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="scorecard-accessor">
      {/* Game Status Display */}
      {game && (
        <div className="game-status-section">
          <h3>Game Status: <StatusBadge status={game.status || 'created'} /></h3>
          
          {game.status === 'finalized' && (
            <div className="status-message finalized-message">
              <p>This game has been finalized. Scores can no longer be modified.</p>
              <p>View the results in the <span className="link-text" onClick={() => navigate('/game-history')}>Game History</span> page.</p>
            </div>
          )}
          
          {game.status === 'completed' && (
            <div className="status-message completed-message">
              <p>This game has been marked as completed. Final editing is still possible.</p>
            </div>
          )}
          
          {!['completed', 'finalized'].includes(game.status) && (
            <div className="status-message">
              <p>Scores can be entered and modified.</p>
            </div>
          )}
        </div>
      )}
      
      {isScorekeeperUser ? (
        <div className="scorekeeper-controls">
          <button 
            className={`btn btn-primary ${!isScoreEntryAllowed() ? 'disabled' : ''}`}
            onClick={isScoreEntryAllowed() ? goToScorecard : undefined}
            disabled={!isScoreEntryAllowed()}
          >
            {isScoreEntryAllowed() ? 'Enter Scores' : 'Score Entry Closed'}
          </button>
          
          {!isScoreEntryAllowed() && (
            <p className="disabled-message">
              {game.status === 'finalized' 
                ? 'This game has been finalized and scores cannot be modified.' 
                : 'Score entry is not available for this game status.'}
            </p>
          )}
        </div>
      ) : (
        <div className="scorekeeper-info">
          <div>Scorekeeper: <strong>{scorekeeperInfo?.name || 'Not assigned'}</strong></div>
          
          {group.scorekeeperId && (
            <div className="scorekeeper-instructions">
              <p>Share this link with the assigned scorekeeper:</p>
              <div className="scorecard-link-display">
                <code>{getScorecardLink()}</code>
              </div>
              
              {!isScoreEntryAllowed() && (
                <div className="warning-box">
                  <p>
                    <strong>Note:</strong> This game is {game.status === 'finalized' ? 'finalized' : `in "${game.status}" status`} and 
                    score entry is {game.status === 'finalized' ? 'permanently closed' : 'currently not available'}.
                  </p>
                </div>
              )}
              
              <div className="scorekeeper-info-box">
                <p>
                  <strong>Note:</strong> The scorekeeper will need to log in with their player account to access this scorecard.
                </p>
              </div>
              <div className="scorecard-actions">
                <button 
                  className="btn btn-secondary copy-link-btn"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? 'Link Copied! ✓' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
          
          {!group.scorekeeperId && (
            <div className="no-scorekeeper-warning">
              <p>No scorekeeper assigned. Please select a scorekeeper to enable score entry.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreCardAccessor;
