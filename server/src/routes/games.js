import express from 'express';
import {
  getGames,
  getUpcomingGames,
  getPastGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  updateGameStatus,
  updateGameGroups,
  updateGameScores
} from '../controllers/gameController.js';

const router = express.Router();

// GET /api/games - Get all games
router.get('/', getGames);

// GET /api/games/upcoming - Get upcoming games
router.get('/upcoming', getUpcomingGames);

// GET /api/games/past - Get past games
router.get('/past', getPastGames);

// GET /api/games/:id - Get a specific game by ID
router.get('/:id', getGameById);

// POST /api/games - Create a new game
router.post('/', createGame);

// PUT /api/games/:id - Update a game
router.put('/:id', updateGame);

// DELETE /api/games/:id - Delete a game
router.delete('/:id', deleteGame);

// PATCH /api/games/:id/status - Update game status
router.patch('/:id/status', updateGameStatus);

// PATCH /api/games/:id/groups - Update game groups
router.patch('/:id/groups', updateGameGroups);

// PATCH /api/games/:id/scores - Update game scores
router.patch('/:id/scores', updateGameScores);

export default router;
