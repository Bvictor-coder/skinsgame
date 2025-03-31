import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';

const PlayersManagement = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({ name: '', email: '', handicap: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  // Load players from dataSync on component mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const friendsData = await dataSync.getFriends();
        setPlayers(friendsData);
      } catch (err) {
        console.error('Error loading players:', err);
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Handle input changes for new player form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlayer({ ...newPlayer, [name]: value });
  };

  // Handle saving a new player
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newPlayer.name || !newPlayer.email) {
      setError('Name and email are required');
      return;
    }
    
    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newPlayer.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Handicap validation (optional, but must be a number if provided)
    if (newPlayer.handicap && isNaN(parseFloat(newPlayer.handicap))) {
      setError('Handicap must be a number');
      return;
    }
    
    // Check for duplicate email
    const duplicateEmail = players.some(
      player => player.email.toLowerCase() === newPlayer.email.toLowerCase()
    );
    
    if (duplicateEmail) {
      setError('A player with this email already exists');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Process handicap as number
      const playerData = {
        ...newPlayer,
        handicap: newPlayer.handicap ? parseFloat(newPlayer.handicap) : null
      };
      
      // Add to dataSync
      const addedPlayer = await dataSync.addFriend(playerData);
      
      // Update local state
      setPlayers([...players, addedPlayer]);
      
      // Reset form
      setNewPlayer({ name: '', email: '', handicap: '' });
      setShowAddForm(false);
      
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a player
  const handleEditPlayer = (player) => {
    setEditingPlayer({
      ...player,
      handicap: player.handicap !== null ? player.handicap.toString() : ''
    });
  };

  // Handle input changes for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlayer({ ...editingPlayer, [name]: value });
  };

  // Handle saving edited player
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editingPlayer.name || !editingPlayer.email) {
      setError('Name and email are required');
      return;
    }
    
    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(editingPlayer.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check for duplicate email (excluding the current player)
    const duplicateEmail = players.some(
      player => player.id !== editingPlayer.id && 
                player.email.toLowerCase() === editingPlayer.email.toLowerCase()
    );
    
    if (duplicateEmail) {
      setError('Another player with this email already exists');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Process handicap as number
      const playerData = {
        ...editingPlayer,
        handicap: editingPlayer.handicap ? parseFloat(editingPlayer.handicap) : null
      };
      
      // Update in dataSync
      const updatedPlayer = await dataSync.updateFriend(editingPlayer.id, playerData);
      
      // Update local state
      setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
      
      // Reset edit mode
      setEditingPlayer(null);
      
    } catch (err) {
      console.error('Error updating player:', err);
      setError('Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a player
  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete from dataSync
      await dataSync.deleteFriend(playerId);
      
      // Update local state
      setPlayers(players.filter(player => player.id !== playerId));
      
    } catch (err) {
      console.error('Error deleting player:', err);
      setError('Failed to delete player');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPlayer(null);
    setError('');
  };

  return (
    <div className="players-management">
      <div className="players-header">
        <h2>Player Management</h2>
        {!showAddForm && (
          <button 
            className="btn" 
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            <i className="fas fa-plus"></i> Add New Player
          </button>
        )}
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {/* Add Player Form */}
      {showAddForm && (
        <div className="player-form card">
          <h3>Add New Player</h3>
          <form onSubmit={handleAddPlayer}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newPlayer.name}
                onChange={handleInputChange}
                required
                placeholder="Player's full name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newPlayer.email}
                onChange={handleInputChange}
                required
                placeholder="player@example.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="handicap">Handicap (optional)</label>
              <input
                type="number"
                id="handicap"
                name="handicap"
                value={newPlayer.handicap}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                placeholder="Enter player's handicap"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Player'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlayer({ name: '', email: '', handicap: '' });
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Players Table */}
      {players.length > 0 ? (
        <div className="players-table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Handicap</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  {editingPlayer && editingPlayer.id === player.id ? (
                    // Edit row
                    <>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={editingPlayer.name}
                          onChange={handleEditInputChange}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          name="email"
                          value={editingPlayer.email}
                          onChange={handleEditInputChange}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="handicap"
                          value={editingPlayer.handicap}
                          onChange={handleEditInputChange}
                          step="0.1"
                          min="0"
                        />
                      </td>
                      <td className="actions">
                        <button 
                          onClick={handleSaveEdit} 
                          className="btn btn-small"
                          disabled={loading}
                        >
                          <i className="fas fa-save"></i> Save
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className="btn btn-small btn-secondary"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    // Display row
                    <>
                      <td>{player.name}</td>
                      <td>{player.email}</td>
                      <td>{player.handicap !== null ? player.handicap : '-'}</td>
                      <td className="actions">
                        <button 
                          onClick={() => handleEditPlayer(player)} 
                          className="btn btn-small btn-secondary"
                          disabled={loading || editingPlayer !== null}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePlayer(player.id)} 
                          className="btn btn-small btn-danger"
                          disabled={loading || editingPlayer !== null}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No players have been added yet.</p>
          {!showAddForm && (
            <button 
              className="btn"
              onClick={() => setShowAddForm(true)}
            >
              Add your first player
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayersManagement;
