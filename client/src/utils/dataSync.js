import api from './api.js';
import { 
  debugLogger, 
  storageMonitor, 
  dataValidator, 
  lifecycleTracer, 
  initializeDebugDashboard 
} from './debugTools.js';

/**
 * DataSync service for handling data synchronization between localStorage and API
 * during the transition period from client-only to server-based architecture.
 * 
 * This service supports dual-mode operation:
 * 1. localStorage-only mode (legacy)
 * 2. API mode with localStorage backup
 * 3. Hybrid mode where we read from both sources and sync data
 * 
 * Enhanced with debugging and validation to track data issues.
 */
class DataSyncService {
  constructor() {
    this.useApi = process.env.REACT_APP_USE_API === 'true';
    this.localStorageKey = 'golfSkinsOrganizer';
    this.localData = { 
      friends: [], 
      games: [], 
      signups: {} 
    };
    this.initialized = false;
    
    // Track operating mode
    debugLogger.log('DATASYNC', `Initialized in ${this.useApi ? 'API+localStorage' : 'localStorage-only'} mode`);
    
    // Initialize debug dashboard in development
    if (process.env.NODE_ENV !== 'production') {
      initializeDebugDashboard();
      debugLogger.log('DATASYNC', 'Debug dashboard initialized');
    }
  }

  /**
   * Initialize the service by loading data from localStorage
   */
  async initialize() {
    if (this.initialized) return;

    // Load data from localStorage first
    this.loadFromLocalStorage();
    
    // If API is enabled, try to sync with server
    if (this.useApi) {
      try {
        await this.syncWithServer();
        console.log('Initial sync with server completed');
      } catch (error) {
        console.error('Error during initial sync with server:', error);
      }
    }
    
    this.initialized = true;
    return this.localData;
  }

