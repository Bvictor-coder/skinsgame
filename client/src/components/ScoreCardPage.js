import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';
import { calculateGameSkins } from '../utils/skinsCalculator';
import '../styles/ScorecardStyles.css';

// Assuming we have this data from monarch-dunes.js; we'll hardcode for now
const monarchDunesData = {
  name: 'Monarch Dunes',
  tees: [
    { name: 'Black', yards: [389, 170, 517, 428, 375, 179, 400, 535, 221, 404, 347, 155, 533, 173, 553, 447, 203, 447] },
    { name: 'Gold', yards: [372, 159, 509, 413, 366, 154, 382, 525, 211, 392, 336, 147, 519, 143, 543, 424, 192, 437] },
    { name: 'White', yards: [335, 144, 490, 390, 320, 134, 353, 503, 151, 376, 322, 139, 492, 131, 490, 403, 182, 414] },
    { name: 'Green', yards: [307, 118, 430, 323, 294, 112, 313, 470, 138, 336, 289, 116, 427, 118, 435, 376, 157, 388] }
  ],
  par: [4, 3, 5, 4, 4, 3, 4, 5, 3, 4, 4, 3, 5, 3, 5, 4, 3, 4], // Course par: 72
  strokeIndex: [1, 15, 9, 3, 7, 11, 13, 5, 17, 2, 14, 16, 4, 1, 8, 12, 10, 6]
};

/**
 * ScoreCardPage Component
 * 
 * Main component for score entry and skins calculation
 */
