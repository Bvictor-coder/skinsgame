/**
 * Enhanced Skins Calculator Utility
 * 
 * Provides advanced functions for calculating skins and results for golf games.
 * This utility handles various skins game formats, handicap calculations,
 * and carryover rules according to standard golf practices.
 */

// Course data for Monarch Dunes
export const MONARCH_DUNES_DATA = {
  name: 'Monarch Dunes',
  // Actual par values for Monarch Dunes
  par: [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 3, 5, 4, 3, 4], // Course par: 72 (Front 9: 36, Back 9: 36)
  // Handicap difficulty ratings from 1 (hardest) to 18 (easiest)
  handicaps: [1, 15, 9, 3, 7, 11, 13, 5, 17, 2, 14, 16, 4, 1, 8, 12, 10, 6],
  // Slope rating (standard measure of course difficulty)
  slopeRating: 132,
  // Course rating (expected score by scratch golfer)
  courseRating: 71.2
};

// Common course data
export const COURSE_DATA = {
  'monarch-dunes': MONARCH_DUNES_DATA,
  // Add more courses here as needed
};

/**
 * Skins game formats
 */
export const GAME_FORMATS = {
  STANDARD: 'standard',            // Regular skins game
  DOUBLE_ON_PAR_5: 'double_par5',  // Double value skins on par 5 holes
  TEAM: 'team',                    // Team-based skins game
  NO_CARRYOVER: 'no_carryover',    // No carryover on ties
  MONARCH_HALF_STROKE: 'monarch_half_stroke', // Monarch Dunes rules with half-stroke handicaps
  MODIFIED: 'modified'             // Custom rules
};

// Default format for the system
export const DEFAULT_FORMAT = GAME_FORMATS.MONARCH_HALF_STROKE;

// Default CTP hole for Monarch Dunes
export const DEFAULT_CTP_HOLE = 2;

/**
 * Calculate handicap strokes for a player on each hole based on their handicap index
 * Standard method - whole strokes
 * 
 * @param {number} handicapIndex - Player's handicap index
 * @param {Object} courseData - Course data with par and handicap information
 * @param {number} percentageOfHandicap - Percentage of handicap to apply (e.g., 0.8 for 80%)
 * @returns {Array} Array of strokes received per hole
 */
export const calculateHandicapStrokes = (handicapIndex, courseData = MONARCH_DUNES_DATA, percentageOfHandicap = 1.0) => {
  if (handicapIndex === null || handicapIndex === undefined) {
    return Array(courseData.par.length).fill(0);
  }
  
  // Calculate playing handicap based on slope rating
  const playingHandicap = Math.round(handicapIndex * (courseData.slopeRating / 113) * percentageOfHandicap);
  
  // Allocate strokes to holes based on their handicap rating
  const strokes = Array(courseData.par.length).fill(0);
  
  if (playingHandicap <= 0) return strokes;
  
  // Create array of hole indexes sorted by handicap difficulty
  const holesSortedByHandicap = courseData.handicaps
    .map((handicap, index) => ({ index, handicap }))
    .sort((a, b) => a.handicap - b.handicap);
  
  // Allocate first round of strokes
  let strokesRemaining = playingHandicap;
  
  while (strokesRemaining > 0) {
    for (const hole of holesSortedByHandicap) {
      if (strokesRemaining <= 0) break;
      
      strokes[hole.index] += 1;
      strokesRemaining--;
    }
  }
  
  return strokes;
};

/**
 * Calculate half-stroke handicap adjustments for Monarch Dunes format
 * 
 * In this format, players receive 1/2 stroke per handicap stroke:
 * - Players receive 1/2 stroke on the hardest holes based on handicap
 * - If handicap > 18, they get an additional 1/2 stroke (full stroke total) on the hardest holes
 * 
 * @param {number} courseHandicap - Player's course handicap
 * @param {Object} courseData - Course data with handicap information
 * @returns {Array} Array of half-stroke values (0, 0.5, or 1) per hole
 */
