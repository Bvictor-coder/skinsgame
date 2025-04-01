/**
 * Game Model
 * 
 * This class represents a golf game with state machine functionality
 * for managing the game lifecycle.
 */

import { GAME_STATUSES, getTimestampProperty, getValidNextStatuses } from './GameStatus';
import { 
  validateGame, 
  validateStatusTransition, 
  validateGameUpdates, 
  validateScores 
} from './GameValidator';

/**
 * Game class with state machine functionality
 */
class Game {
  /**
   * Create a new Game instance
   * @param {Object} data - Initial game data
   */
  constructor(data = {}) {
    // Core properties
    this.id = data.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.time = data.time || '08:00';
    this.course = data.course || null;
    this.holes = data.holes !== undefined ? data.holes : 18;
    this.entryFee = data.entryFee !== undefined ? data.entryFee : 0;
    this.notes = data.notes || '';
    
    // Special properties
    this.ctpHole = data.ctpHole !== undefined ? data.ctpHole : null;
    this.ctpPlayerId = data.ctpPlayerId || null;
    this.wolfEnabled = data.wolfEnabled === true;
    
    // Lifecycle properties
    this.status = data.status || GAME_STATUSES.CREATED;
    this.statusHistory = data.statusHistory || [];
    
    // Assign all timestamp properties
    this.createdAt = data.createdAt || new Date().toISOString();
    this.openedAt = data.openedAt || null;
    this.enrollmentCompletedAt = data.enrollmentCompletedAt || null;
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.finalizedAt = data.finalizedAt || null;
    
    // Player groups
    this.groups = data.groups || [];
    
    // Ensure scores object exists
    this.scores = data.scores || { raw: [] };
    
    // Create initial status history entry if new game
    if (!data.id && !data.statusHistory?.length) {
      this.statusHistory.push({
        status: this.status,
        timestamp: this.createdAt
      });
    }
  }
  
  /**
   * Check if a status transition is valid
   * @param {string} newStatus - Status to transition to
   * @returns {boolean} True if transition is valid
   */
  canTransitionTo(newStatus) {
    const validation = validateStatusTransition(this.status, newStatus);
    return validation.isValid;
  }
  
  /**
   * Get all valid next statuses for this game
   * @returns {string[]} Array of valid next statuses
   */
  getValidNextStatuses() {
    return getValidNextStatuses(this.status);
  }
  
  /**
   * Transition game to a new status
   * @param {string} newStatus - Status to transition to
   * @returns {Game} Updated game instance
   * @throws {Error} If transition is invalid
   */
  transitionTo(newStatus) {
    const validation = validateStatusTransition(this.status, newStatus);
    
    if (!validation.isValid) {
      throw new Error(validation.error || `Invalid transition to ${newStatus}`);
    }
    
    // Record previous status
    const previousStatus = this.status;
    
    // Set the new status
    this.status = newStatus;
    
    // Add appropriate timestamp
    const timestamp = new Date().toISOString();
    const timestampProp = getTimestampProperty(newStatus);
    
    if (timestampProp) {
      this[timestampProp] = timestamp;
    }
    
    // Add to status history
    this.statusHistory.push({
      status: newStatus,
      timestamp,
      previousStatus
    });
    
    return this;
  }
  
  /**
   * Apply updates to the game
   * @param {Object} updates - Properties to update
   * @returns {Game} Updated game instance
   * @throws {Error} If updates are invalid
   */
  update(updates) {
    // Validate updates
    const validationResult = validateGameUpdates(this, updates);
    if (!validationResult.isValid) {
      throw new Error(`Invalid updates: ${validationResult.errors.join(', ')}`);
    }
    
    // Special handling for status transitions
    if (updates.status && updates.status !== this.status) {
      return this.transitionTo(updates.status);
    }
    
    // Special handling for scores to ensure we don't lose calculated data
    if (updates.scores) {
      // Preserve calculated scores if they exist and aren't being explicitly replaced
      if (this.scores.calculated && !updates.scores.calculated) {
        updates.scores.calculated = this.scores.calculated;
      }
    }
    
    // Apply all other updates
    Object.keys(updates).forEach(key => {
      if (key !== 'status') { // Already handled status specially
        this[key] = updates[key];
      }
    });
    
    return this;
  }
  
