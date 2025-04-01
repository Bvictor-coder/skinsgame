/**
 * Redux Action Types
 * 
 * This file defines all the action type constants used in the application.
 * Following the pattern of request/success/failure for async actions.
 */

// ==== GAME ACTIONS ====

// Fetch all games
export const FETCH_GAMES_REQUEST = 'FETCH_GAMES_REQUEST';
export const FETCH_GAMES_SUCCESS = 'FETCH_GAMES_SUCCESS';
export const FETCH_GAMES_FAILURE = 'FETCH_GAMES_FAILURE';

// Fetch single game
export const FETCH_GAME_REQUEST = 'FETCH_GAME_REQUEST';
export const FETCH_GAME_SUCCESS = 'FETCH_GAME_SUCCESS';
export const FETCH_GAME_FAILURE = 'FETCH_GAME_FAILURE';

// Create game
export const CREATE_GAME_REQUEST = 'CREATE_GAME_REQUEST';
export const CREATE_GAME_SUCCESS = 'CREATE_GAME_SUCCESS';
export const CREATE_GAME_FAILURE = 'CREATE_GAME_FAILURE';

// Update game
export const UPDATE_GAME_REQUEST = 'UPDATE_GAME_REQUEST';
export const UPDATE_GAME_SUCCESS = 'UPDATE_GAME_SUCCESS';
export const UPDATE_GAME_FAILURE = 'UPDATE_GAME_FAILURE';

// Game status transition
export const TRANSITION_GAME_STATUS_REQUEST = 'TRANSITION_GAME_STATUS_REQUEST';
export const TRANSITION_GAME_STATUS_SUCCESS = 'TRANSITION_GAME_STATUS_SUCCESS';
export const TRANSITION_GAME_STATUS_FAILURE = 'TRANSITION_GAME_STATUS_FAILURE';

// Update game scores
export const UPDATE_GAME_SCORES_REQUEST = 'UPDATE_GAME_SCORES_REQUEST';
export const UPDATE_GAME_SCORES_SUCCESS = 'UPDATE_GAME_SCORES_SUCCESS';
export const UPDATE_GAME_SCORES_FAILURE = 'UPDATE_GAME_SCORES_FAILURE';

// Finalize game
export const FINALIZE_GAME_REQUEST = 'FINALIZE_GAME_REQUEST';
export const FINALIZE_GAME_SUCCESS = 'FINALIZE_GAME_SUCCESS';
export const FINALIZE_GAME_FAILURE = 'FINALIZE_GAME_FAILURE';

// Delete game
export const DELETE_GAME_REQUEST = 'DELETE_GAME_REQUEST';
export const DELETE_GAME_SUCCESS = 'DELETE_GAME_SUCCESS';
export const DELETE_GAME_FAILURE = 'DELETE_GAME_FAILURE';

// ==== UI ACTIONS ====

// Set active game
export const SET_ACTIVE_GAME = 'SET_ACTIVE_GAME';
export const CLEAR_ACTIVE_GAME = 'CLEAR_ACTIVE_GAME';

// Error handling
export const CLEAR_GAME_ERRORS = 'CLEAR_GAME_ERRORS';

// ==== FRIEND ACTIONS ====
// These would be implemented in a similar pattern to game actions

// ==== SIGNUP ACTIONS ====
// These would be implemented in a similar pattern to game actions

// ==== APPLICATION ACTIONS ====

// Data synchronization
export const SYNC_DATA_REQUEST = 'SYNC_DATA_REQUEST';
export const SYNC_DATA_SUCCESS = 'SYNC_DATA_SUCCESS';
export const SYNC_DATA_FAILURE = 'SYNC_DATA_FAILURE';

// Application initialization
export const INITIALIZE_APP_REQUEST = 'INITIALIZE_APP_REQUEST';
export const INITIALIZE_APP_SUCCESS = 'INITIALIZE_APP_SUCCESS';
export const INITIALIZE_APP_FAILURE = 'INITIALIZE_APP_FAILURE';

// Storage mode and API availability
export const SET_STORAGE_MODE = 'SET_STORAGE_MODE';
export const API_AVAILABILITY_CHANGE = 'API_AVAILABILITY_CHANGE';

// Backup and restore
export const CREATE_BACKUP_REQUEST = 'CREATE_BACKUP_REQUEST';
export const CREATE_BACKUP_SUCCESS = 'CREATE_BACKUP_SUCCESS';
export const CREATE_BACKUP_FAILURE = 'CREATE_BACKUP_FAILURE';

export const RESTORE_BACKUP_REQUEST = 'RESTORE_BACKUP_REQUEST';
export const RESTORE_BACKUP_SUCCESS = 'RESTORE_BACKUP_SUCCESS';
export const RESTORE_BACKUP_FAILURE = 'RESTORE_BACKUP_FAILURE';