export const calculateHalfStrokeHandicap = (courseHandicap, courseData = MONARCH_DUNES_DATA) => {
  if (courseHandicap === null || courseHandicap === undefined || courseHandicap <= 0) {
    return Array(courseData.par.length).fill(0);
  }
  
  // Create array of hole indexes sorted by handicap difficulty (hardest to easiest)
  const holesSortedByHandicap = courseData.handicaps
    .map((handicap, index) => ({ index, handicap }))
    .sort((a, b) => a.handicap - b.handicap);
  
  // Initialize strokes array with zeros
  const strokes = Array(courseData.par.length).fill(0);
  
  // First, apply half strokes to all holes where the player gets strokes based on handicap
  const initialHalfStrokes = Math.min(courseHandicap, 18);
  
  // Apply half strokes to the hardest holes up to the player's handicap
  for (let i = 0; i < initialHalfStrokes; i++) {
    const holeIndex = holesSortedByHandicap[i].index;
    strokes[holeIndex] = 0.5;
  }
  
  // If handicap > 18, apply additional half strokes to make full strokes
  // on the hardest holes first
  if (courseHandicap > 18) {
    const additionalHalfStrokes = Math.min(courseHandicap - 18, 18);
    
    for (let i = 0; i < additionalHalfStrokes; i++) {
      const holeIndex = holesSortedByHandicap[i].index;
      strokes[holeIndex] += 0.5; // Add another half stroke to make it a full stroke
    }
  }
  
  // If handicap > 36, start the cycle again - first 18 holes get another half stroke
  if (courseHandicap > 36) {
    const extraHalfStrokes = Math.min(courseHandicap - 36, 18);
    
    for (let i = 0; i < extraHalfStrokes; i++) {
      const holeIndex = holesSortedByHandicap[i].index;
      strokes[holeIndex] += 0.5; // Add another half stroke (making 1.5 total for these holes)
    }
  }
  
  // If handicap > 54, add more to the hardest holes again (rare but possible)
  if (courseHandicap > 54) {
    const extremeHalfStrokes = Math.min(courseHandicap - 54, 18);
    
    for (let i = 0; i < extremeHalfStrokes; i++) {
      const holeIndex = holesSortedByHandicap[i].index;
      strokes[holeIndex] += 0.5; // Add another half stroke (making 2.0 total for these holes)
    }
  }
  
  return strokes;
};

/**
 * Calculate net scores for a player
 * @param {Array} rawScores - Array of raw scores
 * @param {Array} handicapStrokes - Array of handicap strokes per hole
 * @returns {Array} Array of net scores
 */
export const calculateNetScores = (rawScores, handicapStrokes) => {
  return rawScores.map((score, i) => Math.max(1, score - (handicapStrokes[i] || 0))); // Net score never below 1
};

/**
 * Calculate skins results from scores with support for different game formats
 * @param {Array} scores - Array of player scores 
 * @param {string} format - Game format (from GAME_FORMATS)
 * @param {Object} courseData - Course data
 * @returns {Array} Skins results by hole
 */
