/**
 * Feature Extraction Module
 * Extracts features from historical data for ML model training
 */

const fs = require('fs');
const path = require('path');

// Data directories
const HISTORICAL_DATA_DIR = path.join(__dirname, '..', 'data', 'historical');
const FEATURES_DIR = path.join(__dirname, '..', 'data', 'features');

// Ensure features directory exists
if (!fs.existsSync(FEATURES_DIR)) {
  fs.mkdirSync(FEATURES_DIR, { recursive: true });
}

/**
 * Load historical data for a sport
 * @param {string} sport - Sport key
 * @returns {Array} - Historical data
 */
function loadHistoricalData(sport) {
  // Find all historical data files for the sport
  const files = fs.readdirSync(HISTORICAL_DATA_DIR)
    .filter(file => file.startsWith(`${sport.toLowerCase()}_historical_`))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log(`No historical data found for ${sport}`);
    return [];
  }
  
  // Load and combine all historical data
  let allGames = [];
  
  files.forEach(file => {
    const filePath = path.join(HISTORICAL_DATA_DIR, file);
    console.log(`Loading historical data from ${filePath}`);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.games && Array.isArray(data.games)) {
        allGames = allGames.concat(data.games);
      }
    } catch (error) {
      console.error(`Error loading historical data from ${filePath}:`, error);
    }
  });
  
  console.log(`Loaded ${allGames.length} games for ${sport}`);
  return allGames;
}

/**
 * Extract basic features common to all sports
 * @param {Object} game - Game data
 * @returns {Object} - Basic features
 */
function extractBasicFeatures(game) {
  const features = {
    // Team identifiers
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    
    // Game outcome (target variable)
    homeWin: game.homeScore > game.awayScore ? 1 : 0,
    
    // Score-related features
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    totalScore: game.homeScore + game.awayScore,
    scoreDifference: game.homeScore - game.awayScore,
    
    // Odds-related features
    homeMoneyline: game.odds?.homeMoneyline,
    awayMoneyline: game.odds?.awayMoneyline,
    spread: game.odds?.spread,
    overUnder: game.odds?.overUnder,
    
    // Data source
    dataSource: game.dataSource || 'unknown'
  };
  
  // Convert moneyline odds to implied probability
  if (features.homeMoneyline) {
    features.homeImpliedProbability = oddsToImpliedProbability(features.homeMoneyline);
  }
  
  if (features.awayMoneyline) {
    features.awayImpliedProbability = oddsToImpliedProbability(features.awayMoneyline);
  }
  
  return features;
}

/**
 * Extract NBA-specific features
 * @param {Object} game - Game data
 * @returns {Object} - NBA features
 */
function extractNBAFeatures(game) {
  const features = extractBasicFeatures(game);
  
  // Add NBA-specific features
  if (game.homeTeam && game.homeTeam.stats) {
    features.homePPG = game.homeTeam.stats.ppg;
    features.homeRPG = game.homeTeam.stats.rpg;
    features.homeAPG = game.homeTeam.stats.apg;
    features.homeFGP = game.homeTeam.stats.fgp;
    features.homeTPP = game.homeTeam.stats.tpp;
  }
  
  if (game.awayTeam && game.awayTeam.stats) {
    features.awayPPG = game.awayTeam.stats.ppg;
    features.awayRPG = game.awayTeam.stats.rpg;
    features.awayAPG = game.awayTeam.stats.apg;
    features.awayFGP = game.awayTeam.stats.fgp;
    features.awayTPP = game.awayTeam.stats.tpp;
  }
  
  if (game.homeTeam && game.homeTeam.standing) {
    features.homeWins = game.homeTeam.standing.wins;
    features.homeLosses = game.homeTeam.standing.losses;
    features.homeWinPct = game.homeTeam.standing.winPercent;
  }
  
  if (game.awayTeam && game.awayTeam.standing) {
    features.awayWins = game.awayTeam.standing.wins;
    features.awayLosses = game.awayTeam.standing.losses;
    features.awayWinPct = game.awayTeam.standing.winPercent;
  }
  
  // Add features from sportsbookreview data
  if (game.dataSource === 'sportsbookreview') {
    // Add any sportsbookreview-specific features
    features.hasSportsbookreviewData = 1;
  } else {
    features.hasSportsbookreviewData = 0;
  }
  
  return features;
}

/**
 * Extract NFL-specific features
 * @param {Object} game - Game data
 * @returns {Object} - NFL features
 */
