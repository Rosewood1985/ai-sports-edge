/**
 * Odds API Routes
 * Provides endpoints for sports odds data
 */

import express from 'express';
import wnbaOddsService from '../../services/WnbaOddsService.js';
import ncaaOddsService from '../../services/NcaaOddsService.js';
import formula1OddsService from '../../services/Formula1OddsService.js';
import fanDuelService from '../../services/FanDuelService.js';
import oddsService from '../../services/OddsService.js';

const router = express.Router();

/**
 * Middleware to handle errors
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  });

/**
 * @route GET /api/odds/wnba
 * @description Get WNBA odds
 * @access Public
 */
router.get('/wnba', asyncHandler(async (req, res) => {
  const { market = 'h2h' } = req.query;
  
  let odds;
  switch (market.toLowerCase()) {
    case 'spreads':
      odds = await wnbaOddsService.getSpreadOdds();
      break;
    case 'totals':
      odds = await wnbaOddsService.getTotalsOdds();
      break;
    case 'h2h':
    default:
      odds = await wnbaOddsService.getMoneylineOdds();
      break;
  }
  
  res.json(odds);
}));

/**
 * @route GET /api/odds/wnba/best
 * @description Get best WNBA odds
 * @access Public
 */
router.get('/wnba/best', asyncHandler(async (req, res) => {
  const bestOdds = await wnbaOddsService.getBestOdds();
  res.json(bestOdds);
}));

/**
 * @route GET /api/odds/wnba/:gameId
 * @description Get WNBA odds for a specific game
 * @access Public
 */
router.get('/wnba/:gameId', asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const gameOdds = await wnbaOddsService.getGameOdds(gameId);
  
  if (!gameOdds) {
    return res.status(404).json({
      error: 'Game not found',
      message: `No game found with ID: ${gameId}`,
    });
  }
  
  res.json(gameOdds);
}));

/**
 * @route GET /api/odds/ncaa/:gender
 * @description Get NCAA basketball odds
 * @access Public
 */
router.get('/ncaa/:gender', asyncHandler(async (req, res) => {
  const { gender } = req.params;
  const { market = 'h2h' } = req.query;
  
  if (gender !== 'mens' && gender !== 'womens') {
    return res.status(400).json({
      error: 'Invalid gender',
      message: 'Gender must be "mens" or "womens"',
    });
  }
  
  let odds;
  switch (market.toLowerCase()) {
    case 'spreads':
      odds = gender === 'mens'
        ? await ncaaOddsService.getMensSpreadOdds()
        : await ncaaOddsService.getWomensSpreadOdds();
      break;
    case 'totals':
      odds = gender === 'mens'
        ? await ncaaOddsService.getMensTotalsOdds()
        : await ncaaOddsService.getWomensTotalsOdds();
      break;
    case 'h2h':
    default:
      odds = gender === 'mens'
        ? await ncaaOddsService.getMensMoneylineOdds()
        : await ncaaOddsService.getWomensMoneylineOdds();
      break;
  }
  
  res.json(odds);
}));

/**
 * @route GET /api/odds/ncaa/:gender/march-madness
 * @description Get NCAA March Madness odds
 * @access Public
 */
router.get('/ncaa/:gender/march-madness', asyncHandler(async (req, res) => {
  const { gender } = req.params;
  
  if (gender !== 'mens' && gender !== 'womens') {
    return res.status(400).json({
      error: 'Invalid gender',
      message: 'Gender must be "mens" or "womens"',
    });
  }
  
  const marchMadnessOdds = await ncaaOddsService.getMarchMadnessOdds(gender);
  res.json(marchMadnessOdds);
}));

/**
 * @route GET /api/odds/ncaa/:gender/best
 * @description Get best NCAA basketball odds
 * @access Public
 */
router.get('/ncaa/:gender/best', asyncHandler(async (req, res) => {
  const { gender } = req.params;
  
  if (gender !== 'mens' && gender !== 'womens') {
    return res.status(400).json({
      error: 'Invalid gender',
      message: 'Gender must be "mens" or "womens"',
    });
  }
  
  const bestOdds = await ncaaOddsService.getBestOdds(gender);
  res.json(bestOdds);
}));

