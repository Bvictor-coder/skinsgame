import React, { useState, useEffect } from 'react';
import { useUser } from '../utils/userContext';
import dataSync from '../utils/dataSync';

/**
 * Login Modal Component
 * 
 * This component handles user login for different roles
 */
const LoginModal = ({ isOpen, onClose, gameId, groupIndex }) => {
  const [role, setRole] = useState('');
  const [playerId, setPlayerId] = useState('');
  // accessCode state removed as it's no longer needed with the new scorekeeper login approach
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin, loginAsPlayer, loginAsScorekeeper } = useUser();
  
  // Load players for the dropdown when the modal opens
  useEffect(() => {
    const loadPlayers = async () => {
      if (isOpen && (role === 'player' || role === 'scorekeeper')) {
        setLoading(true);
        try {
          // Get all players
          const allPlayers = await dataSync.getFriends();
          
          // If we're in scorekeeper mode and have a gameId/groupIndex,
          // we need to filter to show only the designated scorekeeper
          if (role === 'scorekeeper' && gameId && groupIndex !== undefined) {
            const gamesData = await dataSync.getGames();
            const game = gamesData.find(g => g.id === gameId);
            
            if (game && game.groups && game.groups[groupIndex]) {
              const group = game.groups[groupIndex];
              
              // If this group has a designated scorekeeper, filter the players list
              if (group.scorekeeperId) {
                const scorekeeperPlayer = allPlayers.find(p => p.id === group.scorekeeperId);
                if (scorekeeperPlayer) {
                  setPlayers([scorekeeperPlayer]);
                } else {
                  // If we can't find the scorekeeper in the players list, show all
                  setPlayers(allPlayers || []);
                }
              } else {
                // No designated scorekeeper, show all players
                setPlayers(allPlayers || []);
              }
            } else {
              // Game or group not found, show all players
              setPlayers(allPlayers || []);
            }
          } else {
            // For player role, just show all players
            setPlayers(allPlayers || []);
          }
        } catch (err) {
          console.error('Error loading players:', err);
          setError('Unable to load players. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadPlayers();
  }, [isOpen, role, gameId, groupIndex]);
  
  // Load game data for scorekeeper code validation
  useEffect(() => {
    const loadGameData = async () => {
      if (isOpen && role === 'scorekeeper' && gameId && groupIndex !== undefined) {
        try {
          // Try to get the simple access code from the group
          const gamesData = await dataSync.getGames();
          const game = gamesData.find(g => g.id === gameId);
          
          if (game && game.groups && game.groups[groupIndex]) {
            const group = game.groups[groupIndex];
            
            // Check if the group has an accessCode property
            if (group.accessCode) {
              // Show a hint about the access code format
              console.log('Access code is available:', group.accessCode);
            }
          }
        } catch (err) {
          console.error('Error loading game data for access code:', err);
        }
      }
    };
    
    loadGameData();
  }, [isOpen, role, gameId, groupIndex]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Handle login attempt
  const handleLogin = async () => {
    setError('');
    
    if (role === 'admin') {
      // For admin, allow access without password in this demo version
      loginAsAdmin();
      onClose();
    } else if (role === 'player') {
      // For player, ensure a player is selected
      if (playerId) {
        loginAsPlayer(playerId);
        onClose();
      } else {
        setError('Please select a player');
      }
    } else if (role === 'scorekeeper') {
      // For scorekeeper, ensure a scorekeeper is selected
      if (!playerId) {
        setError('Please select a scorekeeper');
        return;
      }
      
      try {
        // Get the game data to verify the scorekeeper is valid for this group
        const gamesData = await dataSync.getGames();
        const game = gamesData.find(g => g.id === gameId);
        
        if (!game) {
          setError('Game not found. Please check the link and try again.');
          return;
        }
        
        const group = game.groups && game.groups[groupIndex];
        
        if (!group) {
          setError('Group not found. Please check the link and try again.');
          return;
        }
        
        // Check if this player is the designated scorekeeper for this group
        if (playerId === group.scorekeeperId) {
          loginAsScorekeeper(gameId, groupIndex, playerId);
          onClose();
        } else {
          setError('You are not the designated scorekeeper for this group.');
        }
      } catch (err) {
        console.error('Error validating scorekeeper access:', err);
        setError('Error validating scorekeeper access. Please try again.');
      }
    } else {
      setError('Please select a role');
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Login</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Login As:</label>
            <div className="role-options">
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="player" 
                  checked={role === 'player'} 
                  onChange={() => {
                    setRole('player');
                    setError('');
                  }}
                />
                Player
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="admin" 
                  checked={role === 'admin'} 
                  onChange={() => {
                    setRole('admin');
                    setError('');
                  }}
                />
                Admin
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="scorekeeper" 
                  checked={role === 'scorekeeper'} 
                  onChange={() => {
                    setRole('scorekeeper');
                    setError('');
                  }}
                />
                Scorekeeper
              </label>
            </div>
          </div>
          
          {/* Show appropriate form based on role */}
          {role === 'player' && (
            <div className="form-group">
              <label>Select Player:</label>
              {loading ? (
                <div className="loading-indicator">Loading players...</div>
              ) : (
                <select 
                  value={playerId} 
                  onChange={(e) => setPlayerId(e.target.value)}
                >
                  <option value="">-- Select Player --</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              )}
              {players.length === 0 && !loading && (
                <div className="info-message">
                  No players found. Please contact the administrator.
                </div>
              )}
            </div>
          )}
          
          {/* Show scorekeeper selection dropdown */}
          {role === 'scorekeeper' && (
            <div className="form-group">
              <label>Select Game:</label>
              <select 
                value={gameId || ''}
                onChange={(e) => {
                  // This would normally update gameId, but we're using the one from props
                  console.log('Would select game:', e.target.value);
                }}
                disabled={gameId ? true : false}
              >
                {gameId ? (
                  <option value={gameId}>Current Game</option>
                ) : (
                  <option value="">-- Select Game --</option>
                )}
              </select>
              
              <label>Select Scorekeeper:</label>
              {loading ? (
                <div className="loading-indicator">Loading scorekeepers...</div>
              ) : (
                <select 
                  value={playerId} 
                  onChange={(e) => setPlayerId(e.target.value)}
                >
                  <option value="">-- Select Your Name --</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              )}
              
              <div className="scorekeeper-info">
                <p>You must be the designated scorekeeper for this group.</p>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleLogin}>Login</button>
            <button className="btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
