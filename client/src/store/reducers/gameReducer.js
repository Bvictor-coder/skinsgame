/**
 * Game Reducer
 * 
 * Handles state updates for game-related actions.
 */

import * as types from '../actions/types';

/**
 * Initial state for the game reducer
 */
const initialState = {
  // Collection of all games
  games: [],
  
  // Currently active/selected game
  activeGame: null,
  
  // Loading state for async operations
  loading: false,
  
  // Error messages
  error: null,
  
  // Success message for operations
  successMessage: null
};

/**
 * Game reducer function
 * @param {Object} state - Current state
 * @param {Object} action - Action object
 * @returns {Object} New state
 */
const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    // ====== FETCH ALL GAMES ======
    case types.FETCH_GAMES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case types.FETCH_GAMES_SUCCESS:
      return {
        ...state,
        loading: false,
        games: action.payload,
        error: null
      };
      
    case types.FETCH_GAMES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // ====== FETCH SINGLE GAME ======
    case types.FETCH_GAME_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case types.FETCH_GAME_SUCCESS:
      return {
        ...state,
        loading: false,
        activeGame: action.payload,
        // Update the game in the games array if it exists
        games: state.games.map(game => 
          game.id === action.payload.id ? action.payload : game
        ),
        error: null
      };
      
    case types.FETCH_GAME_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // ====== CREATE GAME ======
    case types.CREATE_GAME_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.CREATE_GAME_SUCCESS:
      return {
        ...state,
        loading: false,
        games: [...state.games, action.payload],
        activeGame: action.payload,
        error: null,
        successMessage: 'Game created successfully'
      };
      
    case types.CREATE_GAME_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== UPDATE GAME ======
    case types.UPDATE_GAME_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.UPDATE_GAME_SUCCESS:
      return {
        ...state,
        loading: false,
        games: state.games.map(game => 
          game.id === action.payload.id ? action.payload : game
        ),
        activeGame: state.activeGame?.id === action.payload.id ? 
          action.payload : state.activeGame,
        error: null,
        successMessage: 'Game updated successfully'
      };
      
    case types.UPDATE_GAME_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== STATUS TRANSITION ======
    case types.TRANSITION_GAME_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.TRANSITION_GAME_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        games: state.games.map(game => 
          game.id === action.payload.id ? action.payload : game
        ),
        activeGame: state.activeGame?.id === action.payload.id ? 
          action.payload : state.activeGame,
        error: null,
        successMessage: `Game status changed to ${action.payload.status}`
      };
      
    case types.TRANSITION_GAME_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== UPDATE SCORES ======
    case types.UPDATE_GAME_SCORES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.UPDATE_GAME_SCORES_SUCCESS:
      return {
        ...state,
        loading: false,
        games: state.games.map(game => 
          game.id === action.payload.id ? action.payload : game
        ),
        activeGame: state.activeGame?.id === action.payload.id ? 
          action.payload : state.activeGame,
        error: null,
        successMessage: 'Scores updated successfully'
      };
      
    case types.UPDATE_GAME_SCORES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== FINALIZE GAME ======
    case types.FINALIZE_GAME_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.FINALIZE_GAME_SUCCESS:
      return {
        ...state,
        loading: false,
        games: state.games.map(game => 
          game.id === action.payload.id ? action.payload : game
        ),
        activeGame: state.activeGame?.id === action.payload.id ? 
          action.payload : state.activeGame,
        error: null,
        successMessage: 'Game finalized successfully'
      };
      
    case types.FINALIZE_GAME_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== DELETE GAME ======
    case types.DELETE_GAME_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        successMessage: null
      };
      
    case types.DELETE_GAME_SUCCESS:
      return {
        ...state,
        loading: false,
        games: state.games.filter(game => game.id !== action.payload),
        activeGame: state.activeGame?.id === action.payload ? 
          null : state.activeGame,
        error: null,
        successMessage: 'Game deleted successfully'
      };
      
    case types.DELETE_GAME_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null
      };
      
    // ====== ACTIVE GAME ======
    case types.SET_ACTIVE_GAME:
      return {
        ...state,
        activeGame: state.games.find(game => game.id === action.payload) || null
      };
      
    case types.CLEAR_ACTIVE_GAME:
      return {
        ...state,
        activeGame: null
      };
      
    // ====== ERROR HANDLING ======
    case types.CLEAR_GAME_ERRORS:
      return {
        ...state,
        error: null,
        successMessage: null
      };
      
    // Default: return current state
    default:
      return state;
  }
};

export default gameReducer;
