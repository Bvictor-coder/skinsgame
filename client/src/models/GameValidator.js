/**
 * Game Validation Utilities
 * 
 * This module provides functions for validating game objects and status transitions.
 */

import { GAME_STATUSES, isValidTransition, getTimestampProperty } from './GameStatus';

/**
 * Validates a complete game object
 * @param {Object} game - The game object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateGame(game) {
  const errors = [];
  
  // Required fields
  if (!game.id) errors.push('Game ID is required');
  if (!game.date) errors.push('Game date is required');
  if (!game.course) errors.push('Game course is required');
  
  // Status must be valid
  if (game.status && !Object.values(GAME_STATUSES).includes(game.status)) {
    errors.push(`Invalid status: ${game.status}`);
  }
  
  // Validate timestamps match status
  if (game.status) {
    const timestampProp = getTimestampProperty(game.status);
    if (timestampProp && !game[timestampProp]) {
      errors.push(`Missing timestamp for status ${game.status}`);
    }
  }
  
  // Ensure scores object has correct structure
  if (game.scores) {
    if (!game.scores.raw || !Array.isArray(game.scores.raw)) {
      errors.push('Game scores must have a valid raw array');
    }
  } else {
    errors.push('Game must have a scores object');
  }
  
  // Validate groups if set
  if (game.groups) {
    if (!Array.isArray(game.groups)) {
      errors.push('Groups must be an array');
    }
  }
  
  // Validate entry fee
  if (game.entryFee !== undefined && 
      (isNaN(game.entryFee) || game.entryFee < 0)) {
    errors.push('Entry fee must be a non-negative number');
  }
  
  // Validate holes
  if (game.holes !== undefined && 
      (isNaN(game.holes) || ![9, 18].includes(Number(game.holes)))) {
    errors.push('Holes must be either 9 or 18');
  }
  
  // Validate CTP hole if present
  if (game.ctpHole !== null && game.ctpHole !== undefined) {
    const holeNumber = Number(game.ctpHole);
    if (isNaN(holeNumber) || holeNumber < 1 || holeNumber > 18) {
      errors.push('CTP hole must be a valid hole number (1-18)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a status transition
 * @param {string} currentStatus - The current game status
 * @param {string} newStatus - The target game status
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validateStatusTransition(currentStatus, newStatus) {
  // If no current status, can only transition to CREATED
  if (!currentStatus) {
    return {
      isValid: newStatus === GAME_STATUSES.CREATED,
      error: newStatus !== GAME_STATUSES.CREATED ? 
        `New games must start with "${GAME_STATUSES.CREATED}" status` : null
    };
  }
  
  // Check if transition is allowed
  const valid = isValidTransition(currentStatus, newStatus);
  
  return {
    isValid: valid,
    error: !valid ? `Cannot transition from "${currentStatus}" to "${newStatus}"` : null
  };
}

/**
 * Validates game data for creation
 * @param {Object} gameData - Game data to validate for creation
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateGameCreation(gameData) {
  const errors = [];
  
  // Required fields
  if (!gameData.course) errors.push('Game course is required');
  if (!gameData.date) errors.push('Game date is required');
  
  // Date must be valid
  if (gameData.date) {
    const dateObj = new Date(gameData.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  // Validate time if provided
  if (gameData.time) {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour format
    if (!timePattern.test(gameData.time)) {
      errors.push('Invalid time format. Use HH:MM in 24-hour format');
    }
  }
  
  // Validate holes
  if (gameData.holes !== undefined && 
      (isNaN(gameData.holes) || ![9, 18].includes(Number(gameData.holes)))) {
    errors.push('Holes must be either 9 or 18');
  }
  
  // Validate entry fee
  if (gameData.entryFee !== undefined && 
      (isNaN(gameData.entryFee) || Number(gameData.entryFee) < 0)) {
    errors.push('Entry fee must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates game updates
 * @param {Object} game - Original game object
 * @param {Object} updates - Updates to apply
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateGameUpdates(game, updates) {
  const errors = [];
  
  // Cannot update ID
  if (updates.id && updates.id !== game.id) {
    errors.push('Cannot change game ID');
  }
  
  // Validate status transition if status is being updated
  if (updates.status && updates.status !== game.status) {
    const transitionResult = validateStatusTransition(game.status, updates.status);
    if (!transitionResult.isValid) {
      errors.push(transitionResult.error);
    }
  }
  
  // Finalized games cannot be modified except to un-finalize
  if (game.status === GAME_STATUSES.FINALIZED &&
      !(updates.status === GAME_STATUSES.COMPLETED)) {
    errors.push('Finalized games cannot be modified except to revert to Completed status');
  }
  
  // Validate specific fields if present in updates
  if (updates.holes !== undefined && 
      (isNaN(updates.holes) || ![9, 18].includes(Number(updates.holes)))) {
    errors.push('Holes must be either 9 or 18');
  }
  
  if (updates.entryFee !== undefined && 
      (isNaN(updates.entryFee) || Number(updates.entryFee) < 0)) {
    errors.push('Entry fee must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates score data
 * @param {Object} scoreData - Score data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateScores(scoreData) {
  const errors = [];
  
  if (!Array.isArray(scoreData)) {
    errors.push('Scores must be an array');
    return { isValid: false, errors };
  }
  
  // Check each score entry
  scoreData.forEach((entry, index) => {
    if (!entry.playerId) {
      errors.push(`Score entry ${index + 1} missing player ID`);
    }
    
    if (!entry.scores || !Array.isArray(entry.scores)) {
      errors.push(`Score entry ${index + 1} has invalid scores array`);
    } else {
      entry.scores.forEach((score, holeIndex) => {
        if (score !== null && (isNaN(score) || score < 1)) {
          errors.push(`Invalid score for player ${entry.playerId}, hole ${holeIndex + 1}`);
        }
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