export const calculateSkins = (scores, format = GAME_FORMATS.STANDARD, courseData = MONARCH_DUNES_DATA) => {
  if (!scores || !scores.length) return [];
  
  const numberOfHoles = scores[0].holes?.length || 0;
  if (numberOfHoles === 0) return [];
  
  const skinsResults = [];
  let carryover = 0; // For tied holes (used in formats with carryover)
  
  // Check if we should use the no-carryover rule
  // Monarch Half-Stroke format always uses no carryover rule
  const useNoCarryover = format === GAME_FORMATS.NO_CARRYOVER || 
                         format === GAME_FORMATS.MONARCH_HALF_STROKE;
  
  // For each hole
  for (let holeIndex = 0; holeIndex < numberOfHoles; holeIndex++) {
    // Get all net scores for this hole
    const holeScores = scores.map(playerScore => ({
      playerId: playerScore.player.id,
      playerName: playerScore.player.name,
      rawScore: playerScore.holes[holeIndex].rawScore,
      netScore: playerScore.holes[holeIndex].netScore,
      handicapStroke: playerScore.holes[holeIndex].handicapStroke || 0,
      par: playerScore.holes[holeIndex].par || courseData.par[holeIndex] || 4
    }));
    
    // Determine skin value based on format and hole type
    let skinValue = 1; // Default value
    
    // Apply format-specific rules
    if (format === GAME_FORMATS.DOUBLE_ON_PAR_5 && courseData.par[holeIndex] === 5) {
      skinValue = 2; // Double value on par 5s
    }
    
    // Add carryover to the skin value (unless using no-carryover rules)
    if (!useNoCarryover) {
      skinValue += carryover;
    }
    
    // Find the lowest score(s)
    const minScore = Math.min(...holeScores.map(s => s.netScore));
    const lowestScorers = holeScores.filter(s => s.netScore === minScore);
    
    // If there's only one lowest score, they win the skin
    if (lowestScorers.length === 1) {
      const winner = lowestScorers[0];
      const holeResult = {
        holeNumber: holeIndex + 1,
        winner: winner.playerName,
        playerId: winner.playerId,
        value: skinValue,
        netScore: winner.netScore,
        rawScore: winner.rawScore,
        parRelative: winner.rawScore - winner.par, // Relative to par (e.g., -1 for birdie)
        handicapUsed: winner.handicapStroke > 0, // Whether handicap was used
        par: winner.par
      };
      
      // Add score descriptor (birdie, eagle, etc.)
      holeResult.scoreType = getScoreType(winner.rawScore, winner.par);
      
      skinsResults.push(holeResult);
      carryover = 0; // Reset carryover
    } else {
      // Tied hole, apply carryover
      if (format === GAME_FORMATS.NO_CARRYOVER) {
        // No carryover - skin is split or lost
        if (lowestScorers.length > 1) {
          const splitValue = skinValue / lowestScorers.length;
          lowestScorers.forEach(scorer => {
            skinsResults.push({
              holeNumber: holeIndex + 1,
              winner: scorer.playerName,
              playerId: scorer.playerId,
              value: splitValue,
              netScore: scorer.netScore,
              rawScore: scorer.rawScore,
              parRelative: scorer.rawScore - scorer.par,
              handicapUsed: scorer.handicapStroke > 0,
              par: scorer.par,
              scoreType: getScoreType(scorer.rawScore, scorer.par),
              tied: true
            });
          });
        }
      } else {
        // Standard carryover
        carryover += skinValue;
        
        const tiedNames = lowestScorers.map(s => s.playerName).join(', ');
        skinsResults.push({
          holeNumber: holeIndex + 1,
          winner: 'Tied - Carryover',
          tiedPlayers: lowestScorers.map(s => s.playerId),
          tiedNames: tiedNames,
          playerId: null,
          value: 0,
          netScore: minScore,
          carryover: carryover, // Track carryover amount
          par: courseData.par[holeIndex] || 4
        });
      }
    }
  }
  
  // Handle any remaining carryover on the last hole (if needed)
  if (carryover > 0 && format !== GAME_FORMATS.NO_CARRYOVER) {
    // Find last result with a winner
    const lastWinnerIndex = [...skinsResults].reverse().findIndex(r => r.playerId !== null);
    
    if (lastWinnerIndex >= 0) {
      // Add carryover to the last winner
      const actualIndex = skinsResults.length - 1 - lastWinnerIndex;
      skinsResults[actualIndex].value += carryover;
      skinsResults[actualIndex].includesEndCarryover = true;
    } else {
      // No winners at all, add a note about unallocated carryover
      skinsResults.push({
        holeNumber: null,
        winner: 'Unallocated Carryover',
        playerId: null,
        value: carryover,
        netScore: null,
        isUnallocatedCarryover: true
      });
    }
  }
  
  return skinsResults;
};