const ScoreCardPage = () => {
  // Get the gameId and groupId from URL parameters
  const { gameId, groupId } = useParams();
  const navigate = useNavigate();
  
  // State for game and players data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [game, setGame] = useState(null);
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  
  // State for score entry
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState({});
  const [handicaps, setHandicaps] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // State for CTP (Closest to Pin)
  const [ctpPlayer, setCtpPlayer] = useState(null);
  
  // State for results calculation
  const [calculatedResults, setCalculatedResults] = useState(null);
  const [viewMode, setViewMode] = useState('score'); // 'score' or 'results'
  const [resultsTab, setResultsTab] = useState('holes'); // 'holes' or 'players'
  
  // Load game and player data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log(`Loading scorecard for gameId: ${gameId}, groupId: ${groupId}`);
        
        // Get game data from localStorage
        const gamesData = await dataSync.getGames();
        console.log(`Found ${gamesData.length} games in storage`);
        
        // Validate gameId
        if (!gameId) {
          setError('Invalid game ID. Please check the URL and try again.');
          setLoading(false);
          return;
        }
        
        const game = gamesData.find(g => g.id === gameId);
        
        if (!game) {
          console.error(`Game with ID ${gameId} not found`);
          setError(`Game not found. Please ensure the game exists and you have the correct access link.`);
          setLoading(false);
          return;
        }
        
        console.log(`Found game: ${game.courseName}, date: ${game.date}`);
        setGame(game);
        
        // Get the specific group - try both string and number format for groupId
        let groupIndex = parseInt(groupId);
        let group = game.groups && (game.groups[groupIndex] || game.groups.find(g => g.id === groupId));
        
        if (!group) {
          console.error(`Group with index/id ${groupId} not found in game`);
          setError(`Group not found within this game. Please check your access link or contact the administrator.`);
          setLoading(false);
          return;
        }
        
        console.log(`Found group with ${group.playerIds?.length || 0} players`);
        setGroup(group);
        
        // Get players in this group
        const allPlayers = await dataSync.getFriends();
        
        // Verify playerIds exist in the group
        // First try to use playerIds from the group object
        if (!group.playerIds || !Array.isArray(group.playerIds) || group.playerIds.length === 0) {
          console.log('No playerIds array found in group, trying to get players from group.players');
          
          // If no playerIds, try to use the players array if it exists
          if (group.players && Array.isArray(group.players) && group.players.length > 0) {
            console.log('Found players array in group, extracting playerIds');
            // Extract playerIds from the players array
            group.playerIds = group.players.map(player => 
              typeof player === 'object' ? player.playerId : player
            ).filter(id => id); // filter out any undefined/null values
            
            console.log('Extracted playerIds:', group.playerIds);
          } else {
            console.error('No player IDs found in this group and no players array available');
            setError('No players found in this group. The group may not be properly configured.');
            setLoading(false);
            return;
          }
        }
        
        const groupPlayers = allPlayers.filter(player => 
          group.playerIds.includes(player.id)
        );
        
        if (groupPlayers.length === 0) {
          console.error('No matching players found for this group');
          setError('No player data found for this group. Please contact the administrator.');
          setLoading(false);
          return;
        }
        
        console.log(`Found ${groupPlayers.length} players for this group`);
        setPlayers(groupPlayers);
        
        // Initialize handicaps
        const initialHandicaps = {};
        groupPlayers.forEach(player => {
          initialHandicaps[player.id] = player.handicap || 0;
        });
        setHandicaps(initialHandicaps);
        
        // Load existing scores if available
        if (game.scores && game.scores.raw) {
          const gameScores = {};
          
          // Extract scores for players in this group
          game.scores.raw.forEach(playerScore => {
            if (group.playerIds.includes(playerScore.playerId)) {
              gameScores[playerScore.playerId] = playerScore.holes || {};
            }
          });
          
          setScores(gameScores);
        } else {
          // Initialize empty scores object
          const initialScores = {};
          groupPlayers.forEach(player => {
            initialScores[player.id] = {};
          });
          setScores(initialScores);
        }
        
        // Load CTP player if set
        if (game.ctpPlayerId) {
          setCtpPlayer(game.ctpPlayerId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Failed to load game data. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [gameId, groupId]);
  
  // Calculate results whenever scores, handicaps, or CTP changes
  useEffect(() => {
    if (!game || !players.length || Object.keys(scores).length === 0) return;
    
    // Function to fetch all players and scores across all groups
    const fetchAllPlayersAndScores = async () => {
      try {
        console.log("Fetching data for ALL players in the game for skins calculation");
        
        // Get all players
        const allPlayers = await dataSync.getFriends();
        
        // Get all groups for this game
        const gameGroups = game.groups || [];
        console.log(`Game has ${gameGroups.length} groups total`);
        
        // Collect all playerIds from all groups
        const allPlayerIds = new Set();
        gameGroups.forEach(group => {
          if (group.playerIds && Array.isArray(group.playerIds)) {
            group.playerIds.forEach(id => allPlayerIds.add(id));
          } else if (group.players && Array.isArray(group.players)) {
            group.players.forEach(player => {
              if (typeof player === 'object' && player.playerId) {
                allPlayerIds.add(player.playerId);
              } else if (typeof player === 'string') {
                allPlayerIds.add(player);
              }
            });
          }
        });
        
        console.log(`Total players across all groups: ${allPlayerIds.size}`);
        
        // Prepare player data for all players
        const allPlayersData = [];
        const allScores = {};
        const allHandicaps = {};
        
        // Process all players in the game
        for (const playerId of allPlayerIds) {
          const playerData = allPlayers.find(p => p.id === playerId);
          if (playerData) {
            // Add player to calculation data
            allPlayersData.push({
              id: playerData.id,
              name: playerData.name,
              courseHandicap: handicaps[playerData.id] || playerData.handicap || 0
            });
            
            // Initialize handicap from stored player data if not already set
            if (!allHandicaps[playerData.id]) {
              allHandicaps[playerData.id] = playerData.handicap || 0;
            }
            
            // Initialize empty scores object for this player
            if (!allScores[playerData.id]) {
              allScores[playerData.id] = {};
            }
          }
        }
        
        // Load scores from all groups if available
        if (game.scores && game.scores.raw) {
          game.scores.raw.forEach(playerScore => {
            if (allPlayerIds.has(playerScore.playerId)) {
              allScores[playerScore.playerId] = playerScore.holes || {};
            }
          });
        }
        
        // Merge current group's scores which might be more up-to-date
        for (const playerId in scores) {
          if (allScores[playerId]) {
            allScores[playerId] = {...allScores[playerId], ...scores[playerId]};
          } else {
            allScores[playerId] = {...scores[playerId]};
          }
        }
        
        // Prepare hole data
        const holeData = monarchDunesData.par.map((par, index) => ({
          par,
          strokeIndex: monarchDunesData.strokeIndex[index]
        }));
        
        console.log(`Calculating skins for ${allPlayersData.length} players across all groups`);
        
        // Calculate skins results for ALL players
        const results = calculateGameSkins(allPlayersData, holeData, allScores);
        setCalculatedResults(results);
      } catch (error) {
        console.error("Error calculating game-wide skins:", error);
      }
    };
    
    // Execute the function to get all player data
    fetchAllPlayersAndScores();
    
  }, [game, players, scores, handicaps, ctpPlayer]);
  
  // Update a player's score for the current hole
  const updateScore = (playerId, score) => {
    // Don't allow negative scores
    if (score < 0) return;
    
    setScores(prevScores => {
      const playerScores = { ...(prevScores[playerId] || {}) };
      playerScores[currentHole] = score;
      
      return {
        ...prevScores,
        [playerId]: playerScores
      };
    });
  };
  
  // Update a player's handicap
  const updateHandicap = (playerId, handicap) => {
    setHandicaps(prevHandicaps => ({
      ...prevHandicaps,
      [playerId]: handicap
    }));
  };
  
  // Check if all scores are entered for the current hole
  const isHoleComplete = (holeNumber) => {
    return players.every(player => {
      return scores[player.id] && scores[player.id][holeNumber] !== undefined;
    });
  };
  
  // Save scores to localStorage
  const saveScores = async () => {
    try {
      setSaving(true);
      
      // Get all games
      const gamesData = await dataSync.getGames();
      const gameIndex = gamesData.findIndex(g => g.id === gameId);
      
      if (gameIndex === -1) {
        setError('Game not found');
        setSaving(false);
        return;
      }
      
      // Prepare the updated game object
      const updatedGame = { ...gamesData[gameIndex] };
      
      // Initialize scores if needed
      if (!updatedGame.scores) {
        updatedGame.scores = {
          raw: []
        };
      }
      
      // Update raw scores
      players.forEach(player => {
        const playerScoreIndex = updatedGame.scores.raw.findIndex(
          s => s.playerId === player.id
        );
        
        if (playerScoreIndex >= 0) {
          // Update existing player scores
          updatedGame.scores.raw[playerScoreIndex].holes = scores[player.id] || {};
          updatedGame.scores.raw[playerScoreIndex].courseHandicap = handicaps[player.id] || 0;
        } else {
          // Add new player scores
          updatedGame.scores.raw.push({
            playerId: player.id,
            holes: scores[player.id] || {},
            courseHandicap: handicaps[player.id] || 0
          });
        }
      });
      
      // Add CTP player if set
      if (ctpPlayer) {
        updatedGame.ctpPlayerId = ctpPlayer;
      }
      
      // Add calculated results if complete
      if (calculatedResults) {
        updatedGame.scores.calculated = calculatedResults;
      }
      
      // Update game in array
      gamesData[gameIndex] = updatedGame;
      
      // Save back to localStorage
      await dataSync.updateGame(updatedGame);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setSaving(false);
    } catch (err) {
      console.error('Error saving scores:', err);
      setError('Failed to save scores. Please try again.');
      setSaving(false);
    }
  };
  
  // Navigate to next hole
  const goToNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };
  
  // Navigate to previous hole
  const goToPrevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };
  
  // Count completed holes
  const completedHolesCount = () => {
    let count = 0;
    for (let hole = 1; hole <= 18; hole++) {
      if (isHoleComplete(hole)) {
        count++;
      }
    }
    return count;
  };
  
  // Determine if we should show results view
  // Show results if all holes are complete or if user has switched to results mode
  const shouldShowResults = () => {
    return viewMode === 'results' || completedHolesCount() === 18;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="scorecard-container">
        <div className="scorecard-header">
          <h2>Error</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/games')}>Back to Games</button>
        </div>
      </div>
    );
  }
  
  // Render the scorecard
  return (
    <div className="scorecard-container">
      {/* Header */}
      <div className="scorecard-header">
        <h2>Scorecard</h2>
        <p>{game.courseName || 'Monarch Dunes'}</p>
      </div>
      
      {/* Game info */}
      <div className="game-info">
        <p className="group-name">Group {parseInt(groupId) + 1}</p>
        <p>Date: {new Date(game.date).toLocaleDateString()}</p>
        <p>Time: {game.time}</p>
      </div>
      
      {/* Scorekeeper indicator */}
      <div className="scorekeeper-controls">
        <div className="scorekeeper-info">
          <span>Scorekeeper:</span>
          <span className="scorekeeper-badge">{players.find(p => p.id === group.scorekeeperId)?.name || 'Unknown'}</span>
        </div>
        
        <button 
          onClick={() => setViewMode(shouldShowResults() ? 'score' : 'results')}
          className="view-toggle-btn"
        >
          {shouldShowResults() ? 'Back to Scorecard' : 'View Results'}
        </button>
      </div>
      
      {/* Conditional rendering based on view mode */}
      {shouldShowResults() ? (
        /* Results View */
        <div className="results-section">
          <h3>Skins Results</h3>
          
          {/* Tabs */}
          <div className="results-tabs">
            <button 
              className={`results-tab ${resultsTab === 'holes' ? 'active' : ''}`}
              onClick={() => setResultsTab('holes')}
            >
              Hole by Hole
            </button>
            <button 
              className={`results-tab ${resultsTab === 'players' ? 'active' : ''}`}
              onClick={() => setResultsTab('players')}
            >
              Player Summary
            </button>
          </div>
          
          {/* Hole Results */}
          {resultsTab === 'holes' && calculatedResults && (
            <div className="hole-results">
              {calculatedResults.holeResults.map(hole => (
                <div key={hole.holeNumber} className="hole-result-item">
                  <div className="hole-result-header">
                    <div>Hole {hole.holeNumber} (Par {hole.par})</div>
                    {hole.status === 'won' ? (
                      <div className="hole-result-winner">
                        {hole.winnerName} (+{hole.skinsValue})
                      </div>
                    ) : hole.status === 'carryover' ? (
                      <div>Tied - Carryover</div>
                    ) : (
                      <div>Incomplete</div>
                    )}
                  </div>
                  <div className="hole-result-content">
                    {hole.scores.map(score => {
                      const isWinner = score.playerId === hole.winner;
                      const isTied = hole.status === 'carryover' && 
                        score.netScore === Math.min(...hole.scores.map(s => s.netScore));
                      
                      return (
                        <div 
                          key={score.playerId} 
                          className={`hole-player-score ${isWinner ? 'winner-row' : ''} ${isTied ? 'tied-row' : ''}`}
                        >
                          <div>{score.playerName}</div>
                          <div>
                            {score.grossScore} - {score.handicapStroke > 0 ? score.handicapStroke : 0} = 
                            <span className="net-score"> {score.netScore}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Player Summary */}
          {resultsTab === 'players' && calculatedResults && (
            <div className="player-summary">
              <table className="player-results-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Skins</th>
                    <th>Winnings</th>
                    <th>CTP</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedResults.playerResults.map(player => (
                    <tr 
                      key={player.playerId} 
                      className={player.skinsWon > 0 ? 'winner-highlight' : ''}
                    >
                      <td>{player.playerName}</td>
                      <td>{player.skinsWon}</td>
                      <td>${player.winnings}</td>
                      <td>{player.playerId === ctpPlayer ? 'Yes' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* CTP selection if not yet set */}
              {!ctpPlayer && (
                <div className="ctp-entry">
                  <h3>Closest to Pin (CTP)</h3>
                  <p>Select the player who was closest to the pin:</p>
                  <select 
                    className="ctp-select"
                    value={ctpPlayer || ''}
                    onChange={(e) => setCtpPlayer(e.target.value)}
                  >
                    <option value="">-- Select Player --</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Score Entry View */
        <>
          {/* Handicap Entry Section */}
          <div className="handicap-entry">
            <h3>Today's Course Handicaps</h3>
            {players.map(player => (
              <div key={player.id} className="handicap-player">
                <div className="player-name">{player.name}</div>
                <div className="handicap-input">
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={handicaps[player.id] || 0}
                    onChange={(e) => updateHandicap(player.id, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Hole Completion Indicator */}
          <div className="hole-completion-indicator">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
              <div 
                key={hole}
                className={`hole-indicator ${isHoleComplete(hole) ? 'complete' : ''} ${hole === currentHole ? 'current' : ''}`}
                onClick={() => setCurrentHole(hole)}
              >
                {hole}
              </div>
            ))}
          </div>
          
          {/* Hole Navigator */}
          <div className="hole-navigator">
            <div className="hole-number">Hole {currentHole}</div>
            <div className="hole-nav-buttons">
              <button 
                onClick={goToPrevHole}
                disabled={currentHole === 1}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>
              <button 
                onClick={goToNextHole}
                disabled={currentHole === 18}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          {/* Hole Information */}
          <div className="hole-info">
            <div className="hole-stat">
              <div className="hole-stat-label">Par</div>
              <div className="hole-stat-value">{monarchDunesData.par[currentHole - 1]}</div>
            </div>
            <div className="hole-stat">
              <div className="hole-stat-label">Yards</div>
              <div className="hole-stat-value">
                {monarchDunesData.tees.find(t => t.name === 'White').yards[currentHole - 1]}
              </div>
            </div>
            <div className="hole-stat">
              <div className="hole-stat-label">Index</div>
              <div className="hole-stat-value">{monarchDunesData.strokeIndex[currentHole - 1]}</div>
            </div>
          </div>
          
          {/* Score Entry */}
          <div className="score-entry">
            {players.map(player => (
              <div key={player.id} className="player-row">
                <div className="player-details">
                  <div className="player-row-name">{player.name}</div>
                  <div className="player-handicap">
                    Handicap: {handicaps[player.id] || 0}
                  </div>
                </div>
                <div className="score-controls">
                  <button 
                    className="score-btn"
                    onClick={() => {
                      const currentScore = scores[player.id]?.[currentHole];
                      if (currentScore && currentScore > 1) {
                        updateScore(player.id, currentScore - 1);
                      }
                    }}
                    disabled={!scores[player.id]?.[currentHole] || scores[player.id][currentHole] <= 1}
                  >
                    -
                  </button>
                  <div className="score-display">
                    {scores[player.id]?.[currentHole] || '-'}
                  </div>
                  <button 
                    className="score-btn"
                    onClick={() => {
                      const currentScore = scores[player.id]?.[currentHole] || 0;
                      updateScore(player.id, currentScore + 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          onClick={() => navigate('/games')}
        >
          Back
        </button>
        <div className="actions-container">
          <button 
            className="primary-btn"
            onClick={saveScores}
            disabled={saving}
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Scores'}
          </button>
          
          {/* Only show finalize button if all holes are complete and not already finalized */}
          {completedHolesCount() === 18 && (!game.status || game.status !== 'completed') && (
            <button 
              className="btn-success finalize-btn"
              onClick={async () => {
                try {
                  setSaving(true);
                  
                  // Get latest game data
                  const gamesData = await dataSync.getGames();
                  const currentGame = gamesData.find(g => g.id === gameId);
                  
                  if (!currentGame) {
                    setError('Game not found');
                    setSaving(false);
                    return;
                  }
                  
                  // Update the game status
                  const updatedGame = {
                    ...currentGame,
                    status: 'completed',
                    completedDate: new Date().toISOString(),
                    scores: {
                      ...currentGame.scores,
                      calculated: calculatedResults
                    }
                  };
                  
                  // Save the updated game
                  await dataSync.updateGame(updatedGame);
                  
                  // Update local state
                  setGame(updatedGame);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                  
                  // Display a success message
                  alert('Game has been finalized successfully! Results are now available in Game History.');
                  
                } catch (err) {
                  console.error('Error finalizing game:', err);
                  setError('Failed to finalize game. Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Finalize Game
            </button>
          )}
          
          {/* Show a message if the game is already finalized */}
          {game.status === 'completed' && (
            <div className="game-finalized-message">
              <i className="fas fa-check-circle"></i> Game Finalized
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreCardPage;
