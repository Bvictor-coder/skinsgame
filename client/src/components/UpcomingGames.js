import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';

const UpcomingGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load games on component mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        
        // Get all games
        const gamesData = await dataSync.getGames();
        
        // Filter to only upcoming games (games with date >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const upcomingGames = gamesData
          .filter(game => {
            const gameDate = new Date(game.date);
            return gameDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setGames(upcomingGames);
        setLoading(false);
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load upcoming games');
        setLoading(false);
      }
    };
    
    loadGames();
  }, []);

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

  return (
    <div className="upcoming-games">
      <h2>Upcoming Games</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading upcoming games...</div>
      ) : (
        <>
          {games.length === 0 ? (
            <div className="alert alert-info">
              There are no upcoming games scheduled at this time.
            </div>
          ) : (
            <div className="games-list">
              {games.map(game => (
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UpcomingGames;