/**
 * Get score type description (eagle, birdie, par, etc.)
 * @param {number} score - Raw score
 * @param {number} par - Par for the hole
 * @returns {string} Score type
 */
export const getScoreType = (score, par) => {
  const diff = score - par;
  
  switch (diff) {
    case -3: return 'albatross';
    case -2: return 'eagle';
    case -1: return 'birdie';
    case 0: return 'par';
    case 1: return 'bogey';
    case 2: return 'double bogey';
    default: return diff < 0 ? 'better than albatross' : `${diff} over par`;
  }
};

/**
 * Generate a comprehensive player summary with skins results
 * @param {Array} players - Array of player objects
 * @param {Array} scores - Array of player scores
 * @param {Array} results - Array of skins results
 * @param {Object} potInfo - Pot information with skin values
 * @param {string} ctpPlayerId - ID of the CTP winner, if any
 * @returns {Array} Player summary with skins won and money earned
 */
export const generatePlayerSummary = (
  players, 
  scores, 
  results, 
  potInfo = { skinValue: 10, ctpValue: 20 }, 
  ctpPlayerId = null
) => {
  if (!players || !players.length || !scores || !scores.length) return [];
  
  const summary = players.map(player => {
    const playerScore = scores.find(s => s.player.id === player.id);
    if (!playerScore) return null;
    
    // Count skins won
    const skinsWon = results.filter(r => r.playerId === player.id);
    const totalSkins = skinsWon.reduce((sum, skin) => sum + skin.value, 0);
    const skinsMoney = totalSkins * (potInfo.skinValue || 10);
    
    // Get scoring stats
    const birdiesOrBetter = playerScore.holes.filter(h => 
      (h.rawScore < h.par) // Birdie or better (raw score less than par)
    ).length;
    
    const eagles = playerScore.holes.filter(h => 
      (h.rawScore <= h.par - 2) // Eagle or better (raw score at least 2 under par)
    ).length;
    
    const pars = playerScore.holes.filter(h => h.rawScore === h.par).length;
    
    // Calculate shots over/under par
    const relativeToPar = playerScore.holes.reduce((sum, h) => sum + (h.rawScore - h.par), 0);
    
    // Add CTP money if applicable
    const ctpMoney = (player.id === ctpPlayerId) ? (potInfo.ctpValue || 20) : 0;
    const totalMoney = skinsMoney + ctpMoney;
    
    return {
      playerId: player.id,
      playerName: player.name,
      handicap: player.handicap,
      handicapUsed: playerScore.holes.some(h => h.handicapStroke > 0),
      rawScore: playerScore.totalRawScore,
      netScore: playerScore.totalNetScore,
      relativeToPar: relativeToPar,
      skinsWon: totalSkins,
      skinsMoney: skinsMoney,
      ctpMoney: ctpMoney,
      totalMoney: totalMoney,
      isCtp: player.id === ctpPlayerId,
      // Detailed stats
      birdiesOrBetter: birdiesOrBetter,
      eagles: eagles,
      pars: pars,
      // Skins details
      skinsDetails: skinsWon.map(skin => ({
        holeNumber: skin.holeNumber,
        value: skin.value,
        money: skin.value * (potInfo.skinValue || 10),
        scoreType: skin.scoreType,
        netScore: skin.netScore,
        rawScore: skin.rawScore,
        handicapUsed: skin.handicapUsed
      }))
    };
  }).filter(Boolean);
  
  // Sort by money won (descending), then by score (ascending)
  return summary.sort((a, b) => {
    if (b.totalMoney !== a.totalMoney) return b.totalMoney - a.totalMoney;
    return a.netScore - b.netScore; // If tied in money, lowest score wins
  });
};

