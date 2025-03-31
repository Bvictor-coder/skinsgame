import api from './api.js';

/**
 * DataSync service for handling data synchronization between localStorage and API
 * during the transition period from client-only to server-based architecture.
 * 
 * This service supports dual-mode operation:
 * 1. localStorage-only mode (legacy)
 * 2. API mode with localStorage backup
 * 3. Hybrid mode where we read from both sources and sync data
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
   * Load data from localStorage
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(this.localStorageKey);
      if (savedData) {
        this.localData = JSON.parse(savedData);
        
        // Ensure proper structure
        if (!this.localData.friends) this.localData.friends = [];
        if (!this.localData.games) this.localData.games = [];
        if (!this.localData.signups) this.localData.signups = {};
        
        console.log('Data loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.localData));
      console.log('Data saved to localStorage');
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
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
      const serverSignups = response.data;
      
      // Convert local signup structure to match server structure
      const localSignupsFlat = [];
      Object.entries(this.localData.signups).forEach(([gameId, signups]) => {
        signups.forEach(signup => {
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
        serverSignups.map(s => `${s.gameId}_${s.playerId}`)
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
      serverSignups.forEach(signup => {
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
   */
  async updateGame(id, gameData) {
    await this.ensureInitialized();
    
    if (this.useApi) {
      try {
        const response = await api.games.update(id, gameData);
        const updatedGame = response.data;
        
        this.localData.games = this.localData.games.map(g => 
          g.id === id ? updatedGame : g
        );
        
        this.saveToLocalStorage();
        return updatedGame;
      } catch (error) {
        console.error('Error updating game on API:', error);
      }
    }
    
    // Update in local storage
    const index = this.localData.games.findIndex(g => g.id === id);
    if (index !== -1) {
      this.localData.games[index] = { ...this.localData.games[index], ...gameData };
      this.saveToLocalStorage();
      return this.localData.games[index];
    }
    
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
}

const dataSync = new DataSyncService();

export default dataSync;
