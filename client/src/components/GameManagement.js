import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';
import StatusBadge from './StatusBadge';
import CtpPlayerSelector from './CtpPlayerSelector';

const GameManagement = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const navigate = useNavigate();

  // Load all games on component mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const gamesData = await dataSync.getGames();
        
        // Sort games by date (most recent first)
        const sortedGames = gamesData.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        
        setGames(sortedGames);
        setLoading(false);
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load games. Please try again.');
        setLoading(false);
      }
    };
    
    loadGames();
  }, []);

  // Function to update a game's status
  const updateGameStatus = async (gameId, newStatus) => {
    try {
      const gameData = games.find(g => g.id === gameId);
      if (!gameData) return;
      
      const updatedGame = {
        ...gameData,
        status: newStatus,
        statusUpdatedAt: new Date().toISOString()
      };
      
      // Add specific timestamp for certain statuses
      if (newStatus === 'open') {
        updatedGame.openedAt = new Date().toISOString();
      } else if (newStatus === 'enrollment_complete') {
        updatedGame.enrollmentCompletedAt = new Date().toISOString();
      } else if (newStatus === 'in_progress') {
        updatedGame.startedAt = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updatedGame.completedAt = new Date().toISOString();
      } else if (newStatus === 'finalized') {
        updatedGame.finalizedAt = new Date().toISOString();
      }
      
      await dataSync.updateGame(updatedGame);
      
      // Update local state
      setGames(prev => 
        prev.map(g => g.id === gameId ? updatedGame : g)
      );
      
      return true;
    } catch (err) {
      console.error('Error updating game status:', err);
      setError(`Failed to update game status to ${newStatus}.`);
      return false;
    }
  };

  // Function to check if a status transition is valid
  const isValidTransition = (currentStatus, newStatus) => {
    // Define forward (progression) status transitions
    const forwardTransitions = {
      'created': ['open'],
      'open': ['enrollment_complete'],
      'enrollment_complete': ['in_progress'],
      'in_progress': ['completed'],
      'completed': ['finalized']
    };
    
    // Define backward (reversion) status transitions for corrections
    const backwardTransitions = {
      'open': ['created'],
      'enrollment_complete': ['open'],
      'in_progress': ['enrollment_complete'],
      'completed': ['in_progress'],
      'finalized': ['completed']
    };
    
    // If current status is undefined/null, only allow transition to 'created'
    if (!currentStatus) {
      return newStatus === 'created';
    }
    
    // Check if the transition is valid in either direction
    return (forwardTransitions[currentStatus]?.includes(newStatus) || 
            backwardTransitions[currentStatus]?.includes(newStatus));
  };

  // Function to get available actions based on current status
  const getAvailableActions = (game) => {
    const forwardActions = [];
    const backwardActions = [];
    const currentStatus = game.status || 'created';
    
    // Forward progression actions
    if (isValidTransition(currentStatus, 'open')) {
      forwardActions.push({ 
        label: 'Open for Enrollment', 
        status: 'open',
        direction: 'forward'
      });
    }
    
    if (isValidTransition(currentStatus, 'enrollment_complete')) {
      forwardActions.push({ 
        label: 'Complete Enrollment', 
        status: 'enrollment_complete',
        direction: 'forward'
      });
    }
    
    if (isValidTransition(currentStatus, 'in_progress')) {
      forwardActions.push({ 
        label: 'Start Game', 
        status: 'in_progress',
        direction: 'forward'
      });
    }
    
    if (isValidTransition(currentStatus, 'completed')) {
      forwardActions.push({ 
        label: 'Mark Completed', 
        status: 'completed',
        direction: 'forward'
      });
    }
    
    if (isValidTransition(currentStatus, 'finalized')) {
      // Only allow finalization if CTP is set
      if (game.ctpPlayerId) {
        forwardActions.push({ 
          label: 'Finalize Game', 
          status: 'finalized',
          direction: 'forward'
        });
      } else {
        forwardActions.push({ 
          label: 'Finalize Game (Set CTP First)', 
          status: 'finalized',
          disabled: true,
          tooltip: 'You must set a Closest To Pin player before finalizing',
          direction: 'forward'
        });
      }
    }
    
    // Backward reversion actions for corrections
    if (isValidTransition(currentStatus, 'created')) {
      backwardActions.push({ 
        label: 'Revert to Created', 
        status: 'created',
        direction: 'backward'
      });
    }
    
    if (isValidTransition(currentStatus, 'open')) {
      backwardActions.push({ 
        label: 'Revert to Open Enrollment', 
        status: 'open',
        direction: 'backward'
      });
    }
    
    if (isValidTransition(currentStatus, 'enrollment_complete')) {
      backwardActions.push({ 
        label: 'Revert to Enrollment Complete', 
        status: 'enrollment_complete',
        direction: 'backward'
      });
    }
    
    if (isValidTransition(currentStatus, 'in_progress')) {
      backwardActions.push({ 
        label: 'Revert to In Progress', 
        status: 'in_progress',
        direction: 'backward'
      });
    }
    
    if (isValidTransition(currentStatus, 'completed')) {
      backwardActions.push({ 
        label: 'Revert to Completed (Unfinalize)', 
        status: 'completed',
        direction: 'backward'
      });
    }
    
    // Combine forward and backward actions
    // Forward actions first, then backward actions
    return [...forwardActions, ...backwardActions];
  };

  // Function to update CTP player for a game
  const updateCtpPlayer = async (gameId, playerId) => {
    try {
      const gameData = games.find(g => g.id === gameId);
      if (!gameData) return;
      
      const updatedGame = {
        ...gameData,
        ctpPlayerId: playerId,
        ctpUpdatedAt: new Date().toISOString()
      };
      
      await dataSync.updateGame(updatedGame);
      
      // Update local state
      setGames(prev => 
        prev.map(g => g.id === gameId ? updatedGame : g)
      );
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating CTP player:', err);
      setError('Failed to update CTP player. Please try again.');
      return false;
    }
  };

  // Function removed as it was unused - StatusBadge component now handles this

  // Function to format date string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to handle game action selection
  const handleGameAction = async (gameId, newStatus) => {
    const success = await updateGameStatus(gameId, newStatus);
    if (success) {
      setError(null);
    }
  };

  // Function to go to pairing and groups configuration
  const goToPairingsAndGroups = (gameId) => {
    // In a real implementation, you would navigate to the PairingsAndGroups component
    // with the gameId as a parameter
    // For now, we'll just simulate storing the active game ID in localStorage
    localStorage.setItem('activeGameId', gameId);
    navigate('/');  // Redirect to home and the user can click on Pairings tab
  };

  // Render loading state
  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="game-management">
      <h2>Game Management</h2>
      <p className="admin-instructions">Manage the lifecycle of games from creation to finalization.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="game-list">
        <div className="game-header">
          <div className="game-column col-date">Date</div>
          <div className="game-column col-course">Course</div>
          <div className="game-column col-status">Status</div>
          <div className="game-column col-players">Players</div>
          <div className="game-column col-actions">Actions</div>
        </div>
        
        {games.length === 0 ? (
          <div className="no-games-message">
            <p>No games found. Click "Create New Game" tab to create one.</p>
          </div>
        ) : (
          games.map(game => (
            <div key={game.id} className={`game-item status-${game.status || 'created'}`}>
              <div className="game-row" onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}>
                <div className="game-column col-date">{formatDate(game.date)}</div>
                <div className="game-column col-course">{game.courseName}</div>
                <div className="game-column col-status">
                  <StatusBadge status={game.status || 'created'} />
                </div>
                <div className="game-column col-players">
                  {game.groups ? game.groups.reduce((total, group) => 
                    total + (group.playerIds?.length || 0), 0) : 0}
                </div>
                <div className="game-column col-actions">
                  <button className="btn-expand">
                    {expandedGameId === game.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
              
              {expandedGameId === game.id && (
                <div className="game-details">
                  <div className="game-info">
                    <div className="game-detail">
                      <strong>Game ID:</strong> {game.id}
                    </div>
                    <div className="game-detail">
                      <strong>Time:</strong> {game.time}
                    </div>
                    <div className="game-detail">
                      <strong>Holes:</strong> {game.holes}
                    </div>
                    <div className="game-detail">
                      <strong>Entry Fee:</strong> ${game.entryFee || 0}
                    </div>
                    <div className="game-detail">
                      <strong>Groups:</strong> {game.groups?.length || 0}
                    </div>
                    <div className="game-detail">
                      <strong>CTP Hole:</strong> {game.ctpHole || 'Not set'}
                    </div>
                    <div className="game-detail">
                      <strong>CTP Winner:</strong> {game.ctpPlayerId ? 'Set' : 'Not set'}
                    </div>
                    {game.notes && (
                      <div className="game-detail">
                        <strong>Notes:</strong> {game.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="game-actions">
                    <h4>Game Actions</h4>
                    <div className="action-buttons">
                      {getAvailableActions(game).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleGameAction(game.id, action.status)}
                          className={`action-btn action-${action.status} ${action.direction}`}
                          disabled={action.disabled}
                          title={action.tooltip}
                        >
                          {action.label}
                        </button>
                      ))}
                      
                      <button 
                        className="action-btn action-manage-players"
                        onClick={() => goToPairingsAndGroups(game.id)}
                      >
                        Manage Players & Groups
                      </button>
                    </div>
                  </div>
                  
                  {/* CTP Player Selector */}
                  {game.ctpHole && (
                    <div className="ctp-selection-section">
                      <CtpPlayerSelector 
                        game={game} 
                        onSelectCtp={(playerId) => updateCtpPlayer(game.id, playerId)}
                        disabled={game.status === 'finalized'}
                      />
                    </div>
                  )}
                  
                  <div className="game-history">
                    <h4>Status History</h4>
                    <div className="status-timeline">
                      {game.createdAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Created</span>
                          <span className="timeline-date">{new Date(game.createdAt).toLocaleString()}</span>
                        </div>
                      )}
                      {game.openedAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Opened for Enrollment</span>
                          <span className="timeline-date">{new Date(game.openedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {game.enrollmentCompletedAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Enrollment Completed</span>
                          <span className="timeline-date">{new Date(game.enrollmentCompletedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {game.startedAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Started</span>
                          <span className="timeline-date">{new Date(game.startedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {game.completedAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Completed</span>
                          <span className="timeline-date">{new Date(game.completedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {game.finalizedAt && (
                        <div className="timeline-item">
                          <span className="timeline-status">Finalized</span>
                          <span className="timeline-date">{new Date(game.finalizedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameManagement;
