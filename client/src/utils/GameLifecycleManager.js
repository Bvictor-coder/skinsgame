/**
 * Game Lifecycle Manager
 * 
 * A central utility for managing the lifecycle of game objects.
 * This manager provides a consistent API for:
 * - Transitioning between game states
 * - Validating state transitions
 * - Tracking lifecycle events
 * - Getting information about available actions based on game state
 */

import { GAME_STATUSES, VALID_TRANSITIONS, getTimestampProperty, getStatusLabel } from '../models/GameStatus';
import { validateStatusTransition } from '../models/GameValidator';
import { debugLogger } from './debugTools';

class GameLifecycleManager {
  /**
   * Transition a game to a new status
   * @param {Object} game - Game object
   * @param {string} newStatus - Target status to transition to
   * @param {Object} options - Additional options for the transition
   * @param {boolean} options.skipValidation - Skip validation (use with caution)
   * @param {Object} options.metadata - Additional metadata to store with the transition
   * @returns {Object} Updated game object
   * @throws {Error} If transition is invalid
   */
  transitionGame(game, newStatus, options = {}) {
    const { skipValidation = false, metadata = {} } = options;
    
    debugLogger.group('LIFECYCLE', `Transitioning game ${game.id} from ${game.status} to ${newStatus}`);
    
    // Validate the transition unless explicitly skipped
    if (!skipValidation) {
      const validationResult = validateStatusTransition(game.status, newStatus);
      if (!validationResult.isValid) {
        debugLogger.error('LIFECYCLE', `Invalid transition: ${validationResult.error}`);
        debugLogger.groupEnd();
        throw new Error(validationResult.error || `Invalid transition to ${newStatus}`);
      }
    }
    
    // Record previous status
    const previousStatus = game.status;
    
    // Create a copy of the game to avoid direct mutation
    const updatedGame = { ...game };
    
    // Set the new status
    updatedGame.status = newStatus;
    
    // Add appropriate timestamp
    const timestamp = new Date().toISOString();
    const timestampProp = getTimestampProperty(newStatus);
    
    if (timestampProp) {
      updatedGame[timestampProp] = timestamp;
    }
    
    // Add to status history
    if (!updatedGame.statusHistory) {
      updatedGame.statusHistory = [];
    }
    
    updatedGame.statusHistory.push({
      status: newStatus,
      timestamp,
      previousStatus,
      metadata
    });
    
    // Handle special cases for specific transitions
    if (newStatus === GAME_STATUSES.FINALIZED) {
      if (updatedGame.scores) {
        updatedGame.scores.locked = true;
      }
    }
    
    debugLogger.log('LIFECYCLE', `Successfully transitioned game to ${newStatus}`);
    debugLogger.groupEnd();
    
    return updatedGame;
  }
  
  /**
   * Check if a game can transition to a specific status
   * @param {Object} game - Game object
   * @param {string} targetStatus - Target status to check
   * @returns {Object} Result with isValid flag and error message
   */
  canTransitionTo(game, targetStatus) {
    return validateStatusTransition(game.status, targetStatus);
  }
  
  /**
   * Get all valid next statuses for a game
   * @param {Object} game - Game object
   * @returns {Array} Array of valid next status values
   */
  getValidNextStatuses(game) {
    const currentStatus = game.status;
    
    if (!currentStatus) {
      return [GAME_STATUSES.CREATED];
    }
    
    return VALID_TRANSITIONS[currentStatus] || [];
  }
  
  /**
   * Get available actions for a game based on its current status
   * @param {Object} game - Game object
   * @returns {Array} Array of available action objects with id, label, and nextStatus
   */
  getAvailableActions(game) {
    const validNextStatuses = this.getValidNextStatuses(game);
    
    return validNextStatuses.map(status => {
      let actionLabel;
      
      switch (status) {
        case GAME_STATUSES.OPEN:
          actionLabel = 'Open Registration';
          break;
        case GAME_STATUSES.ENROLLMENT_COMPLETE:
          actionLabel = 'Close Registration';
          break;
        case GAME_STATUSES.IN_PROGRESS:
          actionLabel = 'Start Game';
          break;
        case GAME_STATUSES.COMPLETED:
          actionLabel = 'Complete Game';
          break;
        case GAME_STATUSES.FINALIZED:
          actionLabel = 'Finalize Results';
          break;
        case GAME_STATUSES.CREATED:
          actionLabel = 'Reset to Created';
          break;
        default:
          actionLabel = `Move to ${getStatusLabel(status)}`;
      }
      
      return {
        id: `transition-to-${status}`,
        label: actionLabel,
        nextStatus: status,
        execute: (gameObj) => this.transitionGame(gameObj, status)
      };
    });
  }
  
