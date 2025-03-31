import React, { useState, useEffect, useCallback } from 'react';
import dataSync from '../utils/dataSync';

const PairingsAndGroups = () => {
  console.log("PairingsAndGroups: Component rendering started");
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [signups, setSignups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [groups, setGroups] = useState([]);
  const [success, setSuccess] = useState('');

  // Create groups from signups - wrapped in useCallback to avoid dependency issues
  const createGroups = useCallback((signupList, existingGroups) => {
    if (!signupList || signupList.length === 0) return [];
    
    // Start with existing groups
    const newGroups = [...existingGroups];
    
    // Get player details for each signup
    const signupWithDetails = signupList.map(signup => {
      const player = players.find(p => p.id === signup.playerId);
      return {
        ...signup,
        name: player ? player.name : 'Unknown Player',
        handicap: player ? player.handicap : null
      };
    });
    
    // Separate wolf players and regular players
    const wolfPlayers = signupWithDetails.filter(player => player.wolf);
    const regularPlayers = signupWithDetails.filter(player => !player.wolf);
    
    // Sort each group by handicap
    const sortedWolfs = wolfPlayers.sort((a, b) => {
      const handicapA = a.handicap || 100;
      const handicapB = b.handicap || 100;
      return handicapA - handicapB;
    });
    
    const sortedRegulars = regularPlayers.sort((a, b) => {
      const handicapA = a.handicap || 100;
      const handicapB = b.handicap || 100;
      return handicapA - handicapB;
    });
    
    // Find players that aren't in any existing group
    const allGroupedPlayerIds = newGroups.flatMap(group => 
      group.players.map(player => player.playerId)
    );
    
    const ungroupedWolfs = sortedWolfs.filter(
      player => !allGroupedPlayerIds.includes(player.playerId)
    );
    
    const ungroupedRegulars = sortedRegulars.filter(
      player => !allGroupedPlayerIds.includes(player.playerId)
    );
    
    // Combine them, with wolf players first
    const unassignedPlayers = [...ungroupedWolfs, ...ungroupedRegulars];
    
    // Create new groups with unassigned players
    if (unassignedPlayers.length > 0) {
      // Find groups that aren't full (less than 4 players)
      const incompleteGroups = newGroups.filter(group => group.players.length < 4);
      
      // Fill incomplete groups first
      for (const group of incompleteGroups) {
        while (group.players.length < 4 && unassignedPlayers.length > 0) {
          group.players.push(unassignedPlayers.shift());
        }
      }
      
      // Create new groups with remaining players
      while (unassignedPlayers.length > 0) {
        const newGroupPlayers = [];
        // Add up to 4 players to a new group
        for (let i = 0; i < 4 && unassignedPlayers.length > 0; i++) {
          newGroupPlayers.push(unassignedPlayers.shift());
        }
        
        if (newGroupPlayers.length > 0) {
          newGroups.push({
            id: `group-${Date.now()}-${newGroups.length}`,
            name: `Group ${newGroups.length + 1}`,
            players: newGroupPlayers
          });
        }
      }
    }
    
    return newGroups;
  }, [players]);

  // Load games, players, and signups on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("PairingsAndGroups: Loading data...");
        
        // Get all games
        const gamesData = await dataSync.getGames();
        console.log("PairingsAndGroups: Games loaded:", gamesData);
        
        // Get all players early to avoid dependency issues
        const playersData = await dataSync.getFriends();
        console.log("PairingsAndGroups: Players loaded:", playersData.length);
        setPlayers(playersData);
        
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
          
          // Get existing groups if available
          if (upcomingGames[0].groups && upcomingGames[0].groups.length > 0) {
            setGroups(upcomingGames[0].groups);
          } else {
            // Create automatic groups based on signup data
            const autoGroups = createGroups(gameSignups, []);
            setGroups(autoGroups);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load games and players');
        setLoading(false);
      }
    };
    
    loadData();
  }, [createGroups]);

  // Load signups when the selected game changes
  useEffect(() => {
    const loadSignups = async () => {
      if (!selectedGame) return;
      
      try {
        setLoading(true);
        
        // Load signups for selected game if not already loaded
        if (!signups[selectedGame.id]) {
          const gameSignups = await dataSync.getSignups(selectedGame.id);
          setSignups(prevSignups => ({
            ...prevSignups,
            [selectedGame.id]: gameSignups
          }));
        }
        
        // Get existing groups if available
        if (selectedGame.groups && selectedGame.groups.length > 0) {
          setGroups(selectedGame.groups);
        } else {
          // Create automatic groups based on signup data
          const currentSignups = signups[selectedGame.id] || [];
          const autoGroups = createGroups(currentSignups, []);
          setGroups(autoGroups);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Failed to load game data');
        setLoading(false);
      }
    };
    
    loadSignups();
  }, [selectedGame, signups, createGroups]);

  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setError('');
    setSuccess('');
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

  // Get active signups for the selected game
  const getActiveSignups = () => {
    if (!selectedGame) return [];
    return signups[selectedGame.id] || [];
  };

  // Generate automatic groups
  const handleGenerateGroups = () => {
    const currentSignups = getActiveSignups();
    
    if (currentSignups.length === 0) {
      setError('No players have signed up for this game yet');
      return;
    }
    
    // Clear existing groups and create new ones
    const autoGroups = createGroups(currentSignups, []);
    setGroups(autoGroups);
    setSuccess('Groups generated automatically');
  };

  // Save groups to the game
  const handleSaveGroups = async () => {
    if (!selectedGame) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get all games from localStorage
      const storedData = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
      const currentGames = storedData.games || [];
      
      // Find the game to update
      const gameIndex = currentGames.findIndex(g => g.id === selectedGame.id);
      if (gameIndex === -1) {
        setError('Game not found');
        setLoading(false);
        return;
      }
      
      // Update game with groups
      currentGames[gameIndex] = {
        ...currentGames[gameIndex],
        groups: groups
      };
      
      // Update localStorage
      localStorage.setItem('golfSkinsOrganizer', JSON.stringify({
        ...storedData,
        games: currentGames
      }));
      
      // Update selected game in state
      setSelectedGame({
        ...selectedGame,
        groups: groups
      });
      
      // Update games list
      setGames(prevGames => {
        return prevGames.map(game => {
          if (game.id === selectedGame.id) {
            return {
              ...game,
              groups: groups
            };
          }
          return game;
        });
      });
      
      setSuccess('Groups saved successfully');
      setLoading(false);
    } catch (err) {
      console.error('Error saving groups:', err);
      setError('Failed to save groups');
      setLoading(false);
    }
  };

  // Print the groups
  const handlePrintGroups = () => {
    if (!selectedGame) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Could not open print window. Please check your popup blocker settings.');
      return;
    }
    
    // Get player details for each group
    const groupsWithDetails = groups.map(group => {
      const playersWithDetails = group.players.map(player => {
        const playerDetail = players.find(p => p.id === player.playerId);
        return {
          ...player,
          name: playerDetail ? playerDetail.name : 'Unknown Player',
          handicap: playerDetail ? playerDetail.handicap : null
        };
      });
      
      return {
        ...group,
        players: playersWithDetails
      };
    });
    
    // Create HTML for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Player Groups - ${getCourseName(selectedGame.course)}</title>
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
          .group {
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
          <h1>Player Groups - ${getCourseName(selectedGame.course)}</h1>
          <p>
            <strong>Date:</strong> ${new Date(selectedGame.date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}<br>
            <strong>Time:</strong> ${selectedGame.time}<br>
            <strong>Format:</strong> ${selectedGame.holes} Holes
          </p>
        </div>
        
        <div class="groups">
          ${groupsWithDetails.map((group, index) => `
            <div class="group">
              <h3>Group ${index + 1}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Handicap</th>
                    <th>Wolf Game</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.players.map(player => `
                    <tr>
                      <td>${player.name}</td>
                      <td>${player.handicap || 'N/A'}</td>
                      <td>${player.wolf ? 'Yes' : 'No'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} - Central Coast Skins Game Organizer</p>
        </div>
        
        <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px;">Print this page</button>
      </body>
      </html>
    `;
    
    // Write content to the window and print
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="pairings-and-groups">
      <h2>Pairings & Groups</h2>
      
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
        <div className="groups-container">
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
          
          {/* Group management panel */}
          <div className="groups-panel">
            {selectedGame ? (
              <>
                <div className="selected-game-header">
                  <div>
                    <h3>{getCourseName(selectedGame.course)}</h3>
                    <p className="selected-game-info">
                      {formatDate(selectedGame.date)} • {selectedGame.time} • 
                      {selectedGame.holes} holes
                    </p>
                  </div>
                  <div className="actions">
                    <button 
                      className="btn btn-primary"
                      onClick={handleGenerateGroups}
                      disabled={getActiveSignups().length === 0}
                    >
                      Generate Groups
                    </button>
                    <button 
                      className="btn"
                      onClick={handleSaveGroups}
                      disabled={groups.length === 0 || loading}
                      style={{ marginLeft: '10px' }}
                    >
                      Save Groups
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handlePrintGroups}
                      disabled={groups.length === 0}
                      style={{ marginLeft: '10px' }}
                    >
                      <i className="fas fa-print"></i> Print Groups
                    </button>
                  </div>
                </div>
                
                <div className="player-groups">
                  <h4>Player Groups ({getActiveSignups().length} players total)</h4>
                  
                  {getActiveSignups().length === 0 ? (
                    <p className="empty-state">No players have signed up for this game yet</p>
                  ) : groups.length === 0 ? (
                    <p className="empty-state">Click "Generate Groups" to create player groups</p>
                  ) : (
                    <div className="groups-list">
                      {groups.map((group, groupIndex) => (
                        <div key={group.id || groupIndex} className="group-card card">
                          <h4>Group {groupIndex + 1}</h4>
                          <table className="group-table">
                            <thead>
                              <tr>
                                <th>Player</th>
                                <th>Handicap</th>
                                <th>Wolf Game</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.players.map(player => {
                                const playerDetail = players.find(p => p.id === player.playerId);
                                return (
                                  <tr key={player.playerId}>
                                    <td>{playerDetail ? playerDetail.name : 'Unknown Player'}</td>
                                    <td>{playerDetail ? playerDetail.handicap : '-'}</td>
                                    <td>{player.wolf ? 'Yes' : 'No'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Select a game to manage groups</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PairingsAndGroups;