function extractNFLFeatures(game) {
  const features = extractBasicFeatures(game);
  
  // Add NFL-specific features
  if (game.homeTeam && game.homeTeam.stats) {
    features.homePPG = game.homeTeam.stats.ppg;
    features.homeYPG = game.homeTeam.stats.ypg;
    features.homePassingYPG = game.homeTeam.stats.passingYpg;
    features.homeRushingYPG = game.homeTeam.stats.rushingYpg;
    features.homeDefensiveYPG = game.homeTeam.stats.defensiveYpg;
  }
  
  if (game.awayTeam && game.awayTeam.stats) {
    features.awayPPG = game.awayTeam.stats.ppg;
    features.awayYPG = game.awayTeam.stats.ypg;
    features.awayPassingYPG = game.awayTeam.stats.passingYpg;
    features.awayRushingYPG = game.awayTeam.stats.rushingYpg;
    features.awayDefensiveYPG = game.awayTeam.stats.defensiveYpg;
  }
  
  if (game.homeTeam && game.homeTeam.standing) {
    features.homeWins = game.homeTeam.standing.wins;
    features.homeLosses = game.homeTeam.standing.losses;
    features.homeTies = game.homeTeam.standing.ties;
    features.homeWinPct = game.homeTeam.standing.winPercent;
  }
  
  if (game.awayTeam && game.awayTeam.standing) {
    features.awayWins = game.awayTeam.standing.wins;
    features.awayLosses = game.awayTeam.standing.losses;
    features.awayTies = game.awayTeam.standing.ties;
    features.awayWinPct = game.awayTeam.standing.winPercent;
  }
  
  // Add features from sportsbookreview data
  if (game.dataSource === 'sportsbookreview') {
    // Add any sportsbookreview-specific features
    features.hasSportsbookreviewData = 1;
  } else {
    features.hasSportsbookreviewData = 0;
  }
  
  return features;
}

/**
 * Extract MLB-specific features
 * @param {Object} game - Game data
 * @returns {Object} - MLB features
 */
function extractMLBFeatures(game) {
  const features = extractBasicFeatures(game);
  
  // Add MLB-specific features
  if (game.homeTeam && game.homeTeam.stats) {
    features.homeAVG = game.homeTeam.stats.avg;
    features.homeRuns = game.homeTeam.stats.runs;
    features.homeHR = game.homeTeam.stats.homeRuns;
    features.homeOBP = game.homeTeam.stats.obp;
    features.homeSLG = game.homeTeam.stats.slg;
    features.homeERA = game.homeTeam.stats.era;
  }
  
  if (game.awayTeam && game.awayTeam.stats) {
    features.awayAVG = game.awayTeam.stats.avg;
    features.awayRuns = game.awayTeam.stats.runs;
    features.awayHR = game.awayTeam.stats.homeRuns;
    features.awayOBP = game.awayTeam.stats.obp;
    features.awaySLG = game.awayTeam.stats.slg;
    features.awayERA = game.awayTeam.stats.era;
  }
  
  if (game.homeTeam && game.homeTeam.standing) {
    features.homeWins = game.homeTeam.standing.wins;
    features.homeLosses = game.homeTeam.standing.losses;
    features.homeWinPct = game.homeTeam.standing.winPercent;
  }
  
  if (game.awayTeam && game.awayTeam.standing) {
    features.awayWins = game.awayTeam.standing.wins;
    features.awayLosses = game.awayTeam.standing.losses;
    features.awayWinPct = game.awayTeam.standing.winPercent;
  }
  
  // Add features from sportsbookreview data
  if (game.dataSource === 'sportsbookreview') {
    // Add any sportsbookreview-specific features
    features.hasSportsbookreviewData = 1;
  } else {
    features.hasSportsbookreviewData = 0;
  }
  
  return features;
}

/**
 * Extract NHL-specific features
 * @param {Object} game - Game data
 * @returns {Object} - NHL features
 */
function extractNHLFeatures(game) {
  const features = extractBasicFeatures(game);
  
  // Add NHL-specific features
  if (game.homeTeam && game.homeTeam.stats) {
    features.homeGoalsPerGame = game.homeTeam.stats.goalsPerGame;
    features.homeGoalsAgainstPerGame = game.homeTeam.stats.goalsAgainstPerGame;
    features.homePowerPlayPct = game.homeTeam.stats.powerPlayPct;
    features.homePenaltyKillPct = game.homeTeam.stats.penaltyKillPct;
  }
  
  if (game.awayTeam && game.awayTeam.stats) {
    features.awayGoalsPerGame = game.awayTeam.stats.goalsPerGame;
    features.awayGoalsAgainstPerGame = game.awayTeam.stats.goalsAgainstPerGame;
    features.awayPowerPlayPct = game.awayTeam.stats.powerPlayPct;
    features.awayPenaltyKillPct = game.awayTeam.stats.penaltyKillPct;
  }
  
  if (game.homeTeam && game.homeTeam.standing) {
    features.homeWins = game.homeTeam.standing.wins;
    features.homeLosses = game.homeTeam.standing.losses;
    features.homeOTLosses = game.homeTeam.standing.otLosses;
    features.homePoints = game.homeTeam.standing.points;
  }
  
  if (game.awayTeam && game.awayTeam.standing) {
    features.awayWins = game.awayTeam.standing.wins;
    features.awayLosses = game.awayTeam.standing.losses;
    features.awayOTLosses = game.awayTeam.standing.otLosses;
    features.awayPoints = game.awayTeam.standing.points;
  }
  
  // Add features from sportsbookreview data
  if (game.dataSource === 'sportsbookreview') {
    // Add any sportsbookreview-specific features
    features.hasSportsbookreviewData = 1;
  } else {
    features.hasSportsbookreviewData = 0;
  }
  
  return features;
}