/**
 * Generate simulated scores for players with more realistic score distribution
 * @param {Array} players - Array of player objects
 * @param {Object} courseData - Course data with par and handicap information
 * @param {string} format - Game format (from GAME_FORMATS)
 * @returns {Array} Simulated scores for all players
 */
export const generateSimulatedScores = (
  players, 
  courseData = MONARCH_DUNES_DATA,
  format = GAME_FORMATS.MONARCH_HALF_STROKE
) => {
  if (!players || !players.length || !courseData) return [];
  
  const playerScores = players.map(player => {
    // Calculate handicap strokes based on format
    const handicap = player.handicap || 15; // Default to 15 if not set
    
    // Calculate handicap strokes based on format
    let handicapStrokes;
    if (format === GAME_FORMATS.MONARCH_HALF_STROKE) {
      // Use the half-stroke handicap allocation
      handicapStrokes = calculateHalfStrokeHandicap(handicap, courseData);
    } else {
      // Use the standard handicap allocation
      handicapStrokes = calculateHandicapStrokes(handicap, courseData);
    }
    
    // Use player's handicap to determine skill level
    const playerSkill = Math.max(0, 30 - handicap) / 30; // 0 to 1 scale, higher is better
    
    // Generate scores for each hole with realistic distribution
    const holeScores = courseData.par.map((par, holeIndex) => {
      // Use skill level to determine score distribution
      // Better players have higher chance of birdie/par, worse players more bogeys+
      const scoreDistribution = getScoreDistribution(playerSkill, par);
      const rawScore = getRandomScoreFromDistribution(scoreDistribution, par);
      
      // Apply handicap stroke
      const handicapStroke = handicapStrokes[holeIndex] || 0;
      const netScore = Math.max(1, rawScore - handicapStroke); // Net score never below 1
      
      return {
        holeNumber: holeIndex + 1,
        par: par,
        rawScore: rawScore,
        handicapStroke: handicapStroke,
        netScore: netScore,
        isHalfStroke: handicapStroke % 1 !== 0 // Flag for half strokes
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

/**
 * Get realistic score distribution based on player skill and hole par
 * @param {number} skillLevel - Player skill level (0-1, higher is better)
 * @param {number} par - Par for the hole
 * @returns {Object} Score distribution with probabilities for each score relative to par
 */
export const getScoreDistribution = (skillLevel, par) => {
  // Base probabilities for a mid-level player (adjusted by par)
  let eagleOrBetter = 0.01;
  let birdie = 0.10;
  let parProbability = 0.30;
  let bogey = 0.40;
  let doubleBogey = 0.15;
  let triplePlus = 0.04;
  
  // Adjust based on skill level
  if (skillLevel > 0.7) { // Very good player
    eagleOrBetter = 0.03;
    birdie = 0.20;
    parProbability = 0.50;
    bogey = 0.20;
    doubleBogey = 0.05;
    triplePlus = 0.02;
  } else if (skillLevel > 0.4) { // Good player
    eagleOrBetter = 0.01;
    birdie = 0.15;
    parProbability = 0.40;
    bogey = 0.30;
    doubleBogey = 0.10;
    triplePlus = 0.04;
  } else if (skillLevel > 0.2) { // Average player
    eagleOrBetter = 0.005;
    birdie = 0.08;
    parProbability = 0.30;
    bogey = 0.40;
    doubleBogey = 0.15;
    triplePlus = 0.065;
  } else { // Beginner
    eagleOrBetter = 0.001;
    birdie = 0.04;
    parProbability = 0.20;
    bogey = 0.35;
    doubleBogey = 0.25;
    triplePlus = 0.159;
  }
  
  // Adjust for par 3s, 4s, and 5s
  if (par === 3) {
    // Harder to eagle, easier to bogey on par 3s
    eagleOrBetter *= 0.5;
    birdie *= 0.8;
    bogey *= 1.2;
  } else if (par === 5) {
    // Easier to get birdies, harder to bogey on par 5s
    birdie *= 1.3;
    bogey *= 0.8;
  }
  
  return {
    eagleOrBetter,
    birdie,
    par: parProbability, // Return parProbability as "par" in the distribution object
    bogey,
    doubleBogey,
    triplePlus
  };
};

/**
 * Get a random score based on a score distribution
 * @param {Object} distribution - Score distribution
 * @param {number} par - Par for the hole
 * @returns {number} Raw score
 */
export const getRandomScoreFromDistribution = (distribution, par = 4) => {
  const rand = Math.random();
  let cumulativeProbability = 0;
  
  cumulativeProbability += distribution.eagleOrBetter;
  if (rand <= cumulativeProbability) {
    // Eagle or better (even mix of eagle, albatross with eagle being more common)
    return Math.random() < 0.9 ? par - 2 : par - 3; 
  }
  
  cumulativeProbability += distribution.birdie;
  if (rand <= cumulativeProbability) {
    return par - 1; // Birdie
  }
  
  cumulativeProbability += distribution.par;
  if (rand <= cumulativeProbability) {
    return par; // Par
  }
  
  cumulativeProbability += distribution.bogey;
  if (rand <= cumulativeProbability) {
    return par + 1; // Bogey
  }
  
  cumulativeProbability += distribution.doubleBogey;
  if (rand <= cumulativeProbability) {
    return par + 2; // Double bogey
  }
  
  // Triple bogey or worse (weighted towards triple, with some worse scores)
  const extraStrokesAboveTriple = Math.floor(Math.random() * 3) * (Math.random() < 0.7 ? 0 : 1);
  return par + 3 + extraStrokesAboveTriple;
};

/**
 * Calculate the total pot value for a game with flexible allocation
 * @param {number} playerCount - Number of players
 * @param {number} entryFee - Entry fee per player
 * @param {Object} options - Additional options
 * @returns {Object} Pot breakdown with total, skins, and CTP values
 */
export const calculatePot = (playerCount, entryFee = 20, options = {}) => {
  const {
    ctpPercentage = 0.25,      // Default 25% to CTP
    lowNetPercentage = 0,      // Default 0% to low net
    secondPlacePercentage = 0, // Default 0% to second place
    adminFeePercentage = 0     // Default 0% admin fee
  } = options;
  
  // Calculate total pot
  const totalPot = playerCount * entryFee;
  
  // Calculate admin fee
  const adminFee = Math.round(totalPot * adminFeePercentage);
  
  // Calculate available pot after admin fee
  const availablePot = totalPot - adminFee;
  
  // Calculate individual allocations
  const ctpPot = Math.round(availablePot * ctpPercentage);
  const lowNetPot = Math.round(availablePot * lowNetPercentage);
  const secondPlacePot = Math.round(availablePot * secondPlacePercentage);
  
  // Remaining goes to skins
  const skinsPot = availablePot - ctpPot - lowNetPot - secondPlacePot;
  
  // Calculate value per skin (with safety check for zero players)
  let skinValue = 0;
  if (playerCount > 0 && skinsPot > 0) {
    // Default allocation assumes 1 skin per player on average
    skinValue = Math.floor(skinsPot / playerCount);
  }
  
  return {
    total: totalPot,
    available: availablePot,
    adminFee: adminFee,
    skins: skinsPot,
    ctp: ctpPot,
    lowNet: lowNetPot,
    secondPlace: secondPlacePot,
    skinValue: skinValue,
    ctpValue: ctpPot,
    perPlayer: entryFee
  };
};

/**
 * Calculate team results for team-based skins games
 * @param {Array} players - Array of player objects with team assignments
 * @param {Array} scores - Array of player scores
 * @param {Array} results - Array of skins results
 * @param {Object} potInfo - Pot information
 * @returns {Array} Team summary with skins won and money earned
 */
export const calculateTeamResults = (players, scores, results, potInfo) => {
  if (!players || !players.length) return [];
  
  // Group players by team
  const teamMap = {};
  
  players.forEach(player => {
    const teamId = player.teamId || 'none';
    if (!teamMap[teamId]) {
      teamMap[teamId] = {
        teamId,
        teamName: player.teamName || `Team ${teamId}`,
        players: [],
        skinsWon: 0,
        skinsMoney: 0,
        ctpMoney: 0,
        totalMoney: 0
      };
    }
    teamMap[teamId].players.push(player.id);
  });
  
  // Calculate skins per team
  results.forEach(result => {
    if (!result.playerId) return; // Skip ties
    
    // Find the player's team
    const player = players.find(p => p.id === result.playerId);
    if (!player) return;
    
    const teamId = player.teamId || 'none';
    if (!teamMap[teamId]) return;
    
    // Add skins to team total
    teamMap[teamId].skinsWon += result.value || 0;
    teamMap[teamId].skinsMoney += (result.value || 0) * (potInfo.skinValue || 10);
  });
  
  // Add CTP money to relevant team
  if (potInfo.ctpPlayerId) {
    const ctpPlayer = players.find(p => p.id === potInfo.ctpPlayerId);
    if (ctpPlayer) {
      const teamId = ctpPlayer.teamId || 'none';
      if (teamMap[teamId]) {
        teamMap[teamId].ctpMoney += potInfo.ctpValue || 0;
      }
    }
  }
  
  // Calculate totals
  Object.values(teamMap).forEach(team => {
    team.totalMoney = team.skinsMoney + team.ctpMoney;
  });
  
  // Return sorted by money won
  return Object.values(teamMap)
    .sort((a, b) => b.totalMoney - a.totalMoney);
};

/**
 * Process real score data into the format needed by the skins calculator
 * @param {Array} rawScoreData - Raw score data from API or input
 * @param {Array} players - Player information
 * @param {Object} courseData - Course data
 * @returns {Array} Processed scores ready for skins calculation
 */
export const processRealScores = (rawScoreData, players, courseData = MONARCH_DUNES_DATA) => {
  if (!rawScoreData || !players) return [];
  
  return players.map(player => {
    const playerScoreData = rawScoreData.find(s => s.playerId === player.id);
    if (!playerScoreData) return null;
    
    // Process hole-by-hole scores
    const holes = [];
    
    // Calculate handicap strokes
    const handicapStrokes = calculateHandicapStrokes(player.handicap || 0, courseData);
    
    for (let i = 0; i < courseData.par.length; i++) {
      const holeScore = playerScoreData.holeScores?.[i] || null;
      
      if (holeScore !== null && typeof holeScore === 'number') {
        const rawScore = holeScore;
        const handicapStroke = handicapStrokes[i] || 0;
        const netScore = Math.max(1, rawScore - handicapStroke);
        
        holes.push({
          holeNumber: i + 1,
          par: courseData.par[i],
          rawScore: rawScore,
          handicapStroke: handicapStroke,
          netScore: netScore
        });
      } else {
        // Missing score data - use placeholder that won't win a skin
        holes.push({
          holeNumber: i + 1,
          par: courseData.par[i],
          rawScore: 999,
          handicapStroke: 0,
          netScore: 999
        });
      }
    }
    
    const validScores = holes.filter(h => h.rawScore !== 999);
    
    // Calculate totals for all valid scores
    const totalRawScore = validScores.reduce((sum, hole) => sum + hole.rawScore, 0);
    const totalNetScore = validScores.reduce((sum, hole) => sum + hole.netScore, 0);
    
    return {
      player,
      holes,
      totalRawScore,
      totalNetScore,
      holesCompleted: validScores.length
    };
  }).filter(Boolean);
};

export default {
  MONARCH_DUNES_DATA,
  COURSE_DATA,
  GAME_FORMATS,
  calculateSkins,
  calculateHandicapStrokes,
  calculateNetScores,
  generatePlayerSummary,
  generateSimulatedScores,
  calculatePot,
  calculateTeamResults,
  processRealScores,
  getScoreType
};
