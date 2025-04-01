/**
 * Game State Machine Test
 * 
 * This component provides a UI for testing the game state machine.
 * It allows creating games, transitioning between states, and verifying
 * that the state machine works correctly.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createGame, 
  fetchGames, 
  transitionGameStatus, 
  setCalculatedScores,
  finalizeGame,
  deleteGame
} from '../../store/actions/gameActions';
import { 
  selectAllGames, 
  selectGamesLoading, 
  selectGamesError 
} from '../../store/selectors/gameSelectors';
import { GAME_STATUSES, getStatusLabel } from '../../models/GameStatus';

const GameStateMachineTest = () => {
  const dispatch = useDispatch();
  const games = useSelector(selectAllGames);
  const loading = useSelector(selectGamesLoading);
  const error = useSelector(selectGamesError);
  
  // Form state
  const [newGameData, setNewGameData] = useState({
    course: 'Monarch Dunes',
    date: new Date().toISOString().split('T')[0],
    holes: 18,
    entryFee: 10
  });
  
  // Selected game for operations
  const [selectedGameId, setSelectedGameId] = useState(null);
  
  // Status transition state
  const [targetStatus, setTargetStatus] = useState('');
  
  // Test scores
  const [hasCalculatedScores, setHasCalculatedScores] = useState(false);
  
  // Load games on mount
  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGameData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle game creation
  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    try {
      const game = await dispatch(createGame(newGameData));
      setSelectedGameId(game.id);
      console.log('Game created:', game);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };
  
  // Handle status transition
  const handleTransition = async () => {
    if (!selectedGameId || !targetStatus) return;
    
    try {
      const game = await dispatch(transitionGameStatus(selectedGameId, targetStatus));
      console.log(`Game transitioned to ${targetStatus}:`, game);
    } catch (error) {
      console.error('Error transitioning game:', error);
    }
  };
  
  // Add test calculated scores
  const handleAddCalculatedScores = async () => {
    if (!selectedGameId) return;
    
    const selectedGame = games.find(g => g.id === selectedGameId);
    
    if (!selectedGame || selectedGame.status !== GAME_STATUSES.COMPLETED) {
      alert('Game must be in Completed status to add calculated scores');
      return;
    }
    
    // Sample calculated scores
    const calculatedScores = {
      results: [
        { playerId: 'player1', net: 72, gross: 82, skins: 2, earnings: 30 },
        { playerId: 'player2', net: 75, gross: 85, skins: 1, earnings: 15 },
        { playerId: 'player3', net: 70, gross: 80, skins: 3, earnings: 45 }
      ],
      totalPot: 90
    };
    
    try {
      await dispatch(setCalculatedScores(selectedGameId, calculatedScores));
      setHasCalculatedScores(true);
      console.log('Added calculated scores');
    } catch (error) {
      console.error('Error adding calculated scores:', error);
    }
  };
  
  // Finalize game
  const handleFinalizeGame = async () => {
    if (!selectedGameId) return;
    
    try {
      const game = await dispatch(finalizeGame(selectedGameId));
      console.log('Game finalized:', game);
    } catch (error) {
      console.error('Error finalizing game:', error);
    }
  };
  
  // Delete game
  const handleDeleteGame = async () => {
    if (!selectedGameId) return;
    
    try {
      await dispatch(deleteGame(selectedGameId));
      setSelectedGameId(null);
      console.log('Game deleted');
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };
  
  // Find selected game
  const selectedGame = games.find(g => g.id === selectedGameId);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Game State Machine Test</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left column */}
        <div style={{ flex: 1 }}>
          <h2>Create New Game</h2>
          <form onSubmit={handleCreateGame} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Course:
                <input
                  type="text"
                  name="course"
                  value={newGameData.course}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Date:
                <input
                  type="date"
                  name="date"
                  value={newGameData.date}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Holes:
                <select
                  name="holes"
                  value={newGameData.holes}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value={9}>9</option>
                  <option value={18}>18</option>
                </select>
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Entry Fee:
                <input
                  type="number"
                  name="entryFee"
                  value={newGameData.entryFee}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>
            </div>
            
            <button
              type="submit"
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </form>
          
          <h2>Game List</h2>
          {games.length === 0 ? (
            <p>No games available. Create one to start testing.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {games.map(game => (
                <li 
                  key={game.id}
                  style={{
                    padding: '10px',
                    backgroundColor: game.id === selectedGameId ? '#e9ecef' : 'transparent',
                    marginBottom: '5px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedGameId(game.id)}
                >
                  <div><strong>{game.course}</strong> - {new Date(game.date).toLocaleDateString()}</div>
                  <div>Status: <span style={{ fontWeight: 'bold' }}>{getStatusLabel(game.status)}</span></div>
                  <div>ID: {game.id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Right column */}
        <div style={{ flex: 1 }}>
          <h2>Game Operations</h2>
          
          {selectedGame ? (
            <div>
              <h3>Selected Game: {selectedGame.course} - {new Date(selectedGame.date).toLocaleDateString()}</h3>
              <p>Current Status: <strong>{getStatusLabel(selectedGame.status)}</strong></p>
              <p>Has Calculated Scores: <strong>{selectedGame.scores?.calculated ? 'Yes' : 'No'}</strong></p>
              
              <div style={{ marginBottom: '20px' }}>
                <h4>Status Transition</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Target Status:
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                      >
                        <option value="">Select status...</option>
                        {selectedGame.getValidNextStatuses().map(status => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleTransition}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={!targetStatus}
                  >
                    Transition
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4>Test Operations</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleAddCalculatedScores}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={selectedGame.status !== GAME_STATUSES.COMPLETED || hasCalculatedScores}
                  >
                    Add Calculated Scores
                  </button>
                  
                  <button
                    onClick={handleFinalizeGame}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={selectedGame.status !== GAME_STATUSES.COMPLETED || !selectedGame.scores?.calculated}
                  >
                    Finalize Game
                  </button>
                  
                  <button
                    onClick={handleDeleteGame}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete Game
                  </button>
                </div>
              </div>
              
              <div>
                <h4>Game Data</h4>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflowX: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(selectedGame, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>Select a game from the list to perform operations.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameStateMachineTest;
