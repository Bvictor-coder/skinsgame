/**
 * API Game Storage Adapter
 * 
 * Handles persistence of Game objects to the backend API.
 * This adapter bridges between the local state machine model and the server's Game model.
 */

import Game from '../models/Game';
import api from '../utils/api';
import { GAME_STATUSES } from '../models/GameStatus';

/**
 * Maps client-side status to server status
 * @param {string} clientStatus - Status from client Game model
 * @returns {string} Server-compatible status
 */
const mapToServerStatus = (clientStatus) => {
  switch (clientStatus) {
    case GAME_STATUSES.CREATED:
    case GAME_STATUSES.OPEN:
    case GAME_STATUSES.ENROLLMENT_COMPLETE:
    case GAME_STATUSES.IN_PROGRESS:
      return 'upcoming';
    case GAME_STATUSES.COMPLETED:
    case GAME_STATUSES.FINALIZED:
      return 'completed';
    default:
      return 'upcoming';
  }
};

/**
 * Maps server status to client-side status
 * @param {string} serverStatus - Status from server
 * @param {Object} gameData - Complete game data to infer detailed status
 * @returns {string} Client-compatible status
 */
const mapToClientStatus = (serverStatus, gameData) => {
  if (serverStatus === 'canceled') {
    return GAME_STATUSES.CANCELED;
  }
  
  if (serverStatus === 'completed') {
    // If it has scores, it's at least completed
    return gameData.scores?.raw?.length > 0 ? 
      (gameData.scores.skins?.length > 0 ? GAME_STATUSES.FINALIZED : GAME_STATUSES.COMPLETED) :
      GAME_STATUSES.COMPLETED;
  }
  
  // For 'upcoming', infer the specific status based on game state
  if (gameData.groups && gameData.groups.length > 0) {
    return GAME_STATUSES.IN_PROGRESS; // Has groups, so must be in progress
  }
  
  return GAME_STATUSES.OPEN; // Default for upcoming games without groups
};

/**
 * Convert server game data to client Game model
 * @param {Object} serverGame - Game data from the server
 * @returns {Game} Client Game model instance
 */
const serverToClientGame = (serverGame) => {
  if (!serverGame) return null;
  
  const clientStatus = mapToClientStatus(serverGame.status, serverGame);
  
  // Create status history if missing
  const statusHistory = [{
    status: clientStatus,
    timestamp: serverGame.createdAt || new Date().toISOString(),
    previousStatus: null
  }];
  
  // Map server game to client Game model
  const clientGame = new Game({
    id: serverGame.id,
    date: new Date(serverGame.date).toISOString().split('T')[0],
    time: serverGame.time || '',
    course: serverGame.course,
    holes: serverGame.holes || 18,
    entryFee: serverGame.entryFee || 0,
    notes: serverGame.notes || '',
    ctpHole: serverGame.ctpHole || null,
    ctpPlayerId: serverGame.scores?.ctpWinner || null,
    wolfEnabled: serverGame.wolfEnabled || false,
    status: clientStatus,
    statusHistory: statusHistory,
    groups: serverGame.groups || [],
    scores: serverGame.scores || { raw: [] },
    createdAt: serverGame.createdAt || new Date().toISOString(),
    updatedAt: serverGame.updatedAt || new Date().toISOString()
  });
  
  return clientGame;
};

/**
 * Convert client Game model to server game data
 * @param {Game} clientGame - Client Game model instance
 * @returns {Object} Server-compatible game data
 */
const clientToServerGame = (clientGame) => {
  if (!clientGame) return null;
  
  // Map client Game model to server game format
  return {
    id: clientGame.id,
    date: new Date(clientGame.date),
    time: clientGame.time || '',
    course: clientGame.course,
    holes: clientGame.holes || 18,
    entryFee: clientGame.entryFee || 0,
    notes: clientGame.notes || '',
    ctpHole: clientGame.ctpHole || null,
    wolfEnabled: clientGame.wolfEnabled || false,
    status: mapToServerStatus(clientGame.status),
    groups: clientGame.groups || [],
    scores: clientGame.scores || { raw: [] },
  };
};

