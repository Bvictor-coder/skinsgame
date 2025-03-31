import React, { useState } from 'react';
import dataSync from '../utils/dataSync';
import NewGameNotification from './NewGameNotification';

const NewGameForm = () => {
  const initialFormState = {
    course: '',
    date: '',
    time: '',
    holes: '18',
    ctpHole: '',
    entryFee: '',
    signupDeadline: '',
    wolfEnabled: false,
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newGame, setNewGame] = useState(null);

  // Course options
  const courses = [
    { id: 'monarch-dunes', name: 'Monarch Dunes' },
    { id: 'avila-beach', name: 'Avila Beach Golf Resort' },
    { id: 'hunter-ranch', name: 'Hunter Ranch Golf Course' },
    { id: 'dairy-creek', name: 'Dairy Creek Golf Course' },
    { id: 'chalk-mountain', name: 'Chalk Mountain Golf Course' },
    { id: 'morro-bay', name: 'Morro Bay Golf Course' },
    { id: 'sea-pines', name: 'Sea Pines Golf Resort' },
    { id: 'cypress-ridge', name: 'Cypress Ridge Golf Course' },
    { id: 'black-lake', name: 'Blacklake Golf Resort' }
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validation
    if (!formData.course) {
      setError('Please select a course');
      return;
    }
    
    if (!formData.date) {
      setError('Please select a date');
      return;
    }
    
    if (!formData.time) {
      setError('Please select a time');
      return;
    }
    
    // Make sure entry fee is a number
    if (formData.entryFee && isNaN(parseFloat(formData.entryFee))) {
      setError('Entry fee must be a number');
      return;
    }
    
    // Make sure CTP hole is a valid number if provided
    if (formData.ctpHole) {
      const ctpHole = parseInt(formData.ctpHole, 10);
      if (isNaN(ctpHole) || ctpHole < 1 || ctpHole > parseInt(formData.holes, 10)) {
        setError(`CTP hole must be between 1 and ${formData.holes}`);
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Process data for the API
      const gameData = {
        ...formData,
        entryFee: formData.entryFee ? parseFloat(formData.entryFee) : null,
        ctpHole: formData.ctpHole ? parseInt(formData.ctpHole, 10) : null,
        holes: parseInt(formData.holes, 10),
        status: 'open', // Default status for new games
        groups: [] // Initialize with empty groups
      };
      
      // Add to dataSync
      const createdGame = await dataSync.addGame(gameData);
      
      // Set the newly created game for notification
      setNewGame({
        ...gameData,
        id: createdGame.id
      });
      
      // Reset form and show success message
      setFormData(initialFormState);
      setSuccess(true);
      
    } catch (err) {
      console.error('Error adding game:', err);
      setError('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  // Format today's date as YYYY-MM-DD for the date input min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="new-game-form">
      <h2>Create New Game</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          Game created successfully!
        </div>
      )}
      
      {/* New Game Notification */}
      {newGame && (
        <NewGameNotification 
          game={newGame} 
          onClose={() => setNewGame(null)} 
        />
      )}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Course Selection */}
          <div className="form-group">
            <label htmlFor="course">Golf Course</label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date and Time */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                min={today}
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="time">Tee Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          {/* Golf Options */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="holes">Number of Holes</label>
              <select
                id="holes"
                name="holes"
                value={formData.holes}
                onChange={handleInputChange}
              >
                <option value="9">9 Holes</option>
                <option value="18">18 Holes</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="entryFee">Entry Fee ($)</label>
              <input
                type="number"
                id="entryFee"
                name="entryFee"
                min="0"
                step="0.01"
                value={formData.entryFee}
                onChange={handleInputChange}
                placeholder="Entry fee amount"
              />
            </div>
          </div>
          
          {/* Additional Options */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ctpHole">Closest to Pin Hole (Optional)</label>
              <input
                type="number"
                id="ctpHole"
                name="ctpHole"
                min="1"
                max={formData.holes}
                value={formData.ctpHole}
                onChange={handleInputChange}
                placeholder={`Hole number (1-${formData.holes})`}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signupDeadline">Sign-up Deadline</label>
              <input
                type="datetime-local"
                id="signupDeadline"
                name="signupDeadline"
                value={formData.signupDeadline}
                onChange={handleInputChange}
              />
              <p className="hint">When players must sign up by (optional)</p>
            </div>
          </div>
          
          {/* Wolf Game Option */}
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="wolfEnabled"
              name="wolfEnabled"
              checked={formData.wolfEnabled}
              onChange={handleInputChange}
            />
            <label htmlFor="wolfEnabled">Enable Wolf Game</label>
          </div>
          
          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information about this game..."
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setFormData(initialFormState);
                setError('');
                setSuccess(false);
              }}
              disabled={loading}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGameForm;
