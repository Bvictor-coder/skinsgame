import React, { useState, useEffect } from 'react';
import skinsCalculatorUtil, { 
  MONARCH_DUNES_DATA, 
  GAME_FORMATS, 
  DEFAULT_FORMAT
} from '../utils/skinsCalculator';

const SkinsCalculator = ({ gameId, players = [] }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [playerSummary, setPlayerSummary] = useState([]);
  const [format, setFormat] = useState(DEFAULT_FORMAT);
  const [gameOptions, setGameOptions] = useState({
    ctpHole: 2, // Default CTP on hole #2
    entryFee: 20,
    ctpPercentage: 0.25 // 25% of pot to CTP
  });

  // Initialize data and calculate results when players change
  useEffect(() => {
    if (players.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Generate simulated scores using the half-stroke format
      const generatedScores = skinsCalculatorUtil.generateSimulatedScores(
        players, 
        MONARCH_DUNES_DATA,
        format
      );
      setScores(generatedScores);
      
      // Calculate skins results with the specified format
      const skins = skinsCalculatorUtil.calculateSkins(
        generatedScores, 
        format, 
        MONARCH_DUNES_DATA
      );
      setResults(skins);
      
      // Calculate pot with CTP percentage
      const potOptions = {
        ctpPercentage: gameOptions.ctpPercentage,
        // No low net or second place prizes by default
        lowNetPercentage: 0,
        secondPlacePercentage: 0
      };
      
      const pot = skinsCalculatorUtil.calculatePot(
        players.length, 
        gameOptions.entryFee, 
        potOptions
      );
      
      // Choose a random CTP winner (or use a pre-defined one if specified)
      const ctpPlayerId = players.length > 0 ? 
        players[Math.floor(Math.random() * players.length)].id : 
        null;
      
      // Generate comprehensive player summary
      const summary = skinsCalculatorUtil.generatePlayerSummary(
        players,
        generatedScores,
        skins,
        pot,
        ctpPlayerId
      );
      
      setPlayerSummary(summary);
      setLoading(false);
    } catch (error) {
      console.error('Error generating skins calculations:', error);
      setLoading(false);
    }
  }, [players, format, gameOptions]);

  if (loading) {
    return <p>Loading skins calculator...</p>;
  }

  return (
    <div className="skins-calculator">
      <h3>Skins Calculation System</h3>
      
      <div className="skins-explanation card">
        <h4>How Handicaps Work in Skins at Monarch Dunes</h4>
        <p>In our skins game at Monarch Dunes, handicaps are applied using half strokes:</p>
        <ol>
          <li>Each hole has a handicap rating from 1 (hardest) to 18 (easiest)</li>
          <li>Players receive <strong>half stroke</strong> adjustments on holes based on their course handicap</li>
          <li>For example, a player with a 9 handicap would receive a half stroke on the 9 hardest holes</li>
          <li>If a player has a handicap over 18, they receive another half stroke (total of one full stroke) on holes where they would receive a stroke based on difficulty</li>
          <li>Example: A 20 handicap player gets a half stroke on all 18 holes, plus an additional half stroke on the 2 hardest holes</li>
          <li>After applying handicap strokes, the lowest net score on each hole wins the skin</li>
          <li>If multiple players tie for lowest net score, no skin is awarded for that hole (no carryover)</li>
        </ol>
        <p className="special-note">This is a field competition - all players compete against each other for skins regardless of which group they play in.</p>
        
        <h4>Monarch Dunes Hole Information</h4>
        <div className="handicap-table">
          <table>
            <thead>
              <tr>
                <th>Hole</th>
                <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th>
                <th>10</th><th>11</th><th>12</th><th>13</th><th>14</th><th>15</th><th>16</th><th>17</th><th>18</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Par</th>
                <td>4</td><td>3</td><td>5</td><td>4</td><td>4</td><td>3</td><td>4</td><td>5</td><td>4</td>
                <td>4</td><td>4</td><td>3</td><td>5</td><td>3</td><td>5</td><td>4</td><td>3</td><td>4</td>
              </tr>
              <tr>
                <th>Difficulty</th>
                <td>1</td><td>15</td><td>9</td><td>3</td><td>7</td><td>11</td><td>13</td><td>5</td><td>17</td>
                <td>2</td><td>14</td><td>16</td><td>4</td><td>1</td><td>8</td><td>12</td><td>10</td><td>6</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="handicap-note">Note: Lower difficulty numbers indicate harder holes where players are more likely to receive handicap strokes</p>
      </div>
      
      {players.length > 0 && (
        <>
          <div className="skins-results card">
            <h4>Skins Results (Simulated)</h4>
            <table className="results-table">
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
                {results.map(result => (
                  <tr key={result.holeNumber} className={result.playerId ? 'winner-highlight' : ''}>
                    <td>{result.holeNumber}</td>
                    <td>{result.winner}</td>
                    <td>
                      {result.netScore !== undefined && (
                        <>
                          {result.rawScore !== undefined ? (
                            <span className="score-display">
                              {result.rawScore}{result.handicapUsed && <sup>H</sup>} → {result.netScore}
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
                    <td>{result.value > 0 ? result.value : (result.tiedPlayers ? 'Tied' : '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="player-summary card">
            <h4>Player Summary</h4>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Skins</th>
                  <th>Winnings</th>
                </tr>
              </thead>
              <tbody>
                {playerSummary.map(player => (
                  <tr key={player.playerId} className={player.totalMoney > 0 ? 'winner-highlight' : ''}>
                    <td>{player.playerName}</td>
                    <td>{player.rawScore}</td>
                    <td>{player.netScore}</td>
                    <td>{player.skinsWon}</td>
                    <td>
                      ${player.totalMoney}
                      {player.isCtp ? ' (includes CTP)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {playerSummary.length > 0 && playerSummary.some(p => p.birdiesOrBetter > 0 || p.pars > 0) && (
            <div className="player-stats card">
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
        </>
      )}
    </div>
  );
};

export default SkinsCalculator;