/**
 * @route GET /api/odds/ncaa/:gender/:gameId
 * @description Get NCAA basketball odds for a specific game
 * @access Public
 */
router.get('/ncaa/:gender/:gameId', asyncHandler(async (req, res) => {
  const { gender, gameId } = req.params;
  
  if (gender !== 'mens' && gender !== 'womens') {
    return res.status(400).json({
      error: 'Invalid gender',
      message: 'Gender must be "mens" or "womens"',
    });
  }
  
  const gameOdds = await ncaaOddsService.getGameOdds(gameId, gender);
  
  if (!gameOdds) {
    return res.status(404).json({
      error: 'Game not found',
      message: `No game found with ID: ${gameId}`,
    });
  }
  
  res.json(gameOdds);
}));

/**
 * @route GET /api/odds/formula1/race-winner
 * @description Get Formula 1 race winner odds
 * @access Public
 */
router.get('/formula1/race-winner', asyncHandler(async (req, res) => {
  const raceWinnerOdds = await formula1OddsService.getRaceWinnerOdds();
  res.json(raceWinnerOdds);
}));

/**
 * @route GET /api/odds/formula1/driver-championship
 * @description Get Formula 1 driver championship odds
 * @access Public
 */
router.get('/formula1/driver-championship', asyncHandler(async (req, res) => {
  const driverChampionshipOdds = await formula1OddsService.getDriverChampionshipOdds();
  res.json(driverChampionshipOdds);
}));

/**
 * @route GET /api/odds/formula1/constructor-championship
 * @description Get Formula 1 constructor championship odds
 * @access Public
 */
router.get('/formula1/constructor-championship', asyncHandler(async (req, res) => {
  const constructorChampionshipOdds = await formula1OddsService.getConstructorChampionshipOdds();
  res.json(constructorChampionshipOdds);
}));

/**
 * @route GET /api/odds/formula1/best-driver
 * @description Get best Formula 1 driver odds
 * @access Public
 */
router.get('/formula1/best-driver', asyncHandler(async (req, res) => {
  const { raceId } = req.query;
  const bestDriverOdds = await formula1OddsService.getBestDriverOdds(raceId);
  res.json(bestDriverOdds);
}));

/**
 * @route GET /api/odds/formula1/:raceId
 * @description Get Formula 1 odds for a specific race
 * @access Public
 */
router.get('/formula1/:raceId', asyncHandler(async (req, res) => {
  const { raceId } = req.params;
  const raceOdds = await formula1OddsService.getRaceOdds(raceId);
  
  if (!raceOdds) {
    return res.status(404).json({
      error: 'Race not found',
      message: `No race found with ID: ${raceId}`,
    });
  }
  
  res.json(raceOdds);
}));

/**
 * @route GET /api/odds/fanduel/link
 * @description Generate a FanDuel affiliate link
 * @access Public
 */
router.get('/fanduel/link', asyncHandler(async (req, res) => {
  const { sport, betType, campaignId } = req.query;
  
  const affiliateLink = fanDuelService.generateAffiliateLink({
    sport,
    betType,
    campaignId,
  });
  
  res.json({ url: affiliateLink });
}));

/**
 * @route GET /api/odds/fanduel/deep-link
 * @description Generate a FanDuel deep link
 * @access Public
 */
router.get('/fanduel/deep-link', asyncHandler(async (req, res) => {
  const { sport, eventId, betType, team, campaignId } = req.query;
  
  const deepLink = fanDuelService.generateDeepLink({
    sport,
    eventId,
    betType,
    team,
    campaignId,
  });
  
  res.json({ url: deepLink });
}));

/**
 * @route GET /api/odds/fanduel/universal-link
 * @description Generate a FanDuel universal link
 * @access Public
 */
