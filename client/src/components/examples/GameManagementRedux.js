/**
 * Game Management Example (Redux Version)
 * 
 * This is an example component that shows how to use Redux directly
 * instead of the legacy dataSync API. Use this as a reference when
 * migrating other components.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchGames, 
  transitionGameStatus, 
  deleteGame 
} from '../../store/actions/gameActions';
import { 
  selectAllGames, 
  selectGamesLoading, 
  selectGamesError,
  selectGamesByStatus,
  selectOpenGames,
  selectInProgressGames,
  selectCompletedGames,
  selectFinalizedGames
} from '../../store/selectors/gameSelectors';
import { GAME_STATUSES, getStatusLabel, isGameEditable } from '../../models/GameStatus';

/**
 * Game Management component using Redux
 */
const GameManagementRedux = () => {
  const dispatch = useDispatch();
  
  // Select data from Redux store
  const games = useSelector(selectAllGames);
  const loading = useSelector(selectGamesLoading);
  const error = useSelector(selectGamesError);
  
  // Example of more specific selectors
  const openGames = useSelector(selectOpenGames);
  const inProgressGames = useSelector(selectInProgressGames);
  const completedGames = useSelector(selectCompletedGames);
  const finalizedGames = useSelector(selectFinalizedGames);
  
  // Pre-select all the game status types (fixing the hooks rule violation)
  const gamesByOpenStatus = useSelector(state => selectGamesByStatus(state, GAME_STATUSES.OPEN));
  const gamesByInProgressStatus = useSelector(state => selectGamesByStatus(state, GAME_STATUSES.IN_PROGRESS));
  const gamesByCompletedStatus = useSelector(state => selectGamesByStatus(state, GAME_STATUSES.COMPLETED));
  const gamesByFinalizedStatus = useSelector(state => selectGamesByStatus(state, GAME_STATUSES.FINALIZED));
  
  // Local state
  const [filter, setFilter] = useState('all');
  
  // Load games on component mount
  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);
  
  // Compute filtered games using useMemo to avoid repeated calculations
  const filteredGames = useMemo(() => {
    switch (filter) {
      case 'open':
        return gamesByOpenStatus;
      case 'in_progress':
        return gamesByInProgressStatus;
      case 'completed':
        return gamesByCompletedStatus;
      case 'finalized':
        return gamesByFinalizedStatus;
      case 'all':
      default:
        return games;
    }
  }, [filter, games, gamesByOpenStatus, gamesByInProgressStatus, gamesByCompletedStatus, gamesByFinalizedStatus]);
  
  // Handle status change
  const handleStatusChange = async (gameId, newStatus) => {
    try {
      await dispatch(transitionGameStatus(gameId, newStatus));
    } catch (error) {
      console.error('Error changing game status:', error);
      // Error handling would go here
    }
  };
  
  // Handle game deletion
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game?')) {
      return;
    }
    
    try {
      await dispatch(deleteGame(gameId));
    } catch (error) {
      console.error('Error deleting game:', error);
      // Error handling would go here
    }
  };
  
  // Render loading state
  if (loading && games.length === 0) {
    return <div className="loading">Loading games...</div>;
  }
  
  // Render error state
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="game-management">
      <h2>Game Management</h2>
      
      {/* Filter controls */}
      <div className="filters">
        <label>
          Filter by status:
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Games</option>
            <option value="open">Open Games</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="finalized">Finalized</option>
          </select>
        </label>
      </div>
      
      {/* Game list */}
      <div className="games-list">
        {games.length === 0 ? (
          <p>No games found. Create a new game to get started.</p>
        ) : (
          <table className="games-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map(game => (
                <tr key={game.id}>
                  <td>{new Date(game.date).toLocaleDateString()}</td>
                  <td>{game.course}</td>
                  <td>{getStatusLabel(game.status)}</td>
                  <td>
                    {/* Status change buttons */}
                    {game.getValidNextStatuses().map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(game.id, status)}
                        className={`status-btn ${status}`}
                      >
                        Move to {getStatusLabel(status)}
                      </button>
                    ))}
                    
                    {/* View details button */}
                    <button
                      onClick={() => {/* View details functionality */}}
                      className="view-btn"
                    >
                      View Details
                    </button>
                    
                    {/* Delete button */}
                    {isGameEditable(game.status) && (
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Game statistics */}
      <div className="game-stats">
        <h3>Game Statistics</h3>
        <p>Total games: {games.length}</p>
        <p>Open games: {openGames.length}</p>
        <p>In progress: {inProgressGames.length}</p>
        <p>Completed: {completedGames.length}</p>
        <p>Finalized: {finalizedGames.length}</p>
      </div>
    </div>
  );
};

export default GameManagementRedux;
