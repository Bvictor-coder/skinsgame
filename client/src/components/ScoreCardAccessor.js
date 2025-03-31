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
  const [accessCode, setAccessCode] = useState("1234"); // Default simple code
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
        
        // Generate a simple accessCode - either use an existing one or create a new one
        if (group.accessCode) {
          setAccessCode(group.accessCode);
        } else {
          // Generate a simple 4-digit PIN
          const newCode = Math.floor(1000 + Math.random() * 9000).toString();
          setAccessCode(newCode);
          
          // Save the code to the group
          const updatedGroup = { ...group, accessCode: newCode };
          
          // Get the game to update the group
          const gamesData = await dataSync.getGames();
          const game = gamesData.find(g => g.id === gameId);
          
          if (game && game.groups) {
            const updatedGroups = [...game.groups];
            updatedGroups[groupIndex] = updatedGroup;
            
            const updatedGame = { ...game, groups: updatedGroups };
            await dataSync.updateGame(updatedGame);
          }
        }
      }
    };
    
    checkIfScorekeeper();
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
          
          {group.scorekeeperId && (
            <div className="scorekeeper-instructions">
              <p>Share this link with the assigned scorekeeper:</p>
              <div className="scorecard-link-display">
                <code>{getScorecardLink()}</code>
              </div>
              <div className="login-code-info">
                <div className="simple-access-code">
                  <h4>Scorekeeper Login Code</h4>
                  <div className="code-display">{accessCode}</div>
                </div>
                <p>
                  <strong>Note:</strong> The scorekeeper will need this simple 4-digit code to access and enter scores.
                </p>
              </div>
              <div className="scorecard-actions">
                <button 
                  className="btn btn-secondary copy-link-btn"
                  onClick={copyLinkToClipboard}
                >
                  {linkCopied ? 'Link Copied! ✓' : 'Copy Link'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                    setAccessCode(newCode);
                    
                    // Update the group with the new code (in a real app)
                    // This is simplified for demonstration
                  }}
                >
                  Generate New Code
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
