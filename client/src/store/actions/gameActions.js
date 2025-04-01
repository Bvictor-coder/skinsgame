/**
 * Game Actions
 * 
 * Redux action creators for game-related operations.
 */

import * as types from './types';
import Game from '../../models/Game';
import storageManager from '../../storage/StorageManager';
import { GAME_STATUSES } from '../../models/GameStatus';

/**
 * Fetch all games
 * @returns {Function} Thunk action
 */
export const fetchGames = () => async (dispatch) => {
  dispatch({ type: types.FETCH_GAMES_REQUEST });
  
  try {
    const games = await storageManager.getAll();
    
    dispatch({
      type: types.FETCH_GAMES_SUCCESS,
      payload: games
    });
    
    return games;
  } catch (error) {
    console.error('Error fetching games:', error);
    
    dispatch({
      type: types.FETCH_GAMES_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Fetch a single game by ID
 * @param {string} id - Game ID
 * @returns {Function} Thunk action
 */
export const fetchGame = (id) => async (dispatch) => {
  dispatch({ type: types.FETCH_GAME_REQUEST });
  
  try {
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    dispatch({
      type: types.FETCH_GAME_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error);
    
    dispatch({
      type: types.FETCH_GAME_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Create a new game
 * @param {Object} gameData - Game data
 * @returns {Function} Thunk action
 */
export const createGame = (gameData) => async (dispatch) => {
  dispatch({ type: types.CREATE_GAME_REQUEST });
  
  try {
    // Create new Game instance
    const game = new Game(gameData);
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.CREATE_GAME_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error('Error creating game:', error);
    
    dispatch({
      type: types.CREATE_GAME_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Update a game
 * @param {string} id - Game ID
 * @param {Object} updates - Game updates
 * @returns {Function} Thunk action
 */
export const updateGame = (id, updates) => async (dispatch) => {
  dispatch({ type: types.UPDATE_GAME_REQUEST });
  
  try {
    // Get current game
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Apply updates
    game.update(updates);
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.UPDATE_GAME_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error updating game ${id}:`, error);
    
    dispatch({
      type: types.UPDATE_GAME_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Transition a game to a new status
 * @param {string} id - Game ID
 * @param {string} newStatus - New game status
 * @returns {Function} Thunk action
 */
export const transitionGameStatus = (id, newStatus) => async (dispatch) => {
  dispatch({ type: types.TRANSITION_GAME_STATUS_REQUEST });
  
  try {
    // Get current game
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Handle special case for finalization
    if (newStatus === GAME_STATUSES.FINALIZED) {
      game.finalize();
    } else {
      // Normal status transition
      game.transitionTo(newStatus);
    }
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.TRANSITION_GAME_STATUS_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error transitioning game ${id} to ${newStatus}:`, error);
    
    dispatch({
      type: types.TRANSITION_GAME_STATUS_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Update game scores
 * @param {string} id - Game ID
 * @param {Array} scores - Raw scores array
 * @returns {Function} Thunk action
 */
export const updateGameScores = (id, scores) => async (dispatch) => {
  dispatch({ type: types.UPDATE_GAME_SCORES_REQUEST });
  
  try {
    // Get current game
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Ensure game is in a state where scores can be modified
    if (!game.canModifyScores()) {
      throw new Error(`Cannot modify scores for game in ${game.status} status`);
    }
    
    // Update scores
    game.updateScores(scores);
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.UPDATE_GAME_SCORES_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error updating scores for game ${id}:`, error);
    
    dispatch({
      type: types.UPDATE_GAME_SCORES_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Set calculated scores for a game
 * @param {string} id - Game ID
 * @param {Object} calculatedScores - Calculated scores data
 * @returns {Function} Thunk action
 */
export const setCalculatedScores = (id, calculatedScores) => async (dispatch) => {
  dispatch({ type: types.UPDATE_GAME_SCORES_REQUEST });
  
  try {
    // Get current game
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Set calculated scores
    game.setCalculatedScores(calculatedScores);
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.UPDATE_GAME_SCORES_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error setting calculated scores for game ${id}:`, error);
    
    dispatch({
      type: types.UPDATE_GAME_SCORES_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Finalize a game
 * @param {string} id - Game ID
 * @returns {Function} Thunk action
 */
export const finalizeGame = (id) => async (dispatch) => {
  dispatch({ type: types.FINALIZE_GAME_REQUEST });
  
  try {
    // Get current game
    const game = await storageManager.getById(id);
    
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Finalize game
    game.finalize();
    
    // Save to storage
    await storageManager.save(game);
    
    dispatch({
      type: types.FINALIZE_GAME_SUCCESS,
      payload: game
    });
    
    return game;
  } catch (error) {
    console.error(`Error finalizing game ${id}:`, error);
    
    dispatch({
      type: types.FINALIZE_GAME_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Delete a game
 * @param {string} id - Game ID
 * @returns {Function} Thunk action
 */
export const deleteGame = (id) => async (dispatch) => {
  dispatch({ type: types.DELETE_GAME_REQUEST });
  
  try {
    const deleted = await storageManager.delete(id);
    
    if (!deleted) {
      throw new Error(`Game with ID ${id} not found or could not be deleted`);
    }
    
    dispatch({
      type: types.DELETE_GAME_SUCCESS,
      payload: id
    });
    
    return id;
  } catch (error) {
    console.error(`Error deleting game ${id}:`, error);
    
    dispatch({
      type: types.DELETE_GAME_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Set the active game
 * @param {string} id - Game ID
 * @returns {Object} Action object
 */
export const setActiveGame = (id) => ({
  type: types.SET_ACTIVE_GAME,
  payload: id
});

/**
 * Clear the active game
 * @returns {Object} Action object
 */
export const clearActiveGame = () => ({
  type: types.CLEAR_ACTIVE_GAME
});

/**
 * Clear game errors
 * @returns {Object} Action object
 */
export const clearGameErrors = () => ({
  type: types.CLEAR_GAME_ERRORS
});
