import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';
import GameResults from './GameResults';
import EnhancedStatusBadge from './EnhancedStatusBadge';
import '../styles/GameHistoryStyles.css';

const GameHistory = () => {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [signups, setSignups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  // Load games, players, and signups on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all games
        const gamesData = await dataSync.getGames();
        
        // Filter to only past games (games with date < today)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const pastGames = gamesData
          .filter(game => {
            const gameDate = new Date(game.date);
            return gameDate < today;
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort latest first
        
        setGames(pastGames);
        
        // Select the first game by default if any exist
        if (pastGames.length > 0) {
          setSelectedGame(pastGames[0]);
          
          // Load signups for the first game
          const gameSignups = await dataSync.getSignups(pastGames[0].id);
          setSignups({ [pastGames[0].id]: gameSignups });
        }
        
        // Get all players
        const playersData = await dataSync.getFriends();
        setPlayers(playersData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load games and players');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load signups when the selected game changes
  useEffect(() => {
    const loadSignups = async () => {
      if (!selectedGame) return;
      
      if (signups[selectedGame.id]) {
        // Already loaded
        return;
      }
      
      try {
        setLoading(true);
        const gameSignups = await dataSync.getSignups(selectedGame.id);
        setSignups(prevSignups => ({
          ...prevSignups,
          [selectedGame.id]: gameSignups
        }));
        setLoading(false);
      } catch (err) {
        console.error('Error loading signups:', err);
        setError('Failed to load sign-ups for this game');
        setLoading(false);
      }
    };
    
    loadSignups();
  }, [selectedGame, signups]);

  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setError('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get formatted date range
  const getDateRange = () => {
    if (games.length === 0) return 'No games found';
    
    if (games.length === 1) {
      return formatDate(games[0].date);
    }
    
    // Get oldest and newest dates
    const oldestDate = new Date(games[games.length - 1].date);
    const newestDate = new Date(games[0].date);
    
    const oldestOptions = { month: 'short', year: 'numeric' };
    const newestOptions = { month: 'short', year: 'numeric' };
    
    return `${oldestDate.toLocaleDateString(undefined, oldestOptions)} - ${newestDate.toLocaleDateString(undefined, newestOptions)}`;
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

  // Get player name from ID
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  // Get active signups for the selected game
  const getActiveSignups = () => {
    if (!selectedGame) return [];
    return signups[selectedGame.id] || [];
  };

  // Get game results from the calculated scores in the game data
  const getGameResults = () => {
    if (!selectedGame) return [];
    
    // Check if the game has calculated results
    if (selectedGame.scores && selectedGame.scores.calculated) {
      // Use the calculated player results from the skins calculator
      return selectedGame.scores.calculated.playerResults.map(playerResult => {
        const player = players.find(p => p.id === playerResult.playerId);
        
        return {
          playerId: playerResult.playerId,
          name: playerResult.playerName || (player ? player.name : 'Unknown Player'),
          handicap: player ? player.handicap : null,
          skins: playerResult.skinsWon || 0,
          moneyEarned: playerResult.winnings || 0,
          isCtp: selectedGame.ctpPlayerId === playerResult.playerId
        };
      });
    }
    
    // If no calculated results, return the active signups just to show players
    const activeSignups = getActiveSignups();
    if (activeSignups.length === 0) return [];
    
    return activeSignups.map(signup => {
      const player = players.find(p => p.id === signup.playerId);
      
      return {
        playerId: signup.playerId,
        name: player ? player.name : 'Unknown Player',
        handicap: player ? player.handicap : null,
        skins: 0,
        moneyEarned: 0, 
        isCtp: selectedGame.ctpPlayerId === signup.playerId
      };
    });
  };

  return (
    <div className="game-history">
      <h2>Game History</h2>
      <p className="date-range">{getDateRange()}</p>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {loading && !games.length ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="history-container">
          {/* Games sidebar */}
          <div className="games-sidebar">
            <h3>Past Games</h3>
            {games.length === 0 ? (
              <p className="empty-state">No past games found</p>
            ) : (
              <ul className="game-list">
                {games.map(game => (
                  <li 
                    key={game.id}
                    className={`game-item ${selectedGame && selectedGame.id === game.id ? 'active' : ''}`}
                    onClick={() => handleGameSelect(game)}
                  >
                    <div className="game-date">{formatDate(game.date)}</div>
                    <div className="game-course">{getCourseName(game.course)}</div>
                    <div className="game-time">{game.time}</div>
                    <div className="game-info">
                      {game.holes} holes • ${game.entryFee || 0}
                      <div className="game-item-status">
                        <EnhancedStatusBadge status={game.status || 'created'} size="small" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Game details panel */}
          <div className="game-details-panel">
            {selectedGame ? (
              <>
                <div className="selected-game-header">
                  <div>
                    <h3>{getCourseName(selectedGame.course)}</h3>
                    <p className="selected-game-info">
                      {formatDate(selectedGame.date)} • {selectedGame.time} • 
                      {selectedGame.holes} holes • ${selectedGame.entryFee || 0}
                    </p>
                    {selectedGame.notes && (
                      <p className="game-notes">{selectedGame.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="results-container card">
                  <h4>Results & Payouts</h4>
                  
                  {selectedGame.status === 'finalized' ? (
                    <div className="finalized-badge">
                      <span className="game-finalized">Game Finalized</span>
                    </div>
                  ) : selectedGame.status === 'completed' ? (
                    <div className="completed-badge">
                      <span className="game-completed">Game Completed</span>
                    </div>
                  ) : (
                    <div className="status-badge">
                      <EnhancedStatusBadge status={selectedGame.status || 'created'} size="medium" />
                    </div>
                  )}
                  
                  {getActiveSignups().length === 0 ? (
                    <p className="empty-state">No player data available for this game</p>
                  ) : (
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Place</th>
                          <th>Player</th>
                          <th>Handicap</th>
                          <th>Skins</th>
                          <th>Winnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getGameResults().map((result, index) => (
                          <tr key={result.playerId} className={result.skins > 0 || result.isCtp ? 'winner-highlight' : ''}>
                            <td>{index + 1}</td>
                            <td>{result.name}</td>
                            <td>{result.handicap !== null ? result.handicap : '-'}</td>
                            <td>{result.skins}</td>
                            <td>${result.moneyEarned}{result.isCtp ? ' + CTP' : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  
                  {selectedGame.ctpPlayerId && (
                    <div className="ctp-winner">
                      <h4>Closest to Pin Winner</h4>
                      <p>{getPlayerName(selectedGame.ctpPlayerId)}</p>
                    </div>
                  )}
                </div>
                
                <div className="player-list">
                  <h4>Players ({getActiveSignups().length})</h4>
                  <div className="player-chips">
                    {getActiveSignups().map(signup => (
                      <div key={signup.playerId} className="player-chip">
                        {getPlayerName(signup.playerId)}
                        {signup.wolf && <span className="wolf-badge">Wolf</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                {getActiveSignups().length > 0 && (
                  <div className="game-results-container">
                    <GameResults 
                      game={selectedGame} 
                      players={players}
                      signups={getActiveSignups()}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>Select a game to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
