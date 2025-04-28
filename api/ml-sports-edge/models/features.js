/**
 * Feature Extraction Module
 * Extracts features from historical data for ML model training
 */

const fs = require('fs');
const path = require('path');
const espnApiWrapper = require('../data/espnApiWrapper');

// Data directories
const HISTORICAL_DATA_DIR = path.join(__dirname, '..', 'data', 'historical');
const FEATURES_DIR = path.join(__dirname, '..', 'data', 'features');
const ESPN_DATA_DIR = path.join(__dirname, '..', 'data', 'espn');
const BET365_DATA_DIR = path.join(__dirname, '..', 'data', 'bet365');

// Ensure directories exist
if (!fs.existsSync(FEATURES_DIR)) {
  fs.mkdirSync(FEATURES_DIR, { recursive: true });
}

if (!fs.existsSync(ESPN_DATA_DIR)) {
  fs.mkdirSync(ESPN_DATA_DIR, { recursive: true });
}

if (!fs.existsSync(BET365_DATA_DIR)) {
  fs.mkdirSync(BET365_DATA_DIR, { recursive: true });
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
 * Fetch and save ESPN data for a sport
 * @param {string} sport - Sport key
 * @param {string} league - League key
 * @returns {Promise<Object>} - ESPN data
 */
async function fetchESPNData(sport, league) {
  console.log(`Fetching ESPN data for ${sport}/${league}...`);
  
  try {
    // Map sport key to ESPN sport code
    const sportMapping = {
      'NBA': { sport: 'basketball', league: 'nba' },
      'WNBA': { sport: 'basketball', league: 'wnba' },
      'NFL': { sport: 'football', league: 'nfl' },
      'MLB': { sport: 'baseball', league: 'mlb' },
      'NHL': { sport: 'hockey', league: 'nhl' },
      'NCAA_MENS': { sport: 'basketball', league: 'mens-college-basketball' },
      'NCAA_WOMENS': { sport: 'basketball', league: 'womens-college-basketball' }
    };
    
    const mapping = sportMapping[sport];
    if (!mapping) {
      console.log(`No ESPN mapping for ${sport}`);
      return null;
    }
    
    // Fetch data from ESPN API
    const scoreboard = await espnApiWrapper.getScoreboard(mapping.sport, mapping.league);
    const standings = await espnApiWrapper.getStandings(mapping.sport, mapping.league);
    const teams = await espnApiWrapper.getTeams(mapping.sport, mapping.league);
    
    // Calculate odds based on ESPN data
    const calculatedOdds = await espnApiWrapper.calculateOdds(mapping.sport, mapping.league);
    
    // Combine all data
    const espnData = {
      scoreboard,
      standings,
      teams,
      calculatedOdds
    };
    
    // Save data to file
    const espnDataPath = path.join(ESPN_DATA_DIR, `${sport.toLowerCase()}_espn_data.json`);
    fs.writeFileSync(espnDataPath, JSON.stringify(espnData, null, 2));
    console.log(`Saved ESPN data for ${sport} to ${espnDataPath}`);
    
    return espnData;
  } catch (error) {
    console.error(`Error fetching ESPN data for ${sport}/${league}:`, error);
    return null;
  }
}

/**
 * Extract ESPN-specific features
 * @param {Object} game - Game data
 * @param {Object} espnData - ESPN data
 * @returns {Object} - ESPN features
 */
function extractESPNFeatures(game, espnData) {
  if (!espnData) {
    return {};
  }
  
  const features = {
    hasESPNData: 1
  };
  
  try {
    // Find matching game in ESPN data
    const espnGame = findMatchingESPNGame(game, espnData);
    
    if (espnGame) {
      features.espnGameId = espnGame.gameId;
      
      // Add odds features from ESPN calculated odds
      if (espnGame.odds) {
        features.espnHomeMoneyline = espnGame.odds.homeMoneyline;
        features.espnAwayMoneyline = espnGame.odds.awayMoneyline;
        features.espnSpread = espnGame.odds.spread;
        features.espnOverUnder = espnGame.odds.overUnder;
        
        // Add implied probabilities
        features.espnHomeImpliedProbability = oddsToImpliedProbability(espnGame.odds.homeMoneyline);
        features.espnAwayImpliedProbability = oddsToImpliedProbability(espnGame.odds.awayMoneyline);
      }
    }
    
    // Find teams in ESPN data
    const homeTeam = findTeamInESPNData(game.homeTeam, espnData);
    const awayTeam = findTeamInESPNData(game.awayTeam, espnData);
    
    // Add team features from ESPN data
    if (homeTeam) {
      features.espnHomeTeamId = homeTeam.id;
      
      // Add team record
      const homeRecord = getTeamRecordFromESPN(homeTeam.id, espnData);
      if (homeRecord) {
        features.espnHomeWins = homeRecord.wins;
        features.espnHomeLosses = homeRecord.losses;
        features.espnHomeWinPct = homeRecord.winPercentage;
      }
    }
    
    if (awayTeam) {
      features.espnAwayTeamId = awayTeam.id;
      
      // Add team record
      const awayRecord = getTeamRecordFromESPN(awayTeam.id, espnData);
      if (awayRecord) {
        features.espnAwayWins = awayRecord.wins;
        features.espnAwayLosses = awayRecord.losses;
        features.espnAwayWinPct = awayRecord.winPercentage;
      }
    }
  } catch (error) {
    console.error('Error extracting ESPN features:', error);
  }
  
  return features;
}

/**
 * Find matching game in ESPN data
 * @param {Object} game - Game data
 * @param {Object} espnData - ESPN data
 * @returns {Object|null} - Matching ESPN game
 */
function findMatchingESPNGame(game, espnData) {
  if (!espnData || !espnData.calculatedOdds) {
    return null;
  }
  
  // Try to find by team names
  return espnData.calculatedOdds.find(espnGame => {
    const homeTeamMatch = espnGame.homeTeam.name.toLowerCase().includes(game.homeTeam.toLowerCase()) ||
                         game.homeTeam.toLowerCase().includes(espnGame.homeTeam.name.toLowerCase());
    
    const awayTeamMatch = espnGame.awayTeam.name.toLowerCase().includes(game.awayTeam.toLowerCase()) ||
                         game.awayTeam.toLowerCase().includes(espnGame.awayTeam.name.toLowerCase());
    
    return homeTeamMatch && awayTeamMatch;
  });
}

/**
 * Find team in ESPN data
 * @param {string} teamName - Team name
 * @param {Object} espnData - ESPN data
 * @returns {Object|null} - Team data
 */
function findTeamInESPNData(teamName, espnData) {
  if (!espnData || !espnData.teams || !espnData.teams.sports) {
    return null;
  }
  
  // Normalize team name
  const normalizedName = teamName.toLowerCase();
  
  // Search through all teams
  for (const sport of espnData.teams.sports) {
    for (const league of sport.leagues) {
      for (const team of league.teams) {
        const teamData = team.team;
        
        // Check if team name matches
        if (teamData.displayName.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(teamData.displayName.toLowerCase()) ||
            (teamData.abbreviation && normalizedName.includes(teamData.abbreviation.toLowerCase()))) {
          return teamData;
        }
      }
    }
  }
  
  return null;
}

/**
 * Get team record from ESPN data
 * @param {string} teamId - ESPN team ID
 * @param {Object} espnData - ESPN data
 * @returns {Object|null} - Team record
 */
function getTeamRecordFromESPN(teamId, espnData) {
  if (!espnData || !espnData.standings || !espnData.standings.standings) {
    return null;
  }
  
  for (const group of espnData.standings.standings) {
    for (const entry of group.entries) {
      if (entry.team.id === teamId) {
        const wins = entry.stats.find(s => s.name === 'wins')?.value || 0;
        const losses = entry.stats.find(s => s.name === 'losses')?.value || 0;
        const ties = entry.stats.find(s => s.name === 'ties')?.value || 0;
        
        const totalGames = wins + losses + ties;
        const winPercentage = totalGames > 0 ? wins / totalGames : 0.5;
        
        return {
          wins,
          losses,
          ties,
          winPercentage
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract features for a specific sport
 * @param {string} sport - Sport key
 * @returns {Promise<Array>} - Extracted features
 */
async function extractFeatures(sport) {
  console.log(`Extracting features for ${sport}...`);
  
  // Load historical data
  const games = loadHistoricalData(sport);
  
  if (games.length === 0) {
    console.log(`No games found for ${sport}`);
    return [];
  }
  
  // Map sport to league for ESPN API
  const sportToLeague = {
    'NBA': 'nba',
    'WNBA': 'wnba',
    'NFL': 'nfl',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'NCAA_MENS': 'mens-college-basketball',
    'NCAA_WOMENS': 'womens-college-basketball'
  };
  
  // Fetch ESPN data
  const espnData = await fetchESPNData(sport, sportToLeague[sport]);
  
  // Load Bet365 data
  const bet365Data = await loadBet365Data(sport);
  
  // Extract features based on sport
  let features = [];
  
  switch (sport) {
    case 'NBA':
    case 'WNBA':
      features = games.map(game => {
        const baseFeatures = extractNBAFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
      break;
    case 'NFL':
      features = games.map(game => {
        const baseFeatures = extractNFLFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
      break;
    case 'MLB':
      features = games.map(game => {
        const baseFeatures = extractMLBFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
      break;
    case 'NHL':
      features = games.map(game => {
        const baseFeatures = extractNHLFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
      break;
    case 'NCAA_MENS':
    case 'NCAA_WOMENS':
      features = games.map(game => {
        const baseFeatures = extractNCAABasketballFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
      break;
    default:
      features = games.map(game => {
        const baseFeatures = extractBasicFeatures(game);
        const espnFeatures = extractESPNFeatures(game, espnData);
        const bet365Features = extractBet365Features(game, bet365Data);
        return { ...baseFeatures, ...espnFeatures, ...bet365Features };
      });
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
async function extractAllFeatures() {
  console.log('Extracting features for all sports...');
  
  const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS'];
  
  for (const sport of sports) {
    try {
      await extractFeatures(sport);
    } catch (error) {
      console.error(`Error extracting features for ${sport}:`, error);
    }
  }
  
  console.log('Feature extraction completed');
}

// Execute if run directly
if (require.main === module) {
  extractAllFeatures().catch(error => {
    console.error('Error extracting features:', error);
    process.exit(1);
  });
}

/**
 * Load Bet365 data for a sport
 * @param {string} sport - Sport key
 * @returns {Promise<Object>} - Bet365 data
 */
async function loadBet365Data(sport) {
  // Find the most recent Bet365 data file for the sport
  const files = fs.readdirSync(BET365_DATA_DIR)
    .filter(file => file.startsWith(`${sport.toLowerCase()}_bet365_odds_`))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log(`No Bet365 data found for ${sport}`);
    return null;
  }
  
  // Load the most recent data
  const filePath = path.join(BET365_DATA_DIR, files[0]);
  console.log(`Loading Bet365 data from ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading Bet365 data from ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract Bet365-specific features
 * @param {Object} game - Game data
 * @param {Object} bet365Data - Bet365 data
 * @returns {Object} - Bet365 features
 */
function extractBet365Features(game, bet365Data) {
  if (!bet365Data || !bet365Data.events || bet365Data.events.length === 0) {
    return {};
  }
  
  const features = {
    hasBet365Data: 1
  };
  
  try {
    // Find matching game in Bet365 data
    const bet365Game = findMatchingBet365Game(game, bet365Data);
    
    if (bet365Game) {
      features.bet365GameFound = 1;
      
      // Add odds features from Bet365
      if (bet365Game.odds) {
        features.bet365HomeMoneyline = bet365Game.odds.homeMoneyline;
        features.bet365AwayMoneyline = bet365Game.odds.awayMoneyline;
        features.bet365DrawMoneyline = bet365Game.odds.drawMoneyline;
        
        // Add implied probabilities
        features.bet365HomeImpliedProbability = oddsToImpliedProbability(bet365Game.odds.homeMoneyline);
        features.bet365AwayImpliedProbability = oddsToImpliedProbability(bet365Game.odds.awayMoneyline);
        
        if (bet365Game.odds.drawMoneyline) {
          features.bet365DrawImpliedProbability = oddsToImpliedProbability(bet365Game.odds.drawMoneyline);
        }
        
        // Add odds comparison features if we have both Bet365 and regular odds
        if (game.odds?.homeMoneyline && features.bet365HomeMoneyline) {
          features.homeOddsDiscrepancy = features.bet365HomeMoneyline - game.odds.homeMoneyline;
          features.homeImpliedProbabilityDiscrepancy =
            features.bet365HomeImpliedProbability - oddsToImpliedProbability(game.odds.homeMoneyline);
        }
        
        if (game.odds?.awayMoneyline && features.bet365AwayMoneyline) {
          features.awayOddsDiscrepancy = features.bet365AwayMoneyline - game.odds.awayMoneyline;
          features.awayImpliedProbabilityDiscrepancy =
            features.bet365AwayImpliedProbability - oddsToImpliedProbability(game.odds.awayMoneyline);
        }
        
        // Calculate value bet indicators
        if (game.odds?.homeMoneyline && features.bet365HomeMoneyline) {
          const regularImplied = oddsToImpliedProbability(game.odds.homeMoneyline);
          const bet365Implied = features.bet365HomeImpliedProbability;
          
          // If Bet365 gives better odds (lower implied probability)
          if (bet365Implied < regularImplied * 0.95) {
            features.homeValueBet = 1;
            features.homeValuePercentage = (regularImplied / bet365Implied - 1) * 100;
          } else {
            features.homeValueBet = 0;
            features.homeValuePercentage = 0;
          }
        }
        
        if (game.odds?.awayMoneyline && features.bet365AwayMoneyline) {
          const regularImplied = oddsToImpliedProbability(game.odds.awayMoneyline);
          const bet365Implied = features.bet365AwayImpliedProbability;
          
          // If Bet365 gives better odds (lower implied probability)
          if (bet365Implied < regularImplied * 0.95) {
            features.awayValueBet = 1;
            features.awayValuePercentage = (regularImplied / bet365Implied - 1) * 100;
          } else {
            features.awayValueBet = 0;
            features.awayValuePercentage = 0;
          }
        }
      }
      
      // Add in-play status
      if (bet365Game.status) {
        features.bet365InPlay = bet365Game.status === 'in-play' ? 1 : 0;
      }
      
      // Add score data if available
      if (bet365Game.scores) {
        features.bet365HomeScore = bet365Game.scores.homeScore;
        features.bet365AwayScore = bet365Game.scores.awayScore;
        
        // Compare with other score data if available
        if (game.homeScore !== undefined && game.awayScore !== undefined) {
          features.homeScoreDiscrepancy = features.bet365HomeScore - game.homeScore;
          features.awayScoreDiscrepancy = features.bet365AwayScore - game.awayScore;
        }
      }
    } else {
      features.bet365GameFound = 0;
    }
  } catch (error) {
    console.error('Error extracting Bet365 features:', error);
  }
  
  return features;
}

/**
 * Find matching game in Bet365 data
 * @param {Object} game - Game data
 * @param {Object} bet365Data - Bet365 data
 * @returns {Object|null} - Matching Bet365 game
 */
function findMatchingBet365Game(game, bet365Data) {
  if (!bet365Data || !bet365Data.events) {
    return null;
  }
  
  // Normalize team names
  const homeTeam = game.homeTeam.toLowerCase();
  const awayTeam = game.awayTeam.toLowerCase();
  
  // Try to find by team names
  return bet365Data.events.find(bet365Game => {
    const bet365HomeTeam = (bet365Game.homeTeam || '').toLowerCase();
    const bet365AwayTeam = (bet365Game.awayTeam || '').toLowerCase();
    
    // Check if team names match (partial match is acceptable)
    const homeMatch = bet365HomeTeam.includes(homeTeam) || homeTeam.includes(bet365HomeTeam);
    const awayMatch = bet365AwayTeam.includes(awayTeam) || awayTeam.includes(bet365AwayTeam);
    
    return homeMatch && awayMatch;
  });
}

module.exports = {
  extractFeatures,
  extractAllFeatures,
  loadHistoricalData,
  fetchESPNData,
  loadBet365Data,
  extractESPNFeatures,
  extractBet365Features,
  findMatchingESPNGame,
  findMatchingBet365Game,
  findTeamInESPNData,
  getTeamRecordFromESPN
};