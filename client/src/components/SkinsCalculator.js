import React, { useState, useEffect, useCallback } from 'react';
// Import dataSync commented out as it's not currently used in this component
// import dataSync from '../utils/dataSync';

const SkinsCalculator = ({ gameId, players = [] }) => {
  const [courseData, setCourseData] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  // Monarch Dunes course data with actual hole handicaps
  const monarchDunesData = {
    name: 'Monarch Dunes',
    // Actual par values for Monarch Dunes
    par: [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 3, 5, 4, 3, 4], // Course par: 72 (Front 9: 36, Back 9: 36)
    // Handicap difficulty ratings from 1 (hardest) to 18 (easiest)
    // As provided by the course
    handicaps: [1, 15, 9, 3, 7, 11, 13, 5, 17, 2, 14, 16, 4, 1, 8, 12, 10, 6]
  };

  // Generate mock player scores - wrap in useCallback to fix dependency issues
  // Generate mock player scores
  const generateMockScores = useCallback(() => {
    if (!players.length || !courseData) return [];
    
    const playerScores = players.map(player => {
      // Convert handicap to strokes - typically players get strokes based on their handicap and the hole difficulty
      const handicap = player.handicap || 12; // Default to 12 if not set
      
      // Generate scores for each hole
      const holeScores = courseData.par.map((par, holeIndex) => {
        // Random score around par based on player skill
        const handicapAdjustment = Math.random() > 0.8 ? 1 : 0;
        const rawScore = par + Math.floor(Math.random() * 4) - 1 + handicapAdjustment;
        
        // Check if player gets a handicap stroke on this hole
        // In a traditional system, a player with handicap 9 would get strokes on the 9 hardest holes
        const getsStroke = handicap >= courseData.handicaps[holeIndex];
        
        return {
          holeNumber: holeIndex + 1,
          par: par,
          rawScore: rawScore,
          handicapStroke: getsStroke ? 1 : 0,
          netScore: getsStroke ? rawScore - 1 : rawScore
        };
      });
      
      return {
        player: player,
        holes: holeScores,
        totalRawScore: holeScores.reduce((sum, hole) => sum + hole.rawScore, 0),
        totalNetScore: holeScores.reduce((sum, hole) => sum + hole.netScore, 0)
      };
    });
    
    return playerScores;
  }, [courseData, players]);

  // Calculate skins results
  const calculateSkins = (scores) => {
    if (!scores.length) return [];
    
    const numberOfHoles = scores[0].holes.length;
    const skinsResults = [];
    let carryover = 0; // For tied holes
    
    // For each hole
    for (let holeIndex = 0; holeIndex < numberOfHoles; holeIndex++) {
      // Get all net scores for this hole
      const holeScores = scores.map(playerScore => ({
        playerId: playerScore.player.id,
        playerName: playerScore.player.name,
        netScore: playerScore.holes[holeIndex].netScore
      }));
      
      // Find the lowest score(s)
      const minScore = Math.min(...holeScores.map(s => s.netScore));
      const lowestScorers = holeScores.filter(s => s.netScore === minScore);
      
      // If there's only one lowest score, they win the skin
      if (lowestScorers.length === 1) {
        const winner = lowestScorers[0];
        skinsResults.push({
          holeNumber: holeIndex + 1,
          winner: winner.playerName,
          playerId: winner.playerId,
          value: 1 + carryover, // 1 skin plus any carryover
          netScore: winner.netScore
        });
        carryover = 0;
      } else {
        // Tied hole, carryover
        carryover++;
        skinsResults.push({
          holeNumber: holeIndex + 1,
          winner: 'Tied - Carryover',
          playerId: null,
          value: 0,
          netScore: minScore
        });
      }
    }
    
    return skinsResults;
  };

  // Load course data
  useEffect(() => {
    // We're always using Monarch Dunes data since that's the only course played
    setCourseData(monarchDunesData);
    setLoading(false);
  }, [monarchDunesData]); // Add monarchDunesData as dependency

  // Generate scores & calculate results when players or course changes
  useEffect(() => {
    if (courseData && players.length) {
      const generatedScores = generateMockScores();
      setScores(generatedScores);
      
      const skinsResults = calculateSkins(generatedScores);
      setResults(skinsResults);
    }
  }, [courseData, players, generateMockScores]); // Add generateMockScores as dependency

  // Generate player summary
  const generatePlayerSummary = () => {
    if (!players.length || !scores.length) return [];
    
    const summary = players.map(player => {
      const playerScore = scores.find(s => s.player.id === player.id);
      if (!playerScore) return null;
      
      // Count skins won
      const skinsWon = results.filter(r => r.playerId === player.id);
      const totalSkins = skinsWon.reduce((sum, skin) => sum + skin.value, 0);
      const skinValue = 10; // Arbitrary value per skin, e.g., $10 per skin
      
      return {
        playerId: player.id,
        playerName: player.name,
        rawScore: playerScore.totalRawScore,
        netScore: playerScore.totalNetScore,
        skinsWon: totalSkins,
        moneyWon: totalSkins * skinValue
      };
    }).filter(Boolean);
    
    // Sort by skins won (descending)
    return summary.sort((a, b) => b.skinsWon - a.skinsWon);
  };

  if (loading) {
    return <p>Loading skins calculator...</p>;
  }

  return (
    <div className="skins-calculator">
      <h3>Skins Calculation System</h3>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      <div className="skins-explanation card">
        <h4>How Handicaps Work in Skins at Monarch Dunes</h4>
        <p>In our skins game at Monarch Dunes, handicaps are applied on a hole-by-hole basis:</p>
        <ol>
          <li>Each hole has a handicap rating from 1 (hardest) to 18 (easiest)</li>
          <li>Players receive handicap strokes on holes based on their handicap index</li>
          <li>For example, a player with a 9 handicap would receive one stroke on each of the 9 hardest holes</li>
          <li>After applying handicap strokes, the lowest net score on each hole wins the skin</li>
          <li>If multiple players tie for lowest net score, the skin carries over to the next hole</li>
        </ol>
        
        <h4>Course Information</h4>
        <p>Monarch Dunes is a par 72 course (Front 9: par 36, Back 9: par 36)</p>
        <h4>Monarch Dunes Hole Handicaps</h4>
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
        <p className="handicap-note">Note: Lower numbers indicate harder holes where players are more likely to receive handicap strokes</p>
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
                  <th>Net Score</th>
                  <th>Skins</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.holeNumber}>
                    <td>{result.holeNumber}</td>
                    <td>{result.winner}</td>
                    <td>{result.netScore}</td>
                    <td>{result.value > 0 ? result.value : '-'}</td>
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
                {generatePlayerSummary().map(player => (
                  <tr key={player.playerId}>
                    <td>{player.playerName}</td>
                    <td>{player.rawScore}</td>
                    <td>{player.netScore}</td>
                    <td>{player.skinsWon}</td>
                    <td>${player.moneyWon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SkinsCalculator;
