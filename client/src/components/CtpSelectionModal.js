import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';

/**
 * Closest to Pin (CTP) Selection Modal
 * 
 * This component allows admin to select the player who was closest to the pin on hole #2
 * before finalizing a game.
 */
const CtpSelectionModal = ({ isOpen, onClose, gameId, onSelectCtp }) => {
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Load all players in the game
  useEffect(() => {
    const loadPlayers = async () => {
      if (!isOpen || !gameId) return;
      
      try {
        setLoading(true);
        
        // Get the game data
        const games = await dataSync.getGames();
        const game = games.find(g => g.id === gameId);
        
        if (!game) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        // Get all players from all groups
        const playerIds = new Set();
        if (game.groups && Array.isArray(game.groups)) {
          game.groups.forEach(group => {
            if (group.playerIds && Array.isArray(group.playerIds)) {
              group.playerIds.forEach(id => playerIds.add(id));
            }
          });
        }
        
        // Get player details
        const allPlayersList = await dataSync.getFriends();
        const gamePlayersWithDetails = allPlayersList.filter(player => 
          playerIds.has(player.id)
        );
        
        setAllPlayers(gamePlayersWithDetails);
        
        // If CTP already set, preselect it
        if (game.ctpPlayerId) {
          setSelectedPlayerId(game.ctpPlayerId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading players for CTP selection:', err);
        setError('Failed to load players');
        setLoading(false);
      }
    };
    
    loadPlayers();
  }, [isOpen, gameId]);
  
  // Handle confirmation
  const handleConfirm = () => {
    if (selectedPlayerId) {
      onSelectCtp(selectedPlayerId);
      onClose();
    } else {
      setError('Please select a player');
    }
  };
  
  // Don't render if modal is not open
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container ctp-modal">
        <div className="modal-header">
          <h3>Select Closest to Pin Winner (Hole #2)</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="ctp-instructions">
            <p>Select the player who was closest to the pin on Hole #2.</p>
            <p>This award is determined after all foursomes have completed hole #2.</p>
          </div>
          
          {loading ? (
            <div className="loading-indicator">Loading players...</div>
          ) : (
            <div className="ctp-player-selection">
              <h4>Select CTP Winner:</h4>
              <div className="ctp-player-grid">
                {allPlayers.map(player => (
                  <div 
                    key={player.id}
                    className={`ctp-player-card ${selectedPlayerId === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
                    <div className="ctp-player-name">{player.name}</div>
                    {player.handicap !== undefined && (
                      <div className="ctp-player-handicap">Handicap: {player.handicap}</div>
                    )}
                    {selectedPlayerId === player.id && (
                      <div className="ctp-selected-indicator">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {allPlayers.length === 0 && !loading && (
                <div className="empty-state">No players found in this game.</div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn primary-btn"
              onClick={handleConfirm}
              disabled={!selectedPlayerId || loading}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CtpSelectionModal;