/**
 * API Game Storage adapter
 */
class ApiGameStorage {
  /**
   * Get all games from the API
   * @returns {Promise<Game[]>} Array of Game instances
   */
  async getAll() {
    try {
      const response = await api.games.getAll();
      const games = response.data.map(serverToClientGame);
      return games;
    } catch (error) {
      console.error('Error fetching games from API:', error);
      // Fall back to empty array on error
      return [];
    }
  }
  
  /**
   * Get a game by ID from the API
   * @param {string} id - Game ID
   * @returns {Promise<Game|null>} Game instance or null if not found
   */
  async getById(id) {
    try {
      const response = await api.games.getById(id);
      return serverToClientGame(response.data);
    } catch (error) {
      console.error(`Error fetching game ${id} from API:`, error);
      return null;
    }
  }
  
  /**
   * Save a game to the API
   * @param {Game} game - Game instance to save
   * @returns {Promise<Game>} Saved game instance
   * @throws {Error} If validation fails or save fails
   */
  async save(game) {
    // Ensure we have a Game instance
    const gameInstance = game instanceof Game ? game : Game.fromJSON(game);
    
    // Validate game before saving
    const validation = gameInstance.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid game: ${validation.errors.join(', ')}`);
    }
    
    try {
      let response;
      const serverGame = clientToServerGame(gameInstance);
      
      if (gameInstance.id && gameInstance.id.includes('game_')) {
        // New game with temporary ID - create it
        const { id, ...newGameData } = serverGame;
        response = await api.games.create(newGameData);
      } else if (gameInstance.id) {
        // Existing game - update it
        response = await api.games.update(gameInstance.id, serverGame);
      } else {
        // Brand new game without ID
        response = await api.games.create(serverGame);
      }
      
      // Convert back to client model and return
      return serverToClientGame(response.data);
    } catch (error) {
      console.error('Error saving game to API:', error);
      throw new Error(`Failed to save game: ${error.message}`);
    }
  }
  
  /**
   * Save multiple games at once to the API
   * @param {Game[]} games - Array of Game instances to save
   * @returns {Promise<Game[]>} Saved game instances
   * @throws {Error} If validation fails or save fails
   */
  async saveMany(games) {
    // Process each game individually - APIs typically don't have batch endpoints
    try {
      const savedGames = [];
      
      for (const game of games) {
        const savedGame = await this.save(game);
        savedGames.push(savedGame);
      }
      
      return savedGames;
    } catch (error) {
      console.error('Error saving multiple games to API:', error);
      throw new Error(`Failed to save games: ${error.message}`);
    }
  }
  
  /**
   * Delete a game from the API
   * @param {string} id - Game ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    try {
      await api.games.delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting game ${id} from API:`, error);
      return false;
    }
  }
  
  /**
   * Update game status in the API
   * @param {string} id - Game ID
   * @param {string} status - New client-side status
   * @returns {Promise<Game>} Updated game instance
   */
  async updateStatus(id, status) {
    try {
      const serverStatus = mapToServerStatus(status);
      const response = await api.games.updateStatus(id, serverStatus);
      
      // The server doesn't store our detailed status, so we need to get the full game
      // and then update its status to our desired client status
      const clientGame = serverToClientGame(response.data);
      clientGame.status = status;
      
      // Save the updated game
      return await this.save(clientGame);
    } catch (error) {
      console.error(`Error updating status for game ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Update game scores in the API
   * @param {string} id - Game ID
   * @param {Object} scores - Scores object
   * @returns {Promise<Game>} Updated game instance
   */
  async updateScores(id, scores) {
    try {
      const response = await api.games.updateScores(id, { scores });
      return serverToClientGame(response.data);
    } catch (error) {
      console.error(`Error updating scores for game ${id}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
const apiGameStorage = new ApiGameStorage();
export default apiGameStorage;
