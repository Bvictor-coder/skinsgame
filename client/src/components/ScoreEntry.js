import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../utils/userContext';
import api from '../utils/api';

const ScoreEntry = ({ gameId, groupIndex }) => {
  const { user } = useUser();
  const [game, setGame] = useState(null);
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ctpWinner, setCtpWinner] = useState('');
  const [currentHole, setCurrentHole] = useState(1);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const activeInputRef = useRef(null);

  // Load game and group data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get game details
        const gameResponse = await api.games.getById(gameId);
        const game = gameResponse.data;
        setGame(game);
        
        // Get players in this group
        if (game.groups && game.groups.length > groupIndex) {
          const currentGroup = game.groups[groupIndex];
          setGroup(currentGroup);
          
          // Get player details
          const playerPromises = currentGroup.playerIds.map(id => api.friends.getById(id));
          const playerResponses = await Promise.all(playerPromises);
          const playerData = playerResponses.map(res => res.data);
          setPlayers(playerData);
          
          // Initialize scores object
          const initialScores = {};
          playerData.forEach(player => {
            initialScores[player.id] = {};
            for (let i = 1; i <= game.holes; i++) {
              initialScores[player.id][i] = '';
            }
          });
          
          // If there are existing scores, merge them in
          if (game.scores && game.scores.raw) {
            game.scores.raw.forEach(playerScore => {
              // Check if this player is in the current group
              if (currentGroup.playerIds.includes(playerScore.playerId)) {
                Object.entries(playerScore.holes).forEach(([hole, score]) => {
                  initialScores[playerScore.playerId][parseInt(hole)] = score.toString();
                });
              }
            });
            
            // Set CTP winner if it exists
            if (game.scores.ctpWinner) {
              setCtpWinner(game.scores.ctpWinner);
            }
          }
          
          setScores(initialScores);
          setActivePlayerId(playerData[0]?.id || null);
        } else {
          setError("Group not found in this game");
        }
      } catch (err) {
        console.error("Error loading game data:", err);
        setError("Failed to load game data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId && groupIndex !== undefined) {
      loadGameData();
    }
  }, [gameId, groupIndex]);
  
  // Handle score input change
  const handleScoreChange = (playerId, hole, value) => {
    // Ensure value is a number between 1 and 15
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > 15) {
      return;
    }
    
    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [hole]: value
      }
    }));
  };
  
  // Handle number pad input
  const handleNumberInput = (number) => {
    if (!activePlayerId || !currentHole) return;
    
    if (number === 'clear') {
      setScores(prev => ({
        ...prev,
        [activePlayerId]: {
          ...prev[activePlayerId],
          [currentHole]: ''
        }
      }));
    } else if (number === 'next') {
      moveToNextInput();
    } else {
      // Limit to 2 digits
      const currentValue = scores[activePlayerId][currentHole] || '';
      if (currentValue.length < 2) {
        const newValue = currentValue + number;
        if (parseInt(newValue) <= 15) {
          handleScoreChange(activePlayerId, currentHole, newValue);
        }
      }
    }
  };
  
  // Move to next input field
  const moveToNextInput = () => {
    const playerIds = players.map(p => p.id);
    const currentPlayerIndex = playerIds.indexOf(activePlayerId);
    const totalPlayers = playerIds.length;
    const totalHoles = game?.holes || 18;
    
    // Calculate next position
    let nextPlayerIndex = currentPlayerIndex;
    let nextHole = currentHole;
    
    if (currentPlayerIndex < totalPlayers - 1) {
      // Move to next player, same hole
      nextPlayerIndex++;
    } else {
      // Move to first player, next hole
      nextPlayerIndex = 0;
      nextHole++;
      
      // If we've gone past the last hole, loop back to first hole
      if (nextHole > totalHoles) {
        nextHole = 1;
      }
    }
    
    // Update state
    setActivePlayerId(playerIds[nextPlayerIndex]);
    setCurrentHole(nextHole);
  };
  
  // Focus handler
  const handleFocus = (playerId, hole) => {
    setActivePlayerId(playerId);
    setCurrentHole(hole);
    setShowNumberPad(true);
  };
  
  // Save scores
  const handleSaveScores = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Convert scores to API format
      const rawScores = Object.entries(scores).map(([playerId, holeScores]) => {
        const holesObject = {};
        
        Object.entries(holeScores).forEach(([hole, score]) => {
          if (score !== '') {
            holesObject[hole] = parseInt(score, 10);
          }
        });
        
        return {
          playerId,
          holes: holesObject
        };
      });
      
      // Build scores object
      const scoresData = {
        raw: rawScores,
        ctpWinner: ctpWinner || null,
        skins: [] // This will be calculated on the server
      };
      
      // Save to API
      await api.games.updateScores(gameId, scoresData);
      
      setSuccess("Scores saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving scores:", err);
      setError("Failed to save scores. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Check if all required scores are entered
  const areAllScoresEntered = () => {
    return players.every(player => {
      return Array.from({ length: game.holes }, (_, i) => i + 1).every(hole => {
        return scores[player.id][hole] !== '';
      });
    });
  };
  
  if (loading) {
    return (
      <div className="score-entry-container loading">
        <div className="loading-spinner"></div>
        <p>Loading scorecard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="score-entry-container">
        <div className="alert alert-error">
          {error}
        </div>
        <button className="btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="score-entry-container">
      {game && (
        <div className="scorecard-header">
          <h3>{game.course}</h3>
          <div className="scorecard-meta">
            <div>
              <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
            </div>
            <div>
              <strong>Group:</strong> {groupIndex + 1}
              {group?.isWolfGroup && <span className="wolf-badge">Wolf Group</span>}
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <div className="score-table-container">
        <table className="score-table">
          <thead>
            <tr>
              <th className="player-header">Player</th>
              {Array.from({ length: game?.holes || 18 }, (_, i) => i + 1).map(hole => (
                <th 
                  key={hole} 
                  className={hole === game?.ctpHole ? 'ctp-hole' : ''}
                >
                  {hole}
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => {
              // Calculate total score
              const totalScore = Object.values(scores[player.id] || {})
                .filter(score => score !== '')
                .reduce((sum, score) => sum + parseInt(score, 10), 0);
              
              // Count valid scores
              const validScores = Object.values(scores[player.id] || {})
                .filter(score => score !== '').length;
              
              return (
                <tr key={player.id}>
                  <td className="player-name">
                    {player.name}
                  </td>
                  
                  {Array.from({ length: game?.holes || 18 }, (_, i) => i + 1).map(hole => (
                    <td key={hole}>
                      <input
                        type="number"
                        className={`score-input ${hole === game?.ctpHole ? 'ctp-hole' : ''} ${activePlayerId === player.id && currentHole === hole ? 'active' : ''}`}
                        min="1"
                        max="15"
                        value={scores[player.id]?.[hole] || ''}
                        onChange={(e) => handleScoreChange(player.id, hole, e.target.value)}
                        onFocus={() => handleFocus(player.id, hole)}
                        ref={activePlayerId === player.id && currentHole === hole ? activeInputRef : null}
                      />
                    </td>
                  ))}
                  
                  <td className="total-score">
                    {validScores === (game?.holes || 18) ? totalScore : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {game?.ctpHole && (
        <div className="ctp-section">
          <h3>Closest to Pin (Hole #{game.ctpHole})</h3>
          <div className="form-group">
            <label htmlFor="ctp-winner">CTP Winner:</label>
            <select
              id="ctp-winner"
              value={ctpWinner}
              onChange={(e) => setCtpWinner(e.target.value)}
            >
              <option value="">-- Select Player --</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      <div className="form-actions">
        <button
          className="btn"
          onClick={handleSaveScores}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Scores'}
        </button>
      </div>
      
      {/* Mobile Number Pad */}
      {showNumberPad && (
        <div className="mobile-number-picker">
          <div className="picker-header">
            <span>
              Enter score for {players.find(p => p.id === activePlayerId)?.name || 'Player'}, Hole {currentHole}
            </span>
            <button className="close-btn" onClick={() => setShowNumberPad(false)}>
              &times;
            </button>
          </div>
          <div className="picker-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'next'].map((btn) => (
              <button
                key={btn}
                className={`picker-button ${btn === 'clear' ? 'clear-btn' : ''} ${btn === 'next' ? 'next-btn' : ''}`}
                onClick={() => handleNumberInput(btn)}
              >
                {btn === 'clear' ? 'Clear' : btn === 'next' ? 'Next' : btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