/**
 * Extract NCAA basketball-specific features
 * @param {Object} game - Game data
 * @returns {Object} - NCAA basketball features
 */
function extractNCAABasketballFeatures(game) {
  const features = extractBasicFeatures(game);
  
  // Add NCAA basketball-specific features
  if (game.homeTeam && game.homeTeam.stats) {
    features.homePPG = game.homeTeam.stats.ppg;
    features.homeRPG = game.homeTeam.stats.rpg;
    features.homeAPG = game.homeTeam.stats.apg;
    features.homeFGP = game.homeTeam.stats.fgp;
    features.homeTPP = game.homeTeam.stats.tpp;
  }
  
  if (game.awayTeam && game.awayTeam.stats) {
    features.awayPPG = game.awayTeam.stats.ppg;
    features.awayRPG = game.awayTeam.stats.rpg;
    features.awayAPG = game.awayTeam.stats.apg;
    features.awayFGP = game.awayTeam.stats.fgp;
    features.awayTPP = game.awayTeam.stats.tpp;
  }
  
  if (game.homeTeam && game.homeTeam.standing) {
    features.homeWins = game.homeTeam.standing.wins;
    features.homeLosses = game.homeTeam.standing.losses;
    features.homeWinPct = game.homeTeam.standing.winPercent;
    features.homeConfWins = game.homeTeam.standing.conferenceWins;
    features.homeConfLosses = game.homeTeam.standing.conferenceLosses;
  }
  
  if (game.awayTeam && game.awayTeam.standing) {
    features.awayWins = game.awayTeam.standing.wins;
    features.awayLosses = game.awayTeam.standing.losses;
    features.awayWinPct = game.awayTeam.standing.winPercent;
    features.awayConfWins = game.awayTeam.standing.conferenceWins;
    features.awayConfLosses = game.awayTeam.standing.conferenceLosses;
  }
  
  // Add NCAA-specific features
  if (game.ncaaData) {
    features.isMarchMadness = game.ncaaData.isMarchMadness ? 1 : 0;
    features.tournamentRound = game.ncaaData.tournamentRound;
    features.bracketRegion = game.ncaaData.bracketRegion;
  }
  
  // Add features from sportsbookreview data
  if (game.dataSource === 'sportsbookreview') {
    // Add any sportsbookreview-specific features
    features.hasSportsbookreviewData = 1;
  } else {
    features.hasSportsbookreviewData = 0;
  }
  
  return features;
}

/**
 * Convert American odds to implied probability
 * @param {number} odds - American odds
 * @returns {number} - Implied probability (0-1)
 */
function oddsToImpliedProbability(odds) {
  if (!odds) return null;
  
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Extract features for a specific sport
 * @param {string} sport - Sport key
 * @returns {Array} - Extracted features
 */
function extractFeatures(sport) {
  console.log(`Extracting features for ${sport}...`);
  
  // Load historical data
  const games = loadHistoricalData(sport);
  
  if (games.length === 0) {
    console.log(`No games found for ${sport}`);
    return [];
  }
  
  // Extract features based on sport
  let features = [];
  
  switch (sport) {
    case 'NBA':
    case 'WNBA':
      features = games.map(extractNBAFeatures);
      break;
    case 'NFL':
      features = games.map(extractNFLFeatures);
      break;
    case 'MLB':
      features = games.map(extractMLBFeatures);
      break;
    case 'NHL':
      features = games.map(extractNHLFeatures);
      break;
    case 'NCAA_MENS':
    case 'NCAA_WOMENS':
      features = games.map(extractNCAABasketballFeatures);
      break;
    default:
      features = games.map(extractBasicFeatures);
  }
  
  // Save features to file
  const featuresPath = path.join(FEATURES_DIR, `${sport.toLowerCase()}_features.json`);
  fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));
  console.log(`Saved ${features.length} feature sets to ${featuresPath}`);
  
  return features;
}

/**
 * Extract features for all sports
 */
function extractAllFeatures() {
  console.log('Extracting features for all sports...');
  
  const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS'];
  
  sports.forEach(sport => {
    try {
      extractFeatures(sport);
    } catch (error) {
      console.error(`Error extracting features for ${sport}:`, error);
    }
  });
  
  console.log('Feature extraction completed');
}

// Execute if run directly
if (require.main === module) {
  extractAllFeatures();
}

module.exports = {
  extractFeatures,
  extractAllFeatures,
  loadHistoricalData
};