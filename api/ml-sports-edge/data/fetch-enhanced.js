/**
 * Enhanced Data Fetcher
 * Collects sports data from all available APIs for model training and predictions
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API configuration
const API_CONFIG = {
  ODDS_API: {
    BASE_URL: 'https://api.the-odds-api.com/v4',
    API_KEY: process.env.ODDS_API_KEY || 'fdf4ad2d50a6b6d2ca77e52734851aa4',
    SPORTS: {
      NBA: 'basketball_nba',
      WNBA: 'basketball_wnba',
      MLB: 'baseball_mlb',
      NHL: 'icehockey_nhl',
      NCAA_MENS: 'basketball_ncaa',
      NCAA_WOMENS: 'basketball_ncaaw',
      FORMULA1: 'motorsport_f1',
      UFC: 'mma_mixed_martial_arts'
    }
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
      FORMULA1: 'racing/f1/scoreboard'
    }
  },
  NHL_API: {
    BASE_URL: 'https://api-web.nhl.com',
    LEGACY_URL: 'https://statsapi.web.nhl.com',
    ENDPOINTS: {
      SCHEDULE: '/api/v1/schedule',
      TEAMS: '/api/v1/teams',
      STANDINGS: '/api/v1/standings',
      PLAYER_STATS: '/api/v1/people',
      GAME_STATS: '/api/v1/game'
    }
  },
  SPORTRADAR_API: {
    BASE_URL: 'https://api.sportradar.com',
    API_KEY: process.env.SPORTRADAR_API_KEY || 'YOUR_API_KEY',
    ENDPOINTS: {
      NBA: {
        GAME_SUMMARY: '/nba/trial/v7/en/games/{game_id}/summary.json',
        PLAYER_PROFILE: '/nba/trial/v7/en/players/{player_id}/profile.json',
        LEAGUE_SCHEDULE: '/nba/trial/v7/en/games/{year}/{month}/{day}/schedule.json',
      },
      NFL: {
        GAME_STATISTICS: '/nfl/official/trial/v7/en/games/{game_id}/statistics.json',
        PLAYER_PROFILE: '/nfl/official/trial/v7/en/players/{player_id}/profile.json',
      },
      MLB: {
        GAME_SUMMARY: '/mlb/trial/v7/en/games/{game_id}/summary.json',
        PLAYER_PROFILE: '/mlb/trial/v7/en/players/{player_id}/profile.json',
      },
      NHL: {
        GAME_SUMMARY: '/nhl/trial/v7/en/games/{game_id}/summary.json',
        PLAYER_PROFILE: '/nhl/trial/v7/en/players/{player_id}/profile.json',
      },
      UFC: {
        EVENT_SUMMARY: '/ufc/trial/v7/en/events/{event_id}/summary.json',
        FIGHTER_PROFILE: '/ufc/trial/v7/en/competitors/{fighter_id}/profile.json',
      }
    }
  },
  NCAA_BASKETBALL_API: {
    BASE_URL: 'https://api.sportradar.com',
    API_KEY: process.env.NCAA_BASKETBALL_API_KEY || 'YOUR_NCAA_API_KEY',
    ENDPOINTS: {
      MENS: {
        GAME_SUMMARY: '/ncaamb/trial/v7/en/games/{game_id}/summary.json',
        PLAYER_PROFILE: '/ncaamb/trial/v7/en/players/{player_id}/profile.json',
        LEAGUE_SCHEDULE: '/ncaamb/trial/v7/en/games/{year}/{month}/{day}/schedule.json',
        TOURNAMENT_SUMMARY: '/ncaamb/trial/v7/en/tournaments/{tournament_id}/summary.json',
      },
      WOMENS: {
        GAME_SUMMARY: '/ncaawb/trial/v7/en/games/{game_id}/summary.json',
        PLAYER_PROFILE: '/ncaawb/trial/v7/en/players/{player_id}/profile.json',
        LEAGUE_SCHEDULE: '/ncaawb/trial/v7/en/games/{year}/{month}/{day}/schedule.json',
        TOURNAMENT_SUMMARY: '/ncaawb/trial/v7/en/tournaments/{tournament_id}/summary.json',
      }
    }
  },
  SHERDOG_API: {
    BASE_URL: 'https://sherdog-api.vercel.app/api',
    ENDPOINTS: {
      FIGHTERS: '/fighters',
      EVENTS: '/events',
      SEARCH: '/search'
    }
  }
};

// Data directory
const DATA_DIR = path.join(__dirname, 'raw');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Rate limiter for API requests
 * @param {number} maxRequests - Maximum requests per time window
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Function} - Rate limiter function
 */
