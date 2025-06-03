/**
 * ML Prediction Service
 * Client-side service for fetching predictions from the ML Sports Edge API
 * Enhanced with security improvements
 */

import axios from 'axios';

// API configuration
const API_CONFIG = {
  // Ensure HTTPS is used in production
  BASE_URL:
    process.env.REACT_APP_ML_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.ai-sports-edge.com/api/ml-sports-edge'
      : 'http://localhost:3000/api/ml-sports-edge'),
  TIMEOUT: 10000, // 10 seconds
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_ITEMS: 100, // Maximum number of items to store in cache
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Fallback data for when API calls fail
const FALLBACK_DATA = {
  trending: [
    {
      id: 'trending1',
      sport: 'NFL',
      date: new Date(Date.now() + 86400000).toISOString(),
      homeTeam: { name: 'Kansas City Chiefs', abbreviation: 'KC' },
      awayTeam: { name: 'San Francisco 49ers', abbreviation: 'SF' },
      predictions: {
        spread: { pick: 'home', line: -3.5, confidence: 0.75 },
        moneyline: { pick: 'home', odds: { home: -180, away: 160 }, confidence: 0.72 },
        total: { pick: 'over', line: 49.5, confidence: 0.68 },
      },
    },
    {
      id: 'trending2',
      sport: 'NBA',
      date: new Date(Date.now() + 172800000).toISOString(),
      homeTeam: { name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      awayTeam: { name: 'Boston Celtics', abbreviation: 'BOS' },
      predictions: {
        spread: { pick: 'away', line: 2.5, confidence: 0.65 },
        moneyline: { pick: 'away', odds: { home: 120, away: -140 }, confidence: 0.68 },
        total: { pick: 'under', line: 220.5, confidence: 0.62 },
      },
    },
  ],
  nba: [
    {
      id: 'nba1',
      sport: 'NBA',
      date: new Date(Date.now() + 172800000).toISOString(),
      homeTeam: { name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      awayTeam: { name: 'Boston Celtics', abbreviation: 'BOS' },
      predictions: {
        spread: { pick: 'away', line: 2.5, confidence: 0.65 },
        moneyline: { pick: 'away', odds: { home: 120, away: -140 }, confidence: 0.68 },
        total: { pick: 'under', line: 220.5, confidence: 0.62 },
      },
    },
    {
      id: 'nba2',
      sport: 'NBA',
      date: new Date(Date.now() + 259200000).toISOString(),
      homeTeam: { name: 'Golden State Warriors', abbreviation: 'GSW' },
      awayTeam: { name: 'Brooklyn Nets', abbreviation: 'BKN' },
      predictions: {
        spread: { pick: 'home', line: -5.5, confidence: 0.72 },
        moneyline: { pick: 'home', odds: { home: -220, away: 190 }, confidence: 0.75 },
        total: { pick: 'over', line: 235.5, confidence: 0.68 },
      },
    },
  ],
  mlb: [
    {
      id: 'mlb1',
      sport: 'MLB',
      date: new Date(Date.now() + 259200000).toISOString(),
      homeTeam: { name: 'New York Yankees', abbreviation: 'NYY' },
      awayTeam: { name: 'Boston Red Sox', abbreviation: 'BOS' },
      predictions: {
        spread: { pick: 'home', line: -1.5, confidence: 0.62 },
        moneyline: { pick: 'home', odds: { home: -150, away: 130 }, confidence: 0.65 },
        total: { pick: 'under', line: 8.5, confidence: 0.58 },
      },
    },
  ],
  nhl: [
    {
      id: 'nhl1',
      sport: 'NHL',
      date: new Date(Date.now() + 345600000).toISOString(),
      homeTeam: { name: 'Toronto Maple Leafs', abbreviation: 'TOR' },
      awayTeam: { name: 'Montreal Canadiens', abbreviation: 'MTL' },
      predictions: {
        spread: { pick: 'home', line: -1.5, confidence: 0.64 },
        moneyline: { pick: 'home', odds: { home: -160, away: 140 }, confidence: 0.67 },
        total: { pick: 'over', line: 5.5, confidence: 0.61 },
      },
    },
  ],
  ncaa: [
    {
      id: 'ncaa1',
      sport: 'NCAA Basketball',
      date: new Date(Date.now() + 432000000).toISOString(),
      homeTeam: { name: 'Duke Blue Devils', abbreviation: 'DUKE' },
      awayTeam: { name: 'North Carolina Tar Heels', abbreviation: 'UNC' },
      predictions: {
        spread: { pick: 'away', line: 3.5, confidence: 0.63 },
        moneyline: { pick: 'away', odds: { home: -180, away: 160 }, confidence: 0.66 },
        total: { pick: 'over', line: 155.5, confidence: 0.59 },
      },
    },
  ],
  formula1: [
    {
      id: 'f1_1',
      sport: 'Formula 1',
      date: new Date(Date.now() + 518400000).toISOString(),
      raceName: 'Monaco Grand Prix',
      trackName: 'Circuit de Monaco',
      location: 'Monte Carlo, Monaco',
      predictions: {
        winner: {
          drivers: [
            {
              name: 'Max Verstappen',
              odds: -120,
              confidence: 0.78,
              analysis: 'Strong performance in practice sessions',
            },
            {
              name: 'Lewis Hamilton',
              odds: 250,
              confidence: 0.65,
              analysis: 'Previous success at this track',
            },
            {
              name: 'Charles Leclerc',
              odds: 350,
              confidence: 0.58,
              analysis: 'Home advantage and improving car',
            },
          ],
        },
        podium: {
          confidence: 0.72,
          drivers: ['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc'],
        },
      },
    },
  ],
  ufc: [
    {
      id: 'ufc1',
      sport: 'UFC',
      date: new Date(Date.now() + 604800000).toISOString(),
      eventName: 'UFC 300',
      weightClass: 'Heavyweight',
      isMainEvent: true,
      fighter1: { name: 'Jon Jones', record: '26-1-0' },
      fighter2: { name: 'Francis Ngannou', record: '17-3-0' },
      predictions: {
        winner: {
          pick: 'Jon Jones',
          odds: -130,
          confidence: 0.68,
          analysis: 'Superior technical skills',
        },
        method: {
          pick: 'Decision',
          confidence: 0.62,
          analysis: 'Jones likely to use distance management',
        },
        round: {
          pick: 'Goes to decision',
          confidence: 0.65,
          analysis: 'Both fighters have strong chins',
        },
      },
    },
  ],
};

// In-memory cache with size limit
const cache = {
  predictions: {},
  timestamp: {},
  keys: [], // To track order for cache eviction
};

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = input => {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  return input.replace(/[<>'"&]/g, '');
};

/**
 * Validate JWT token format (basic client-side validation)
 * @param {string} token - JWT token to validate
 * @returns {boolean} - Whether token is valid format
 */
const isValidTokenFormat = token => {
  if (!token) return false;

  // Basic JWT format validation (header.payload.signature)
  const tokenRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return tokenRegex.test(token);
};

/**
 * Add item to cache with size management
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
const addToCache = (key, data) => {
  // If key already exists, remove it from the keys array
  const existingIndex = cache.keys.indexOf(key);
  if (existingIndex !== -1) {
    cache.keys.splice(existingIndex, 1);
  }

  // Add key to the end of the keys array (most recently used)
  cache.keys.push(key);

  // Add data to cache
  cache.predictions[key] = data;
  cache.timestamp[key] = Date.now();

  // If cache exceeds size limit, remove oldest items
  if (cache.keys.length > API_CONFIG.MAX_CACHE_ITEMS) {
    const oldestKey = cache.keys.shift(); // Remove oldest key
    delete cache.predictions[oldestKey];
    delete cache.timestamp[oldestKey];
  }
};

/**
 * Check if cached data is still valid
 * @param {string} key - Cache key
 * @returns {boolean} - True if cache is valid
 */
const isCacheValid = key => {
  if (!cache.timestamp[key]) {
    return false;
  }

  const now = Date.now();
  const cacheTime = cache.timestamp[key];

  return now - cacheTime < API_CONFIG.CACHE_DURATION;
};

/**
 * Create API client with authentication
 * @param {string} token - JWT token
 * @returns {Object} - Axios instance
 */
const createApiClient = (token = null) => {
  const headers = {};

  if (token && isValidTokenFormat(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers,
  });
};

/**
 * Safe logging function that redacts sensitive information in production
 * @param {string} level - Log level (log, error, warn)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
const safeLog = (level, message, data = null) => {
  // In production, don't log detailed errors or sensitive information
  if (API_CONFIG.IS_PRODUCTION) {
    if (level === 'error') {
      console.error(`[MLPredictionService] ${message}`);
    } else if (level === 'warn') {
      console.warn(`[MLPredictionService] ${message}`);
    } else {
      console.log(`[MLPredictionService] ${message}`);
    }
    return;
  }

  // In development, log more details
  if (level === 'error') {
    console.error(`[MLPredictionService] ${message}`, data || '');
  } else if (level === 'warn') {
    console.warn(`[MLPredictionService] ${message}`, data || '');
  } else {
    console.log(`[MLPredictionService] ${message}`, data || '');
  }
};

/**
 * Get game predictions
 * @param {Object} options - Request options
 * @param {string} options.sport - Sport key (NBA, MLB, etc.)
 * @param {string} options.date - Date string (YYYY-MM-DD)
 * @param {number} options.limit - Maximum number of predictions to return
 * @param {string} options.token - JWT token for authenticated requests
 * @returns {Promise<Array>} - Game predictions
 */
export const getGamePredictions = async ({
  sport = 'NBA',
  date = null,
  limit = null,
  token = null,
} = {}) => {
  // Sanitize inputs
  const sanitizedSport = sanitizeInput(sport);
  const sanitizedDate = date ? sanitizeInput(date) : null;

  // Create cache key
  const cacheKey = `game_predictions_${sanitizedSport.toLowerCase()}_${sanitizedDate || 'today'}`;

  // Check cache
  if (isCacheValid(cacheKey)) {
    safeLog('log', `Using cached data for ${cacheKey}`);
    return cache.predictions[cacheKey];
  }

  try {
    // Validate token format
    if (token && !isValidTokenFormat(token)) {
      safeLog('warn', 'Invalid token format provided');
      token = null;
    }

    // Create API client
    const apiClient = createApiClient(token);

    // Build query parameters
    const params = { sport: sanitizedSport };
    if (sanitizedDate) params.date = sanitizedDate;
    if (limit && Number.isInteger(limit) && limit > 0) params.limit = limit;

    // Log API request (only in development)
    safeLog('log', `Fetching predictions for ${sanitizedSport}`);

    // Make API request
    const response = await apiClient.get('/predictions/games', { params });

    // Log success (only in development)
    safeLog('log', `Successfully fetched ${response.data.data?.length || 0} predictions`);

    // Update cache
    addToCache(cacheKey, response.data.data);

    return response.data.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      `Error fetching game predictions for ${sanitizedSport}`,
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // Use fallback data
    safeLog('log', `Using fallback data for ${sanitizedSport.toLowerCase()}`);
    const fallbackKey = sanitizedSport.toLowerCase();

    // Update cache with fallback data
    addToCache(cacheKey, FALLBACK_DATA[fallbackKey] || []);

    return FALLBACK_DATA[fallbackKey] || [];
  }
};

/**
 * Get detailed prediction for a specific game
 * @param {string} gameId - Game ID
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Object>} - Detailed game prediction
 */
export const getGamePredictionById = async (gameId, token = null) => {
  // Sanitize input
  const sanitizedGameId = sanitizeInput(gameId);

  // Create cache key
  const cacheKey = `game_prediction_${sanitizedGameId}`;

  // Check cache
  if (isCacheValid(cacheKey)) {
    safeLog('log', `Using cached data for ${cacheKey}`);
    return cache.predictions[cacheKey];
  }

  try {
    // Validate token format
    if (token && !isValidTokenFormat(token)) {
      safeLog('warn', 'Invalid token format provided');
      token = null;
    }

    // Create API client
    const apiClient = createApiClient(token);

    // Log API request (only in development)
    safeLog('log', `Fetching prediction for game ${sanitizedGameId}`);

    // Make API request
    const response = await apiClient.get(`/predictions/games/${sanitizedGameId}`);

    // Log success (only in development)
    safeLog('log', `Successfully fetched prediction for game ${sanitizedGameId}`);

    // Update cache
    addToCache(cacheKey, response.data.data);

    return response.data.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      `Error fetching prediction for game ${sanitizedGameId}`,
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // Find fallback data for this game ID
    safeLog('log', `Using fallback data for game ${sanitizedGameId}`);

    // Search through all fallback data for this game ID
    for (const sportKey in FALLBACK_DATA) {
      const game = FALLBACK_DATA[sportKey].find(g => g.id === sanitizedGameId);
      if (game) {
        // Update cache with fallback data
        addToCache(cacheKey, game);
        return game;
      }
    }

    // Return null if no fallback data found
    return null;
  }
};

/**
 * Get player performance predictions
 * @param {string} playerId - Player ID
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Object>} - Player prediction
 */
export const getPlayerPrediction = async (playerId, token = null) => {
  // Sanitize input
  const sanitizedPlayerId = sanitizeInput(playerId);

  // Create cache key
  const cacheKey = `player_prediction_${sanitizedPlayerId}`;

  // Check cache
  if (isCacheValid(cacheKey)) {
    safeLog('log', `Using cached data for ${cacheKey}`);
    return cache.predictions[cacheKey];
  }

  try {
    // Validate token format
    if (token && !isValidTokenFormat(token)) {
      safeLog('warn', 'Invalid token format provided');
      token = null;
    }

    // Create API client
    const apiClient = createApiClient(token);

    // Log API request (only in development)
    safeLog('log', `Fetching prediction for player ${sanitizedPlayerId}`);

    // Make API request
    const response = await apiClient.get(`/predictions/players/${sanitizedPlayerId}`);

    // Log success (only in development)
    safeLog('log', `Successfully fetched prediction for player ${sanitizedPlayerId}`);

    // Update cache
    addToCache(cacheKey, response.data.data);

    return response.data.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      `Error fetching prediction for player ${sanitizedPlayerId}`,
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // Return fallback player data
    const fallbackPlayer = {
      id: sanitizedPlayerId,
      name: 'Player Name',
      team: 'Team Name',
      game: {
        date: new Date(Date.now() + 86400000).toISOString(),
        opponent: 'Opponent Team',
      },
      predictions: {
        points: { prediction: 22.5, range: [18, 27], confidence: 0.72 },
        rebounds: { prediction: 8.5, range: [6, 11], confidence: 0.68 },
        assists: { prediction: 5.5, range: [3, 8], confidence: 0.65 },
      },
    };

    // Update cache with fallback data
    addToCache(cacheKey, fallbackPlayer);

    return fallbackPlayer;
  }
};

/**
 * Get predictions for a specific sport
 * @param {string} sportType - Sport type (NBA, MLB, etc.)
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Array>} - Sport predictions
 */
export const getPredictionsBySport = async (sportType, token = null) => {
  // Sanitize input
  const sanitizedSportType = sanitizeInput(sportType);

  // Create cache key
  const cacheKey = `sport_predictions_${sanitizedSportType.toLowerCase()}`;

  // Check cache
  if (isCacheValid(cacheKey)) {
    safeLog('log', `Using cached data for ${cacheKey}`);
    return cache.predictions[cacheKey];
  }

  try {
    // Validate token format
    if (token && !isValidTokenFormat(token)) {
      safeLog('warn', 'Invalid token format provided');
      token = null;
    }

    // Create API client
    const apiClient = createApiClient(token);

    // Log API request (only in development)
    safeLog('log', `Fetching predictions for sport ${sanitizedSportType}`);

    // Make API request
    const response = await apiClient.get(`/predictions/sports/${sanitizedSportType}`);

    // Log success (only in development)
    safeLog('log', `Successfully fetched predictions for sport ${sanitizedSportType}`);

    // Update cache
    addToCache(cacheKey, response.data.data);

    return response.data.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      `Error fetching predictions for sport ${sanitizedSportType}`,
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // Map sportType to fallback data key
    let fallbackKey = sanitizedSportType.toLowerCase();
    if (sanitizedSportType === 'NCAA_MENS') fallbackKey = 'ncaa';
    if (sanitizedSportType === 'FORMULA1') fallbackKey = 'formula1';

    // Use fallback data
    safeLog('log', `Using fallback data for ${fallbackKey}`);

    // Update cache with fallback data
    addToCache(cacheKey, FALLBACK_DATA[fallbackKey] || []);

    return FALLBACK_DATA[fallbackKey] || [];
  }
};

/**
 * Get trending predictions
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Array>} - Trending predictions
 */
export const getTrendingPredictions = async (token = null) => {
  // Create cache key
  const cacheKey = 'trending_predictions';

  // Check cache
  if (isCacheValid(cacheKey)) {
    safeLog('log', `Using cached data for ${cacheKey}`);
    return cache.predictions[cacheKey];
  }

  try {
    // Validate token format
    if (token && !isValidTokenFormat(token)) {
      safeLog('warn', 'Invalid token format provided');
      token = null;
    }

    // Create API client
    const apiClient = createApiClient(token);

    // Log API request (only in development)
    safeLog('log', 'Fetching trending predictions');

    // Make API request
    const response = await apiClient.get('/predictions/trending');

    // Log success (only in development)
    safeLog('log', `Successfully fetched trending predictions`);

    // Update cache
    addToCache(cacheKey, response.data.data);

    return response.data.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      'Error fetching trending predictions',
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // Use fallback data
    safeLog('log', 'Using fallback trending data');

    // Update cache with fallback data
    addToCache(cacheKey, FALLBACK_DATA.trending || []);

    return FALLBACK_DATA.trending || [];
  }
};

/**
 * Submit feedback on a prediction
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.predictionId - Prediction ID
 * @param {string} feedback.predictionType - Prediction type
 * @param {number} feedback.rating - Rating (1-5)
 * @param {string} feedback.comments - Comments
 * @param {string} token - JWT token (required)
 * @returns {Promise<Object>} - Submission result
 */
export const submitPredictionFeedback = async (feedback, token) => {
  // Validate token
  if (!token || !isValidTokenFormat(token)) {
    safeLog('error', 'Authentication required to submit feedback');
    throw new Error('Authentication required to submit feedback');
  }

  // Sanitize feedback data
  const sanitizedFeedback = {
    predictionId: sanitizeInput(feedback.predictionId),
    predictionType: sanitizeInput(feedback.predictionType),
    rating:
      typeof feedback.rating === 'number'
        ? Math.min(Math.max(Math.round(feedback.rating), 1), 5)
        : 3,
    comments: feedback.comments ? sanitizeInput(feedback.comments) : '',
  };

  try {
    // Create API client
    const apiClient = createApiClient(token);

    // Log API request (only in development)
    safeLog('log', `Submitting feedback for prediction ${sanitizedFeedback.predictionId}`);

    // Make API request
    const response = await apiClient.post('/predictions/feedback', sanitizedFeedback);

    // Log success (only in development)
    safeLog('log', 'Successfully submitted feedback');

    return response.data;
  } catch (error) {
    // Log error (redacted in production)
    safeLog(
      'error',
      'Error submitting prediction feedback',
      API_CONFIG.IS_PRODUCTION ? null : error
    );

    // For feedback, we'll still throw an error since it's not critical
    throw new Error('Failed to submit feedback. Please try again later.');
  }
};

/**
 * Clear prediction cache
 * @param {string} key - Specific cache key to clear (optional)
 */
export const clearPredictionCache = (key = null) => {
  if (key) {
    const sanitizedKey = sanitizeInput(key);
    delete cache.predictions[sanitizedKey];
    delete cache.timestamp[sanitizedKey];

    // Remove from keys array
    const keyIndex = cache.keys.indexOf(sanitizedKey);
    if (keyIndex !== -1) {
      cache.keys.splice(keyIndex, 1);
    }

    safeLog('log', `Cleared cache for ${sanitizedKey}`);
  } else {
    cache.predictions = {};
    cache.timestamp = {};
    cache.keys = [];
    safeLog('log', 'Cleared all prediction cache');
  }
};

// Export all functions
export default {
  getGamePredictions,
  getGamePredictionById,
  getPlayerPrediction,
  getPredictionsBySport,
  getTrendingPredictions,
  submitPredictionFeedback,
  clearPredictionCache,
};
