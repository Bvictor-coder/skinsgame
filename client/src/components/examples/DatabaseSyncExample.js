import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchGames, 
  createGame, 
  updateGame, 
  deleteGame 
} from '../../store/actions/gameActions';
import { 
  syncData, 
  setStorageMode, 
  checkApiAvailability,
  createBackup,
  restoreFromBackup
} from '../../store/actions/syncActions';
import { 
  selectAllGames, 
  selectGameById, 
  selectGamesError 
} from '../../store/selectors/gameSelectors';
import {
  getStorageMode,
  isApiAvailable,
  isSyncing,
  getLastSyncTime,
  getSyncError
} from '../../store/selectors/syncSelectors';
import { STORAGE_MODES } from '../../storage/StorageManager';
import Game from '../../models/Game';
import { GAME_STATUSES } from '../../models/GameStatus';

const DatabaseSyncExample = () => {
  const dispatch = useDispatch();
  
  // Connect to Redux state via selectors
  const games = useSelector(selectAllGames);
  const storageMode = useSelector(getStorageMode);
  const apiAvailable = useSelector(isApiAvailable);
  const syncing = useSelector(isSyncing);
  const lastSync = useSelector(getLastSyncTime);
  const error = useSelector(getSyncError) || useSelector(selectGamesError);
  
  // Local state
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    course: 'Monarch Dunes',
    holes: 18,
    entryFee: 10,
    notes: ''
  });
  
  // Load games on initial mount
  useEffect(() => {
    dispatch(fetchGames());
    
    // Check API availability every 30 seconds
    const apiCheckInterval = setInterval(() => {
      dispatch(checkApiAvailability());
    }, 30000);
    
    return () => clearInterval(apiCheckInterval);
  }, [dispatch]);
  
  // Get the selected game
  const selectedGame = useSelector(state => 
    selectedGameId ? selectGameById(state, selectedGameId) : null
  );
  
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Create new game
  const handleCreateGame = (e) => {
    e.preventDefault();
    
    const newGame = {
      ...formData,
      status: GAME_STATUSES.CREATED,
      holes: parseInt(formData.holes, 10),
      entryFee: parseInt(formData.entryFee, 10)
    };
    
    dispatch(createGame(newGame));
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      course: 'Monarch Dunes',
      holes: 18,
      entryFee: 10,
      notes: ''
    });
  };
  
  // Update existing game
  const handleUpdateGame = (e) => {
    e.preventDefault();
    
    if (!selectedGameId) return;
    
    const updatedGame = {
      ...formData,
      holes: parseInt(formData.holes, 10),
      entryFee: parseInt(formData.entryFee, 10)
    };
    
    dispatch(updateGame(selectedGameId, updatedGame));
  };
  
  // Delete game
  const handleDeleteGame = (id) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      dispatch(deleteGame(id));
      if (selectedGameId === id) {
        setSelectedGameId(null);
      }
    }
  };
  
  // Select game for editing
  const handleSelectGame = (game) => {
    setSelectedGameId(game.id);
    setFormData({
      date: game.date,
      course: game.course,
      holes: game.holes,
      entryFee: game.entryFee,
      notes: game.notes || ''
    });
  };
  
  // Sync data between local storage and API
  const handleSyncData = () => {
    dispatch(syncData());
  };
  
  // Change storage mode
  const handleStorageModeChange = (e) => {
    dispatch(setStorageMode(e.target.value));
  };
  
  // Create backup
  const handleCreateBackup = () => {
    dispatch(createBackup());
  };
  
  // Restore from backup
  const handleRestoreBackup = () => {
    dispatch(restoreFromBackup());
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };
  
  // Game status badge
  const getStatusBadge = (status) => {
    let color = 'gray';
    
    switch (status) {
      case GAME_STATUSES.CREATED:
      case GAME_STATUSES.OPEN:
        color = 'blue';
        break;
      case GAME_STATUSES.ENROLLMENT_COMPLETE:
      case GAME_STATUSES.IN_PROGRESS:
        color = 'orange';
        break;
      case GAME_STATUSES.COMPLETED:
      case GAME_STATUSES.FINALIZED:
        color = 'green';
        break;
      case GAME_STATUSES.CANCELED:
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return (
      <span style={{ 
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: color,
        color: 'white'
      }}>
        {status}
      </span>
    );
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Database Sync Example</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h2>Storage Configuration</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label>
              <strong>Storage Mode: </strong>
              <select 
                value={storageMode} 
                onChange={handleStorageModeChange}
                style={{ padding: '5px' }}
              >
                <option value={STORAGE_MODES.LOCAL}>Local Only</option>
                <option value={STORAGE_MODES.API}>API Only</option>
                <option value={STORAGE_MODES.HYBRID}>Hybrid (Default)</option>
              </select>
            </label>
          </div>
          
          <div>
            <strong>API Status: </strong>
            <span style={{ 
              color: apiAvailable ? 'green' : 'red',
              fontWeight: 'bold'
            }}>
              {apiAvailable ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div>
            <strong>Last Sync: </strong>
            <span>{formatTimestamp(lastSync)}</span>
          </div>
          
          <button 
            onClick={handleSyncData}
            disabled={syncing || !apiAvailable}
            style={{ 
              padding: '5px 10px',
              backgroundColor: syncing ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: syncing ? 'not-allowed' : 'pointer'
            }}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          
          <button 
            onClick={handleCreateBackup}
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Backup
          </button>
          
          <button 
            onClick={handleRestoreBackup}
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Restore
          </button>
        </div>
        
        {error && (
          <div style={{ 
            color: 'red', 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#ffebee',
            borderRadius: '4px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Game form */}
        <div style={{ flex: '1' }}>
          <h2>{selectedGameId ? 'Edit Game' : 'Create New Game'}</h2>
          <form onSubmit={selectedGameId ? handleUpdateGame : handleCreateGame}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Date:
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Course:
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Holes:
                <select
                  name="holes"
                  value={formData.holes}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="9">9 Holes</option>
                  <option value="18">18 Holes</option>
                </select>
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Entry Fee:
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Notes:
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', height: '100px' }}
                />
              </label>
            </div>
            
            <button
              type="submit"
              style={{ 
                padding: '10px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {selectedGameId ? 'Update Game' : 'Create Game'}
            </button>
            
            {selectedGameId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGameId(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    course: 'Monarch Dunes',
                    holes: 18,
                    entryFee: 10,
                    notes: ''
                  });
                }}
                style={{ 
                  padding: '10px 15px',
                  backgroundColor: '#ccc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
        
        {/* Games list */}
        <div style={{ flex: '1' }}>
          <h2>Games ({games.length})</h2>
          {games.length === 0 ? (
            <p>No games found. Create a new game to get started.</p>
          ) : (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {games.map(game => (
                <li
                  key={game.id}
                  style={{ 
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: selectedGameId === game.id ? '#f0f7ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div>
                      <strong>{game.course}</strong> {' '}
                      {getStatusBadge(game.status)}
                    </div>
                    <div>
                      {new Date(game.date).toLocaleDateString()} | {game.holes} holes | ${game.entryFee}
                    </div>
                    {game.notes && <div><em>{game.notes}</em></div>}
                  </div>
                  <div>
                    <button
                      onClick={() => handleSelectGame(game)}
                      style={{ 
                        padding: '5px 10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      style={{ 
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSyncExample;
