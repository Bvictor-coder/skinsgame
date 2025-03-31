import React, { useState, useEffect } from 'react';
import { useUser } from '../utils/userContext';
import dataSync from '../utils/dataSync';

const PlayerSignUp = () => {
  const { user } = useUser();
  const [games, setGames] = useState([]);
  const [signups, setSignups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load games and player signups on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all games
        const gamesData = await dataSync.getGames();
        
        // Filter to only upcoming games
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const upcomingGames = gamesData
          .filter(game => {
            const gameDate = new Date(game.date);
            return gameDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setGames(upcomingGames);
        
        // Load signups for each game
        const playerSignups = {};
        
        for (const game of upcomingGames) {
          const gameSignups = await dataSync.getSignups(game.id);
          
          // Check if the current player is signed up
          const playerSignup = gameSignups.find(signup => signup.playerId === user.id);
          playerSignups[game.id] = playerSignup || null;
        }
        
        setSignups(playerSignups);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load games and signups');
        setLoading(false);
      }
    };
    
    if (user.id) {
      loadData();
    }
  }, [user.id]);

  // Toggle signup for a game
  const handleToggleSignup = async (gameId, currentSignup) => {
    try {
      setError('');
      setSuccess('');
      
      if (currentSignup) {
        // Remove signup
        // In a real API this would use the signup ID, but for localStorage we'll just filter
        
        // Get existing signups
        const gameSignups = await dataSync.getSignups(gameId);
        
        // Filter out the current player's signup
        const updatedSignups = gameSignups.filter(signup => signup.playerId !== user.id);
        
        // Update in localStorage
        const storedData = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
        if (storedData.signups) {
          storedData.signups[gameId] = updatedSignups;
          localStorage.setItem('golfSkinsOrganizer', JSON.stringify(storedData));
        }
        
        // Update local state
        setSignups(prev => ({
          ...prev,
          [gameId]: null
        }));
        
        setSuccess('You have been successfully removed from this game');
      } else {
        // Add signup
        const newSignup = {
          playerId: user.id,
          wolf: false, // Default to not wolf
          notes: ''
        };
        
        // Add to dataSync
        await dataSync.addSignup(gameId, newSignup);
        
        // Update local state
        setSignups(prev => ({
          ...prev,
          [gameId]: newSignup
        }));
        
        setSuccess('You have been successfully signed up for this game');
      }
    } catch (err) {
      console.error('Error updating signup:', err);
      setError('Failed to update signup');
    }
  };

  // Handle wolf option toggle
  const handleWolfToggle = async (gameId) => {
    try {
      setError('');
      
      const currentSignup = signups[gameId];
      if (!currentSignup) return;
      
      // Toggle wolf status
      const updatedSignup = {
        ...currentSignup,
        wolf: !currentSignup.wolf
      };
      
      // Update in localStorage
      const storedData = JSON.parse(localStorage.getItem('golfSkinsOrganizer') || '{}');
      if (storedData.signups && storedData.signups[gameId]) {
        const index = storedData.signups[gameId].findIndex(signup => signup.playerId === user.id);
        if (index !== -1) {
          storedData.signups[gameId][index] = updatedSignup;
          localStorage.setItem('golfSkinsOrganizer', JSON.stringify(storedData));
        }
      }
      
      // Update local state
      setSignups(prev => ({
        ...prev,
        [gameId]: updatedSignup
      }));
      
      setSuccess('Wolf game preference updated');
    } catch (err) {
      console.error('Error updating wolf preference:', err);
      setError('Failed to update wolf preference');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get course name from ID
  const getCourseName = (courseId) => {
    const courses = {
      'monarch-dunes': 'Monarch Dunes',
      'avila-beach': 'Avila Beach Golf Resort',
      'hunter-ranch': 'Hunter Ranch Golf Course',
      'dairy-creek': 'Dairy Creek Golf Course',
      'chalk-mountain': 'Chalk Mountain Golf Course',
      'morro-bay': 'Morro Bay Golf Course',
      'sea-pines': 'Sea Pines Golf Resort',
      'cypress-ridge': 'Cypress Ridge Golf Course',
      'black-lake': 'Blacklake Golf Resort'
    };
    
    return courses[courseId] || courseId;
  };

  // Check if signup deadline has passed
  const isSignupClosed = (game) => {
    if (!game.signupDeadline) return false;
    
    const now = new Date();
    const deadline = new Date(game.signupDeadline);
    
    return now > deadline;
  };

  if (!user.id) {
    return (
      <div className="sign-up-container">
        <h2>Sign Up for Games</h2>
        <div className="alert alert-info">
          Please log in to sign up for games.
        </div>
      </div>
    );
  }

  return (
    <div className="sign-up-container">
      <h2>Sign Up for Games</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading games...</div>
      ) : (
        <>
          {games.length === 0 ? (
            <div className="alert alert-info">
              There are no upcoming games available for sign-up at this time.
            </div>
          ) : (
            <div className="games-list">
              {games.map(game => {
                const isSignedUp = !!signups[game.id];
                const signupStatus = isSignedUp 
                  ? 'You are signed up for this game' 
                  : 'You are not signed up for this game';
                const closed = isSignupClosed(game);
                
                return (
                  <div key={game.id} className="game-card card">
                    <div className="game-header">
                      <h3>{getCourseName(game.course)}</h3>
                      <span className="game-date">{formatDate(game.date)}</span>
                    </div>
                    
                    <div className="game-details">
                      <div className="detail-item">
                        <strong>Time:</strong> {game.time}
                      </div>
                      <div className="detail-item">
                        <strong>Format:</strong> {game.holes} Holes
                      </div>
                      <div className="detail-item">
                        <strong>Entry Fee:</strong> ${game.entryFee || 0}
                      </div>
                      {game.ctpHole && (
                        <div className="detail-item">
                          <strong>Closest to Pin:</strong> Hole #{game.ctpHole}
                        </div>
                      )}
                      {game.signupDeadline && (
                        <div className="detail-item">
                          <strong>Sign-up Deadline:</strong> {new Date(game.signupDeadline).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {game.notes && (
                      <div className="game-notes">
                        <strong>Notes:</strong> {game.notes}
                      </div>
                    )}
                    
                    <div className="signup-status">
                      <div className={`status-indicator ${isSignedUp ? 'signed-up' : 'not-signed-up'}`}>
                        {signupStatus}
                      </div>
                      
                      {!closed && (
                        <button 
                          className={`btn ${isSignedUp ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleSignup(game.id, signups[game.id])}
                        >
                          {isSignedUp ? 'Cancel Sign-up' : 'Sign Up'}
                        </button>
                      )}
                      
                      {closed && !isSignedUp && (
                        <div className="alert alert-warning">
                          Sign-up is closed for this game
                        </div>
                      )}
                    </div>
                    
                    {isSignedUp && game.wolfEnabled && (
                      <div className="wolf-option">
                        <label className="checkbox-label">
                          <input 
                            type="checkbox"
                            checked={signups[game.id].wolf}
                            onChange={() => handleWolfToggle(game.id)}
                            disabled={closed}
                          />
                          <span>I want to participate in the Wolf Game</span>
                        </label>
                        <p className="hint">
                          Wolf Game is an additional side game where players take turns being the "Wolf" and picking partners after watching tee shots.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerSignUp;
