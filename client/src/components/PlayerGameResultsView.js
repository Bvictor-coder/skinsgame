import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dataSync from '../utils/dataSync';
import skinsCalculatorUtil from '../utils/skinsCalculator';
import EnhancedStatusBadge from './EnhancedStatusBadge';
import '../styles/GameResultsStyles.css';

/**
 * PlayerGameResultsView Component
 * 
 * Displays game results specifically for players, including final scores, 
 * skins won, and payouts. This component is designed to be easily accessible
 * from the player's dashboard and from completed game views.
 */
const PlayerGameResultsView = ({ gameId, playerId }) => {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [signups, setSignups] = useState([]);
  const [playerSummary, setPlayerSummary] = useState([]);
  const [skinsResults, setSkinsResults] = useState([]);
  const [potInfo, setPotInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load game and result data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        
        // Load all games and find the one we need
        const gamesData = await dataSync.getGames();
        const currentGame = gamesData.find(g => g.id === gameId);
        
        if (!currentGame) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        setGame(currentGame);
        
        // Load players data
        const playersData = await dataSync.getFriends();
        setPlayers(playersData);
        
        // Load signups for this game
        const gameSignups = await dataSync.getSignups(gameId);
        setSignups(gameSignups);
        
        // If the game has calculated scores, use those
        if (currentGame.scores && currentGame.scores.calculated) {
          setPlayerSummary(currentGame.scores.calculated.playerResults || []);
          setSkinsResults(currentGame.scores.calculated.skinsResults || []);
          setPotInfo(currentGame.scores.calculated.potInfo || {});
        } else {
          // Otherwise, try to calculate them ourselves
          const activePlayers = gameSignups.map(signup => {
            const player = playersData.find(p => p.id === signup.playerId);
            return player || { id: signup.playerId, name: 'Unknown Player', handicap: 12 };
          });
          
          // Generate scores
          const generatedScores = skinsCalculatorUtil.generateSimulatedScores(activePlayers);
          
          // Get course data
          const courseData = skinsCalculatorUtil.COURSE_DATA[currentGame.course] || 
                              skinsCalculatorUtil.MONARCH_DUNES_DATA;
          
          // Calculate skins
          const format = currentGame.skinsFormat || skinsCalculatorUtil.GAME_FORMATS.STANDARD;
          const skins = skinsCalculatorUtil.calculateSkins(generatedScores, format, courseData);
          setSkinsResults(skins);
          
          // Calculate pot
          const potOptions = {
            ctpPercentage: 0.25, // 25% to CTP by default
            lowNetPercentage: currentGame.lowNetPercentage || 0,
            secondPlacePercentage: currentGame.secondPlacePercentage || 0
          };
          
          const pot = skinsCalculatorUtil.calculatePot(
            activePlayers.length,
            currentGame.entryFee || 20,
            potOptions
          );
          setPotInfo(pot);
          
          // Generate player summary
          const summary = skinsCalculatorUtil.generatePlayerSummary(
            activePlayers,
            generatedScores,
            skins,
            pot,
            currentGame.ctpPlayerId
          );
          setPlayerSummary(summary);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Failed to load game results');
        setLoading(false);
      }
    };
    
    loadGameData();
  }, [gameId]);

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

  // Get player's results
  const getPlayerResults = () => {
    if (!playerSummary.length || !playerId) return null;
    
    return playerSummary.find(p => p.playerId === playerId);
  };

  if (loading) {
    return <div className="loading">Loading game results...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!game) {
    return <div className="no-results">Game not found</div>;
  }

  const playerData = playerId ? getPlayerResults() : null;
  const ctpWinner = game.ctpPlayerId ? players.find(p => p.id === game.ctpPlayerId) : null;
  
  return (
    <div className="player-game-results">
      <div className="game-results-header">
        <h2>{getCourseName(game.course)}</h2>
        <p className="game-date">{formatDate(game.date)} • {game.time || 'Time not specified'}</p>
        <div className="game-status">
          <EnhancedStatusBadge status={game.status || 'created'} size="medium" />
        </div>
      </div>
      
      {playerId && playerData && (
        <div className="your-results-summary">
          <h3>Your Results</h3>
          <div className="player-result-card">
            <div className="result-section">
              <div className="result-label">Score:</div>
              <div className="result-value">
                {playerData.rawScore || '-'} (Net: {playerData.netScore || '-'})
              </div>
            </div>
            <div className="result-section">
              <div className="result-label">Skins Won:</div>
              <div className="result-value">{playerData.skinsWon || 0}</div>
            </div>
            <div className="result-section">
              <div className="result-label">Winnings:</div>
              <div className="result-value">${playerData.totalMoney || 0}</div>
            </div>
            {playerData.isCtp && (
              <div className="ctp-badge">
                CTP Winner: +${potInfo.ctpValue || 0}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="results-sections">
        {/* Player Results Table */}
        <div className="results-section">
          <h3>Player Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Player</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Skins</th>
                <th>Winnings</th>
              </tr>
            </thead>
            <tbody>
              {playerSummary.length > 0 ? (
                playerSummary.map((player, index) => (
                  <tr 
                    key={player.playerId} 
                    className={`${player.totalMoney > 0 ? 'winner-highlight' : ''} ${player.playerId === playerId ? 'current-player-highlight' : ''}`}
                  >
                    <td>{index + 1}</td>
                    <td>{player.playerName}</td>
                    <td>{player.rawScore || '-'}</td>
                    <td>{player.netScore || '-'}</td>
                    <td>{player.skinsWon || 0}</td>
                    <td>
                      ${player.totalMoney || 0}
                      {player.isCtp ? ' (includes CTP)' : ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No results available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Skins Breakdown */}
        {skinsResults.length > 0 && (
          <div className="results-section">
            <h3>Skins Breakdown</h3>
            <table className="skins-table">
              <thead>
                <tr>
                  <th>Hole</th>
                  <th>Winner</th>
                  <th>Score</th>
                  <th>Type</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {skinsResults.map(result => (
                  <tr 
                    key={result.holeNumber} 
                    className={`${result.playerId ? 'winning-skin' : ''} ${result.playerId === playerId ? 'current-player-highlight' : ''}`}
                  >
                    <td>{result.holeNumber}</td>
                    <td>{result.winner}</td>
                    <td>
                      {result.netScore !== undefined && (
                        <>
                          {result.rawScore !== undefined ? (
                            <span className="score-display">
                              {result.rawScore}{result.handicapUsed && <sup className="handicap-indicator">H</sup>} → {result.netScore}
                            </span>
                          ) : (
                            result.netScore
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {result.scoreType && (
                        <span className={`score-type ${result.scoreType}`}>
                          {result.scoreType.charAt(0).toUpperCase() + result.scoreType.slice(1)}
                        </span>
                      )}
                    </td>
                    <td>
                      {result.value > 0 
                        ? (
                          <span className="skin-value">
                            {result.value} {result.includesEndCarryover && '(+carryover)'} 
                            <span className="money-value">${result.value * (potInfo.skinValue || 0)}</span>
                          </span>
                        ) 
                        : (
                          <span className="carryover">{result.carryover ? `Carryover: ${result.carryover}` : '-'}</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* CTP Winner */}
        {ctpWinner && (
          <div className="ctp-winner-section">
            <h3>Closest to Pin Winner (${potInfo.ctpValue || 0})</h3>
            <div className={`ctp-winner-display ${game.ctpPlayerId === playerId ? 'current-player-highlight' : ''}`}>
              {ctpWinner.name || 'Unknown Player'}
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="results-nav-buttons">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
        <button className="btn-primary" onClick={() => navigate('/game-history')}>
          Game History
        </button>
      </div>
    </div>
  );
};

export default PlayerGameResultsView;
