/**
 * Game Lifecycle Testing Component
 * 
 * This is a simple test harness for the GameLifecycleManager and related components.
 * It allows you to create sample games, transition them through various states,
 * and visualize the results with the new components.
 * 
 * How to use:
 * 1. Import this component in App.js and add a route for it (e.g., /lifecycle-test)
 * 2. Navigate to that route in your browser
 * 3. Use the controls to test the lifecycle functionality
 */

import React, { useState, useEffect } from 'react';
import EnhancedStatusBadge from '../components/EnhancedStatusBadge';
import GameStatusTimeline from '../components/GameStatusTimeline';
import gameLifecycleManager from '../utils/GameLifecycleManager';
import { GAME_STATUSES } from '../models/GameStatus';

function createSampleGame(id) {
  // Create a game with minimal required properties
  return {
    id: id || `game-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    courseName: 'Test Golf Course',
    course: 'test-course',
    holes: 18,
    entryFee: 25,
    status: GAME_STATUSES.CREATED,
    groups: [],
    scores: { raw: [] },
    createdAt: new Date().toISOString()
  };
}

const GameLifecycleTest = () => {
  const [testGame, setTestGame] = useState(null);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  
  // Initialize with a sample game
  useEffect(() => {
    setTestGame(createSampleGame());
  }, []);
  
  // Reset to a fresh game
  const resetGame = () => {
    setTestGame(createSampleGame());
    setTransitionMessage('');
    setLastAction('Reset to a new game');
    setGameHistory([]);
  };
  
  // Transition the game to a new status
  const transitionGame = (newStatus) => {
    try {
      let updatedGame;
      
      if (newStatus === GAME_STATUSES.FINALIZED) {
        // Special case for finalization
        if (!testGame.ctpPlayerId) {
          // Add mock CTP player for testing
          const withCtp = {
            ...testGame,
            ctpPlayerId: 'test-player-1',
            ctpHole: 7
          };
          updatedGame = gameLifecycleManager.finalizeGame(withCtp);
        } else {
          updatedGame = gameLifecycleManager.finalizeGame(testGame);
        }
      } else {
        // Regular transition
        updatedGame = gameLifecycleManager.transitionGame(testGame, newStatus, {
          metadata: {
            testRun: true,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Update the game
      setTestGame(updatedGame);
      
      // Add to history
      setGameHistory(prev => [
        ...prev, 
        { status: updatedGame.status, timestamp: new Date().toISOString() }
      ]);
      
      // Show success message
      setTransitionMessage(`Successfully transitioned to ${newStatus}`);
      setLastAction(`Transitioned to ${newStatus}`);
    } catch (error) {
      // Show error message
      setTransitionMessage(`Error: ${error.message}`);
      setLastAction(`Failed to transition to ${newStatus}`);
    }
  };
  
  // Display game state as JSON
  const formatGameState = (game) => {
    if (!game) return 'No game';
    
    // Format for readability
    const display = {
      id: game.id,
      status: game.status,
      courseName: game.courseName,
      date: game.date,
      ctpPlayerId: game.ctpPlayerId || '(not set)',
      statusHistory: game.statusHistory || []
    };
    
    return JSON.stringify(display, null, 2);
  };
  
  if (!testGame) {
    return <div>Loading test game...</div>;
  }
  
  return (
    <div className="lifecycle-test-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Game Lifecycle Testing</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, marginRight: '10px' }}>Current Game Status:</h3>
          <EnhancedStatusBadge 
            status={testGame.status} 
            game={testGame}
            size="large"
            showTimestamp={true}
          />
        </div>
        
        <div>
          <h3>Last Action:</h3>
          <p>{lastAction || 'None'}</p>
          {transitionMessage && (
            <p style={{ 
              color: transitionMessage.startsWith('Error') ? 'red' : 'green',
              fontWeight: 'bold'
            }}>
              {transitionMessage}
            </p>
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Transition Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.values(GAME_STATUSES).map(status => (
            <button
              key={status}
              onClick={() => transitionGame(status)}
              disabled={status === testGame.status}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: status === testGame.status ? '#f0f0f0' : '#ffffff',
                cursor: status === testGame.status ? 'default' : 'pointer'
              }}
            >
              Transition to {status}
            </button>
          ))}
          
          <button
            onClick={resetGame}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#f8f8f8',
              marginLeft: 'auto'
            }}
          >
            Reset Game
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Game Timeline Visualization</h3>
        <GameStatusTimeline game={testGame} />
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Game State</h3>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}
          >
            {formatGameState(testGame)}
          </pre>
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Transition History</h3>
          <div
            style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}
          >
            {gameHistory.length === 0 ? (
              <p>No transitions yet</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {gameHistory.map((entry, index) => (
                  <li key={index} style={{ marginBottom: '10px', padding: '5px', borderBottom: '1px solid #ddd' }}>
                    <div><strong>Status:</strong> {entry.status}</div>
                    <div><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLifecycleTest;
