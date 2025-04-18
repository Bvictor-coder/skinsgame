import React, { useState, useEffect, useCallback } from 'react';
import dataSync from '../utils/dataSync';
import ScoreCardAccessor from './ScoreCardAccessor';

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
  const [renderError, setRenderError] = useState(null);
  const [localStorageError, setLocalStorageError] = useState(null);
  const [sortBy, setSortBy] = useState('default'); // 'default' or 'startingHole'
  
  // Check localStorage availability
  useEffect(() => {
    try {
      // Test localStorage
      localStorage.setItem('testLocalStorage', 'test');
      if (localStorage.getItem('testLocalStorage') !== 'test') {
        throw new Error('localStorage read/write test failed');
      }
      localStorage.removeItem('testLocalStorage');
      
      // Test getting actual data
      const storedData = localStorage.getItem('golfSkinsOrganizer');
      console.log("LocalStorage test - has data:", !!storedData);
    } catch (err) {
      console.error("LocalStorage access error:", err);
      setLocalStorageError(`LocalStorage error: ${err.message}`);
    }
  }, []);

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
            players: newGroupPlayers,
            startingHole: null,
            startingPosition: null
          });
        }
      }
    }
    
    return newGroups;
  }, [players]);

  // Update a group's starting hole information
  const updateGroupStartingHole = (groupIndex, holeNumber, position) => {
    const updatedGroups = [...groups];
    
    // Validate hole number (1-18)
    const validatedHoleNumber = parseInt(holeNumber);
    if (isNaN(validatedHoleNumber) || validatedHoleNumber < 1 || validatedHoleNumber > 18) {
      // If invalid, clear the starting hole
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        startingHole: null,
        startingPosition: null
      };
    } else {
      // If valid, update the starting hole and position
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        startingHole: validatedHoleNumber,
        startingPosition: position
      };
    }
    
    setGroups(updatedGroups);
  };

  // Sort groups by criteria
  const getSortedGroups = () => {
    if (sortBy === 'startingHole') {
      return [...groups].sort((a, b) => {
        // Groups without starting holes go last
        if (!a.startingHole && !b.startingHole) return 0;
        if (!a.startingHole) return 1;
        if (!b.startingHole) return -1;
        
        // Sort by hole number first
        if (a.startingHole !== b.startingHole) {
          return a.startingHole - b.startingHole;
        }
        
        // Then by position (a before b)
        if (a.startingPosition === 'a' && b.startingPosition === 'b') return -1;
        if (a.startingPosition === 'b' && b.startingPosition === 'a') return 1;
        
        // Default to original order
        return 0;
      });
    }
    
    // Default sorting (by group index)
    return groups;
  };

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
      
      console.log("Saving groups:", groups);
      
      // Prepare playerIds array for each group
      const formattedGroups = groups.map(group => {
        // Ensure we have player objects with playerIds
        if (!group.players || !Array.isArray(group.players)) {
          console.error("Invalid group player data:", group);
          throw new Error(`Group ${group.id} has invalid player data`);
        }
        
        // Convert player objects to just playerIds array, ensuring playerId exists
        const playerIds = group.players
          .filter(player => player && player.playerId) // Filter out invalid players
          .map(player => player.playerId);
          
        console.log(`Group ${group.id} playerIds:`, playerIds);
        
        if (playerIds.length === 0) {
          console.warn(`Group ${group.id} has no valid players`);
        }
        
        return {
          id: group.id,
          playerIds: playerIds, // Use the filtered playerIds
          startingHole: group.startingHole,
          startingPosition: group.startingPosition,
          scorekeeperId: group.scorekeeperId,
          accessCode: group.accessCode || Math.floor(1000 + Math.random() * 9000).toString()
        };
      });
      
      // Create updated game object
      const updatedGame = {
        ...selectedGame,
        groups: formattedGroups
      };
      
      console.log("Updating game with groups:", formattedGroups);
      
      // Use dataSync service to update the game
      await dataSync.updateGame(updatedGame);
      
      // Update selected game in state
      setSelectedGame(updatedGame);
      
      // Update games list
      setGames(prevGames => {
        return prevGames.map(game => {
          if (game.id === selectedGame.id) {
            return updatedGame;
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
    
    // Sort groups for print if needed
    let printGroups = groupsWithDetails;
    if (sortBy === 'startingHole') {
      printGroups = [...groupsWithDetails].sort((a, b) => {
        if (!a.startingHole && !b.startingHole) return 0;
        if (!a.startingHole) return 1;
        if (!b.startingHole) return -1;
        return a.startingHole - b.startingHole;
      });
    }
    
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
          .starting-hole {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            background-color: #e8f4f8;
            border: 1px solid #c8e6f0;
            color: #2980b9;
            font-weight: bold;
            margin-left: 10px;
          }
          .group-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
          ${printGroups.map((group, index) => `
            <div class="group">
              <div class="group-header">
                <h3>Group ${index + 1}</h3>
                ${group.startingHole ? 
                  `<div class="starting-hole">Starting Hole: ${group.startingHole}${group.startingPosition ? group.startingPosition : ''}</div>` : 
                  ''}
              </div>
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

  // Wrap render in try/catch to catch any rendering errors
  const renderContent = () => {
    try {
      // Show any localStorage errors first
      if (localStorageError) {
        return (
          <div className="error-container">
            <h3>Storage Error</h3>
            <p>{localStorageError}</p>
            <p>Please try clearing your browser cache or using a different browser.</p>
          </div>
        );
      }
      
      // Then show any general render errors
      if (renderError) {
        return (
          <div className="error-container">
            <h3>Rendering Error</h3>
            <p>{renderError}</p>
            <button 
              className="btn" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        );
      }
      
      // Safe check for games array
      const safeGames = Array.isArray(games) ? games : [];
      
      // Get sorted groups based on current sort criteria
      const sortedGroups = getSortedGroups();
      
      // Normal component rendering
      return loading && !safeGames.length ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="groups-container">
          {/* Games sidebar */}
          <div className="games-sidebar">
            <h3>Upcoming Games</h3>
            {safeGames.length === 0 ? (
              <p className="empty-state">No upcoming games found</p>
            ) : (
              <ul className="game-list">
                {safeGames.map(game => (
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
                  
                  {/* Sort controls */}
                  {groups.length > 0 && (
                    <div className="sort-controls">
                      <span className="sort-label">Sort by:</span>
                      <label>
                        <input 
                          type="radio" 
                          name="sort" 
                          value="default" 
                          checked={sortBy === 'default'} 
                          onChange={() => setSortBy('default')} 
                        /> 
                        Group Order
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="sort" 
                          value="startingHole" 
                          checked={sortBy === 'startingHole'} 
                          onChange={() => setSortBy('startingHole')} 
                        /> 
                        Starting Hole
                      </label>
                    </div>
                  )}
                  
                  {getActiveSignups().length === 0 ? (
                    <p className="empty-state">No players have signed up for this game yet</p>
                  ) : !Array.isArray(groups) || groups.length === 0 ? (
                    <p className="empty-state">Click "Generate Groups" to create player groups</p>
                  ) : (
                    <div className={`groups-list ${sortBy === 'startingHole' ? 'sorted-by-hole' : ''}`}>
                      {sortedGroups.map((group, groupIndex) => {
                        // Get the original index for reference
                        const originalIndex = groups.findIndex(g => g.id === group.id);
                        
                        return (
                          <div 
                            key={group.id || groupIndex} 
                            className={`group-card card ${group.startingHole ? 'hole-assigned' : ''}`}
                          >
                            <h4>Group {originalIndex + 1}</h4>
                            <table className="group-table">
                              <thead>
                                <tr>
                                  <th>Player</th>
                                  <th>Handicap</th>
                                  <th>Wolf Game</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.isArray(group.players) ? group.players.map(player => {
                                  // Safety check to ensure player is a valid object
                                  if (!player || typeof player !== 'object') return null;
                                  
                                  const playerDetail = Array.isArray(players) ? 
                                    players.find(p => p && p.id === player.playerId) : null;
                                    
                                  const playerId = player.playerId || 'unknown-player';
                                  
                                  return (
                                    <tr key={playerId}>
                                      <td>{playerDetail ? playerDetail.name : 'Unknown Player'}</td>
                                      <td>{playerDetail ? playerDetail.handicap : '-'}</td>
                                      <td>{player.wolf ? 'Yes' : 'No'}</td>
                                    </tr>
                                  );
                                }) : (
                                  <tr><td colSpan="3">No players in this group</td></tr>
                                )}
                              </tbody>
                            </table>
                            
                            {/* Starting hole assignment UI */}
                            <div className="starting-hole-container">
                              <div className="starting-hole-label">Starting Hole:</div>
                              <div className="starting-hole-controls">
                                <input
                                  type="number"
                                  className="hole-number-input"
                                  min="1"
                                  max="18"
                                  value={group.startingHole || ''}
                                  onChange={(e) => updateGroupStartingHole(
                                    originalIndex, 
                                    e.target.value, 
                                    group.startingPosition || 'a'
                                  )}
                                  placeholder="#"
                                />
                                
                                <select
                                  className="position-selector"
                                  value={group.startingPosition || 'a'}
                                  onChange={(e) => updateGroupStartingHole(
                                    originalIndex, 
                                    group.startingHole || '', 
                                    e.target.value
                                  )}
                                  disabled={!group.startingHole}
                                >
                                  <option value="a">A</option>
                                  <option value="b">B</option>
                                </select>
                              </div>
                              
                              {group.startingHole ? (
                                <div className="starting-hole-badge">
                                  Hole {group.startingHole}{group.startingPosition || ''}
                                </div>
                              ) : (
                                <div className="starting-hole-badge">
                                  Not assigned
                                </div>
                              )}
                            </div>
                            
                            {/* Scorekeeper assignment and scorecard access */}
                            <div className="scorekeeper-container">
                              <div className="scorekeeper-label">Scorekeeper:</div>
                              <div className="scorekeeper-controls">
                                <select
                                  className="scorekeeper-selector"
                                  value={group.scorekeeperId || ''}
                                  onChange={(e) => {
                                    const updatedGroups = [...groups];
                                    updatedGroups[originalIndex] = {
                                      ...updatedGroups[originalIndex],
                                      scorekeeperId: e.target.value || null
                                    };
                                    setGroups(updatedGroups);
                                  }}
                                >
                                  <option value="">-- Select Scorekeeper --</option>
                                  {Array.isArray(group.players) && group.players.map(player => {
                                    const playerDetail = players.find(p => p.id === player.playerId);
                                    return playerDetail ? (
                                      <option key={playerDetail.id} value={playerDetail.id}>
                                        {playerDetail.name}
                                      </option>
                                    ) : null;
                                  })}
                                </select>
                              </div>
                            </div>
                            
                            {/* Scorecard access for this group */}
                            {selectedGame && group.scorekeeperId && (
                              <div className="scorecard-access">
                                <ScoreCardAccessor 
                                  gameId={selectedGame.id} 
                                  groupIndex={originalIndex} 
                                  group={group} 
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
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
      );
    } catch (error) {
      console.error("Render error:", error);
      setRenderError(error.message);
      return (
        <div className="error-container">
          <h3>Error Rendering Component</h3>
          <p>{error.message}</p>
          <button 
            className="btn" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
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
      
      {renderContent()}
    </div>
  );
};

export default PairingsAndGroups;
