/**
 * Feature Engineering Module
 * Extracts and creates features from normalized data for ML model
 */

const fs = require('fs');
const path = require('path');

// Data directories
const NORMALIZED_DATA_DIR = path.join(__dirname, '..', 'data', 'normalized');
const FEATURES_DIR = path.join(__dirname, '..', 'data', 'features');

// Ensure features directory exists
if (!fs.existsSync(FEATURES_DIR)) {
  fs.mkdirSync(FEATURES_DIR, { recursive: true });
}

/**
 * Save feature data to file
 * @param {string} sport - Sport key
 * @param {string} predictionType - Type of prediction (spread, moneyline, total)
 * @param {Object} data - Feature data
 */
function saveFeatureData(sport, predictionType, data) {
  const filename = `${sport.toLowerCase()}_${predictionType}_features_${new Date().toISOString().split('T')[0]}.json`;
  const filePath = path.join(FEATURES_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${predictionType} feature data for ${sport} to ${filePath}`);
}

/**
 * Load normalized data for a sport
 * @param {string} sport - Sport key
 * @param {string} dataType - Type of data (games, races, fights)
 * @returns {Array} - Normalized data
 */
function loadNormalizedData(sport, dataType) {
  // Find the most recent normalized data file for the sport
  const files = fs.readdirSync(NORMALIZED_DATA_DIR)
    .filter(file => file.startsWith(`${sport.toLowerCase()}_${dataType}_`))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log(`No normalized ${dataType} data found for ${sport}`);
    return null;
  }
  
  const filePath = path.join(NORMALIZED_DATA_DIR, files[0]);
  console.log(`Loading normalized ${dataType} data for ${sport} from ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading normalized ${dataType} data for ${sport}:`, error);
    return null;
  }
}

/**
 * Load historical data for a sport
 * @param {string} sport - Sport key
 * @returns {Array} - Historical data
 */
function loadHistoricalData(sport) {
  // Find historical data files for the sport
  const files = fs.readdirSync(path.join(__dirname, '..', 'data', 'raw'))
    .filter(file => file.startsWith(`${sport.toLowerCase()}_historical_`))
    .sort();
  
  if (files.length === 0) {
    console.log(`No historical data found for ${sport}`);
    return [];
  }
  
  // Load and combine all historical data
  const historicalData = [];
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', 'data', 'raw', file);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.games && Array.isArray(data.games)) {
        historicalData.push(...data.games);
      }
    } catch (error) {
      console.error(`Error loading historical data from ${file}:`, error);
    }
  }
  
  console.log(`Loaded ${historicalData.length} historical games for ${sport}`);
  return historicalData;
}

/**
 * Get team history from historical data
 * @param {string} teamName - Team name
 * @param {Array} historicalGames - Historical games
 * @returns {Array} - Team's historical games
 */
function getTeamHistory(teamName, historicalGames) {
  return historicalGames.filter(game => 
    game.homeTeam === teamName || game.awayTeam === teamName
  );
}

/**
 * Get head-to-head games between two teams
 * @param {string} team1 - First team name
 * @param {string} team2 - Second team name
 * @param {Array} historicalGames - Historical games
 * @returns {Array} - Head-to-head games
 */
function getHeadToHeadGames(team1, team2, historicalGames) {
  return historicalGames.filter(game => 
    (game.homeTeam === team1 && game.awayTeam === team2) ||
    (game.homeTeam === team2 && game.awayTeam === team1)
  );
}

/**
 * Calculate win rate for a team
 * @param {Array} teamGames - Team's historical games
 * @returns {number} - Win rate (0-1)
 */
function calculateWinRate(teamGames) {
  if (teamGames.length === 0) {
    return 0.5; // Default to 50% if no games
  }
  
  const wins = teamGames.filter(game => {
    if (game.homeTeam === teamGames[0].homeTeam) {
      return game.homeScore > game.awayScore;
    } else {
      return game.awayScore > game.homeScore;
    }
  }).length;
  
  return wins / teamGames.length;
}

/**
 * Calculate home win rate for a team
 * @param {Array} teamGames - Team's historical games
 * @returns {number} - Home win rate (0-1)
 */
function calculateHomeWinRate(teamGames) {
  const homeGames = teamGames.filter(game => game.homeTeam === teamGames[0].homeTeam);
  
  if (homeGames.length === 0) {
    return 0.5; // Default to 50% if no home games
  }
  
  const homeWins = homeGames.filter(game => game.homeScore > game.awayScore).length;
  
  return homeWins / homeGames.length;
}

/**
 * Calculate away win rate for a team
 * @param {Array} teamGames - Team's historical games
 * @returns {number} - Away win rate (0-1)
 */
function calculateAwayWinRate(teamGames) {
  const awayGames = teamGames.filter(game => game.awayTeam === teamGames[0].homeTeam);
  
  if (awayGames.length === 0) {
    return 0.5; // Default to 50% if no away games
  }
  
  const awayWins = awayGames.filter(game => game.awayScore > game.homeScore).length;
  
  return awayWins / awayGames.length;
}

/**
 * Calculate recent form for a team
 * @param {Array} teamGames - Team's historical games
 * @param {number} numGames - Number of recent games to consider
 * @returns {number} - Recent form (0-1)
 */
function calculateRecentForm(teamGames, numGames = 10) {
  // Sort games by date (most recent first)
  const sortedGames = [...teamGames].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Take the most recent games
  const recentGames = sortedGames.slice(0, numGames);
  
  if (recentGames.length === 0) {
    return 0.5; // Default to 50% if no recent games
  }
  
  // Calculate win rate for recent games
  return calculateWinRate(recentGames);
}

/**
 * Calculate head-to-head win rate for a team
 * @param {Array} h2hGames - Head-to-head games
 * @param {string} teamName - Team name
 * @returns {number} - Head-to-head win rate (0-1)
 */
function calculateH2HWinRate(h2hGames, teamName) {
  if (h2hGames.length === 0) {
    return 0.5; // Default to 50% if no head-to-head games
  }
  
  const wins = h2hGames.filter(game => {
    if (game.homeTeam === teamName) {
      return game.homeScore > game.awayScore;
    } else {
      return game.awayScore > game.homeScore;
    }
  }).length;
  
  return wins / h2hGames.length;
}

/**
 * Calculate implied probability from American odds
 * @param {number} odds - American odds
 * @returns {number} - Implied probability (0-1)
 */
function calculateImpliedProbability(odds) {
  if (!odds) {
    return 0.5; // Default to 50% if no odds
  }
  
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Extract features for team sports (NBA, WNBA, MLB, NHL, NCAA)
 * @param {Array} games - Normalized games data
 * @param {Array} historicalGames - Historical games data
 * @returns {Object} - Features for different prediction types
 */
function extractTeamSportFeatures(games, historicalGames) {
  console.log(`Extracting features for ${games.length} games...`);
  
  const spreadFeatures = [];
  const moneylineFeatures = [];
  const totalFeatures = [];
  
  games.forEach(game => {
    // Skip games that don't have odds data
    if (!game.dataSource.odds) {
      return;
    }
    
    // Get team names
    const homeTeamName = game.homeTeam.name;
    const awayTeamName = game.awayTeam.name;
    
    // Get team history
    const homeTeamHistory = getTeamHistory(homeTeamName, historicalGames);
    const awayTeamHistory = getTeamHistory(awayTeamName, historicalGames);
    
    // Get head-to-head history
    const h2hGames = getHeadToHeadGames(homeTeamName, awayTeamName, historicalGames);
    
    // Base features for all prediction types
    const baseFeatures = {
      // Game metadata
      gameId: game.id,
      sport: game.sport,
      date: game.date,
      
      // Team identifiers
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      
      // Time features
      dayOfWeek: new Date(game.date).getDay(),
      isWeekend: new Date(game.date).getDay() === 0 || new Date(game.date).getDay() === 6 ? 1 : 0,
      
      // Team performance features
      homeTeamWinRate: calculateWinRate(homeTeamHistory),
      awayTeamWinRate: calculateWinRate(awayTeamHistory),
      homeTeamRecentForm: calculateRecentForm(homeTeamHistory, 10),
      awayTeamRecentForm: calculateRecentForm(awayTeamHistory, 10),
      homeTeamHomeWinRate: calculateHomeWinRate(homeTeamHistory),
      awayTeamAwayWinRate: calculateAwayWinRate(awayTeamHistory),
      
      // Head-to-head features
      h2hHomeWinRate: calculateH2HWinRate(h2hGames, homeTeamName),
      h2hGamesCount: h2hGames.length,
      
      // Home advantage
      isHomeGame: 1, // Always 1 for home team perspective
      
      // Odds-based features
      homeTeamImpliedProbability: calculateImpliedProbability(game.odds.homeMoneyline),
      awayTeamImpliedProbability: calculateImpliedProbability(game.odds.awayMoneyline)
    };
    
    // Sport-specific features
    if (game.sport === 'NHL' && game.nhlStats) {
      baseFeatures.homeTeamGoalsPerGame = calculateAverageGoals(homeTeamHistory, homeTeamName);
      baseFeatures.awayTeamGoalsPerGame = calculateAverageGoals(awayTeamHistory, awayTeamName);
      baseFeatures.homeTeamGoalsAgainstPerGame = calculateAverageGoalsAgainst(homeTeamHistory, homeTeamName);
      baseFeatures.awayTeamGoalsAgainstPerGame = calculateAverageGoalsAgainst(awayTeamHistory, awayTeamName);
    }
    
    if (game.sport.includes('NCAA') && game.ncaa) {
      baseFeatures.isMarchMadness = game.ncaa.isMarchMadness ? 1 : 0;
      baseFeatures.isTournamentGame = game.ncaa.tournamentRound ? 1 : 0;
    }
    
    // Spread prediction features
    if (game.odds.spread !== null) {
      const spreadFeature = {
        ...baseFeatures,
        spreadValue: game.odds.spread,
        label: null // Will be filled with actual outcome when available
      };
      
      spreadFeatures.push(spreadFeature);
    }
    
    // Moneyline prediction features
    if (game.odds.homeMoneyline !== null && game.odds.awayMoneyline !== null) {
      const moneylineFeature = {
        ...baseFeatures,
        homeMoneyline: game.odds.homeMoneyline,
        awayMoneyline: game.odds.awayMoneyline,
        label: null // Will be filled with actual outcome when available
      };
      
      moneylineFeatures.push(moneylineFeature);
    }
    
    // Total (over/under) prediction features
    if (game.odds.overUnder !== null) {
      const totalFeature = {
        ...baseFeatures,
        overUnderValue: game.odds.overUnder,
        label: null // Will be filled with actual outcome when available
      };
      
      totalFeatures.push(totalFeature);
    }
  });
  
  return {
    spread: spreadFeatures,
    moneyline: moneylineFeatures,
    total: totalFeatures
  };
}

/**
 * Calculate average goals for a team
 * @param {Array} teamGames - Team's historical games
 * @param {string} teamName - Team name
 * @returns {number} - Average goals per game
 */
function calculateAverageGoals(teamGames, teamName) {
  if (teamGames.length === 0) {
    return 2.5; // Default to league average if no games
  }
  
  const totalGoals = teamGames.reduce((sum, game) => {
    if (game.homeTeam === teamName) {
      return sum + game.homeScore;
    } else {
      return sum + game.awayScore;
    }
  }, 0);
  
  return totalGoals / teamGames.length;
}

/**
 * Calculate average goals against for a team
 * @param {Array} teamGames - Team's historical games
 * @param {string} teamName - Team name
 * @returns {number} - Average goals against per game
 */
function calculateAverageGoalsAgainst(teamGames, teamName) {
  if (teamGames.length === 0) {
    return 2.5; // Default to league average if no games
  }
  
  const totalGoalsAgainst = teamGames.reduce((sum, game) => {
    if (game.homeTeam === teamName) {
      return sum + game.awayScore;
    } else {
      return sum + game.homeScore;
    }
  }, 0);
  
  return totalGoalsAgainst / teamGames.length;
}

/**
 * Extract features for Formula 1 races
 * @param {Array} races - Normalized races data
 * @param {Array} historicalRaces - Historical races data
 * @returns {Object} - Features for different prediction types
 */
function extractFormula1Features(races, historicalRaces) {
  console.log(`Extracting features for ${races.length} F1 races...`);
  
  // For Formula 1, we'll focus on race winner prediction
  const winnerFeatures = [];
  
  races.forEach(race => {
    // Skip races that don't have odds data
    if (!race.dataSource.odds || !race.odds.driverOdds || race.odds.driverOdds.length === 0) {
      return;
    }
    
    // Create a feature for each driver in the race
    race.odds.driverOdds.forEach(driverOdds => {
      const driverName = driverOdds.driverName;
      
      // Get driver's historical performance
      const driverHistory = getDriverHistory(driverName, historicalRaces);
      
      // Get track history
      const trackHistory = getTrackHistory(race.trackName, historicalRaces);
      
      // Base features for driver
      const driverFeature = {
        // Race metadata
        raceId: race.id,
        raceName: race.raceName,
        trackName: race.trackName,
        date: race.date,
        
        // Driver info
        driverName: driverName,
        
        // Time features
        dayOfWeek: new Date(race.date).getDay(),
        
        // Driver performance features
        driverWinRate: calculateDriverWinRate(driverName, driverHistory),
        driverPodiumRate: calculateDriverPodiumRate(driverName, driverHistory),
        driverTrackWinRate: calculateDriverTrackWinRate(driverName, race.trackName, trackHistory),
        
        // Odds-based features
        driverImpliedProbability: calculateImpliedProbability(driverOdds.odds),
        driverOdds: driverOdds.odds,
        
        // Label (will be filled with actual outcome when available)
        label: null
      };
      
      winnerFeatures.push(driverFeature);
    });
  });
  
  return {
    winner: winnerFeatures
  };
}

/**
 * Get driver's historical races
 * @param {string} driverName - Driver name
 * @param {Array} historicalRaces - Historical races
 * @returns {Array} - Driver's historical races
 */
function getDriverHistory(driverName, historicalRaces) {
  // This is a placeholder - in a real implementation, we would have
  // proper historical race data with driver results
  return [];
}

/**
 * Get historical races at a specific track
 * @param {string} trackName - Track name
 * @param {Array} historicalRaces - Historical races
 * @returns {Array} - Historical races at the track
 */
function getTrackHistory(trackName, historicalRaces) {
  // This is a placeholder - in a real implementation, we would have
  // proper historical race data with track information
  return [];
}

/**
 * Calculate win rate for a driver
 * @param {string} driverName - Driver name
 * @param {Array} driverHistory - Driver's historical races
 * @returns {number} - Win rate (0-1)
 */
function calculateDriverWinRate(driverName, driverHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual win rate from historical data
  return 0.1; // Default to 10% win rate
}

/**
 * Calculate podium rate for a driver
 * @param {string} driverName - Driver name
 * @param {Array} driverHistory - Driver's historical races
 * @returns {number} - Podium rate (0-1)
 */
function calculateDriverPodiumRate(driverName, driverHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual podium rate from historical data
  return 0.3; // Default to 30% podium rate
}

/**
 * Calculate win rate for a driver at a specific track
 * @param {string} driverName - Driver name
 * @param {string} trackName - Track name
 * @param {Array} trackHistory - Historical races at the track
 * @returns {number} - Win rate at the track (0-1)
 */
function calculateDriverTrackWinRate(driverName, trackName, trackHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual win rate at the track from historical data
  return 0.1; // Default to 10% win rate
}

/**
 * Extract features for UFC/MMA fights
 * @param {Array} fights - Normalized fights data
 * @param {Array} historicalFights - Historical fights data
 * @returns {Object} - Features for different prediction types
 */
function extractUFCFeatures(fights, historicalFights) {
  console.log(`Extracting features for ${fights.length} UFC fights...`);
  
  // For UFC, we'll focus on fight winner prediction
  const winnerFeatures = [];
  
  fights.forEach(fight => {
    // Skip fights that don't have odds data
    if (!fight.dataSource.odds || !fight.odds.fighter1 || !fight.odds.fighter2) {
      return;
    }
    
    // Get fighter names
    const fighter1Name = fight.fighter1.name;
    const fighter2Name = fight.fighter2.name;
    
    // Get fighter history
    const fighter1History = getFighterHistory(fighter1Name, historicalFights);
    const fighter2History = getFighterHistory(fighter2Name, historicalFights);
    
    // Base features for fight
    const fightFeature = {
      // Fight metadata
      fightId: fight.id,
      eventId: fight.eventId,
      eventName: fight.eventName,
      date: fight.date,
      
      // Fighter info
      fighter1Name: fighter1Name,
      fighter2Name: fighter2Name,
      
      // Fight details
      weightClass: fight.weightClass,
      isMainEvent: fight.isMainEvent ? 1 : 0,
      isTitleFight: fight.isTitleFight ? 1 : 0,
      rounds: fight.rounds,
      
      // Time features
      dayOfWeek: new Date(fight.date).getDay(),
      
      // Fighter performance features
      fighter1WinRate: calculateFighterWinRate(fighter1Name, fighter1History),
      fighter2WinRate: calculateFighterWinRate(fighter2Name, fighter2History),
      fighter1KORate: calculateFighterKORate(fighter1Name, fighter1History),
      fighter2KORate: calculateFighterKORate(fighter2Name, fighter2History),
      fighter1SubmissionRate: calculateFighterSubmissionRate(fighter1Name, fighter1History),
      fighter2SubmissionRate: calculateFighterSubmissionRate(fighter2Name, fighter2History),
      
      // Odds-based features
      fighter1ImpliedProbability: calculateImpliedProbability(fight.odds.fighter1),
      fighter2ImpliedProbability: calculateImpliedProbability(fight.odds.fighter2),
      fighter1Odds: fight.odds.fighter1,
      fighter2Odds: fight.odds.fighter2,
      
      // Label (will be filled with actual outcome when available)
      label: null
    };
    
    winnerFeatures.push(fightFeature);
  });
  
  return {
    winner: winnerFeatures
  };
}

/**
 * Get fighter's historical fights
 * @param {string} fighterName - Fighter name
 * @param {Array} historicalFights - Historical fights
 * @returns {Array} - Fighter's historical fights
 */
function getFighterHistory(fighterName, historicalFights) {
  // This is a placeholder - in a real implementation, we would have
  // proper historical fight data with fighter results
  return [];
}

/**
 * Calculate win rate for a fighter
 * @param {string} fighterName - Fighter name
 * @param {Array} fighterHistory - Fighter's historical fights
 * @returns {number} - Win rate (0-1)
 */
function calculateFighterWinRate(fighterName, fighterHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual win rate from historical data
  return 0.5; // Default to 50% win rate
}

/**
 * Calculate KO rate for a fighter
 * @param {string} fighterName - Fighter name
 * @param {Array} fighterHistory - Fighter's historical fights
 * @returns {number} - KO rate (0-1)
 */
function calculateFighterKORate(fighterName, fighterHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual KO rate from historical data
  return 0.3; // Default to 30% KO rate
}

/**
 * Calculate submission rate for a fighter
 * @param {string} fighterName - Fighter name
 * @param {Array} fighterHistory - Fighter's historical fights
 * @returns {number} - Submission rate (0-1)
 */
function calculateFighterSubmissionRate(fighterName, fighterHistory) {
  // This is a placeholder - in a real implementation, we would calculate
  // the actual submission rate from historical data
  return 0.2; // Default to 20% submission rate
}

/**
 * Extract features for a specific sport
 * @param {string} sport - Sport key
 * @returns {Object} - Features for different prediction types
 */
function extractFeatures(sport) {
  console.log(`Extracting features for ${sport}...`);
  
  let normalizedData;
  let dataType;
  
  // Determine data type based on sport
  if (sport === 'FORMULA1') {
    dataType = 'races';
  } else if (sport === 'UFC') {
    dataType = 'fights';
  } else {
    dataType = 'games';
  }
  
  // Load normalized data
  normalizedData = loadNormalizedData(sport, dataType);
  if (!normalizedData) {
    console.log(`No normalized data to extract features from for ${sport}`);
    return null;
  }
  
  // Load historical data
  const historicalData = loadHistoricalData(sport);
  
  let features;
  
  // Extract features based on sport type
  if (sport === 'FORMULA1') {
    features = extractFormula1Features(normalizedData, historicalData);
    saveFeatureData(sport, 'winner', features.winner);
  } else if (sport === 'UFC') {
    features = extractUFCFeatures(normalizedData, historicalData);
    saveFeatureData(sport, 'winner', features.winner);
  } else {
    // Team sports (NBA, WNBA, MLB, NHL, NCAA)
    features = extractTeamSportFeatures(normalizedData, historicalData);
    saveFeatureData(sport, 'spread', features.spread);
    saveFeatureData(sport, 'moneyline', features.moneyline);
    saveFeatureData(sport, 'total', features.total);
  }
  
  return features;
}

/**
 * Extract features for all sports
 */
async function extractAllSportsFeatures() {
  console.log('Starting feature extraction process...');
  
  // List of sports to extract features for
  const sports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'];
  
  // Extract features for each sport
  for (const sport of sports) {
    try {
      extractFeatures(sport);
    } catch (error) {
      console.error(`Error extracting features for ${sport}:`, error);
      // Continue with next sport
    }
  }
  
  console.log('Feature extraction process completed');
}

// Execute if run directly
if (require.main === module) {
  extractAllSportsFeatures()
    .then(() => {
      console.log('Feature extraction script completed successfully');
    })
    .catch(error => {
      console.error('Error in feature extraction script:', error);
      process.exit(1);
    });
}

module.exports = {
  extractFeatures,
  extractAllSportsFeatures,
  extractTeamSportFeatures,
  extractFormula1Features,
  extractUFCFeatures
};