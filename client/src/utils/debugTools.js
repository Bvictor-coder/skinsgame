/**
 * Debug Tools for Golf Skins Organizer
 * 
 * This utility provides tools for debugging data persistence issues,
 * monitoring localStorage operations, and validating data integrity.
 */

// Control flag to enable/disable debug features
const DEBUG_ENABLED = true;

// Enable localStorage debug console (only in development)
const STORAGE_DEBUG = true;

// Control detailed validation error logging
const VALIDATION_DEBUG = true;

/**
 * Enhanced console logger with prefixes and conditional execution
 */
const debugLogger = {
  log: (prefix, ...args) => {
    if (DEBUG_ENABLED) {
      console.log(`[${prefix}]`, ...args);
    }
  },
  
  warn: (prefix, ...args) => {
    if (DEBUG_ENABLED) {
      console.warn(`[${prefix}]`, ...args);
    }
  },
  
  error: (prefix, ...args) => {
    if (DEBUG_ENABLED) {
      console.error(`[${prefix}]`, ...args);
    }
  },
  
  group: (prefix, label) => {
    if (DEBUG_ENABLED) {
      console.group(`[${prefix}] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (DEBUG_ENABLED) {
      console.groupEnd();
    }
  },
  
  table: (prefix, data) => {
    if (DEBUG_ENABLED) {
      console.log(`[${prefix}]`);
      console.table(data);
    }
  }
};

/**
 * Monitor localStorage operations
 */
const storageMonitor = {
  /**
   * Track what's being saved to localStorage
   */
  trackSave: (key, data) => {
    if (!STORAGE_DEBUG) return;
    
    debugLogger.group('STORAGE:SAVE', key);
    
    if (typeof data === 'object') {
      debugLogger.log('STORAGE:SAVE', 'Saving object data:');
      debugLogger.table('STORAGE:SAVE', data);
    } else {
      debugLogger.log('STORAGE:SAVE', 'Saving primitive data:', data);
    }
    
    debugLogger.log('STORAGE:SAVE', 'Storage operation timestamp:', new Date().toISOString());
    debugLogger.groupEnd();
  },
  
  /**
   * Track what's being loaded from localStorage
   */
  trackLoad: (key, data) => {
    if (!STORAGE_DEBUG) return;
    
    debugLogger.group('STORAGE:LOAD', key);
    
    if (data) {
      if (typeof data === 'object') {
        debugLogger.log('STORAGE:LOAD', 'Loaded object data:');
        debugLogger.table('STORAGE:LOAD', data);
      } else {
        debugLogger.log('STORAGE:LOAD', 'Loaded primitive data:', data);
      }
    } else {
      debugLogger.warn('STORAGE:LOAD', 'No data found for key:', key);
    }
    
    debugLogger.log('STORAGE:LOAD', 'Storage operation timestamp:', new Date().toISOString());
    debugLogger.groupEnd();
  },
  
  /**
   * Dump the entire localStorage contents for inspection
   */
  dumpStorage: () => {
    if (!STORAGE_DEBUG) return null;
    
    debugLogger.group('STORAGE:DUMP', 'Complete localStorage contents');
    
    try {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          const value = localStorage.getItem(key);
          let parsedValue;
          
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            parsedValue = value; // Not JSON, store as is
          }
          
          storage[key] = parsedValue;
        } catch (e) {
          storage[key] = `[Error reading value: ${e.message}]`;
        }
      }
      
      debugLogger.table('STORAGE:DUMP', storage);
      debugLogger.groupEnd();
      return storage;
    } catch (e) {
      debugLogger.error('STORAGE:DUMP', 'Error accessing localStorage:', e);
      debugLogger.groupEnd();
      return null;
    }
  }
};

/**
 * Data validation utilities
 */
const dataValidator = {
  /**
   * Validate a game object's structure and data integrity
   */
  validateGame: (game) => {
    if (!game) {
      debugLogger.error('VALIDATE:GAME', 'Game object is null or undefined');
      return false;
    }
    
    const errors = [];
    
    // Check required fields
    if (!game.id) errors.push('Missing game ID');
    if (!game.date) errors.push('Missing game date');
    if (!game.courseName && !game.course) errors.push('Missing course info');
    
    // Check status validity
    const validStatuses = ['created', 'open', 'enrollment_complete', 'in_progress', 'completed', 'finalized'];
    if (game.status && !validStatuses.includes(game.status)) {
      errors.push(`Invalid game status: ${game.status}`);
    }
    
    // Check scores structure if it exists
    if (game.scores) {
      if (!game.scores.raw && !Array.isArray(game.scores.raw)) {
        errors.push('Game scores.raw is not an array');
      }
      
      // Check raw scores format if present
      if (game.scores.raw && Array.isArray(game.scores.raw)) {
        game.scores.raw.forEach((playerScore, index) => {
          if (!playerScore.playerId) {
            errors.push(`scores.raw[${index}] missing playerId`);
          }
          if (!playerScore.holes || typeof playerScore.holes !== 'object') {
            errors.push(`scores.raw[${index}] has invalid holes data`);
          }
        });
      }
      
      // Check calculated scores if present
      if (game.scores.calculated) {
        if (!Array.isArray(game.scores.calculated.playerResults)) {
          errors.push('scores.calculated.playerResults is not an array');
        }
        if (!Array.isArray(game.scores.calculated.holeResults)) {
          errors.push('scores.calculated.holeResults is not an array');
        }
      }
    }
    
    // Check groups structure if it exists
    if (game.groups) {
      if (!Array.isArray(game.groups)) {
        errors.push('Game groups is not an array');
      } else {
        game.groups.forEach((group, index) => {
          if (!group.playerIds && !group.players) {
            errors.push(`Group ${index} has no players or playerIds`);
          }
        });
      }
    }
    
    // Log validation results
    if (errors.length > 0) {
      if (VALIDATION_DEBUG) {
        debugLogger.group('VALIDATE:GAME', `Game ID: ${game.id}`);
        debugLogger.error('VALIDATE:GAME', `Found ${errors.length} validation errors:`);
        errors.forEach(err => debugLogger.error('VALIDATE:GAME', `- ${err}`));
        debugLogger.log('VALIDATE:GAME', 'Game object:', game);
        debugLogger.groupEnd();
      }
      return false;
    }
    
    return true;
  },
  
  /**
   * Validate player/friend object
   */
  validateFriend: (friend) => {
    if (!friend) {
      debugLogger.error('VALIDATE:FRIEND', 'Friend object is null or undefined');
      return false;
    }
    
    const errors = [];
    
    // Check required fields
    if (!friend.id) errors.push('Missing friend ID');
    if (!friend.name) errors.push('Missing friend name');
    
    // Check optional fields format if present
    if (friend.handicap !== undefined && typeof friend.handicap !== 'number') {
      errors.push('Handicap is not a number');
    }
    
    if (friend.email && typeof friend.email !== 'string') {
      errors.push('Email is not a string');
    }
    
    // Log validation results
    if (errors.length > 0) {
      if (VALIDATION_DEBUG) {
        debugLogger.group('VALIDATE:FRIEND', `Friend ID: ${friend.id}`);
        debugLogger.error('VALIDATE:FRIEND', `Found ${errors.length} validation errors:`);
        errors.forEach(err => debugLogger.error('VALIDATE:FRIEND', `- ${err}`));
        debugLogger.log('VALIDATE:FRIEND', 'Friend object:', friend);
        debugLogger.groupEnd();
      }
      return false;
    }
    
    return true;
  },
  
  /**
   * Validate signup object
   */
  validateSignup: (signup, gameId) => {
    if (!signup) {
      debugLogger.error('VALIDATE:SIGNUP', 'Signup object is null or undefined');
      return false;
    }
    
    const errors = [];
    
    // Check required fields
    if (!signup.playerId) errors.push('Missing player ID');
    
    // Check optional fields format if present
    if (signup.wolf !== undefined && typeof signup.wolf !== 'boolean') {
      errors.push('Wolf flag is not a boolean');
    }
    
    // Log validation results
    if (errors.length > 0) {
      if (VALIDATION_DEBUG) {
        debugLogger.group('VALIDATE:SIGNUP', `Signup for game: ${gameId}, player: ${signup.playerId}`);
        debugLogger.error('VALIDATE:SIGNUP', `Found ${errors.length} validation errors:`);
        errors.forEach(err => debugLogger.error('VALIDATE:SIGNUP', `- ${err}`));
        debugLogger.log('VALIDATE:SIGNUP', 'Signup object:', signup);
        debugLogger.groupEnd();
      }
      return false;
    }
    
    return true;
  }
};

/**
 * Game lifecycle tracing for debugging
 */
const lifecycleTracer = {
  /**
   * Track a state change in a game's lifecycle
   */
  traceStateChange: (gameId, oldStatus, newStatus) => {
    debugLogger.group('LIFECYCLE', `Game ${gameId} status change: ${oldStatus} -> ${newStatus}`);
    debugLogger.log('LIFECYCLE', `Timestamp: ${new Date().toISOString()}`);
    debugLogger.log('LIFECYCLE', `Callstack: ${new Error().stack.split('\n').slice(2).join('\n')}`);
    debugLogger.groupEnd();
  },
  
  /**
   * Log a game's complete lifecycle history from timestamps
   */
  getLifecycleHistory: (game) => {
    if (!game) return [];
    
    const history = [];
    
    if (game.createdAt) {
      history.push({
        status: 'created',
        timestamp: new Date(game.createdAt),
        formattedTime: new Date(game.createdAt).toLocaleString()
      });
    }
    
    if (game.openedAt) {
      history.push({
        status: 'open',
        timestamp: new Date(game.openedAt),
        formattedTime: new Date(game.openedAt).toLocaleString()
      });
    }
    
    if (game.enrollmentCompletedAt) {
      history.push({
        status: 'enrollment_complete',
        timestamp: new Date(game.enrollmentCompletedAt),
        formattedTime: new Date(game.enrollmentCompletedAt).toLocaleString()
      });
    }
    
    if (game.startedAt) {
      history.push({
        status: 'in_progress',
        timestamp: new Date(game.startedAt),
        formattedTime: new Date(game.startedAt).toLocaleString()
      });
    }
    
    if (game.completedAt) {
      history.push({
        status: 'completed',
        timestamp: new Date(game.completedAt),
        formattedTime: new Date(game.completedAt).toLocaleString()
      });
    }
    
    if (game.finalizedAt) {
      history.push({
        status: 'finalized',
        timestamp: new Date(game.finalizedAt),
        formattedTime: new Date(game.finalizedAt).toLocaleString()
      });
    }
    
    // Sort by timestamp
    history.sort((a, b) => a.timestamp - b.timestamp);
    
    return history;
  },
  
  /**
   * Display a game's lifecycle history in the console
   */
  displayLifecycleHistory: (game) => {
    if (!game) {
      debugLogger.error('LIFECYCLE', 'Cannot display history for null game');
      return;
    }
    
    const history = lifecycleTracer.getLifecycleHistory(game);
    
    debugLogger.group('LIFECYCLE', `Game ${game.id} lifecycle history`);
    
    if (history.length === 0) {
      debugLogger.warn('LIFECYCLE', 'No lifecycle timestamps found for this game');
    } else {
      history.forEach((entry, index) => {
        debugLogger.log('LIFECYCLE', `${index + 1}. ${entry.status} - ${entry.formattedTime}`);
      });
    }
    
    // Also log the current status
    debugLogger.log('LIFECYCLE', `Current status: ${game.status || 'unknown'}`);
    
    debugLogger.groupEnd();
  }
};

// Debug Dashboard for the browser console
const initializeDebugDashboard = () => {
  if (!DEBUG_ENABLED) return;
  
  // Attach utilities to window for console access
  if (typeof window !== 'undefined') {
    window.GolfSkinsDebug = {
      dumpStorage: storageMonitor.dumpStorage,
      validateGame: dataValidator.validateGame,
      validateFriend: dataValidator.validateFriend,
      validateSignup: dataValidator.validateSignup,
      getLifecycleHistory: lifecycleTracer.getLifecycleHistory,
      displayLifecycleHistory: lifecycleTracer.displayLifecycleHistory,
      
      // Check all games in storage
      validateAllGames: () => {
        try {
          const storage = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
          if (!storage.games || !Array.isArray(storage.games)) {
            debugLogger.error('VALIDATE:ALL', 'No games array found in storage');
            return false;
          }
          
          debugLogger.group('VALIDATE:ALL', 'Validating all games');
          debugLogger.log('VALIDATE:ALL', `Found ${storage.games.length} games`);
          
          const validGames = [];
          const invalidGames = [];
          
          storage.games.forEach(game => {
            if (dataValidator.validateGame(game)) {
              validGames.push(game.id);
            } else {
              invalidGames.push(game.id);
            }
          });
          
          debugLogger.log('VALIDATE:ALL', `Valid games: ${validGames.length}`, validGames);
          debugLogger.log('VALIDATE:ALL', `Invalid games: ${invalidGames.length}`, invalidGames);
          debugLogger.groupEnd();
          
          return invalidGames.length === 0;
        } catch (e) {
          debugLogger.error('VALIDATE:ALL', 'Error validating games:', e);
          return false;
        }
      },
      
      // Fix common issues with games in storage
      fixGamesStorage: () => {
        try {
          const storage = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
          if (!storage.games || !Array.isArray(storage.games)) {
            debugLogger.error('FIX:GAMES', 'No games array found in storage');
            return false;
          }
          
          debugLogger.group('FIX:GAMES', 'Attempting to fix game issues');
          
          let fixCount = 0;
          
          // Fix common issues
          storage.games.forEach(game => {
            // Ensure scores structure exists
            if (!game.scores) {
              game.scores = { raw: [] };
              fixCount++;
              debugLogger.log('FIX:GAMES', `Added missing scores object to game ${game.id}`);
            }
            
            // Ensure status is valid
            const validStatuses = ['created', 'open', 'enrollment_complete', 'in_progress', 'completed', 'finalized'];
            if (!game.status || !validStatuses.includes(game.status)) {
              game.status = 'created';
              fixCount++;
              debugLogger.log('FIX:GAMES', `Fixed invalid status for game ${game.id}`);
            }
            
            // Ensure timestamp exists for current status
            if (game.status === 'completed' && !game.completedAt) {
              game.completedAt = new Date().toISOString();
              fixCount++;
              debugLogger.log('FIX:GAMES', `Added missing completedAt timestamp to game ${game.id}`);
            }
            
            if (game.status === 'finalized' && !game.finalizedAt) {
              game.finalizedAt = new Date().toISOString();
              fixCount++;
              debugLogger.log('FIX:GAMES', `Added missing finalizedAt timestamp to game ${game.id}`);
            }
          });
          
          // Save fixed storage
          localStorage.setItem('golfSkinsOrganizer', JSON.stringify(storage));
          
          debugLogger.log('FIX:GAMES', `Fixed ${fixCount} issues`);
          debugLogger.groupEnd();
          
          return true;
        } catch (e) {
          debugLogger.error('FIX:GAMES', 'Error fixing games:', e);
          debugLogger.groupEnd();
          return false;
        }
      }
    };
    
    console.log('%c🏌️‍♂️ Golf Skins Debug Dashboard Loaded 🏌️‍♀️', 'background: #2a9d8f; color: white; padding: 5px; border-radius: 5px;');
    console.log('Available commands:');
    console.log(' - GolfSkinsDebug.dumpStorage()');
    console.log(' - GolfSkinsDebug.validateAllGames()');
    console.log(' - GolfSkinsDebug.fixGamesStorage()');
    console.log(' - GolfSkinsDebug.validateGame(gameObj)');
    console.log(' - GolfSkinsDebug.displayLifecycleHistory(gameObj)');
  }
};

// Export all debug utilities
export {
  debugLogger,
  storageMonitor,
  dataValidator,
  lifecycleTracer,
  initializeDebugDashboard
};
