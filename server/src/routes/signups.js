import express from 'express';
import {
  getAllSignups,
  getSignupsByGameId,
  getSignupsByPlayerId,
  createSignup,
  updateSignup,
  deleteSignup,
  getSignupByPlayerAndGame
} from '../controllers/signupController.js';

const router = express.Router();

// GET /api/signups - Get all signups
router.get('/', getAllSignups);

// GET /api/signups/game/:gameId - Get signups for a specific game
router.get('/game/:gameId', getSignupsByGameId);

// GET /api/signups/player/:playerId - Get signups for a specific player
router.get('/player/:playerId', getSignupsByPlayerId);

// GET /api/signups/player/:playerId/game/:gameId - Get signup for a specific player and game
router.get('/player/:playerId/game/:gameId', getSignupByPlayerAndGame);

// POST /api/signups - Create a new signup
router.post('/', createSignup);

// PUT /api/signups/:id - Update a signup
router.put('/:id', updateSignup);

// DELETE /api/signups/:id - Delete a signup
router.delete('/:id', deleteSignup);

export default router;
