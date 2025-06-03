/**
 * Data Fetcher
 * Collects sports data from external APIs for model training and predictions
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API configuration
const API_CONFIG = {
  ODDS_API: {
    BASE_URL: 'https://api.the-odds-api.com/v4',
    API_KEY: process.env.ODDS_API_KEY || 'your-api-key-here',
    SPORTS: {
      NBA: 'basketball_nba',
      WNBA: 'basketball_wnba',
      MLB: 'baseball_mlb',
      NHL: 'icehockey_nhl',
      NCAA_MENS: 'basketball_ncaa',
      NCAA_WOMENS: 'basketball_ncaaw',
      FORMULA1: 'motorsport_f1',
    },
  },
  ESPN_API: {
    BASE_URL: 'https://site.api.espn.com/apis/site/v2/sports',
    ENDPOINTS: {
      NBA: 'basketball/nba/scoreboard',
      WNBA: 'basketball/wnba/scoreboard',
      MLB: 'baseball/mlb/scoreboard',
      NHL: 'hockey/nhl/scoreboard',
      NCAA_MENS: 'basketball/mens-college-basketball/scoreboard',
      NCAA_WOMENS: 'basketball/womens-college-basketball/scoreboard',
      FORMULA1: 'racing/f1/scoreboard',
    },
  },
  NHL_API: {
    BASE_URL: 'https://api-web.nhl.com',
    LEGACY_URL: 'https://statsapi.web.nhl.com',
    ENDPOINTS: {
      SCHEDULE: '/api/v1/schedule',
      TEAMS: '/api/v1/teams',
      STANDINGS: '/api/v1/standings',
      PLAYER_STATS: '/api/v1/people',
      GAME_STATS: '/api/v1/game',
    },
  },
};

// Data directory
const DATA_DIR = path.join(__dirname, 'raw');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Fetch odds data from the Odds API
 * @param {string} sport - Sport key
 * @returns {Promise<Object>} - Odds data
 */
async function fetchOddsData(sport) {
  try {
    const sportKey = API_CONFIG.ODDS_API.SPORTS[sport];
    if (!sportKey) {
      console.log(`No Odds API mapping for ${sport}`);
      return null;
    }

    const url = `${API_CONFIG.ODDS_API.BASE_URL}/sports/${sportKey}/odds`;
    const params = {
      apiKey: API_CONFIG.ODDS_API.API_KEY,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
    };

    console.log(`Fetching odds data for ${sport}...`);
    const response = await axios.get(url, { params });

    if (response.status !== 200) {
      throw new Error(`Odds API returned ${response.status}: ${response.statusText}`);
    }

    // Save data to file
    const filename = `${sport.toLowerCase()}_odds_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(response.data, null, 2));

    console.log(`Saved odds data for ${sport} to ${filename}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching odds data for ${sport}:`, error.message);
    return null;
  }
}

/**
 * Fetch game data from the ESPN API
 * @param {string} sport - Sport key
 * @returns {Promise<Object>} - Game data
 */
async function fetchESPNData(sport) {
  try {
    const endpoint = API_CONFIG.ESPN_API.ENDPOINTS[sport];
    if (!endpoint) {
      console.log(`No ESPN API endpoint for ${sport}`);
      return null;
    }

    const url = `${API_CONFIG.ESPN_API.BASE_URL}/${endpoint}`;

    console.log(`Fetching ESPN data for ${sport}...`);
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
    }

    // Save data to file
    const filename = `${sport.toLowerCase()}_espn_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(response.data, null, 2));

    console.log(`Saved ESPN data for ${sport} to ${filename}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ESPN data for ${sport}:`, error.message);
    return null;
  }
}

/**
 * Fetch NHL stats data
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - NHL stats data
 */
async function fetchNHLStats(date = new Date().toISOString().split('T')[0]) {
  try {
    const url = `${API_CONFIG.NHL_API.BASE_URL}${API_CONFIG.NHL_API.ENDPOINTS.SCHEDULE}?date=${date}&expand=schedule.linescore`;

    console.log(`Fetching NHL schedule for ${date}...`);
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(`NHL API returned ${response.status}: ${response.statusText}`);
    }

    // Save data to file
    const filename = `nhl_stats_${date}.json`;
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(response.data, null, 2));

    console.log(`Saved NHL stats to ${filename}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching NHL stats:`, error.message);
    return null;
  }
}

/**
 * Fetch historical game results
 * @param {string} sport - Sport key
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Historical game results
 */
async function fetchHistoricalResults(sport, startDate, endDate) {
  // This is a placeholder function
  // In a real implementation, this would fetch historical results
  // from a sports data provider API

  console.log(`Fetching historical results for ${sport} from ${startDate} to ${endDate}...`);

  // Mock data for demonstration
  const mockData = {
    sport,
    startDate,
    endDate,
    games: [
      {
        date: '2025-03-15',
        homeTeam: 'Lakers',
        awayTeam: 'Celtics',
        homeScore: 112,
        awayScore: 105,
        odds: {
          spread: -3.5,
          overUnder: 224.5,
          homeMoneyline: -150,
          awayMoneyline: +130,
        },
      },
      {
        date: '2025-03-16',
        homeTeam: 'Warriors',
        awayTeam: 'Nets',
        homeScore: 120,
        awayScore: 115,
        odds: {
          spread: -2.5,
          overUnder: 235.5,
          homeMoneyline: -130,
          awayMoneyline: +110,
        },
      },
    ],
  };

  // Save mock data to file
  const filename = `${sport.toLowerCase()}_historical_${startDate}_to_${endDate}.json`;
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(mockData, null, 2));

  console.log(`Saved historical results to ${filename}`);
  return mockData;
}

/**
 * Fetch all data for a specific sport
 * @param {string} sport - Sport key
 */
async function fetchAllDataForSport(sport) {
  console.log(`Fetching all data for ${sport}...`);

  // Fetch current odds
  const oddsData = await fetchOddsData(sport);

  // Fetch ESPN data
  const espnData = await fetchESPNData(sport);

  // Fetch NHL-specific data if applicable
  if (sport === 'NHL') {
    const nhlData = await fetchNHLStats();
  }

  // Fetch historical data (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const historicalData = await fetchHistoricalResults(sport, startDate, endDate);

  console.log(`Completed data fetch for ${sport}`);
}

/**
 * Main function to fetch all sports data
 */
async function fetchAllSportsData() {
  console.log('Starting data fetch process...');

  // List of sports to fetch data for
  const sports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1'];

  // Fetch data for each sport
  for (const sport of sports) {
    await fetchAllDataForSport(sport);
  }

  console.log('Data fetch process completed');
}

// Execute if run directly
if (require.main === module) {
  fetchAllSportsData()
    .then(() => {
      console.log('Data fetch script completed successfully');
    })
    .catch(error => {
      console.error('Error in data fetch script:', error);
      process.exit(1);
    });
}

module.exports = {
  fetchOddsData,
  fetchESPNData,
  fetchNHLStats,
  fetchHistoricalResults,
  fetchAllDataForSport,
  fetchAllSportsData,
};
