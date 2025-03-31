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
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin, loginAsPlayer, loginAsScorekeeper } = useUser();
  
  // Load players for the dropdown when the modal opens
  useEffect(() => {
    const loadPlayers = async () => {
      if (isOpen && role === 'player') {
        setLoading(true);
        try {
          const allPlayers = await dataSync.getFriends();
          setPlayers(allPlayers || []);
        } catch (err) {
          console.error('Error loading players:', err);
          setError('Unable to load players. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadPlayers();
  }, [isOpen, role]);
  
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
      // For scorekeeper, validate the simple access code
      try {
        // Get the group data to verify the access code
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
        
        // Allow the default 4-digit code or the specific accessCode from the group
        const validCode = group.accessCode || '1234';
        
        // Also allow a master code for testing
        if (accessCode === validCode || accessCode === '0000') {
          loginAsScorekeeper(gameId, groupIndex, accessCode);
          onClose();
        } else {
          setError('Invalid scorekeeper code. Please check and try again.');
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
          
          {/* Only show access code field for scorekeeper, not for admin */}
          {role === 'scorekeeper' && (
            <div className="form-group">
              <label>Scorekeeper Access Code:</label>
              <input 
                type="text"
                className="access-code-input"
                value={accessCode} 
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter 4-digit code"
                maxLength={4}
                pattern="[0-9]*"
              />
              
              <div className="access-code-help">
                <p>Enter the 4-digit access code provided by the administrator.</p>
                <p className="fallback-hint">Tip: Try code <strong>0000</strong> if you don't have the access code.</p>
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
