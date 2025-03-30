import Game from '../models/Game.js';
import Signup from '../models/Signup.js';
import mongoose from 'mongoose';

// Get all games
export const getGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ date: -1 });
    res.status(200).json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Server error while fetching games', error: error.message });
  }
};

// Get upcoming games
export const getUpcomingGames = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingGames = await Game.find({
      $and: [
        { date: { $gte: today } },
        { status: { $ne: 'canceled' } }
      ]
    }).sort({ date: 1 });
    
    res.status(200).json(upcomingGames);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({ message: 'Server error while fetching upcoming games', error: error.message });
  }
};

// Get past games
export const getPastGames = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastGames = await Game.find({
      $or: [
        { date: { $lt: today } },
        { status: 'completed' },
        { status: 'canceled' }
      ]
    }).sort({ date: -1 });
    
    res.status(200).json(pastGames);
  } catch (error) {
    console.error('Error fetching past games:', error);
    res.status(500).json({ message: 'Server error while fetching past games', error: error.message });
  }
};

// Get a specific game by ID
export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json(game);
  } catch (error) {
    console.error(`Error fetching game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while fetching game', error: error.message });
  }
};

// Create a new game
export const createGame = async (req, res) => {
  try {
    const { 
      date, time, course, holes, ctpHole, entryFee,
      signupDeadline, wolfEnabled, notes 
    } = req.body;
    
    if (!date || !course) {
      return res.status(400).json({ message: 'Date and course are required' });
    }
    
    const newGame = new Game({
      date,
      time: time || '',
      course,
      holes: holes || 18,
      ctpHole: ctpHole || 2,
      entryFee: entryFee || 10,
      signupDeadline: signupDeadline || null,
      wolfEnabled: wolfEnabled || false,
      notes: notes || '',
      status: 'upcoming',
      groups: []
    });
    
    const savedGame = await newGame.save();
    res.status(201).json(savedGame);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ message: 'Server error while creating game', error: error.message });
  }
};

// Update a game
export const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, time, course, holes, ctpHole, entryFee,
      signupDeadline, wolfEnabled, notes, status
    } = req.body;
    
    if (!date || !course) {
      return res.status(400).json({ message: 'Date and course are required' });
    }
    
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      {
        date,
        time: time || '',
        course,
        holes: holes || 18,
        ctpHole: ctpHole || 2,
        entryFee: entryFee || 10,
        signupDeadline: signupDeadline || null,
        wolfEnabled: wolfEnabled || false,
        notes: notes || '',
        status: status || 'upcoming'
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedGame) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json(updatedGame);
  } catch (error) {
    console.error(`Error updating game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating game', error: error.message });
  }
};

// Delete a game
export const deleteGame = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Delete the game
    const deletedGame = await Game.findByIdAndDelete(id).session(session);
    
    if (!deletedGame) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Delete all signups for this game
    await Signup.deleteMany({ gameId: id }).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ message: 'Game deleted successfully', game: deletedGame });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error(`Error deleting game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while deleting game', error: error.message });
  }
};

// Update game status
export const updateGameStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['upcoming', 'completed', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (upcoming, completed, or canceled)' });
    }
    
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedGame) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json(updatedGame);
  } catch (error) {
    console.error(`Error updating status for game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating game status', error: error.message });
  }
};

// Update game groups
export const updateGameGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const { groups } = req.body;
    
    if (!groups || !Array.isArray(groups)) {
      return res.status(400).json({ message: 'Valid groups array is required' });
    }
    
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { groups },
      { new: true, runValidators: true }
    );
    
    if (!updatedGame) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json(updatedGame);
  } catch (error) {
    console.error(`Error updating groups for game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating game groups', error: error.message });
  }
};

// Update game scores
export const updateGameScores = async (req, res) => {
  try {
    const { id } = req.params;
    const { scores } = req.body;
    
    if (!scores) {
      return res.status(400).json({ message: 'Scores object is required' });
    }
    
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { scores },
      { new: true, runValidators: true }
    );
    
    if (!updatedGame) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json(updatedGame);
  } catch (error) {
    console.error(`Error updating scores for game with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating game scores', error: error.message });
  }
};
