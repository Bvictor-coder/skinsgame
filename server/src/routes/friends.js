import express from 'express';
import {
  getFriends,
  getFriendById,
  createFriend,
  updateFriend,
  deleteFriend
} from '../controllers/friendController.js';

const router = express.Router();

// GET /api/friends - Get all friends
router.get('/', getFriends);

// GET /api/friends/:id - Get a specific friend by ID
router.get('/:id', getFriendById);

// POST /api/friends - Create a new friend
router.post('/', createFriend);

// PUT /api/friends/:id - Update a friend
router.put('/:id', updateFriend);

// DELETE /api/friends/:id - Delete a friend
router.delete('/:id', deleteFriend);

export default router;