function createRateLimiter(maxRequests, timeWindow) {
  const requests = [];
  
  return async function rateLimiter() {
    const now = Date.now();
    
    // Remove requests outside the time window
    while (requests.length > 0 && requests[0] < now - timeWindow) {
      requests.shift();
    }
    
    // Check if we've hit the rate limit
    if (requests.length >= maxRequests) {
      const oldestRequest = requests[0];
      const timeToWait = oldestRequest + timeWindow - now;
      console.log(`Rate limit reached. Waiting ${timeToWait}ms before next request.`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    // Add current request timestamp
    requests.push(now);
  };
}

// Create rate limiters for each API
const rateLimiters = {
  ODDS_API: createRateLimiter(5, 60 * 1000), // 5 requests per minute
  ESPN_API: createRateLimiter(10, 60 * 1000), // 10 requests per minute
  NHL_API: createRateLimiter(10, 60 * 1000), // 10 requests per minute
  SPORTRADAR_API: createRateLimiter(5, 60 * 1000), // 5 requests per minute
  NCAA_BASKETBALL_API: createRateLimiter(5, 60 * 1000), // 5 requests per minute
  SHERDOG_API: createRateLimiter(10, 60 * 1000) // 10 requests per minute
};

/**
 * Fetch data with rate limiting and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Axios options
 * @param {string} apiName - API name for rate limiting
 * @returns {Promise<Object>} - Response data
 */
async function fetchWithRateLimit(url, options = {}, apiName) {
  try {
    // Apply rate limiting
    if (rateLimiters[apiName]) {
      await rateLimiters[apiName]();
    }
    
    // Make request
    const response = await axios(url, {
      ...options,
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        console.error(`API Error (${apiName}): ${error.response.status} - ${error.response.statusText}`);
        console.error(`URL: ${url}`);
        console.error(`Response data:`, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error(`Network Error (${apiName}): No response received`);
        console.error(`URL: ${url}`);
      } else {
        // Error in setting up the request
        console.error(`Request Error (${apiName}): ${error.message}`);
        console.error(`URL: ${url}`);
      }
    } else {
      // Non-Axios error
      console.error(`General Error (${apiName}): ${error.message}`);
      console.error(`URL: ${url}`);
    }
    
    throw error;
  }
}

/**
 * Save data to file
 * @param {string} filename - Filename
 * @param {Object} data - Data to save
 */
function saveToFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved data to ${filePath}`);
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
      oddsFormat: 'american'
    };

    console.log(`Fetching odds data for ${sport}...`);
    const data = await fetchWithRateLimit(
      url, 
      { params }, 
      'ODDS_API'
    );
    
    // Save data to file
    const filename = `${sport.toLowerCase()}_odds_${new Date().toISOString().split('T')[0]}.json`;
    saveToFile(filename, data);
    
    return data;
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
    const data = await fetchWithRateLimit(
      url, 
      {}, 
      'ESPN_API'
    );
    
    // Save data to file
    const filename = `${sport.toLowerCase()}_espn_${new Date().toISOString().split('T')[0]}.json`;
    saveToFile(filename, data);
    
    return data;
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
    const data = await fetchWithRateLimit(
      url, 
      {}, 
      'NHL_API'
    );
    
    // Save data to file
    const filename = `nhl_stats_${date}.json`;
    saveToFile(filename, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching NHL stats:`, error.message);
    return null;
  }
}