  /**
   * Load data from localStorage with safety checks for SSR environments
   * Enhanced with validation and error recovery
   */
  loadFromLocalStorage() {
    try {
      // Check if localStorage is available (this prevents SSR errors)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedData = localStorage.getItem(this.localStorageKey);
        
        debugLogger.log('DATASYNC:LOAD', 'Attempting to load data from localStorage');
        
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            storageMonitor.trackLoad(this.localStorageKey, parsedData);
            
            // Validate structure and recover if needed
            const validatedData = this.validateAndRecoverData(parsedData);
            this.localData = validatedData;
            
            debugLogger.log('DATASYNC:LOAD', `Successfully loaded data with ${this.localData.games.length} games, ${this.localData.friends.length} friends`);
          } catch (parseError) {
            debugLogger.error('DATASYNC:LOAD', 'Error parsing localStorage JSON:', parseError);
            // Recovery: keep default empty data structure
            debugLogger.warn('DATASYNC:LOAD', 'Using default empty data structure due to parsing error');
          }
        } else {
          debugLogger.warn('DATASYNC:LOAD', 'No data found in localStorage, using default empty structure');
        }
      } else {
        debugLogger.log('DATASYNC:LOAD', 'localStorage not available (possible SSR), using default data structure');
      }
    } catch (error) {
      debugLogger.error('DATASYNC:LOAD', 'Critical error in loadFromLocalStorage:', error);
    }
  }
  
  /**
   * Validate loaded data and recover from common issues
   */
  validateAndRecoverData(data) {
    debugLogger.log('DATASYNC:VALIDATE', 'Validating loaded data structure');
    
    // Start with a good default structure
    const validData = {
      friends: [],
      games: [],
      signups: {}
    };
    
    // Check and recover friends array
    if (Array.isArray(data.friends)) {
      validData.friends = data.friends.filter(friend => {
        const isValid = dataValidator.validateFriend(friend);
        if (!isValid) {
          debugLogger.warn('DATASYNC:VALIDATE', `Filtered out invalid friend object:`, friend);
        }
        return isValid;
      });
      debugLogger.log('DATASYNC:VALIDATE', `Validated ${validData.friends.length} friends`);
    } else {
      debugLogger.warn('DATASYNC:VALIDATE', 'Friends data is not an array or is missing, using empty array');
    }
    
    // Check and recover games array
    if (Array.isArray(data.games)) {
      validData.games = data.games.filter(game => {
        // Add missing fields to prevent errors
        if (!game.scores) {
          game.scores = { raw: [] };
          debugLogger.warn('DATASYNC:VALIDATE', `Added missing scores object to game ${game.id}`);
        }
        
        const isValid = dataValidator.validateGame(game);
        if (!isValid) {
          debugLogger.warn('DATASYNC:VALIDATE', `Filtered out invalid game object:`, game);
        }
        return isValid;
      });
      debugLogger.log('DATASYNC:VALIDATE', `Validated ${validData.games.length} games`);
    } else {
      debugLogger.warn('DATASYNC:VALIDATE', 'Games data is not an array or is missing, using empty array');
    }
    
    // Check and recover signups object
    if (data.signups && typeof data.signups === 'object') {
      // Copy valid signups
      Object.entries(data.signups).forEach(([gameId, signupsList]) => {
        if (Array.isArray(signupsList)) {
          validData.signups[gameId] = signupsList.filter(signup => {
            const isValid = dataValidator.validateSignup(signup, gameId);
            if (!isValid) {
              debugLogger.warn('DATASYNC:VALIDATE', `Filtered out invalid signup for game ${gameId}:`, signup);
            }
            return isValid;
          });
        } else {
          debugLogger.warn('DATASYNC:VALIDATE', `Signups for game ${gameId} is not an array, skipping`);
        }
      });
    } else {
      debugLogger.warn('DATASYNC:VALIDATE', 'Signups data is not an object or is missing, using empty object');
    }
    
    return validData;
  }

  /**
   * Save data to localStorage with safety checks for SSR environments
   * Enhanced with pre-save validation and error handling
   */
  saveToLocalStorage() {
    try {
      // Check if localStorage is available (this prevents SSR errors)
      if (typeof window !== 'undefined' && window.localStorage) {
        debugLogger.log('DATASYNC:SAVE', 'Preparing to save data to localStorage');
        
        // Validate data before saving to prevent corruption
        const games = this.localData.games || [];
        const friends = this.localData.friends || [];
        const signups = this.localData.signups || {};
        
        // Check if we have valid game objects
        games.forEach(game => {
          if (!dataValidator.validateGame(game)) {
            debugLogger.warn('DATASYNC:SAVE', `Game ${game.id} failed validation but will be saved anyway:`, game);
          }
        });
        
        // Log storage operation details
        storageMonitor.trackSave(this.localStorageKey, this.localData);
        
        // Actual save
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.localData));
        debugLogger.log('DATASYNC:SAVE', `Saved ${games.length} games, ${friends.length} friends to localStorage`);
      } else {
        debugLogger.log('DATASYNC:SAVE', 'localStorage not available (possible SSR), data not saved');
      }
    } catch (error) {
      debugLogger.error('DATASYNC:SAVE', 'Error saving data to localStorage:', error);
      // Attempt recovery - store in sessionStorage as backup if available
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('golfSkins_emergency_backup', JSON.stringify(this.localData));
          debugLogger.warn('DATASYNC:SAVE', 'Created emergency backup in sessionStorage after localStorage save failure');
        }
      } catch (backupErr) {
        debugLogger.error('DATASYNC:SAVE', 'Failed to create emergency backup:', backupErr);
      }
    }
  }

  /**
   * Sync data with server
   * This is a comprehensive sync that will migrate local-only data to the server
   */
  async syncWithServer() {
    if (!this.useApi) return;

    // Sync friends first
    await this.syncFriends();
    
    // Sync games
    await this.syncGames();
    
    // Sync signups
    await this.syncSignups();
    
    // Save updated local data
    this.saveToLocalStorage();
  }

  /**
   * Sync friends with the server
   */
  async syncFriends() {
    try {
      // Get all friends from server
      const response = await api.friends.getAll();
      const serverFriends = response.data;
      
      // Map server friends by email for easy lookup
      const serverFriendsByEmail = serverFriends.reduce((map, friend) => {
        map[friend.email.toLowerCase()] = friend;
        return map;
      }, {});
      
      // Find local-only friends that need to be created on server
      const localOnlyFriends = this.localData.friends.filter(
        f => !serverFriendsByEmail[f.email.toLowerCase()]
      );
      
      // Create local-only friends on server
      for (const friend of localOnlyFriends) {
        try {
          const resp = await api.friends.create({
            name: friend.name,
            email: friend.email,
            handicap: friend.handicap
          });
          
          // Update local ID to match server ID
          const oldId = friend.id;
          friend.id = resp.data.id;
          
          // Update any references to this friend in signups
          this.updateFriendReferences(oldId, friend.id);
          
          console.log(`Friend ${friend.name} created on server with ID ${friend.id}`);
        } catch (error) {
          console.error(`Error creating friend ${friend.name} on server:`, error);
        }
      }
      
      // Update local friends with data from server
      this.localData.friends = serverFriends;
    } catch (error) {
      console.error('Error syncing friends with server:', error);
    }
  }

  /**
   * Sync games with the server
   */
  async syncGames() {
    try {
      // Get all games from server
      const response = await api.games.getAll();
      const serverGames = response.data;
      
      // Map server games by unique properties for matching
      const serverGamesMap = serverGames.reduce((map, game) => {
        const key = `${game.course}_${game.date}`;
        map[key] = game;
        return map;
      }, {});
      
      // Find local-only games that need to be created on server
      const localOnlyGames = this.localData.games.filter(game => {
        const key = `${game.course}_${game.date}`;
        return !serverGamesMap[key];
      });
      
      // Create local-only games on server
      for (const game of localOnlyGames) {
        try {
          const resp = await api.games.create({
            date: game.date,
            time: game.time,
            course: game.course,
            holes: game.holes,
            ctpHole: game.ctpHole,
            entryFee: game.entryFee,
            signupDeadline: game.signupDeadline,
            wolfEnabled: game.wolfEnabled,
            notes: game.notes,
            status: game.status,
            groups: game.groups
          });
          
          // Update local ID to match server ID
          const oldId = game.id;
          game.id = resp.data.id;
          
          // Update any references to this game in signups
          this.updateGameReferences(oldId, game.id);
          
          console.log(`Game ${game.course} on ${game.date} created on server with ID ${game.id}`);
        } catch (error) {
          console.error(`Error creating game ${game.course} on server:`, error);
        }
      }
      
      // Update local games with data from server
      this.localData.games = serverGames;
    } catch (error) {
      console.error('Error syncing games with server:', error);
    }
  }

  /**
   * Sync signups with the server
   */
  async syncSignups() {
    try {
      // Get all signups from server
      const response = await api.signups.getAll();
      const serverSignupsData = response.data;
      
      // Convert local signup structure to match server structure
      const localSignupsFlat = [];
      Object.entries(this.localData.signups || {}).forEach(([gameId, gameSignups]) => {
        gameSignups.forEach(signup => {
          localSignupsFlat.push({
            gameId,
            playerId: signup.playerId,
            wolf: signup.wolf || false,
            notes: signup.notes || ''
          });
        });
      });
      
      // Find local signups not on server
      const serverSignupKeys = new Set(
        serverSignupsData.map(s => `${s.gameId}_${s.playerId}`)
      );
      
      const localOnlySignups = localSignupsFlat.filter(signup => {
        return !serverSignupKeys.has(`${signup.gameId}_${signup.playerId}`);
      });
      
      // Create local-only signups on server
      for (const signup of localOnlySignups) {
        try {
          await api.signups.create(signup);
          console.log(`Signup for player ${signup.playerId} in game ${signup.gameId} created on server`);
        } catch (error) {
          console.error(`Error creating signup on server:`, error);
        }
      }
      
      // Prepare new structure for local signups
      const newSignups = {};
      serverSignupsData.forEach(signup => {
        if (!newSignups[signup.gameId]) {
          newSignups[signup.gameId] = [];
        }
        
        newSignups[signup.gameId].push({
          playerId: signup.playerId,
          wolf: signup.wolf,
          notes: signup.notes,
          id: signup.id // keep server ID
        });
      });
      
      // Update local signups with data from server
      this.localData.signups = newSignups;
    } catch (error) {
      console.error('Error syncing signups with server:', error);
    }
  }

  /**
   * Update friend ID references in signups
   */
  updateFriendReferences(oldId, newId) {
    Object.keys(this.localData.signups).forEach(gameId => {
      this.localData.signups[gameId].forEach(signup => {
        if (signup.playerId === oldId) {
          signup.playerId = newId;
        }
      });
    });
    
    // Update in game groups too
    this.localData.games.forEach(game => {
      if (game.groups && game.groups.length) {
        game.groups.forEach(group => {
          if (group.playerIds && group.playerIds.length) {
            group.playerIds = group.playerIds.map(id => id === oldId ? newId : id);
          }
          if (group.scorekeeperId === oldId) {
            group.scorekeeperId = newId;
          }
        });
      }
    });
  }

  /**
   * Update game ID references in signups
   */
  updateGameReferences(oldId, newId) {
    if (this.localData.signups[oldId]) {
      this.localData.signups[newId] = this.localData.signups[oldId];
      delete this.localData.signups[oldId];
    }
  }

  // --- API methods that match the current app interface ---

  /**
   * Get all friends
   */
  async getFriends() {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.friends.getAll();
        this.localData.friends = response.data;
        this.saveToLocalStorage();
      } catch (error) {
        console.error('Error fetching friends from API, using local data:', error);
      }
    }
    
    return this.localData.friends;
  }

  /**
   * Add a friend
   */
  async addFriend(friend) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.friends.create(friend);
        const newFriend = response.data;
        this.localData.friends.push(newFriend);
        this.saveToLocalStorage();
        return newFriend;
      } catch (error) {
        console.error('Error adding friend to API:', error);
        
        // Fall back to local storage only if API fails
        const localFriend = { ...friend, id: Date.now().toString() };
        this.localData.friends.push(localFriend);
        this.saveToLocalStorage();
        return localFriend;
      }
    } else {
      // Local storage only mode
      const newFriend = { ...friend, id: Date.now().toString() };
      this.localData.friends.push(newFriend);
      this.saveToLocalStorage();
      return newFriend;
    }
  }

  /**
   * Update a friend
   */
  async updateFriend(id, friendData) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.friends.update(id, friendData);
        const updatedFriend = response.data;
        
        this.localData.friends = this.localData.friends.map(f => 
          f.id === id ? updatedFriend : f
        );
        
        this.saveToLocalStorage();
        return updatedFriend;
      } catch (error) {
        console.error('Error updating friend on API:', error);
      }
    }
    
    // Update in local storage
    const index = this.localData.friends.findIndex(f => f.id === id);
    if (index !== -1) {
      this.localData.friends[index] = { ...this.localData.friends[index], ...friendData };
      this.saveToLocalStorage();
      return this.localData.friends[index];
    }
    
    return null;
  }

  /**
   * Delete a friend
   */
  async deleteFriend(id) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        await api.friends.delete(id);
      } catch (error) {
        console.error('Error deleting friend from API:', error);
      }
    }
    
    // Delete from local storage regardless of API success
    this.localData.friends = this.localData.friends.filter(f => f.id !== id);
    this.saveToLocalStorage();
  }
  
  /**
   * Delete a game
   */
  async deleteGame(id) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        await api.games.delete(id);
      } catch (error) {
        console.error('Error deleting game from API:', error);
      }
    }
    
    // Delete from local storage regardless of API success
    this.localData.games = this.localData.games.filter(g => g.id !== id);
    
    // Also clean up any signups for this game
    if (this.localData.signups && this.localData.signups[id]) {
      delete this.localData.signups[id];
    }
    
    this.saveToLocalStorage();
    return true; // Indicate success
  }

  /**
   * Get all games
   */
  async getGames() {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.games.getAll();
        this.localData.games = response.data;
        this.saveToLocalStorage();
      } catch (error) {
        console.error('Error fetching games from API, using local data:', error);
      }
    }
    
    return this.localData.games;
  }

  /**
   * Add a game
   */
  async addGame(game) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.games.create(game);
        const newGame = response.data;
        this.localData.games.push(newGame);
        this.localData.signups[newGame.id] = [];
        this.saveToLocalStorage();
        return newGame;
      } catch (error) {
        console.error('Error adding game to API:', error);
        
        // Fall back to local storage only if API fails
        const localGame = { ...game, id: Date.now().toString() };
        this.localData.games.push(localGame);
        this.localData.signups[localGame.id] = [];
        this.saveToLocalStorage();
        return localGame;
      }
    } else {
      // Local storage only mode
      const newGame = { ...game, id: Date.now().toString() };
      this.localData.games.push(newGame);
      this.localData.signups[newGame.id] = [];
      this.saveToLocalStorage();
      return newGame;
    }
  }

  /**
   * Update a game
   * This method handles both full game objects and partial updates
   * Enhanced with lifecycle tracking and validation
   */
  async updateGame(gameOrId, gameData) {
    await this.ensureInitialized();
    
    // Handle the case where a full game object is passed
    let id, updateData;
    
    if (typeof gameOrId === 'object' && gameOrId !== null) {
      // Full game object passed
      id = gameOrId.id;
      updateData = gameOrId;
    } else {
      // ID and partial update data passed
      id = gameOrId;
      updateData = gameData;
    }

    if (!id) {
      debugLogger.error('DATASYNC:UPDATE_GAME', 'Cannot update game: No ID provided');
      return null;
    }
    
    debugLogger.group('DATASYNC:UPDATE_GAME', `Updating game ${id}`);
    
    if (this.useApi) {
      try {
        debugLogger.log('DATASYNC:UPDATE_GAME', 'Updating game using API');
        const response = await api.games.update(id, updateData);
        const updatedGame = response.data;
        
        this.localData.games = this.localData.games.map(g => 
          g.id === id ? updatedGame : g
        );
        
        this.saveToLocalStorage();
        debugLogger.log('DATASYNC:UPDATE_GAME', 'Game updated successfully via API');
        debugLogger.groupEnd();
        return updatedGame;
      } catch (error) {
        debugLogger.error('DATASYNC:UPDATE_GAME', 'Error updating game on API:', error);
      }
    }
    
    // Update in local storage
    const index = this.localData.games.findIndex(g => g.id === id);
    if (index !== -1) {
      const oldGame = {...this.localData.games[index]};
      const oldStatus = oldGame.status;
      
      // Create updated game
      const updatedGame = { ...oldGame, ...updateData };
      
      // Ensure scores object is properly structured
      if (!updatedGame.scores) {
        updatedGame.scores = { raw: [] };
      }
      
      // Track lifecycle status changes
      if (updateData.status && updateData.status !== oldStatus) {
        debugLogger.log('DATASYNC:UPDATE_GAME', `Status change detected: ${oldStatus} -> ${updateData.status}`);
        lifecycleTracer.traceStateChange(id, oldStatus, updateData.status);
        
        // Add transition timestamp
        const timestamp = new Date().toISOString();
        
          switch (updateData.status) {
          case 'created':
            updatedGame.createdAt = timestamp;
            break;
          case 'open':
            updatedGame.openedAt = timestamp;
            break;
          case 'enrollment_complete':
            updatedGame.enrollmentCompletedAt = timestamp;
            break;
          case 'in_progress':
            updatedGame.startedAt = timestamp;
            break;
          case 'completed':
            updatedGame.completedAt = timestamp;
            break;
          case 'finalized':
            updatedGame.finalizedAt = timestamp;
            break;
          default:
            // No special handling for other statuses
            break;
        }
      }
      
      // Special handling for calculated scores
      if (oldGame.scores && oldGame.scores.calculated && 
          (!updateData.scores || !updateData.scores.calculated)) {
        debugLogger.log('DATASYNC:UPDATE_GAME', 'Preserving calculated scores during update');
        if (!updatedGame.scores) updatedGame.scores = {};
        updatedGame.scores.calculated = oldGame.scores.calculated;
      }
      
      // Validate the game before saving
      if (!dataValidator.validateGame(updatedGame)) {
        debugLogger.warn('DATASYNC:UPDATE_GAME', 'Updated game failed validation but will be saved:', updatedGame);
      }
      
      // Update the game in the array
      this.localData.games[index] = updatedGame;
      
      // Save changes to localStorage
      this.saveToLocalStorage();
      
      debugLogger.log('DATASYNC:UPDATE_GAME', `Game ${id} successfully updated in localStorage`);
      
      // Display updated lifecycle history
      lifecycleTracer.displayLifecycleHistory(updatedGame);
      
      debugLogger.groupEnd();
      return updatedGame;
    }
    
    debugLogger.error('DATASYNC:UPDATE_GAME', `Game with ID ${id} not found in local storage`);
    debugLogger.groupEnd();
    return null;
  }

  /**
   * Get signups for a game
   */
  async getSignups(gameId) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.signups.getByGameId(gameId);
        
        // Convert server format to local format
        const signups = response.data.map(s => ({
          playerId: s.playerId,
          wolf: s.wolf,
          notes: s.notes
        }));
        
        this.localData.signups[gameId] = signups;
        this.saveToLocalStorage();
      } catch (error) {
        console.error(`Error fetching signups for game ${gameId} from API:`, error);
      }
    }
    
    return this.localData.signups[gameId] || [];
  }

  /**
   * Add a signup
   */
  async addSignup(gameId, signup) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.signups.create({
          gameId,
          playerId: signup.playerId,
          wolf: signup.wolf || false,
          notes: signup.notes || '',
          lateAddition: signup.lateAddition || false,
          lateReason: signup.lateReason || '',
          startingPosition: signup.startingPosition || 'A'
        });
        
        const newSignup = {
          playerId: response.data.playerId,
          wolf: response.data.wolf,
          notes: response.data.notes,
          lateAddition: response.data.lateAddition,
          lateReason: response.data.lateReason,
          startingPosition: response.data.startingPosition
        };
        
        if (!this.localData.signups[gameId]) {
          this.localData.signups[gameId] = [];
        }
        
        this.localData.signups[gameId].push(newSignup);
        this.saveToLocalStorage();
        return newSignup;
      } catch (error) {
        console.error('Error adding signup to API:', error);
      }
    }
    
    // Local storage operation
    if (!this.localData.signups[gameId]) {
      this.localData.signups[gameId] = [];
    }
    
    this.localData.signups[gameId].push(signup);
    this.saveToLocalStorage();
    return signup;
  }

  /**
   * Ensure the service is initialized before use
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the current user information from localStorage
   * Used for determining if the current user is a scorekeeper, etc.
   */
  getCurrentUser() {
    // Safety check for SSR/browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    try {
      const userData = localStorage.getItem('golfSkinsUser');
      if (!userData) return null;
      
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error retrieving current user data:', error);
      return null;
    }
  }
}

const dataSync = new DataSyncService();

export default dataSync;
