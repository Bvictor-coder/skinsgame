import React, { useState, useEffect } from 'react';
import dataSync from '../utils/dataSync';

const SkinsCalculator = ({ gameId, players = [] }) => {
  const [courseData, setCourseData] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  // Sample course data with hole handicaps
  // In a real implementation, this would come from a database
  const courseDatabase = {
    'monarch-dunes': {
      name: 'Monarch Dunes',
      par: [4, 3, 4, 4, 5, 4, 4, 3, 5], // Sample front 9 pars
      handicaps: [7, 3, 1, 9, 5, 11, 13, 17, 15] // Handicap rating (1 = hardest, 18 = easiest)
    },
    'avila-beach': {
      name: 'Avila Beach Golf Resort',
      par: [4, 4, 5, 3, 4, 4, 3, 4, 5],
      handicaps: [5, 3, 11, 15, 1, 9, 17, 7, 13]
    }
  };

  // Generate mock player scores
  const generateMockScores = () => {
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
  };

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

  // Load or generate data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch the game data
        // For this demo, we're using mock data
        if (gameId) {
          // Get the game
          const game = { course: 'monarch-dunes', holes: 9 }; // Mock game data
          setCourseData(courseDatabase[game.course]);
        } else {
          // Use default course for demo
          setCourseData(courseDatabase['monarch-dunes']);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load course data');
        setLoading(false);
      }
    };
    
    loadData();
  }, [gameId]);

  // Generate scores & calculate results when players or course changes
  useEffect(() => {
    if (courseData && players.length) {
      const generatedScores = generateMockScores();
      setScores(generatedScores);
      
      const skinsResults = calculateSkins(generatedScores);
      setResults(skinsResults);
    }
  }, [courseData, players]);

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
        <h4>How Handicaps Work in Skins</h4>
        <p>In our skins game, handicaps are applied on a hole-by-hole basis:</p>
        <ol>
          <li>Each hole on the course has a handicap rating from 1 (hardest) to 18 (easiest)</li>
          <li>Players receive handicap strokes on holes based on their handicap index</li>
          <li>For example, a player with a 9 handicap would receive one stroke on each of the 9 hardest holes</li>
          <li>After applying handicap strokes, the lowest net score on each hole wins the skin</li>
          <li>If multiple players tie for lowest net score, the skin carries over to the next hole</li>
        </ol>
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
