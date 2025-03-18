/**
 * ML Prediction Service
 * Client-side service for fetching predictions from the ML Sports Edge API
 */

import axios from 'axios';

// API configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_ML_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000, // 10 seconds
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// In-memory cache
const cache = {
  predictions: {},
  timestamp: {}
};

/**
 * Check if cached data is still valid
 * @param {string} key - Cache key
 * @returns {boolean} - True if cache is valid
 */
const isCacheValid = (key) => {
  if (!cache.timestamp[key]) {
    return false;
  }
  
  const now = Date.now();
  const cacheTime = cache.timestamp[key];
  
  return (now - cacheTime) < API_CONFIG.CACHE_DURATION;
};

/**
 * Create API client with authentication
 * @param {string} token - JWT token
 * @returns {Object} - Axios instance
 */
const createApiClient = (token = null) => {
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers
  });
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
export const getGamePredictions = async ({ sport = 'NBA', date = null, limit = null, token = null } = {}) => {
  // Create cache key
  const cacheKey = `game_predictions_${sport.toLowerCase()}_${date || 'today'}`;
  
  // Check cache
  if (isCacheValid(cacheKey)) {
    return cache.predictions[cacheKey];
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Build query parameters
    const params = { sport };
    if (date) params.date = date;
    if (limit) params.limit = limit;
    
    // Make API request
    const response = await apiClient.get('/predictions/games', { params });
    
    // Update cache
    cache.predictions[cacheKey] = response.data.data;
    cache.timestamp[cacheKey] = Date.now();
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching game predictions:', error);
    
    // Return empty array on error
    return [];
  }
};

/**
 * Get detailed prediction for a specific game
 * @param {string} gameId - Game ID
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Object>} - Detailed game prediction
 */
export const getGamePredictionById = async (gameId, token = null) => {
  // Create cache key
  const cacheKey = `game_prediction_${gameId}`;
  
  // Check cache
  if (isCacheValid(cacheKey)) {
    return cache.predictions[cacheKey];
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Make API request
    const response = await apiClient.get(`/predictions/games/${gameId}`);
    
    // Update cache
    cache.predictions[cacheKey] = response.data.data;
    cache.timestamp[cacheKey] = Date.now();
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching prediction for game ${gameId}:`, error);
    
    // Return null on error
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
  // Create cache key
  const cacheKey = `player_prediction_${playerId}`;
  
  // Check cache
  if (isCacheValid(cacheKey)) {
    return cache.predictions[cacheKey];
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Make API request
    const response = await apiClient.get(`/predictions/players/${playerId}`);
    
    // Update cache
    cache.predictions[cacheKey] = response.data.data;
    cache.timestamp[cacheKey] = Date.now();
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching prediction for player ${playerId}:`, error);
    
    // Return null on error
    return null;
  }
};

/**
 * Get predictions for a specific sport
 * @param {string} sportType - Sport type (NBA, MLB, etc.)
 * @param {string} token - JWT token for authenticated requests
 * @returns {Promise<Array>} - Sport predictions
 */
export const getPredictionsBySport = async (sportType, token = null) => {
  // Create cache key
  const cacheKey = `sport_predictions_${sportType.toLowerCase()}`;
  
  // Check cache
  if (isCacheValid(cacheKey)) {
    return cache.predictions[cacheKey];
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Make API request
    const response = await apiClient.get(`/predictions/sports/${sportType}`);
    
    // Update cache
    cache.predictions[cacheKey] = response.data.data;
    cache.timestamp[cacheKey] = Date.now();
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching predictions for sport ${sportType}:`, error);
    
    // Return empty array on error
    return [];
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
    return cache.predictions[cacheKey];
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Make API request
    const response = await apiClient.get('/predictions/trending');
    
    // Update cache
    cache.predictions[cacheKey] = response.data.data;
    cache.timestamp[cacheKey] = Date.now();
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching trending predictions:', error);
    
    // Return empty array on error
    return [];
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
  if (!token) {
    throw new Error('Authentication required to submit feedback');
  }
  
  try {
    // Create API client
    const apiClient = createApiClient(token);
    
    // Make API request
    const response = await apiClient.post('/predictions/feedback', feedback);
    
    return response.data;
  } catch (error) {
    console.error('Error submitting prediction feedback:', error);
    throw error;
  }
};

/**
 * Clear prediction cache
 * @param {string} key - Specific cache key to clear (optional)
 */
export const clearPredictionCache = (key = null) => {
  if (key) {
    delete cache.predictions[key];
    delete cache.timestamp[key];
  } else {
    cache.predictions = {};
    cache.timestamp = {};
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
  clearPredictionCache
};