/**
 * Fetch data from SportRadar API
 * @param {string} sport - Sport key
 * @param {string} endpoint - Endpoint key
 * @param {Object} params - Parameters to replace in the endpoint
 * @returns {Promise<Object>} - SportRadar data
 */
async function fetchSportRadarData(sport, endpoint, params = {}) {
  try {
    if (!API_CONFIG.SPORTRADAR_API.ENDPOINTS[sport]) {
      console.log(`No SportRadar API endpoints for ${sport}`);
      return null;
    }
    
    if (!API_CONFIG.SPORTRADAR_API.ENDPOINTS[sport][endpoint]) {
      console.log(`No SportRadar API endpoint ${endpoint} for ${sport}`);
      return null;
    }
    
    let endpointUrl = API_CONFIG.SPORTRADAR_API.ENDPOINTS[sport][endpoint];
    
    // Replace parameters in the URL
    Object.entries(params).forEach(([key, value]) => {
      endpointUrl = endpointUrl.replace(`{${key}}`, value);
    });
    
    const url = `${API_CONFIG.SPORTRADAR_API.BASE_URL}${endpointUrl}?api_key=${API_CONFIG.SPORTRADAR_API.API_KEY}`;
    
    console.log(`Fetching SportRadar data for ${sport} (${endpoint})...`);
    const data = await fetchWithRateLimit(
      url, 
      {}, 
      'SPORTRADAR_API'
    );
    
    // Save data to file
    const filename = `${sport.toLowerCase()}_sportradar_${endpoint.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    saveToFile(filename, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching SportRadar data for ${sport} (${endpoint}):`, error.message);
    return null;
  }
}

/**
 * Fetch NCAA basketball data
 * @param {string} gender - 'MENS' or 'WOMENS'
 * @param {string} endpoint - Endpoint key
 * @param {Object} params - Parameters to replace in the endpoint
 * @returns {Promise<Object>} - NCAA data
 */
async function fetchNCAAData(gender, endpoint, params = {}) {
  try {
    if (!API_CONFIG.NCAA_BASKETBALL_API.ENDPOINTS[gender]) {
      console.log(`No NCAA API endpoints for ${gender}`);
      return null;
    }
    
    if (!API_CONFIG.NCAA_BASKETBALL_API.ENDPOINTS[gender][endpoint]) {
      console.log(`No NCAA API endpoint ${endpoint} for ${gender}`);
      return null;
    }
    
    let endpointUrl = API_CONFIG.NCAA_BASKETBALL_API.ENDPOINTS[gender][endpoint];
    
    // Replace parameters in the URL
    Object.entries(params).forEach(([key, value]) => {
      endpointUrl = endpointUrl.replace(`{${key}}`, value);
    });
    
    const url = `${API_CONFIG.NCAA_BASKETBALL_API.BASE_URL}${endpointUrl}?api_key=${API_CONFIG.NCAA_BASKETBALL_API.API_KEY}`;
    
    console.log(`Fetching NCAA ${gender} data (${endpoint})...`);
    const data = await fetchWithRateLimit(
      url, 
      {}, 
      'NCAA_BASKETBALL_API'
    );
    
    // Save data to file
    const filename = `ncaa_${gender.toLowerCase()}_${endpoint.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    saveToFile(filename, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} data (${endpoint}):`, error.message);
    return null;
  }
}

/**
 * Fetch UFC/MMA data from Sherdog API
 * @param {string} endpoint - Endpoint key
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - UFC/MMA data
 */
async function fetchSherdogData(endpoint, params = {}) {
  try {
    if (!API_CONFIG.SHERDOG_API.ENDPOINTS[endpoint]) {
      console.log(`No Sherdog API endpoint ${endpoint}`);
      return null;
    }
    
    const url = `${API_CONFIG.SHERDOG_API.BASE_URL}${API_CONFIG.SHERDOG_API.ENDPOINTS[endpoint]}`;
    
    console.log(`Fetching Sherdog data (${endpoint})...`);
    const data = await fetchWithRateLimit(
      url, 
      { params }, 
      'SHERDOG_API'
    );
    
    // Save data to file
    const filename = `sherdog_${endpoint.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    saveToFile(filename, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching Sherdog data (${endpoint}):`, error.message);
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
          awayMoneyline: +130
        }
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
          awayMoneyline: +110
        }
      }
    ]
  };
  
  // Save mock data to file
  const filename = `${sport.toLowerCase()}_historical_${startDate}_to_${endDate}.json`;
  saveToFile(filename, mockData);
  
  return mockData;
}

