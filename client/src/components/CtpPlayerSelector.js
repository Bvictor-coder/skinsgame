import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';
import '../styles/CtpPlayerSelector.css';

/**
 * CtpPlayerSelector Component
 * 
 * Inline component for selecting a CTP (Closest to Pin) winner
 * directly within the game management interface
 */
const CtpPlayerSelector = ({ game, onSelectCtp, disabled = false }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(game.ctpPlayerId || '');
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  
  // Fetch all players from all groups in this game
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const friendsData = await dataSync.getFriends();
        
        // Extract all player IDs from all groups in the game
        const gamePlayerIds = game.groups?.flatMap(g => g.playerIds || []) || [];
        
        // Filter to only include players in this game
        const gamePlayers = friendsData.filter(p => gamePlayerIds.includes(p.id));
        
        setAllPlayers(gamePlayers);
        
        // If there's a selected CTP player, find their name
        if (game.ctpPlayerId) {
          const ctpPlayer = friendsData.find(p => p.id === game.ctpPlayerId);
          if (ctpPlayer) {
            setSelectedPlayerName(ctpPlayer.name);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching players for CTP selection:", error);
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, [game]);
  
  // Handle player selection
  const handleSelectPlayer = async (playerId) => {
    setSelectedPlayerId(playerId);
    
    // Find player name for display purposes
    if (playerId) {
      const player = allPlayers.find(p => p.id === playerId);
      setSelectedPlayerName(player?.name || '');
    } else {
      setSelectedPlayerName('');
    }
    
    // Call the callback to update game data
    onSelectCtp(playerId);
  };
  
  return (
    <div className="ctp-player-selector">
      <h4>Closest to Pin Winner</h4>
      {loading ? (
        <div className="loading-indicator">Loading players...</div>
      ) : (
        <>
          <div className="ctp-selection-wrapper">
            <select 
              value={selectedPlayerId}
              onChange={(e) => handleSelectPlayer(e.target.value)}
              disabled={disabled}
              className={disabled ? 'disabled' : ''}
            >
              <option value="">-- Select CTP Winner --</option>
              {allPlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
            
            <button 
              className="ctp-clear-btn"
              onClick={() => handleSelectPlayer('')}
              disabled={!selectedPlayerId || disabled}
            >
              Clear Selection
            </button>
          </div>
          
          {selectedPlayerId && selectedPlayerName && (
            <div className="ctp-winner-display">
              <span className="ctp-label">Current CTP Winner:</span>
              <span className="ctp-winner">{selectedPlayerName}</span>
            </div>
          )}
          
          {!selectedPlayerId && !disabled && game.ctpHole && (
            <div className="ctp-reminder">
              <p>Remember to select a CTP winner before finalizing the game</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CtpPlayerSelector;
