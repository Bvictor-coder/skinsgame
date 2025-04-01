/**
 * Game Selectors
 * 
 * Functions to select and derive game data from the Redux store.
 * These selectors help components access state without knowing its structure.
 */

import { GAME_STATUSES } from '../../models/GameStatus';

/**
 * Select all games from state
 * @param {Object} state - Redux state
 * @returns {Array} Array of games
 */
export const selectAllGames = (state) => state.games.games;

/**
 * Select active/selected game
 * @param {Object} state - Redux state
 * @returns {Object|null} Active game or null
 */
export const selectActiveGame = (state) => state.games.activeGame;

/**
 * Select loading state for games
 * @param {Object} state - Redux state
 * @returns {boolean} Loading state
 */
export const selectGamesLoading = (state) => state.games.loading;

/**
 * Select error state for games
 * @param {Object} state - Redux state
 * @returns {string|null} Error message or null
 */
export const selectGamesError = (state) => state.games.error;

/**
 * Select success message for games
 * @param {Object} state - Redux state
 * @returns {string|null} Success message or null
 */
export const selectGamesSuccessMessage = (state) => state.games.successMessage;

/**
 * Select a specific game by ID
 * @param {Object} state - Redux state
 * @param {string} id - Game ID
 * @returns {Object|undefined} Game with the specified ID or undefined
 */
export const selectGameById = (state, id) => {
  return selectAllGames(state).find(game => game.id === id);
};

/**
 * Select upcoming games (future date and not finalized)
 * @param {Object} state - Redux state
 * @returns {Array} Array of upcoming games sorted by date
 */
export const selectUpcomingGames = (state) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return selectAllGames(state)
    .filter(game => {
      const gameDate = new Date(game.date);
      return gameDate >= today && game.status !== GAME_STATUSES.FINALIZED;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Select past games (past date or finalized)
 * @param {Object} state - Redux state
 * @returns {Array} Array of past games sorted by date (newest first)
 */
export const selectPastGames = (state) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return selectAllGames(state)
    .filter(game => {
      const gameDate = new Date(game.date);
      return gameDate < today || game.status === GAME_STATUSES.FINALIZED;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
};

/**
 * Select games by status
 * @param {Object} state - Redux state
 * @param {string} status - Game status
 * @returns {Array} Array of games with the specified status
 */
export const selectGamesByStatus = (state, status) => {
  return selectAllGames(state)
    .filter(game => game.status === status)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Select games that are open for enrollment
 * @param {Object} state - Redux state
 * @returns {Array} Array of open games
 */
export const selectOpenGames = (state) => {
  return selectGamesByStatus(state, GAME_STATUSES.OPEN);
};

/**
 * Select games that are in progress
 * @param {Object} state - Redux state
 * @returns {Array} Array of in-progress games
 */
export const selectInProgressGames = (state) => {
  return selectGamesByStatus(state, GAME_STATUSES.IN_PROGRESS);
};

/**
 * Select games that are completed but not finalized
 * @param {Object} state - Redux state
 * @returns {Array} Array of completed games
 */
export const selectCompletedGames = (state) => {
  return selectGamesByStatus(state, GAME_STATUSES.COMPLETED);
};

/**
 * Select games that are finalized
 * @param {Object} state - Redux state
 * @returns {Array} Array of finalized games
 */
export const selectFinalizedGames = (state) => {
  return selectGamesByStatus(state, GAME_STATUSES.FINALIZED);
};

/**
 * Select the number of games
 * @param {Object} state - Redux state
 * @returns {number} Number of games
 */
export const selectGameCount = (state) => {
  return selectAllGames(state).length;
};

/**
 * Select games for a specific course
 * @param {Object} state - Redux state
 * @param {string} course - Course name/id
 * @returns {Array} Array of games for the specified course
 */
export const selectGamesByCourse = (state, course) => {
  return selectAllGames(state)
    .filter(game => game.course === course)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
};

/**
 * Select valid next statuses for the active game
 * @param {Object} state - Redux state
 * @returns {Array} Array of valid next statuses or empty array if no active game
 */
export const selectValidNextStatusesForActiveGame = (state) => {
  const activeGame = selectActiveGame(state);
  
  if (!activeGame) {
    return [];
  }
  
  return activeGame.getValidNextStatuses();
};

/**
 * Select games that can have scores modified
 * @param {Object} state - Redux state
 * @returns {Array} Array of games that can have scores modified
 */
export const selectGamesForScoreEntry = (state) => {
  return selectAllGames(state)
    .filter(game => game.canModifyScores())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};