/**
 * Fetch all data for a specific sport
 * @param {string} sport - Sport key
 */
async function fetchAllDataForSport(sport) {
  console.log(`Fetching all data for ${sport}...`);
  
  // Create a data object to store all fetched data
  const sportData = {
    sport,
    timestamp: new Date().toISOString(),
    sources: {}
  };
  
  // Fetch odds data
  const oddsData = await fetchOddsData(sport);
  if (oddsData) {
    sportData.sources.odds = oddsData;
  }
  
  // Fetch ESPN data
  const espnData = await fetchESPNData(sport);
  if (espnData) {
    sportData.sources.espn = espnData;
  }
  
  // Fetch sport-specific data
  if (sport === 'NHL') {
    const nhlData = await fetchNHLStats();
    if (nhlData) {
      sportData.sources.nhlStats = nhlData;
    }
  }
  
  // Fetch SportRadar data
  if (['NBA', 'NFL', 'MLB', 'NHL', 'UFC'].includes(sport)) {
    // For demonstration, we'll just fetch game summaries
    // In a real implementation, you would fetch more data types
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    if (sport !== 'UFC') {
      const scheduleData = await fetchSportRadarData(sport, 'LEAGUE_SCHEDULE', {
        year,
        month,
        day
      });
      
      if (scheduleData) {
        sportData.sources.sportRadarSchedule = scheduleData;
      }
    } else {
      // For UFC, we would fetch upcoming events
      // This is a placeholder
      console.log('UFC SportRadar data would be fetched here');
    }
  }
  
  // Fetch NCAA data
  if (sport === 'NCAA_MENS' || sport === 'NCAA_WOMENS') {
    const gender = sport.replace('NCAA_', '');
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const scheduleData = await fetchNCAAData(gender, 'LEAGUE_SCHEDULE', {
      year,
      month,
      day
    });
    
    if (scheduleData) {
      sportData.sources.ncaaSchedule = scheduleData;
    }
  }
  
  // Fetch UFC/MMA data
  if (sport === 'UFC') {
    const eventsData = await fetchSherdogData('EVENTS');
    if (eventsData) {
      sportData.sources.sherdogEvents = eventsData;
    }
  }
  
  // Fetch historical data (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  const historicalData = await fetchHistoricalResults(
    sport,
    startDate,
    endDate
  );
  
  if (historicalData) {
    sportData.sources.historical = historicalData;
  }
  
  // Save combined data
  const filename = `${sport.toLowerCase()}_combined_${new Date().toISOString().split('T')[0]}.json`;
  saveToFile(filename, sportData);
  
  console.log(`Completed data fetch for ${sport}`);
  return sportData;
}

/**
 * Main function to fetch all sports data
 */
async function fetchAllSportsData() {
  console.log('Starting enhanced data fetch process...');
  
  // List of sports to fetch data for
  const sports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'];
  
  // Fetch data for each sport
  for (const sport of sports) {
    try {
      await fetchAllDataForSport(sport);
    } catch (error) {
      console.error(`Error fetching data for ${sport}:`, error);
      // Continue with next sport
    }
  }
  
  console.log('Enhanced data fetch process completed');
}

// Execute if run directly
if (require.main === module) {
  fetchAllSportsData()
    .then(() => {
      console.log('Enhanced data fetch script completed successfully');
    })
    .catch(error => {
      console.error('Error in enhanced data fetch script:', error);
      process.exit(1);
    });
}

module.exports = {
  fetchOddsData,
  fetchESPNData,
  fetchNHLStats,
  fetchSportRadarData,
  fetchNCAAData,
  fetchSherdogData,
  fetchHistoricalResults,
  fetchAllDataForSport,
  fetchAllSportsData
};