import React, { useState, useEffect } from 'react';
import '../styles/GameResultsStyles.css';
import skinsCalculatorUtil, { GAME_FORMATS } from '../utils/skinsCalculator';
import EnhancedStatusBadge from './EnhancedStatusBadge';

/**
 * GameResults Component
 * 
 * Displays the results and payouts for a game, including skins, CTP, and total winnings.
 */
const GameResults = ({ game, players, signups }) => {
  const [loadingScores, setLoadingScores] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [scores, setScores] = useState([]);
  const [skinsResults, setSkinsResults] = useState([]);
  const [playerSummary, setPlayerSummary] = useState([]);
  const [potInfo, setPotInfo] = useState({});
  const [gameFormat, setGameFormat] = useState(GAME_FORMATS.STANDARD);
  
  useEffect(() => {
    const initializeResults = () => {
      setLoadingScores(true);
      setErrorMessage('');
      
      try {
        if (!game || !players || !signups) {
          setLoadingScores(false);
          return;
        }
        
        // If the game has calculated scores, use those
        if (game.scores && game.scores.calculated) {
          setPlayerSummary(game.scores.calculated.playerResults || []);
          setSkinsResults(game.scores.calculated.skinsResults || []);
          setPotInfo(game.scores.calculated.potInfo || {});
          setLoadingScores(false);
          return;
        }
        
        // Otherwise, generate simulated results
        const activePlayers = signups.map(signup => {
          const player = players.find(p => p.id === signup.playerId);
          return player || { id: signup.playerId, name: 'Unknown Player', handicap: 12 };
        });
        
        // Generate scores
        const generatedScores = skinsCalculatorUtil.generateSimulatedScores(activePlayers);
        setScores(generatedScores);
        
        // Determine game format from game settings (default to STANDARD)
        const format = game.skinsFormat || GAME_FORMATS.STANDARD;
        setGameFormat(format);
        
        // Get course data (default to MONARCH_DUNES_DATA)
        const courseData = skinsCalculatorUtil.COURSE_DATA[game.course] || 
                          skinsCalculatorUtil.MONARCH_DUNES_DATA;
        
        // Calculate skins and results with the specified format
        const skins = skinsCalculatorUtil.calculateSkins(generatedScores, format, courseData);
        setSkinsResults(skins);
        
        // Calculate pot with additional options
        const potOptions = {
          ctpPercentage: 0.25, // 25% to CTP by default
          lowNetPercentage: game.lowNetPercentage || 0,
          secondPlacePercentage: game.secondPlacePercentage || 0
        };
        
        const pot = skinsCalculatorUtil.calculatePot(activePlayers.length, game.entryFee || 20, potOptions);
        setPotInfo(pot);
        
        // Generate comprehensive player summary
        const summary = skinsCalculatorUtil.generatePlayerSummary(
          activePlayers,
          generatedScores,
          skins,
          pot,
          game.ctpPlayerId
        );
        setPlayerSummary(summary);
        
        setLoadingScores(false);
      } catch (error) {
        console.error('Error initializing results:', error);
        setErrorMessage('Error generating game results');
        setLoadingScores(false);
      }
    };
    
    initializeResults();
  }, [game, players, signups]);
  
  // Get player name from ID
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };
  
  if (loadingScores) {
    return <div className="loading">Loading results...</div>;
  }
  
  if (errorMessage) {
    return <div className="error-message">{errorMessage}</div>;
  }
  
  // If no game or no signups, show empty state
  if (!game || !signups || signups.length === 0) {
    return (
      <div className="empty-results-state">
        <p>No player data available for this game</p>
      </div>
    );
  }
  
  return (
    <div className="game-results">
      <div className="results-header">
        <h3>Results & Payouts</h3>
        
        {game.status && (
          <div className="game-status">
            <EnhancedStatusBadge status={game.status} size="medium" />
          </div>
        )}
      </div>
      
      {/* Display pot information */}
      <div className="pot-info">
        <div className="pot-breakdown">
          <div className="pot-item">
            <span className="pot-label">Total Pot:</span>
            <span className="pot-value">${potInfo.total || 0}</span>
          </div>
          <div className="pot-item">
            <span className="pot-label">Skins Pot:</span>
            <span className="pot-value">${potInfo.skins || 0}</span>
          </div>
          <div className="pot-item">
            <span className="pot-label">CTP Pot:</span>
            <span className="pot-value">${potInfo.ctp || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Player Results Summary */}
      <div className="player-results">
        <h4>Player Results</h4>
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
                <tr key={player.playerId} className={player.totalMoney > 0 ? 'winner-highlight' : ''}>
                  <td>{index + 1}</td>
                  <td>{player.playerName}</td>
                  <td>{player.rawScore || '-'}</td>
                  <td>{player.netScore || '-'}</td>
                  <td>{player.skinsWon || 0}</td>
                  <td>
                    ${player.totalMoney || player.moneyEarned || 0}
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
        <div className="skins-breakdown">
          <h4>Skins Breakdown</h4>
          <table className="skins-table">
            <thead>
              <tr>
                <th>Hole</th>
                <th>Winner</th>
                <th>Score</th>
                <th>Type</th>
                <th>Skins Value</th>
              </tr>
            </thead>
            <tbody>
              {skinsResults.map(result => (
                <tr key={result.holeNumber} className={result.playerId ? 'winning-skin' : ''}>
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
                          <span className="money-value">${result.value * potInfo.skinValue}</span>
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

      {/* Player Stats Summary */}
      {playerSummary.length > 0 && playerSummary.some(p => p.birdiesOrBetter > 0 || p.pars > 0) && (
        <div className="player-stats">
          <h4>Player Stats</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Birdies+</th>
                <th>Pars</th>
                <th>Net Score</th>
                <th>Vs. Par</th>
              </tr>
            </thead>
            <tbody>
              {playerSummary
                .sort((a, b) => (a.netScore || 0) - (b.netScore || 0))
                .map(player => (
                  <tr key={player.playerId}>
                    <td>{player.playerName}</td>
                    <td>{player.birdiesOrBetter || 0}</td>
                    <td>{player.pars || 0}</td>
                    <td>{player.netScore || '-'}</td>
                    <td className={player.relativeToPar > 0 ? 'over-par' : player.relativeToPar < 0 ? 'under-par' : ''}>
                      {player.relativeToPar !== undefined ? (
                        player.relativeToPar === 0 ? 'E' : 
                        (player.relativeToPar > 0 ? '+' : '') + player.relativeToPar
                      ) : '-'}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* CTP Winner */}
      {game.ctpPlayerId && (
        <div className="ctp-winner">
          <h4>Closest to Pin Winner (${potInfo.ctpValue || 0})</h4>
          <p>{getPlayerName(game.ctpPlayerId)}</p>
        </div>
      )}
    </div>
  );
};

export default GameResults;
