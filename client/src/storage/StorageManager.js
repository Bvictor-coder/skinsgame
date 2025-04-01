/**
 * Storage Manager
 * 
 * Manages multiple storage implementations and decides which one to use based on
 * environment settings, network availability, and user preferences.
 */

import localGameStorage from './GameStorage';
import apiGameStorage from './ApiGameStorage';

/**
 * Storage mode constants
 */
export const STORAGE_MODES = {
  LOCAL: 'local',
  API: 'api',
  HYBRID: 'hybrid'
};

/**
 * Storage manager class
 */
class StorageManager {
  constructor() {
    // Default to HYBRID mode
    this.mode = process.env.REACT_APP_STORAGE_MODE || STORAGE_MODES.HYBRID;
    
    // Track API availability
    this.apiAvailable = true;
    
    // Initialize the appropriate storage
    this.localStorage = localGameStorage;
    this.apiStorage = apiGameStorage;
  }
  
  /**
   * Set storage mode
   * @param {string} mode - Storage mode from STORAGE_MODES
   */
  setMode(mode) {
    if (Object.values(STORAGE_MODES).includes(mode)) {
      this.mode = mode;
    } else {
      console.warn(`Invalid storage mode: ${mode}. Using HYBRID mode.`);
      this.mode = STORAGE_MODES.HYBRID;
    }
  }
  
  /**
   * Check if API is available
   * @returns {Promise<boolean>} True if API is available
   */
  async checkApiAvailability() {
    try {
      // Simple fetch to check if API is available
      await this.apiStorage.getAll();
      this.apiAvailable = true;
      return true;
    } catch (error) {
      console.warn('API is not available, falling back to local storage');
      this.apiAvailable = false;
      return false;
    }
  }
  
  /**
   * Get the appropriate storage implementation
   * @returns {Object} Storage implementation to use
   */
  getStorage() {
    // In API mode, still fall back to local if API is not available
    if (this.mode === STORAGE_MODES.API) {
      return this.apiAvailable ? this.apiStorage : this.localStorage;
    }
    
    // In LOCAL mode, always use local storage
    if (this.mode === STORAGE_MODES.LOCAL) {
      return this.localStorage;
    }
    
    // In HYBRID mode, prefer API if available
    return this.apiAvailable ? this.apiStorage : this.localStorage;
  }
  
  /**
   * Get all games
   * @returns {Promise<Game[]>} Array of Game instances
   */
  async getAll() {
    // In HYBRID mode, try API first, then local if API fails
    if (this.mode === STORAGE_MODES.HYBRID) {
      try {
        if (this.apiAvailable) {
          const games = await this.apiStorage.getAll();
          // Backup to local storage
          await this.localStorage.saveMany(games);
          return games;
        }
      } catch (error) {
        console.warn('API fetch failed, falling back to local storage');
        this.apiAvailable = false;
      }
      
      return this.localStorage.getAll();
    }
    
    // For API or LOCAL mode, use the appropriate storage
    return this.getStorage().getAll();
  }
  
  /**
   * Get a game by ID
   * @param {string} id - Game ID
   * @returns {Promise<Game|null>} Game instance or null if not found
   */
  async getById(id) {
    // In HYBRID mode, try API first, then local if API fails
    if (this.mode === STORAGE_MODES.HYBRID) {
      try {
        if (this.apiAvailable) {
          const game = await this.apiStorage.getById(id);
          if (game) {
            // Backup to local storage
            await this.localStorage.save(game);
            return game;
          }
        }
      } catch (error) {
        console.warn(`API fetch for game ${id} failed, falling back to local storage`);
        this.apiAvailable = false;
      }
      
      return this.localStorage.getById(id);
    }
    
    // For API or LOCAL mode, use the appropriate storage
    return this.getStorage().getById(id);
  }
  
  /**
   * Save a game
   * @param {Game} game - Game instance to save
   * @returns {Promise<Game>} Saved game instance
   */
  async save(game) {
    // In HYBRID mode, save to both API and local
    if (this.mode === STORAGE_MODES.HYBRID) {
      try {
        if (this.apiAvailable) {
          const savedGame = await this.apiStorage.save(game);
          // Backup to local storage
          await this.localStorage.save(savedGame);
          return savedGame;
        }
      } catch (error) {
        console.warn(`API save failed, falling back to local storage: ${error.message}`);
        this.apiAvailable = false;
      }
      
      return this.localStorage.save(game);
    }
    
    // For API or LOCAL mode, use the appropriate storage
    return this.getStorage().save(game);
  }
  