  /**
   * Update raw scores
   * @param {Array} rawScores - Array of score objects
   * @returns {Game} Updated game instance
   * @throws {Error} If scores are invalid
   */
  updateScores(rawScores) {
    // Validate scores
    const validationResult = validateScores(rawScores);
    if (!validationResult.isValid) {
      throw new Error(`Invalid scores: ${validationResult.errors.join(', ')}`);
    }
    
    // Preserve calculated scores if they exist
    const calculated = this.scores.calculated;
    
    // Update raw scores
    this.scores = { 
      raw: rawScores,
      // Keep calculated scores if they exist
      ...(calculated ? { calculated } : {})
    };
    
    return this;
  }
  
  /**
   * Set calculated scores
   * @param {Object} calculatedScores - Calculated score data
   * @returns {Game} Updated game instance
   */
  setCalculatedScores(calculatedScores) {
    // Ensure scores object exists
    if (!this.scores) {
      this.scores = { raw: [] };
    }
    
    // Update calculated scores
    this.scores.calculated = calculatedScores;
    
    return this;
  }
  
  /**
   * Handle special cases when a game is finalized
   * @returns {Game} Updated game instance
   * @throws {Error} If game cannot be finalized
   */
  finalize() {
    // Ensure we're in a state that can be finalized
    if (this.status !== GAME_STATUSES.COMPLETED) {
      throw new Error('Cannot finalize a game that is not in Completed status');
    }
    
    // Ensure scores are calculated
    if (!this.scores.calculated) {
      throw new Error('Cannot finalize a game without calculated scores');
    }
    
    // Set scores as locked to prevent modification after finalization
    this.scores = {
      ...this.scores,
      locked: true
    };
    
    // Transition to finalized status
    return this.transitionTo(GAME_STATUSES.FINALIZED);
  }
  
  /**
   * Validate the game object
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validate() {
    return validateGame(this);
  }
  
  /**
   * Convert game to a plain object for storage/API
   * Safely handles circular references
   * @returns {Object} Plain JavaScript object representation
   */
  toJSON() {
    // List of properties to serialize
    const propertiesToSerialize = [
      'id', 'date', 'time', 'course', 'holes', 'entryFee', 'notes',
      'ctpHole', 'ctpPlayerId', 'wolfEnabled', 'status', 'statusHistory',
      'createdAt', 'openedAt', 'enrollmentCompletedAt', 'startedAt',
      'completedAt', 'finalizedAt', 'groups', 'scores'
    ];
    
    // Create a new object with just the specified properties
    const result = {};
    propertiesToSerialize.forEach(prop => {
      if (this[prop] !== undefined) {
        result[prop] = this[prop];
      }
    });
    
    return result;
  }
  
  /**
   * Create a Game instance from stored data
   * @param {Object} data - Stored game data
   * @returns {Game} Game instance
   */
  static fromJSON(data) {
    return new Game(data);
  }
  
  /**
   * Create a copy of this game
   * @returns {Game} New game instance with same properties
   */
  clone() {
    // Use the safe toJSON method to get a clean copy of properties
    const data = this.toJSON();
    return new Game(data);
  }
  
  /**
   * Check if the game has been finalized
   * @returns {boolean} True if the game is finalized
   */
  isFinalized() {
    return this.status === GAME_STATUSES.FINALIZED;
  }
  
  /**
   * Check if scores can be modified
   * @returns {boolean} True if scores can be modified
   */
  canModifyScores() {
    // Finalized games with locked scores cannot be modified
    if (this.status === GAME_STATUSES.FINALIZED && this.scores.locked) {
      return false;
    }
    
    // Only games in progress or completed can have scores modified
    return [GAME_STATUSES.IN_PROGRESS, GAME_STATUSES.COMPLETED].includes(this.status);
  }
  
  /**
   * Get a human-readable game title
   * @returns {string} Game title
   */
  getTitle() {
    const date = new Date(this.date).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${date} - ${this.course}`;
  }
}

export default Game;
