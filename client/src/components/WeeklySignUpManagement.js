import React, { useState, useEffect, useRef } from 'react';
import dataSync from '../utils/dataSync';
import PrintablePlayersList from './PrintablePlayersList';

const WeeklySignUpManagement = () => {
  const printableRef = useRef(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [signups, setSignups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [newSignup, setNewSignup] = useState({ playerId: '', wolf: false });
  const [success, setSuccess] = useState('');

  // Load games, players, and signups on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all games
        const gamesData = await dataSync.getGames();
        
        // Filter to only upcoming games (games with date >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const upcomingGames = gamesData
          .filter(game => {
            const gameDate = new Date(game.date);
            return gameDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setGames(upcomingGames);
        
        // Select the first game by default if any exist
        if (upcomingGames.length > 0) {
          setSelectedGame(upcomingGames[0]);
          
          // Load signups for the first game
          const gameSignups = await dataSync.getSignups(upcomingGames[0].id);
          setSignups({ [upcomingGames[0].id]: gameSignups });
        }
        
        // Get all players
        const playersData = await dataSync.getFriends();
        setPlayers(playersData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load games and players');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load signups when the selected game changes
  useEffect(() => {
    const loadSignups = async () => {
      if (!selectedGame) return;
      
      if (signups[selectedGame.id]) {
        // Already loaded
        return;
      }
      
      try {
        setLoading(true);
        const gameSignups = await dataSync.getSignups(selectedGame.id);
        setSignups(prevSignups => ({
          ...prevSignups,
          [selectedGame.id]: gameSignups
        }));
        setLoading(false);
      } catch (err) {
        console.error('Error loading signups:', err);
        setError('Failed to load sign-ups for this game');
        setLoading(false);
      }
    };
    
    loadSignups();
  }, [selectedGame, signups]);

  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setNewSignup({ playerId: '', wolf: false });
    setError('');
    setSuccess('');
  };

  // Handle input changes for new signup form
  const handleInputChange = (e) => {
    const { name, checked, type, value } = e.target;
    setNewSignup({
      ...newSignup,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle adding a new signup
  const handleAddSignup = async (e) => {
    e.preventDefault();
    
    if (!selectedGame) {
      setError('No game selected');
      return;
    }
    
    if (!newSignup.playerId) {
      setError('Please select a player');
      return;
    }
    
    // Check if player is already signed up
    const currentSignups = signups[selectedGame.id] || [];
    const existingSignup = currentSignups.find(
      signup => signup.playerId === newSignup.playerId
    );
    
    if (existingSignup) {
      setError('This player is already signed up for this game');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Add signup to dataSync
      await dataSync.addSignup(selectedGame.id, {
        playerId: newSignup.playerId,
        wolf: newSignup.wolf,
        notes: ''
      });
      
      // Update local state
      const updatedSignups = [
        ...currentSignups,
        {
          playerId: newSignup.playerId,
          wolf: newSignup.wolf,
          notes: ''
        }
      ];
      
      setSignups({
        ...signups,
        [selectedGame.id]: updatedSignups
      });
      
      // Reset form
      setNewSignup({ playerId: '', wolf: false });
      setSuccess('Player added to sign-up list');
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding signup:', err);
      setError('Failed to add player to sign-up list');
      setLoading(false);
    }
  };

  // Handle removing a signup
  const handleRemoveSignup = async (playerId) => {
    if (!selectedGame) return;
    
    if (!window.confirm('Are you sure you want to remove this player from the sign-up list?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // In our localStorage implementation, we need to:
      // 1. Get all current signups for this game
      // 2. Filter out the one we want to remove
      // 3. Replace the entire signups array for this game
      
      const currentSignups = signups[selectedGame.id] || [];
      const updatedSignups = currentSignups.filter(
        signup => signup.playerId !== playerId
      );
      
      // Update dataSync - since we don't have a direct remove function,
      // we'll manually update the localStorage data
      // This is a workaround specific to this implementation
      const allGames = await dataSync.getGames();
      const currentGame = allGames.find(g => g.id === selectedGame.id);
      
      if (currentGame) {
        // Normally we'd make an API call here, but for localStorage
        // we manually update the dataSync signups
        localStorage.setItem('golfSkinsOrganizer', JSON.stringify({
          ...JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}'),
          signups: {
            ...JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}').signups || {},
            [selectedGame.id]: updatedSignups
          }
        }));
      }
      
      // Update local state
      setSignups({
        ...signups,
        [selectedGame.id]: updatedSignups
      });
      
      setSuccess('Player removed from sign-up list');
      setLoading(false);
    } catch (err) {
      console.error('Error removing signup:', err);
      setError('Failed to remove player from sign-up list');
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get course name from ID
  const getCourseName = (courseId) => {
    const courses = {
      'monarch-dunes': 'Monarch Dunes',
      'avila-beach': 'Avila Beach Golf Resort',
      'hunter-ranch': 'Hunter Ranch Golf Course',
      'dairy-creek': 'Dairy Creek Golf Course',
      'chalk-mountain': 'Chalk Mountain Golf Course',
      'morro-bay': 'Morro Bay Golf Course',
      'sea-pines': 'Sea Pines Golf Resort',
      'cypress-ridge': 'Cypress Ridge Golf Course',
      'black-lake': 'Blacklake Golf Resort'
    };
    
    return courses[courseId] || courseId;
  };

  // Get player name from ID
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  // Get active signups for the selected game
  const getActiveSignups = () => {
    if (!selectedGame) return [];
    return signups[selectedGame.id] || [];
  };

  // Get players who aren't signed up yet
  const getAvailablePlayers = () => {
    const activeSignups = getActiveSignups();
    const signedUpPlayerIds = activeSignups.map(signup => signup.playerId);
    
    return players.filter(player => !signedUpPlayerIds.includes(player.id));
  };

  // Handle deleting a game
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Get all games from localStorage
      const storedData = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
      const currentGames = storedData.games || [];
      
      // Filter out the game to delete
      const updatedGames = currentGames.filter(game => game.id !== gameId);
      
      // Also remove any signups for this game
      const currentSignups = storedData.signups || {};
      delete currentSignups[gameId];
      
      // Update localStorage
      localStorage.setItem('golfSkinsOrganizer', JSON.stringify({
        ...storedData,
        games: updatedGames,
        signups: currentSignups
      }));
      
      // Update local state
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      
      // If we just deleted the selected game, select another game
      if (selectedGame && selectedGame.id === gameId) {
        const remainingGames = games.filter(game => game.id !== gameId);
        setSelectedGame(remainingGames.length > 0 ? remainingGames[0] : null);
      }
      
      setSuccess('Game successfully deleted');
      setLoading(false);
    } catch (err) {
      console.error('Error deleting game:', err);
      setError('Failed to delete game');
      setLoading(false);
    }
  };

  // Handle print button
  const handlePrint = () => {
    if (!selectedGame) return;
    
    // Open printable view in a new window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      setError('Could not open print window. Please check your popup blocker settings.');
      return;
    }
    
    const activeSignups = getActiveSignups();
    
    // Create HTML content for print
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Player List - ${getCourseName(selectedGame.course)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          h1, h2, h3 {
            margin-top: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .player-count {
            margin-bottom: 20px;
          }
          .player-group {
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            text-align: center;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Player List - Central Coast Skins Game</h1>
          <h2>${getCourseName(selectedGame.course)}</h2>
          <p>
            <strong>Date:</strong> ${new Date(selectedGame.date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}<br>
            <strong>Time:</strong> ${selectedGame.time}<br>
            <strong>Format:</strong> ${selectedGame.holes} Holes - Skins Game<br>
            <strong>Entry Fee:</strong> $${selectedGame.entryFee || 0}
          </p>
        </div>
        
        <div class="player-count">
          <strong>Total Players:</strong> ${activeSignups.length}<br>
          <strong>Wolf Game Participants:</strong> ${activeSignups.filter(s => s.wolf).length}
        </div>
        
        <h3>All Players</h3>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Handicap</th>
              <th>Wolf Game</th>
            </tr>
          </thead>
          <tbody>
            ${activeSignups.map(signup => {
              const player = players.find(p => p.id === signup.playerId) || {};
              return `
                <tr>
                  <td>${player.name || 'Unknown Player'}</td>
                  <td>${player.handicap || 'N/A'}</td>
                  <td>${signup.wolf ? 'Yes' : 'No'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} - Central Coast Skins Game Organizer</p>
        </div>
        
        <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px;">Print this page</button>
      </body>
      </html>
    `;
    
    // Write content to new window and trigger print
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="weekly-signup-management">
      <h2>Weekly Sign-up Management</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      {loading && !games.length ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="signup-container">
          {/* Games sidebar */}
          <div className="games-sidebar">
            <h3>Upcoming Games</h3>
            {games.length === 0 ? (
              <p className="empty-state">No upcoming games found</p>
            ) : (
              <ul className="game-list">
                {games.map(game => (
                  <li 
                    key={game.id}
                    className={`game-item ${selectedGame && selectedGame.id === game.id ? 'active' : ''}`}
                    onClick={() => handleGameSelect(game)}
                  >
                    <div className="game-date">{formatDate(game.date)}</div>
                    <div className="game-course">{getCourseName(game.course)}</div>
                    <div className="game-time">{game.time}</div>
                    <div className="game-info">
                      {game.holes} holes • ${game.entryFee || 0}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Signup management panel */}
          <div className="signup-panel">
            {selectedGame ? (
              <>
                <div className="selected-game-header">
                  <div>
                    <h3>{getCourseName(selectedGame.course)}</h3>
                    <p className="selected-game-info">
                      {formatDate(selectedGame.date)} • {selectedGame.time} • 
                      {selectedGame.holes} holes • ${selectedGame.entryFee || 0}
                    </p>
                  </div>
                  <div className="game-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={handlePrint}
                      disabled={getActiveSignups().length === 0}
                    >
                      <i className="fas fa-print"></i> Print Player List
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteGame(selectedGame.id)}
                      style={{ marginLeft: '10px' }}
                    >
                      <i className="fas fa-trash"></i> Delete Game
                    </button>
                  </div>
                </div>
                
                <div className="signup-actions card">
                  <h4>Add Player to Sign-up List</h4>
                  <form onSubmit={handleAddSignup}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="playerId">Player</label>
                        <select
                          id="playerId"
                          name="playerId"
                          value={newSignup.playerId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select a player</option>
                          {getAvailablePlayers().map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name} {player.handicap ? `(${player.handicap})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group checkbox-group">
                        <input
                          type="checkbox"
                          id="wolf"
                          name="wolf"
                          checked={newSignup.wolf}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="wolf">Playing Wolf Game</label>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn"
                        disabled={loading || !newSignup.playerId}
                      >
                        {loading ? 'Adding...' : 'Add Player to Game'}
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="current-signups">
                  <h4>Current Sign-ups ({getActiveSignups().length})</h4>
                  {getActiveSignups().length === 0 ? (
                    <p className="empty-state">No players have signed up yet</p>
                  ) : (
                    <table className="signup-table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Handicap</th>
                          <th>Wolf Game</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveSignups().map(signup => {
                          const player = players.find(p => p.id === signup.playerId);
                          return (
                            <tr key={signup.playerId}>
                              <td>{getPlayerName(signup.playerId)}</td>
                              <td>{player ? player.handicap : '-'}</td>
                              <td>{signup.wolf ? 'Yes' : 'No'}</td>
                              <td className="actions">
                                <button 
                                  onClick={() => handleRemoveSignup(signup.playerId)} 
                                  className="btn btn-small btn-danger"
                                  disabled={loading}
                                >
                                  <i className="fas fa-times"></i> Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Select a game to manage sign-ups</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySignUpManagement;
