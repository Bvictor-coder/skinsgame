/**
 * Golf Skins Calculation Utility
 * 
 * This utility provides functions for calculating handicap strokes and skins
 * based on the half-stroke handicap system.
 */

/**
 * Calculate if a half-stroke handicap applies to a player on a specific hole
 * @param {number} courseHandicap - Player's course handicap
 * @param {number} holeIndex - Index of difficulty for the hole (1 = hardest, 18 = easiest)
 * @returns {number} - 0.5 if handicap applies, 0 if not
 */
export const calculateHandicapStroke = (courseHandicap, holeIndex) => {
  // No handicap strokes if courseHandicap is 0
  if (courseHandicap <= 0) return 0;
  
  // Note: holeIndex is 1-based (1 = hardest)
  // Base handicap (up to 18): Get half stroke on N hardest holes
  // where N is the course handicap
  if (courseHandicap <= 18) {
    // If player's handicap >= holeIndex, they get a half stroke
    // Example: handicap 9 gets half stroke on holes with index 1-9
    return courseHandicap >= holeIndex ? 0.5 : 0;
  }
  
  // For handicaps > 18, first give half stroke on all holes
  // Then give another half stroke on the hardest holes starting from 1
  // until all strokes are allocated
  const extraStrokes = courseHandicap - 18; 
  
  // All holes get at least half stroke for handicaps > 18
  let stroke = 0.5;
  
  // Add another half stroke if player gets extra strokes on this hole
  if (extraStrokes >= holeIndex) {
    stroke += 0.5;
  }
  
  return stroke;
};

/**
 * Calculate net score for a player on a hole
 * @param {number} grossScore - The player's actual score on the hole
 * @param {number} handicapStroke - The handicap stroke applied (0, 0.5, or 1)
 * @returns {number} - Net score after handicap adjustment
 */
export const calculateNetScore = (grossScore, handicapStroke) => {
  return grossScore - handicapStroke;
};

/**
 * Determine if a player wins a skin on a hole
 * @param {Array} playerScores - Array of player net scores for the hole
 * @param {number} playerIndex - Index of the player to check
 * @returns {boolean} - True if player wins a skin, false otherwise
 */
export const determineHoleSkinWinner = (playerScores) => {
  // If there are no scores, no one wins
  if (!playerScores || playerScores.length === 0) {
    return null;
  }
  
  // Find the lowest score
  const lowestScore = Math.min(...playerScores.map(p => p.netScore));
  
  // Find players with the lowest score
  const playersWithLowestScore = playerScores.filter(p => p.netScore === lowestScore);
  
  // If exactly one player has the lowest score, they win the skin
  if (playersWithLowestScore.length === 1) {
    return playersWithLowestScore[0].playerId;
  }
  
  // If there's a tie for lowest, no skin is awarded
  return null;
};

/**
 * Calculate skins results for an entire game
 * @param {Array} playersData - Array of player objects with handicaps
 * @param {Object} holeData - Hole data including par and stroke index
 * @param {Object} scores - Raw scores keyed by playerId and hole number
 * @returns {Object} - Complete skins calculation results
 */
export const calculateGameSkins = (playersData, holeData, scores) => {
  // Validate inputs
  if (!playersData || !holeData || !scores) {
    return null;
  }
  
  const results = {
    holeResults: [],
    playerResults: [],
    carryover: 0,
    totalSkins: 0
  };
  
  // Keep track of skins won by each player
  const playerSkins = {};
  playersData.forEach(player => {
    playerSkins[player.id] = 0;
  });
  
  let currentCarryover = 0;
  
  // Process each hole
  for (let holeNumber = 1; holeNumber <= holeData.length; holeNumber++) {
    const holeStrokeIndex = holeData[holeNumber - 1].strokeIndex;
    const holePar = holeData[holeNumber - 1].par;
    
    // Calculate net scores for all players on this hole
    const holeScores = playersData.map(player => {
      const grossScore = scores[player.id]?.[holeNumber] || null;
      
      // Skip players who don't have a score for this hole
      if (grossScore === null) return null;
      
      const handicapStroke = calculateHandicapStroke(player.courseHandicap, holeStrokeIndex);
      const netScore = calculateNetScore(grossScore, handicapStroke);
      
      return {
        playerId: player.id,
        playerName: player.name,
        grossScore,
        handicapStroke,
        netScore
      };
    }).filter(score => score !== null); // Remove null scores
    
    // Skip hole if not all players have scores
    if (holeScores.length < playersData.length) {
      results.holeResults.push({
        holeNumber,
        par: holePar,
        strokeIndex: holeStrokeIndex,
        winner: null,
        winnerName: null,
        scores: holeScores,
        carryover: currentCarryover,
        status: 'incomplete'
      });
      continue;
    }
    
    // Determine skin winner
    const winnerPlayerId = determineHoleSkinWinner(holeScores);
    
    let holeResult = {
      holeNumber,
      par: holePar,
      strokeIndex: holeStrokeIndex,
      scores: holeScores,
      carryover: currentCarryover
    };
    
    // If there's a winner
    if (winnerPlayerId) {
      const winner = playersData.find(p => p.id === winnerPlayerId);
      const skinsValue = 1 + currentCarryover;
      
      holeResult = {
        ...holeResult,
        winner: winnerPlayerId,
        winnerName: winner ? winner.name : 'Unknown Player',
        status: 'won',
        skinsValue
      };
      
      // Update player's total skins
      playerSkins[winnerPlayerId] += skinsValue;
      results.totalSkins += skinsValue;
      
      // Reset carryover
      currentCarryover = 0;
    } else {
      // No winner - carryover
      holeResult = {
        ...holeResult,
        winner: null,
        winnerName: null,
        status: 'carryover'
      };
      
      // Increment carryover
      currentCarryover++;
    }
    
    results.holeResults.push(holeResult);
  }
  
  // Prepare player results
  results.playerResults = playersData.map(player => ({
    playerId: player.id,
    playerName: player.name,
    skinsWon: playerSkins[player.id],
    winnings: playerSkins[player.id] * 10 // Assuming $10 per skin
  })).sort((a, b) => b.skinsWon - a.skinsWon); // Sort by most skins won
  
  // Save remaining carryover
  results.carryover = currentCarryover;
  
  return results;
};