  /**
   * Save multiple games
   * @param {Game[]} games - Array of Game instances to save
   * @returns {Promise<Game[]>} Saved game instances
   */
  async saveMany(games) {
    // In HYBRID mode, save to both API and local
    if (this.mode === STORAGE_MODES.HYBRID) {
      try {
        if (this.apiAvailable) {
          const savedGames = await this.apiStorage.saveMany(games);
          // Backup to local storage
          await this.localStorage.saveMany(savedGames);
          return savedGames;
        }
      } catch (error) {
        console.warn(`API batch save failed, falling back to local storage: ${error.message}`);
        this.apiAvailable = false;
      }
      
      return this.localStorage.saveMany(games);
    }
    
    // For API or LOCAL mode, use the appropriate storage
    return this.getStorage().saveMany(games);
  }
  
  /**
   * Delete a game
   * @param {string} id - Game ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    // In HYBRID mode, delete from both API and local
    if (this.mode === STORAGE_MODES.HYBRID) {
      let apiSuccess = true;
      
      try {
        if (this.apiAvailable) {
          apiSuccess = await this.apiStorage.delete(id);
        }
      } catch (error) {
        console.warn(`API delete failed, falling back to local delete: ${error.message}`);
        this.apiAvailable = false;
        apiSuccess = false;
      }
      
      const localSuccess = await this.localStorage.delete(id);
      
      // If either succeeded, consider it successful
      return apiSuccess || localSuccess;
    }
    
    // For API or LOCAL mode, use the appropriate storage
    return this.getStorage().delete(id);
  }
  
  /**
   * Create a backup of all data
   * @returns {Promise<Object>} Backup data object
   */
  async createBackup() {
    // Always use local storage for backup
    return this.localStorage.createBackup();
  }
  
  /**
   * Restore from a backup
   * @param {Object} backupData - Backup data object
   * @returns {Promise<boolean>} True if restored successfully
   */
  async restoreFromBackup(backupData) {
    // Always restore to local storage first
    const success = await this.localStorage.restoreFromBackup(backupData);
    
    // If in HYBRID or API mode and API is available, also sync to API
    if ((this.mode === STORAGE_MODES.HYBRID || this.mode === STORAGE_MODES.API) && this.apiAvailable) {
      try {
        // Get all games from local storage
        const games = await this.localStorage.getAll();
        
        // Save them to the API
        await this.apiStorage.saveMany(games);
      } catch (error) {
        console.warn(`Failed to sync restored data to API: ${error.message}`);
        this.apiAvailable = false;
      }
    }
    
    return success;
  }
  
  /**
   * Sync data between local storage and API
   * @returns {Promise<boolean>} True if sync was successful
   */
  async syncData() {
    // If API is not available or we're in LOCAL mode, no need to sync
    if (!this.apiAvailable || this.mode === STORAGE_MODES.LOCAL) {
      return false;
    }
    
    try {
      // Get all games from both storages
      const localGames = await this.localStorage.getAll();
      const apiGames = await this.apiStorage.getAll();
      
      // Create maps for easy lookups
      const localGamesMap = new Map(localGames.map(game => [game.id, game]));
      const apiGamesMap = new Map(apiGames.map(game => [game.id, game]));
      
      // Find games that are in local but not in API
      const localOnlyGames = localGames.filter(game => !apiGamesMap.has(game.id));
      
      // Find games that are in API but not in local
      const apiOnlyGames = apiGames.filter(game => !localGamesMap.has(game.id));
      
      // Find games that are in both, but check timestamps
      const commonGames = localGames.filter(game => apiGamesMap.has(game.id));
      const updatedLocalGames = commonGames.filter(localGame => {
        const apiGame = apiGamesMap.get(localGame.id);
        const localUpdated = new Date(localGame.updatedAt || localGame.createdAt);
        const apiUpdated = new Date(apiGame.updatedAt || apiGame.createdAt);
        return localUpdated > apiUpdated;
      });
      
      const updatedApiGames = apiGames.filter(apiGame => {
        const localGame = localGamesMap.get(apiGame.id);
        if (!localGame) return false;
        
        const localUpdated = new Date(localGame.updatedAt || localGame.createdAt);
        const apiUpdated = new Date(apiGame.updatedAt || apiGame.createdAt);
        return apiUpdated > localUpdated;
      });
      
      // Sync local-only games to API
      if (localOnlyGames.length > 0) {
        await this.apiStorage.saveMany(localOnlyGames);
      }
      
      // Sync API-only games to local
      if (apiOnlyGames.length > 0) {
        await this.localStorage.saveMany(apiOnlyGames);
      }
      
      // Sync updated local games to API
      if (updatedLocalGames.length > 0) {
        await this.apiStorage.saveMany(updatedLocalGames);
      }
      
      // Sync updated API games to local
      if (updatedApiGames.length > 0) {
        await this.localStorage.saveMany(updatedApiGames);
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      this.apiAvailable = false;
      return false;
    }
  }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;
