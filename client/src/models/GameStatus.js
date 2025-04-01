/**
 * Game Status Constants and Utilities
 * 
 * This module defines the possible game statuses, valid transitions between them,
 * and helper functions for working with game status values.
 */

/**
 * Enum of possible game statuses
 * @readonly
 * @enum {string}
 */
export const GAME_STATUSES = {
  /** Initial creation state before opening for enrollment */
  CREATED: 'created',
  
  /** Game is open for player enrollment */
  OPEN: 'open',
  
  /** Enrollment period has ended, preparing for game start */
  ENROLLMENT_COMPLETE: 'enrollment_complete',
  
  /** Game is currently being played */
  IN_PROGRESS: 'in_progress',
  
  /** All scores submitted, game is complete but not finalized */
  COMPLETED: 'completed',
  
  /** Game fully finalized with official results */
  FINALIZED: 'finalized'
};

/**
 * Map of valid status transitions.
 * Keys are current statuses, values are arrays of valid next statuses.
 * @type {Object.<string, string[]>}
 */
export const VALID_TRANSITIONS = {
  [GAME_STATUSES.CREATED]: [GAME_STATUSES.OPEN],
  [GAME_STATUSES.OPEN]: [GAME_STATUSES.ENROLLMENT_COMPLETE, GAME_STATUSES.CREATED],
  [GAME_STATUSES.ENROLLMENT_COMPLETE]: [GAME_STATUSES.IN_PROGRESS, GAME_STATUSES.OPEN],
  [GAME_STATUSES.IN_PROGRESS]: [GAME_STATUSES.COMPLETED, GAME_STATUSES.ENROLLMENT_COMPLETE],
  [GAME_STATUSES.COMPLETED]: [GAME_STATUSES.FINALIZED, GAME_STATUSES.IN_PROGRESS],
  [GAME_STATUSES.FINALIZED]: [GAME_STATUSES.COMPLETED]
};

/**
 * Get the timestamp property name associated with a game status
 * @param {string} status - The game status
 * @returns {string|null} The property name for the timestamp, or null if invalid status
 */
export function getTimestampProperty(status) {
  switch (status) {
    case GAME_STATUSES.CREATED:
      return 'createdAt';
    case GAME_STATUSES.OPEN:
      return 'openedAt';
    case GAME_STATUSES.ENROLLMENT_COMPLETE:
      return 'enrollmentCompletedAt';
    case GAME_STATUSES.IN_PROGRESS:
      return 'startedAt';
    case GAME_STATUSES.COMPLETED:
      return 'completedAt';
    case GAME_STATUSES.FINALIZED:
      return 'finalizedAt';
    default:
      return null;
  }
}

/**
 * Get human-readable label for a status
 * @param {string} status - The game status
 * @returns {string} User-friendly label for the status
 */
export function getStatusLabel(status) {
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
}

/**
 * Check if a transition between statuses is valid
 * @param {string} currentStatus - The current game status
 * @param {string} newStatus - The target game status
 * @returns {boolean} True if the transition is valid
 */
export function isValidTransition(currentStatus, newStatus) {
  // For new games without a status, can only transition to CREATED
  if (!currentStatus) {
    return newStatus === GAME_STATUSES.CREATED;
  }
  
  // Get allowed transitions for the current status
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  // If no transitions defined or target not in allowed list, invalid
  return allowedTransitions && allowedTransitions.includes(newStatus);
}

/**
 * Get all valid next statuses for a given status
 * @param {string} currentStatus - The current game status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus) {
  if (!currentStatus) {
    return [GAME_STATUSES.CREATED];
  }
  
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Determine if a game with given status can be edited
 * @param {string} status - The game status
 * @returns {boolean} True if the game is editable
 */
export function isGameEditable(status) {
  // Finalized games cannot be edited
  return status !== GAME_STATUSES.FINALIZED;
}

/**
 * Determine if scores can be modified for a game with the given status
 * @param {string} status - The game status
 * @returns {boolean} True if scores can be modified
 */
export function canModifyScores(status) {
  return status === GAME_STATUSES.IN_PROGRESS || status === GAME_STATUSES.COMPLETED;
}

/**
 * Determine if players can sign up for a game with the given status
 * @param {string} status - The game status
 * @returns {boolean} True if players can sign up
 */
export function canSignUpPlayers(status) {
  return status === GAME_STATUSES.OPEN;
}
