/**
 * Game Storage Adapter
 * 
 * Handles persistence of Game objects to localStorage.
 */

import Game from '../models/Game';

class GameStorage {
  /**
   * Initialize the storage adapter
   * @param {string} storageKey - Key to use for localStorage (optional)
   */
  constructor(storageKey = 'golfSkinsOrganizer') {
    this.storageKey = storageKey;
  }
  
  /**
   * Get all games from storage
   * @returns {Promise<Game[]>} Array of Game instances
   */
  async getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      const gamesData = parsedData.games || [];
      
      // Convert to Game instances
      return gamesData.map(game => Game.fromJSON(game));
    } catch (error) {
      console.error('Error loading games from storage:', error);
      return [];
    }
  }
  
  /**
   * Get a game by ID
   * @param {string} id - Game ID
   * @returns {Promise<Game|null>} Game instance or null if not found
   */
  async getById(id) {
    try {
      const games = await this.getAll();
      const gameData = games.find(g => g.id === id);
      return gameData || null;
    } catch (error) {
      console.error(`Error getting game ${id} from storage:`, error);
      return null;
    }
  }
  
  /**
   * Save a game to storage
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
      // Get existing data
      const data = localStorage.getItem(this.storageKey);
      const parsedData = data ? JSON.parse(data) : { games: [], friends: [], signups: {} };
      
      // Find and update the game if it exists, otherwise add it
      const gameIndex = parsedData.games.findIndex(g => g.id === gameInstance.id);
      
      if (gameIndex !== -1) {
        parsedData.games[gameIndex] = gameInstance.toJSON();
      } else {
        parsedData.games.push(gameInstance.toJSON());
      }
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(parsedData));
      
      return gameInstance;
    } catch (error) {
      console.error('Error saving game to storage:', error);
      throw new Error(`Failed to save game: ${error.message}`);
    }
  }
  
  /**
   * Save multiple games at once
   * @param {Game[]} games - Array of Game instances to save
   * @returns {Promise<Game[]>} Saved game instances
   * @throws {Error} If validation fails or save fails
   */
  async saveMany(games) {
    try {
      // Get existing data
      const data = localStorage.getItem(this.storageKey);
      const parsedData = data ? JSON.parse(data) : { games: [], friends: [], signups: {} };
      
      // Create a map of existing games by ID for quick lookup
      const existingGamesMap = new Map(
        parsedData.games.map(g => [g.id, g])
      );
      
      // Process each game
      const processedGames = [];
      
      for (const game of games) {
        // Ensure we have a Game instance
        const gameInstance = game instanceof Game ? game : Game.fromJSON(game);
        
        // Validate game
        const validation = gameInstance.validate();
        if (!validation.isValid) {
          throw new Error(`Invalid game ${gameInstance.id}: ${validation.errors.join(', ')}`);
        }
        
        // Update map with new game data
        existingGamesMap.set(gameInstance.id, gameInstance.toJSON());
        processedGames.push(gameInstance);
      }
      
      // Convert map back to array
      parsedData.games = Array.from(existingGamesMap.values());
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(parsedData));
      
      return processedGames;
    } catch (error) {
      console.error('Error saving multiple games to storage:', error);
      throw new Error(`Failed to save games: ${error.message}`);
    }
  }
  
  /**
   * Delete a game from storage
   * @param {string} id - Game ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    try {
      // Get existing data
      const data = localStorage.getItem(this.storageKey);
      if (!data) return false;
      
      const parsedData = JSON.parse(data);
      
      // Check if game exists
      const initialLength = parsedData.games.length;
      
      // Filter out the game to delete
      parsedData.games = parsedData.games.filter(g => g.id !== id);
      
      // If no game was removed, return false
      if (parsedData.games.length === initialLength) {
        return false;
      }
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(parsedData));
      
      return true;
    } catch (error) {
      console.error(`Error deleting game ${id} from storage:`, error);
      return false;
    }
  }
  
  /**
   * Delete all games from storage
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteAll() {
    try {
      // Get existing data
      const data = localStorage.getItem(this.storageKey);
      if (!data) return true;
      
      const parsedData = JSON.parse(data);
      
      // Clear games array
      parsedData.games = [];
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(parsedData));
      
      return true;
    } catch (error) {
      console.error('Error deleting all games from storage:', error);
      return false;
    }
  }
  
  /**
   * Create a backup of all data
   * @returns {Promise<Object>} Backup data object
   */
  async createBackup() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return { games: [], friends: [], signups: {} };
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }
  
  /**
   * Restore data from a backup
   * @param {Object} backupData - Backup data object
   * @returns {Promise<boolean>} True if restored successfully
   */
  async restoreFromBackup(backupData) {
    try {
      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Invalid backup data');
      }
      
      // Ensure backup has the expected structure
      const sanitizedBackup = {
        games: Array.isArray(backupData.games) ? backupData.games : [],
        friends: Array.isArray(backupData.friends) ? backupData.friends : [],
        signups: backupData.signups && typeof backupData.signups === 'object' ? backupData.signups : {}
      };
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(sanitizedBackup));
      
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }
}

// Export a singleton instance
const gameStorage = new GameStorage();
export default gameStorage;