router.get('/fanduel/universal-link', asyncHandler(async (req, res) => {
  const { sport, eventId, betType, team, campaignId } = req.query;
  
  const universalLink = fanDuelService.generateUniversalLink({
    sport,
    eventId,
    betType,
    team,
    campaignId,
  });
  
  res.json(universalLink);
}));

/**
 * @route POST /api/odds/fanduel/track
 * @description Track a FanDuel conversion
 * @access Public
 */
router.post('/fanduel/track', asyncHandler(async (req, res) => {
  const { userId, eventType, source, value } = req.body;
  
  if (!userId || !eventType) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'userId and eventType are required',
    });
  }
  
  const trackingResult = await fanDuelService.trackConversion({
    userId,
    eventType,
    source,
    value,
  });
  
  res.json(trackingResult);
}));

/**
 * @route POST /api/odds/local
 * @description Get odds for local teams based on geolocation
 * @access Public
 */
router.post('/local', asyncHandler(async (req, res) => {
  const { teams, location } = req.body;
  
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'teams array is required and must not be empty',
    });
  }
  
  if (!location || !location.city) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'location with city is required',
    });
  }
  
  try {
    // Try to get real odds data for the local teams
    const localOdds = [];
    
    // Get upcoming games for each team
    for (const team of teams) {
      try {
        // Try to find odds for this team from our odds service
        const teamOdds = await oddsService.getTeamOdds(team);
        
        if (teamOdds && teamOdds.length > 0) {
          // Add real odds data
          localOdds.push(...teamOdds);
        } else {
          // If no real odds are available, create a simulated entry
          const opponent = generateOpponent(team);
          const baseOdds = 2.0;
          const popularityFactor = team.includes('Yankees') || team.includes('Lakers') ? 0.8 : 1.2;
          const odds = baseOdds * popularityFactor * (0.9 + Math.random() * 0.4);
          const suggestion = odds < 2.0 ? 'bet' : 'avoid';
          
          localOdds.push({
            team,
            game: `${team} vs. ${opponent}`,
            odds: odds,
            suggestion: suggestion,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error getting odds for team ${team}:`, error);
        // Continue with other teams even if one fails
      }
    }
    
    // Return the odds data
    res.json(localOdds);
  } catch (error) {
    console.error('Error getting local odds:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get odds for local teams',
    });
  }
}));

/**
 * Generate a realistic opponent for a team
 * @param {string} team - Team name
 * @returns {string} Opponent name
 */
function generateOpponent(team) {
  // Simple mapping of teams to common opponents
  const rivalries = {
    'New York Yankees': ['Boston Red Sox', 'Tampa Bay Rays'],
    'Boston Red Sox': ['New York Yankees', 'Toronto Blue Jays'],
    'Los Angeles Lakers': ['Los Angeles Clippers', 'Golden State Warriors'],
    'Golden State Warriors': ['Los Angeles Lakers', 'Phoenix Suns'],
    'Dallas Cowboys': ['Philadelphia Eagles', 'New York Giants'],
    'New England Patriots': ['Buffalo Bills', 'Miami Dolphins']
  };
  
  // Check if we have a known rivalry
  for (const [teamName, opponents] of Object.entries(rivalries)) {
    if (team.includes(teamName)) {
      return opponents[Math.floor(Math.random() * opponents.length)];
    }
  }
  
  // Default opponents by sport
  const sportOpponents = {
    'Yankees': 'Red Sox',
    'Mets': 'Phillies',
    'Giants': 'Eagles',
    'Jets': 'Patriots',
    'Knicks': 'Celtics',
    'Nets': 'Raptors',
    'Dodgers': 'Giants',
    'Angels': 'Athletics',
    'Rams': 'Seahawks',
    'Chargers': 'Raiders',
    'Lakers': 'Celtics',
    'Clippers': 'Warriors'
  };
  
  // Try to find a matching opponent
  for (const [teamKey, opponent] of Object.entries(sportOpponents)) {
    if (team.includes(teamKey)) {
      return opponent;
    }
  }
  
  // Generic opponent as fallback
  return 'Rival Team';
}

export default router;