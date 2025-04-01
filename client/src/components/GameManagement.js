import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';

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
    // Define valid status transitions
    const validTransitions = {
      'created': ['open'],
      'open': ['enrollment_complete'],
      'enrollment_complete': ['in_progress'],
      'in_progress': ['completed'],
      'completed': ['finalized']
    };
    
    // If current status is undefined/null, only allow transition to 'created'
    if (!currentStatus) {
      return newStatus === 'created';
    }
    
    // Check if the transition is valid
    return validTransitions[currentStatus]?.includes(newStatus);
  };

  // Function to get available actions based on current status
  const getAvailableActions = (game) => {
    const actions = [];
    const currentStatus = game.status || 'created';
    
    if (isValidTransition(currentStatus, 'open')) {
      actions.push({ label: 'Open for Enrollment', status: 'open' });
    }
    
    if (isValidTransition(currentStatus, 'enrollment_complete')) {
      actions.push({ label: 'Complete Enrollment', status: 'enrollment_complete' });
    }
    
    if (isValidTransition(currentStatus, 'in_progress')) {
      actions.push({ label: 'Start Game', status: 'in_progress' });
    }
    
    if (isValidTransition(currentStatus, 'completed')) {
      actions.push({ label: 'Mark Completed', status: 'completed' });
    }
    
    if (isValidTransition(currentStatus, 'finalized')) {
      // Only allow finalization if CTP is set
      if (game.ctpPlayerId) {
        actions.push({ label: 'Finalize Game', status: 'finalized' });
      } else {
        actions.push({ 
          label: 'Finalize Game (Set CTP First)', 
          status: 'finalized',
          disabled: true,
          tooltip: 'You must set a Closest To Pin player before finalizing'
        });
      }
    }
    
    return actions;
  };

  // Function to set CTP (Closest to Pin) player for a game
  const openCtpSelection = (gameId) => {
    // For now just navigate to the scorecard page for any group
    // (In a real implementation, you'd have a dedicated CTP selection modal)
    const game = games.find(g => g.id === gameId);
    if (game && game.groups && game.groups.length > 0) {
      navigate(`/scorecard/${gameId}/0`);
    } else {
      setError('Game has no groups. Add groups first.');
    }
  };

  // Function to get formatted status text
  const getStatusText = (status) => {
    switch(status) {
      case 'created': return 'Created';
      case 'open': return 'Open for Enrollment';
      case 'enrollment_complete': return 'Enrollment Complete';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'finalized': return 'Finalized';
      default: return 'Unknown';
    }
  };

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
                  <span className={`status-badge status-${game.status || 'created'}`}>
                    {getStatusText(game.status || 'created')}
                  </span>
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
                          className={`action-btn action-${action.status}`}
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
                      
                      <button 
                        className="action-btn action-set-ctp"
                        onClick={() => openCtpSelection(game.id)}
                        disabled={!game.ctpHole}
                      >
                        {game.ctpPlayerId ? 'Update CTP Winner' : 'Set CTP Winner'}
                      </button>
                    </div>
                  </div>
                  
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