  /**
   * Check if a game can be modified
   * @param {Object} game - Game object
   * @returns {boolean} True if the game can be modified
   */
  canModifyGame(game) {
    return game.status !== GAME_STATUSES.FINALIZED;
  }
  
  /**
   * Check if scores can be entered for a game
   * @param {Object} game - Game object
   * @returns {boolean} True if scores can be entered
   */
  canEnterScores(game) {
    return [
      GAME_STATUSES.IN_PROGRESS,
      GAME_STATUSES.COMPLETED
    ].includes(game.status);
  }
  
  /**
   * Check if players can sign up for a game
   * @param {Object} game - Game object
   * @returns {boolean} True if players can sign up
   */
  canSignUpPlayers(game) {
    return game.status === GAME_STATUSES.OPEN;
  }
  
  /**
   * Check if a game can be finalized
   * @param {Object} game - Game object
   * @returns {boolean} True if the game can be finalized
   */
  canFinalizeGame(game) {
    // Can only finalize completed games with calculated scores
    return (
      game.status === GAME_STATUSES.COMPLETED &&
      game.scores &&
      game.scores.calculated
    );
  }
  
  /**
   * Format game status history for display
   * @param {Object} game - Game object
   * @returns {Array} Formatted status history entries
   */
  formatStatusHistory(game) {
    if (!game.statusHistory || !Array.isArray(game.statusHistory)) {
      return [];
    }
    
    return game.statusHistory.map(entry => ({
      status: entry.status,
      statusLabel: getStatusLabel(entry.status),
      previousStatus: entry.previousStatus,
      previousStatusLabel: entry.previousStatus ? getStatusLabel(entry.previousStatus) : 'None',
      timestamp: entry.timestamp,
      formattedDate: new Date(entry.timestamp).toLocaleDateString(),
      formattedTime: new Date(entry.timestamp).toLocaleTimeString(),
      metadata: entry.metadata || {}
    }));
  }
  
  /**
   * Get the current phase of the game lifecycle
   * @param {Object} game - Game object
   * @returns {string} Phase identifier: 'setup', 'registration', 'play', or 'completed'
   */
  getGamePhase(game) {
    switch (game.status) {
      case GAME_STATUSES.CREATED:
        return 'setup';
      
      case GAME_STATUSES.OPEN:
      case GAME_STATUSES.ENROLLMENT_COMPLETE:
        return 'registration';
      
      case GAME_STATUSES.IN_PROGRESS:
        return 'play';
      
      case GAME_STATUSES.COMPLETED:
      case GAME_STATUSES.FINALIZED:
        return 'completed';
      
      default:
        return 'unknown';
    }
  }
  
  /**
   * Check if a game is active (happening today)
   * @param {Object} game - Game object
   * @returns {boolean} True if the game is active today
   */
  isGameActive(game) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const gameDate = new Date(game.date);
    gameDate.setHours(0, 0, 0, 0);
    
    const isToday = gameDate.getTime() === today.getTime();
    const isInProgress = game.status === GAME_STATUSES.IN_PROGRESS;
    
    return isToday && isInProgress;
  }
  
  /**
   * Finalize a game (special transition that includes additional validations)
   * @param {Object} game - Game object
   * @returns {Object} Updated game object
   * @throws {Error} If game cannot be finalized
   */
  finalizeGame(game) {
    if (game.status !== GAME_STATUSES.COMPLETED) {
      throw new Error('Cannot finalize a game that is not in Completed status');
    }
    
    if (!game.scores || !game.scores.calculated) {
      throw new Error('Cannot finalize a game without calculated scores');
    }
    
    // Add special metadata for finalization
    return this.transitionGame(game, GAME_STATUSES.FINALIZED, {
      metadata: {
        resultsConfirmed: true,
        finalizedTimestamp: new Date().toISOString()
      }
    });
  }
}

// Create and export a singleton instance
const gameLifecycleManager = new GameLifecycleManager();
export default gameLifecycleManager;
