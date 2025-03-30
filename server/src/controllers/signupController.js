import Signup from '../models/Signup.js';
import Game from '../models/Game.js';
import Friend from '../models/Friend.js';
import mongoose from 'mongoose';

// Get all signups
export const getAllSignups = async (req, res) => {
  try {
    const signups = await Signup.find()
      .populate('playerId', 'name email handicap')
      .populate('gameId', 'course date time');
    
    res.status(200).json(signups);
  } catch (error) {
    console.error('Error fetching all signups:', error);
    res.status(500).json({ message: 'Server error while fetching signups', error: error.message });
  }
};

// Get signups for a specific game
export const getSignupsByGameId = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const signups = await Signup.find({ gameId })
      .populate('playerId', 'name email handicap')
      .sort({ createdAt: 1 });
    
    res.status(200).json(signups);
  } catch (error) {
    console.error(`Error fetching signups for game with ID ${req.params.gameId}:`, error);
    res.status(500).json({ message: 'Server error while fetching signups for game', error: error.message });
  }
};

// Get signups for a specific player
export const getSignupsByPlayerId = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Check if player exists
    const player = await Friend.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    const signups = await Signup.find({ playerId })
      .populate('gameId', 'course date time status')
      .sort({ 'gameId.date': -1 });
    
    res.status(200).json(signups);
  } catch (error) {
    console.error(`Error fetching signups for player with ID ${req.params.playerId}:`, error);
    res.status(500).json({ message: 'Server error while fetching signups for player', error: error.message });
  }
};

// Create a new signup
export const createSignup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { gameId, playerId, wolf, notes } = req.body;
    
    if (!gameId || !playerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Game ID and Player ID are required' });
    }
    
    // Check if game exists
    const game = await Game.findById(gameId).session(session);
    if (!game) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if player exists
    const player = await Friend.findById(playerId).session(session);
    if (!player) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Check if player is already signed up for this game
    const existingSignup = await Signup.findOne({ gameId, playerId }).session(session);
    if (existingSignup) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: 'Player is already signed up for this game' });
    }
    
    // Check if wolf option is enabled for this game
    if (wolf && !game.wolfEnabled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Wolf option is not enabled for this game' });
    }
    
    const newSignup = new Signup({
      gameId,
      playerId,
      wolf: wolf || false,
      notes: notes || ''
    });
    
    const savedSignup = await newSignup.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate player data before sending response
    const populatedSignup = await Signup.findById(savedSignup._id)
      .populate('playerId', 'name email handicap');
    
    res.status(201).json(populatedSignup);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating signup:', error);
    res.status(500).json({ message: 'Server error while creating signup', error: error.message });
  }
};

// Update a signup
export const updateSignup = async (req, res) => {
  try {
    const { id } = req.params;
    const { wolf, notes } = req.body;
    
    // Get existing signup
    const existingSignup = await Signup.findById(id);
    if (!existingSignup) {
      return res.status(404).json({ message: 'Signup not found' });
    }
    
    // Check if wolf option is enabled for this game if trying to update wolf status
    if (wolf !== undefined && wolf) {
      const game = await Game.findById(existingSignup.gameId);
      if (!game.wolfEnabled) {
        return res.status(400).json({ message: 'Wolf option is not enabled for this game' });
      }
    }
    
    // Update the signup
    const updatedSignup = await Signup.findByIdAndUpdate(
      id,
      { 
        wolf: wolf !== undefined ? wolf : existingSignup.wolf,
        notes: notes !== undefined ? notes : existingSignup.notes
      },
      { new: true, runValidators: true }
    ).populate('playerId', 'name email handicap');
    
    if (!updatedSignup) {
      return res.status(404).json({ message: 'Signup not found' });
    }
    
    res.status(200).json(updatedSignup);
  } catch (error) {
    console.error(`Error updating signup with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating signup', error: error.message });
  }
};

// Delete a signup
export const deleteSignup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSignup = await Signup.findByIdAndDelete(id);
    
    if (!deletedSignup) {
      return res.status(404).json({ message: 'Signup not found' });
    }
    
    res.status(200).json({ message: 'Signup deleted successfully', signup: deletedSignup });
  } catch (error) {
    console.error(`Error deleting signup with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while deleting signup', error: error.message });
  }
};

// Get signup for a specific player and game
export const getSignupByPlayerAndGame = async (req, res) => {
  try {
    const { playerId, gameId } = req.params;
    
    const signup = await Signup.findOne({ playerId, gameId })
      .populate('playerId', 'name email handicap');
    
    if (!signup) {
      return res.status(404).json({ message: 'Signup not found' });
    }
    
    res.status(200).json(signup);
  } catch (error) {
    console.error(`Error fetching signup for player ID ${req.params.playerId} and game ID ${req.params.gameId}:`, error);
    res.status(500).json({ message: 'Server error while fetching signup', error: error.message });
  }
};
