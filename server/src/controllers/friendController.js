import Friend from '../models/Friend.js';

// Get all friends
export const getFriends = async (req, res) => {
  try {
    const friends = await Friend.find().sort({ name: 1 });
    res.status(200).json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Server error while fetching friends', error: error.message });
  }
};

// Get a specific friend by ID
export const getFriendById = async (req, res) => {
  try {
    const { id } = req.params;
    const friend = await Friend.findById(id);
    
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    res.status(200).json(friend);
  } catch (error) {
    console.error(`Error fetching friend with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while fetching friend', error: error.message });
  }
};

// Create a new friend
export const createFriend = async (req, res) => {
  try {
    const { name, email, handicap } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Check if a friend with this email already exists
    const existingFriend = await Friend.findOne({ email });
    if (existingFriend) {
      return res.status(409).json({ message: 'A friend with this email already exists' });
    }
    
    const newFriend = new Friend({
      name,
      email,
      handicap: handicap === '' ? null : handicap
    });
    
    const savedFriend = await newFriend.save();
    res.status(201).json(savedFriend);
  } catch (error) {
    console.error('Error creating friend:', error);
    res.status(500).json({ message: 'Server error while creating friend', error: error.message });
  }
};

// Update a friend
export const updateFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, handicap } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Check if email is being changed and if new email already exists
    const existingFriend = await Friend.findOne({ email, _id: { $ne: id } });
    if (existingFriend) {
      return res.status(409).json({ message: 'Another friend with this email already exists' });
    }
    
    const updatedFriend = await Friend.findByIdAndUpdate(
      id,
      { name, email, handicap: handicap === '' ? null : handicap },
      { new: true, runValidators: true }
    );
    
    if (!updatedFriend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    res.status(200).json(updatedFriend);
  } catch (error) {
    console.error(`Error updating friend with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while updating friend', error: error.message });
  }
};

// Delete a friend
export const deleteFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFriend = await Friend.findByIdAndDelete(id);
    
    if (!deletedFriend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    // If friend is successfully deleted, return 200 with the deleted friend
    res.status(200).json({ message: 'Friend deleted successfully', friend: deletedFriend });
  } catch (error) {
    console.error(`Error deleting friend with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error while deleting friend', error: error.message });
  }
};
