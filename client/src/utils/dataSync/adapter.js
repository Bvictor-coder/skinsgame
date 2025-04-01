/**
 * DataSync Adapter
 * 
 * This adapter provides backwards compatibility with the old dataSync API
 * while using the new Redux store and Game model underneath.
 */

import store from '../../store';
import { 
  fetchGames, 
  fetchGame, 
  createGame, 
  updateGame, 
  transitionGameStatus, 
  updateGameScores,
  setCalculatedScores,
  finalizeGame,
  deleteGame
} from '../../store/actions/gameActions';
import { GAME_STATUSES } from '../../models/GameStatus';

/**
 * DataSync adapter that mimics the old API but uses Redux
 */
const dataSync = {
  /**
   * Initialize the data layer
   * @returns {Promise<Array>} All games
   */
  initialize: async () => {
    try {
      await store.dispatch(fetchGames());
      return store.getState().games.games;
    } catch (error) {
      console.error('Error initializing data:', error);
      throw error;
    }
  },
  
  /**
   * Get all games
   * @returns {Promise<Array>} All games
   */
  getGames: async () => {
    try {
      await store.dispatch(fetchGames());
      return store.getState().games.games;
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  },
  
  /**
   * Add a new game
   * @param {Object} gameData - Game data
   * @returns {Promise<Object>} Created game
   */
  addGame: async (gameData) => {
    try {
      return await store.dispatch(createGame(gameData));
    } catch (error) {
      console.error('Error adding game:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing game
   * @param {string|Object} gameOrId - Game ID or game object with id property
   * @param {Object} [gameData] - Game updates if gameOrId is an ID
   * @returns {Promise<Object>} Updated game
   */
  updateGame: async (gameOrId, gameData) => {
    try {
      // If first arg is an object with an id, use that as the game object
      if (typeof gameOrId === 'object' && gameOrId.id) {
        return await store.dispatch(updateGame(gameOrId.id, gameOrId));
      }
      
      // Otherwise, use first arg as ID and second as updates
      return await store.dispatch(updateGame(gameOrId, gameData));
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  },
  
  /**
   * Change a game's status
   * @param {string} gameId - Game ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated game
   */
  changeGameStatus: async (gameId, status) => {
    try {
      return await store.dispatch(transitionGameStatus(gameId, status));
    } catch (error) {
      console.error(`Error changing game status to ${status}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a game's scores
   * @param {string} gameId - Game ID
   * @param {Array} scores - Raw scores array
   * @returns {Promise<Object>} Updated game
   */
  updateGameScores: async (gameId, scores) => {
    try {
      return await store.dispatch(updateGameScores(gameId, scores));
    } catch (error) {
      console.error('Error updating game scores:', error);
      throw error;
    }
  },
  
  /**
   * Set calculated scores for a game
   * @param {string} gameId - Game ID
   * @param {Object} calculatedScores - Calculated scores data
   * @returns {Promise<Object>} Updated game
   */
  setCalculatedScores: async (gameId, calculatedScores) => {
    try {
      return await store.dispatch(setCalculatedScores(gameId, calculatedScores));
    } catch (error) {
      console.error('Error setting calculated scores:', error);
      throw error;
    }
  },
  
  /**
   * Finalize a game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Finalized game
   */
  finalizeGame: async (gameId) => {
    try {
      return await store.dispatch(finalizeGame(gameId));
    } catch (error) {
      console.error('Error finalizing game:', error);
      throw error;
    }
  },
  
  /**
   * Delete a game
   * @param {string} gameId - Game ID
   * @returns {Promise<boolean>} Success indicator
   */
  deleteGame: async (gameId) => {
    try {
      await store.dispatch(deleteGame(gameId));
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  },
  
  /**
   * Get a game by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<Object|null>} Game or null if not found
   */
  getGameById: async (gameId) => {
    try {
      const games = store.getState().games.games;
      const cachedGame = games.find(g => g.id === gameId);
      
      if (cachedGame) {
        return cachedGame;
      }
      
      // If not in cache, fetch from storage
      return await store.dispatch(fetchGame(gameId));
    } catch (error) {
      console.error(`Error getting game ${gameId}:`, error);
      return null;
    }
  },
  
  /**
   * Get game status label
   * @param {string} status - Game status
   * @returns {string} Human-readable status label
   */
  getGameStatusLabel: (status) => {
    switch (status) {
      case GAME_STATUSES.CREATED:
        return 'Created';
      case GAME_STATUSES.OPEN:
        return 'Open for Enrollment';
      case GAME_STATUSES.ENROLLMENT_COMPLETE:
        return 'Enrollment Complete';
      case GAME_STATUSES.IN_PROGRESS:
        return 'In Progress';
      case GAME_STATUSES.COMPLETED:
        return 'Completed';
      case GAME_STATUSES.FINALIZED:
        return 'Finalized';
      default:
        return 'Unknown Status';
    }
  },
  
  /**
   * Check if a game can transition to a status
   * @param {Object} game - Game object
   * @param {string} status - Target status
   * @returns {boolean} True if transition is valid
   */
  canTransitionTo: (game, status) => {
    if (!game) return false;
    
    switch (game.status) {
      case GAME_STATUSES.CREATED:
        return status === GAME_STATUSES.OPEN;
      case GAME_STATUSES.OPEN:
        return status === GAME_STATUSES.ENROLLMENT_COMPLETE || status === GAME_STATUSES.CREATED;
      case GAME_STATUSES.ENROLLMENT_COMPLETE:
        return status === GAME_STATUSES.IN_PROGRESS || status === GAME_STATUSES.OPEN;
      case GAME_STATUSES.IN_PROGRESS:
        return status === GAME_STATUSES.COMPLETED || status === GAME_STATUSES.ENROLLMENT_COMPLETE;
      case GAME_STATUSES.COMPLETED:
        return status === GAME_STATUSES.FINALIZED || status === GAME_STATUSES.IN_PROGRESS;
      case GAME_STATUSES.FINALIZED:
        return status === GAME_STATUSES.COMPLETED;
      default:
        return false;
    }
  }
};

export default dataSync;
