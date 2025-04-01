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
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin, loginAsPlayer, loginAsScorekeeper } = useUser();
  
  // New state for scorekeeper selection
  const [activeGames, setActiveGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(gameId || '');
  const [gameGroups, setGameGroups] = useState([]);
  
  // Load players for regular player selection (not scorekeeper)
  useEffect(() => {
    const loadPlayers = async () => {
      if (isOpen && role === 'player') {
        setLoading(true);
        try {
          // Get all players
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
  
  // Load active games for scorekeeper role
  useEffect(() => {
    const loadActiveGames = async () => {
      if (isOpen && role === 'scorekeeper') {
        setLoading(true);
        try {
          // Get all games
          const gamesData = await dataSync.getGames();
          
          // Filter to games that are in progress or open (need scoring)
          const activeGamesData = gamesData.filter(game => 
            game.status === 'in_progress' || game.status === 'open'
          );
          
          setActiveGames(activeGamesData);
          
          // If gameId is provided via props, set it as selected
          if (gameId) {
            setSelectedGame(gameId);
            // Load scorekeeper info for this game
            await loadScorekeeperForGame(gameId, groupIndex);
          } else if (activeGamesData.length > 0) {
            // Otherwise, select the first active game by default
            setSelectedGame(activeGamesData[0].id);
          }
          
        } catch (err) {
          console.error('Error loading active games:', err);
          setError('Unable to load active games. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadActiveGames();
  }, [isOpen, role, gameId, groupIndex]);
  
  // Load scorekeeper info when a game is selected
  const loadScorekeeperForGame = async (gameId, specificGroupIndex = null) => {
    if (!gameId) return;
    
    try {
      // Get all players
      const allPlayers = await dataSync.getFriends();
      
      // Find the selected game
      const gamesData = await dataSync.getGames();
      const selectedGameData = gamesData.find(g => g.id === gameId);
      
      if (!selectedGameData || !selectedGameData.groups) {
        setError('Selected game has no groups');
        return;
      }
      
      setGameGroups(selectedGameData.groups);
      
      // If a specific group is provided, only show its scorekeeper
      if (specificGroupIndex !== null && selectedGameData.groups[specificGroupIndex]) {
        const group = selectedGameData.groups[specificGroupIndex];
        
        if (group.scorekeeperId) {
          const scorekeeperPlayer = allPlayers.find(p => p.id === group.scorekeeperId);
          if (scorekeeperPlayer) {
            setPlayers([{
              ...scorekeeperPlayer,
              groupIndex: specificGroupIndex
            }]);
            return;
          }
        }
      }
      
      // Otherwise, find all scorekeepers across groups
      const scorekeepers = selectedGameData.groups
        .filter(group => group.scorekeeperId)
        .map((group, index) => {
          const player = allPlayers.find(p => p.id === group.scorekeeperId);
          if (player) {
            return {
              ...player,
              groupIndex: index
            };
          }
          return null;
        })
        .filter(Boolean);
      
      setPlayers(scorekeepers);
      
    } catch (err) {
      console.error('Error loading scorekeepers:', err);
      setError('Failed to load scorekeeper information');
    }
  };
  
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
      // For scorekeeper, need a selected game and player
      if (!selectedGame && !gameId) {
        setError('Please select a game');
        return;
      }
      
      const effectiveGameId = gameId || selectedGame;
      
      if (!playerId) {
        setError('Please select a scorekeeper');
        return;
      }
      
      try {
        // Find the selected player to get the group index
        const selectedPlayer = players.find(p => p.id === playerId);
        if (!selectedPlayer) {
          setError('Selected player not found');
          return;
        }
        
        // Get group index from either the URL params or the selected player
        const effectiveGroupIndex = groupIndex !== undefined ? 
          groupIndex : selectedPlayer.groupIndex;
        
        // Get the game data to verify the scorekeeper is valid for this group
        const gamesData = await dataSync.getGames();
        const game = gamesData.find(g => g.id === effectiveGameId);
        
        if (!game) {
          setError('Game not found. Please check the game selection.');
          return;
        }
        
        const group = game.groups && game.groups[effectiveGroupIndex];
        
        if (!group) {
          setError('Group not found within this game.');
          return;
        }
        
        // Check if this player is the designated scorekeeper for this group
        if (playerId === group.scorekeeperId) {
          // Get player name for better display
          const playerName = selectedPlayer.name || 'Scorekeeper';
          
          // Use updated loginAsScorekeeper with player ID and name
          loginAsScorekeeper(effectiveGameId, effectiveGroupIndex, playerId, playerName);
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
                value={selectedGame || gameId || ''}
                onChange={(e) => {
                  const newGameId = e.target.value;
                  setSelectedGame(newGameId);
                  setPlayerId(''); // Reset player selection when game changes
                  if (newGameId) {
                    loadScorekeeperForGame(newGameId);
                  }
                }}
                disabled={gameId ? true : false}
              >
                <option value="">-- Select Active Game --</option>
                {activeGames.map(game => (
                  <option key={game.id} value={game.id}>
                    {new Date(game.date).toLocaleDateString()} - {game.courseName} - Group {game.groups?.length || 0}
                  </option>
                ))}
                {gameId && !activeGames.find(g => g.id === gameId) && (
                  <option value={gameId}>Current Game</option>
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
                      {player.name} - Group {player.groupIndex + 1}
                    </option>
                  ))}
                </select>
              )}
              
              {players.length === 0 && !loading && (
                <div className="info-message warn">
                  No scorekeepers found for this game. Scorekeepers must be assigned by an admin.
                </div>
              )}
              
              <div className="scorekeeper-info">
                <p><strong>Note:</strong> You must be the designated scorekeeper for a group to enter scores.</p>
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
