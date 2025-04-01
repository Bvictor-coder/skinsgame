import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';

/**
 * Debug Panel Component
 * 
 * This component provides a visual interface for monitoring and debugging
 * the application state, particularly game lifecycle issues.
 * It's only visible in development mode and can be toggled on/off.
 */
const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  // State for storing localStorage contents (commented out to avoid eslint warning)
  const [/*currentStorage*/, setCurrentStorage] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load all games on component mount
  useEffect(() => {
    loadGames();
    
    // Setup storage event listener to detect changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadGames, handleStorageChange]);
  
  // Setup auto-refresh interval if enabled
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadGames();
        dumpStorage();
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, loadGames]);
  
  // Update selected game when games change or selected ID changes
  useEffect(() => {
    if (selectedGameId) {
      const game = games.find(g => g.id === selectedGameId);
      setSelectedGame(game || null);
    }
  }, [games, selectedGameId]);

  // Load games from localStorage via dataSync
  const loadGames = async () => {
    try {
      const gamesData = await dataSync.getGames();
      setGames(gamesData);
      
      // Select first game if none selected
      if (!selectedGameId && gamesData.length > 0) {
        setSelectedGameId(gamesData[0].id);
      }
    } catch (err) {
      console.error('Error loading games for debug panel:', err);
    }
  };
  
  // Handle storage changes from other tabs/windows
  const handleStorageChange = (event) => {
    if (event.key === 'golfSkinsOrganizer') {
      loadGames();
      dumpStorage();
    }
  };
  
  // Dump current localStorage contents
  const dumpStorage = () => {
    try {
      const storage = {};
      
      const mainData = localStorage.getItem('golfSkinsOrganizer');
      if (mainData) {
        storage.main = JSON.parse(mainData);
      }
      
      const userData = localStorage.getItem('golfSkinsUser');
      if (userData) {
        storage.user = JSON.parse(userData);
      }
      
      setCurrentStorage(storage);
    } catch (err) {
      console.error('Error dumping storage:', err);
    }
  };
  
  // Toggle panel visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      loadGames();
      dumpStorage();
    }
  };
  
  // Fix common issues with selected game
  const fixSelectedGame = async () => {
    if (!selectedGame) return;
    
    const fixedGame = { ...selectedGame };
    let fixesApplied = false;
    
    // Ensure scores object exists
    if (!fixedGame.scores) {
      fixedGame.scores = { raw: [] };
      fixesApplied = true;
    }
    
    // Ensure timestamps for status exist
    const timestamp = new Date().toISOString();
    
    switch (fixedGame.status) {
      case 'created':
        if (!fixedGame.createdAt) {
          fixedGame.createdAt = timestamp;
          fixesApplied = true;
        }
        break;
      case 'open':
        if (!fixedGame.openedAt) {
          fixedGame.openedAt = timestamp;
          fixesApplied = true;
        }
        break;
      case 'enrollment_complete':
        if (!fixedGame.enrollmentCompletedAt) {
          fixedGame.enrollmentCompletedAt = timestamp;
          fixesApplied = true;
        }
        break;
      case 'in_progress':
        if (!fixedGame.startedAt) {
          fixedGame.startedAt = timestamp;
          fixesApplied = true;
        }
        break;
      case 'completed':
        if (!fixedGame.completedAt) {
          fixedGame.completedAt = timestamp;
          fixesApplied = true;
        }
        break;
      case 'finalized':
        if (!fixedGame.finalizedAt) {
          fixedGame.finalizedAt = timestamp;
          fixesApplied = true;
        }
        break;
      default:
        break;
    }
    
    if (fixesApplied) {
      try {
        await dataSync.updateGame(fixedGame);
        loadGames();
        alert(`Fixed game ${fixedGame.id}. Please check the console for details.`);
      } catch (err) {
        console.error('Error fixing game:', err);
        alert(`Error fixing game: ${err.message}`);
      }
    } else {
      alert('No issues found with this game');
    }
  };
  
  // Transition game to a new status
  const transitionGameStatus = async (newStatus) => {
    if (!selectedGame) return;
    
    try {
      const updatedGame = { ...selectedGame, status: newStatus };
      await dataSync.updateGame(updatedGame);
      loadGames();
      alert(`Game transitioned to ${newStatus} status`);
    } catch (err) {
      console.error('Error transitioning game status:', err);
      alert(`Error transitioning game: ${err.message}`);
    }
  };
  
  // Get game status history
  const getGameHistory = (game) => {
    if (!game) return [];
    
    const history = [];
    
    if (game.createdAt) {
      history.push({
        status: 'created',
        timestamp: new Date(game.createdAt).toLocaleString()
      });
    }
    
    if (game.openedAt) {
      history.push({
        status: 'open',
        timestamp: new Date(game.openedAt).toLocaleString()
      });
    }
    
    if (game.enrollmentCompletedAt) {
      history.push({
        status: 'enrollment_complete',
        timestamp: new Date(game.enrollmentCompletedAt).toLocaleString()
      });
    }
    
    if (game.startedAt) {
      history.push({
        status: 'in_progress',
        timestamp: new Date(game.startedAt).toLocaleString()
      });
    }
    
    if (game.completedAt) {
      history.push({
        status: 'completed',
        timestamp: new Date(game.completedAt).toLocaleString()
      });
    }
    
    if (game.finalizedAt) {
      history.push({
        status: 'finalized',
        timestamp: new Date(game.finalizedAt).toLocaleString()
      });
    }
    
    return history;
  };
  
  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'created':
        return 'status-created';
      case 'open':
        return 'status-open';
      case 'enrollment_complete':
        return 'status-enrollment';
      case 'in_progress':
        return 'status-progress';
      case 'completed':
        return 'status-completed';
      case 'finalized':
        return 'status-finalized';
      default:
        return '';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Panel styling
  const panelStyle = {
    position: 'fixed',
    bottom: isVisible ? '0' : '-500px',
    left: '0',
    right: '0',
    height: '500px',
    backgroundColor: '#f8f9fa',
    borderTop: '3px solid #6c757d',
    zIndex: 9999,
    transition: 'bottom 0.3s ease-in-out',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const headerStyle = {
    padding: '10px 15px',
    backgroundColor: '#343a40',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #dee2e6'
  };
  
  const toggleButtonStyle = {
    position: 'fixed',
    bottom: isVisible ? '500px' : '0',
    right: '20px',
    zIndex: 10000,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: isVisible ? '4px 4px 0 0' : '4px',
    padding: '8px 15px',
    cursor: 'pointer',
    transition: 'bottom 0.3s ease-in-out'
  };
  
  const contentStyle = {
    display: 'flex',
    height: 'calc(100% - 45px)',
    overflow: 'hidden'
  };
  
  const sidebarStyle = {
    width: '25%',
    borderRight: '1px solid #dee2e6',
    overflowY: 'auto',
    padding: '10px'
  };
  
  const detailsStyle = {
    width: '75%',
    overflowY: 'auto',
    padding: '15px'
  };
  
  const gameItemStyle = {
    padding: '10px',
    margin: '5px 0',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #dee2e6'
  };
  
  const selectedGameItemStyle = {
    ...gameItemStyle,
    backgroundColor: '#e9ecef',
    borderColor: '#007bff'
  };
  
  const statusBadgeStyle = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    marginLeft: '5px'
  };
  
  const historyItemStyle = {
    padding: '8px 10px',
    margin: '5px 0',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    borderLeft: '4px solid #6c757d',
    display: 'flex',
    justifyContent: 'space-between'
  };
  
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <>
      {/* Toggle button */}
      <button style={toggleButtonStyle} onClick={toggleVisibility}>
        {isVisible ? 'Hide Debug Panel' : 'Debug Panel'}
      </button>
      
      {/* Debug panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Debug Panel</h3>
          <div>
            <button 
              onClick={loadGames}
              style={{
                marginRight: '10px',
                padding: '4px 10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
            <label style={{ marginRight: '10px', color: 'white' }}>
              <input 
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                style={{ marginRight: '5px' }}
              />
              Auto-refresh
            </label>
            <button 
              onClick={toggleVisibility}
              style={{
                padding: '4px 10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={contentStyle}>
          {/* Sidebar with games list */}
          <div style={sidebarStyle}>
            <h4>Games</h4>
            {games.length === 0 ? (
              <p>No games found</p>
            ) : (
              games.map(game => (
                <div 
                  key={game.id}
                  style={game.id === selectedGameId ? selectedGameItemStyle : gameItemStyle}
                  onClick={() => setSelectedGameId(game.id)}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {formatDate(game.date)} - {game.course}
                    <span 
                      style={{
                        ...statusBadgeStyle,
                        backgroundColor: (() => {
                          switch (game.status) {
                            case 'created': return '#6c757d';
                            case 'open': return '#007bff';
                            case 'enrollment_complete': return '#17a2b8';
                            case 'in_progress': return '#ffc107';
                            case 'completed': return '#28a745';
                            case 'finalized': return '#343a40';
                            default: return '#6c757d';
                          }
                        })()
                      }}
                    >
                      {game.status || 'created'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ID: {game.id}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Game details */}
          <div style={detailsStyle}>
            {selectedGame ? (
              <>
                <h3>Game Details</h3>
                <div style={{ marginBottom: '20px' }}>
                  <strong>ID:</strong> {selectedGame.id}<br />
                  <strong>Course:</strong> {selectedGame.course}<br />
                  <strong>Date:</strong> {formatDate(selectedGame.date)}<br />
                  <strong>Status:</strong> {selectedGame.status || 'created'}<br />
                  <strong>Scores Object Exists:</strong> {selectedGame.scores ? 'Yes' : 'No'}<br />
                  <strong>Has Calculated Results:</strong> {
                    selectedGame.scores && selectedGame.scores.calculated ? 'Yes' : 'No'
                  }
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4>Actions</h4>
                  <button
                    onClick={fixSelectedGame}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    Fix Issues
                  </button>
                  
                  <div style={{ marginTop: '10px' }}>
                    <h5>Change Status:</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <button
                        onClick={() => transitionGameStatus('created')}
                        className={getStatusClass('created')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Created
                      </button>
                      <button
                        onClick={() => transitionGameStatus('open')}
                        className={getStatusClass('open')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => transitionGameStatus('enrollment_complete')}
                        className={getStatusClass('enrollment_complete')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Enrollment Complete
                      </button>
                      <button
                        onClick={() => transitionGameStatus('in_progress')}
                        className={getStatusClass('in_progress')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => transitionGameStatus('completed')}
                        className={getStatusClass('completed')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => transitionGameStatus('finalized')}
                        className={getStatusClass('finalized')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#343a40',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Finalized
                      </button>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4>Status Timestamps</h4>
                  {getGameHistory(selectedGame).length > 0 ? (
                    getGameHistory(selectedGame).map((event, index) => (
                      <div 
                        key={index}
                        style={{
                          ...historyItemStyle,
                          borderLeftColor: (() => {
                            switch (event.status) {
                              case 'created': return '#6c757d';
                              case 'open': return '#007bff';
                              case 'enrollment_complete': return '#17a2b8';
                              case 'in_progress': return '#ffc107';
                              case 'completed': return '#28a745';
                              case 'finalized': return '#343a40';
                              default: return '#6c757d';
                            }
                          })()
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>
                          {event.status.replace('_', ' ')}
                        </span>
                        <span style={{ color: '#666' }}>
                          {event.timestamp}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No timestamps recorded for this game</p>
                  )}
                </div>
                
                <div>
                  <h4>Raw Data</h4>
                  <pre style={{ 
                    backgroundColor: '#f1f3f5', 
                    padding: '10px', 
                    overflow: 'auto',
                    fontSize: '12px',
                    maxHeight: '200px' 
                  }}>
                    {JSON.stringify(selectedGame, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <p>Select a game to view details</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DebugPanel;
