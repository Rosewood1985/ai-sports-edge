/**
 * API Key Management
 *
 * This module provides a centralized way to manage API keys and other sensitive credentials.
 * It loads keys from environment variables or secure storage and provides them to services.
 *
 * IMPORTANT: This file should NEVER contain hardcoded API keys or secrets.
 * All sensitive values should be loaded from environment variables or secure storage.
 */

const { Platform } = require('react-native');
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Storage keys for API keys
const API_KEY_STORAGE_KEYS = {
  WEATHER: 'api_key_weather',
  ODDS: 'api_key_odds',
  FIREBASE: 'api_key_firebase',
  STRIPE: 'api_key_stripe',
  STRIPE_PUBLISHABLE: 'api_key_stripe_publishable',
  GOOGLE_MAPS: 'api_key_google_maps',
};

// Cache for API keys to avoid repeated storage lookups
const apiKeyCache = {};

/**
 * Get an API key from environment variables, secure storage, or cache
 * @param {string} keyName - Name of the API key
 * @param {string} storageKey - Storage key for the API key
 * @param {string} envVarName - Environment variable name for the API key
 * @returns {Promise<string>} API key
 */
const getApiKey = async (keyName, storageKey, envVarName) => {
  try {
    // Check cache first
    if (apiKeyCache[keyName]) {
      return apiKeyCache[keyName];
    }

    // Try to get from environment variables first (for development)
    let apiKey = null;

    // For Expo, use Constants.manifest.extra
    if (Constants.manifest && Constants.manifest.extra) {
      apiKey = Constants.manifest.extra[envVarName];
    }

    // For React Native, use process.env
    if (!apiKey && process.env) {
      apiKey = process.env[envVarName];
    }

    // If not found in environment variables, try to get from secure storage
    if (!apiKey) {
      const storedKey = await AsyncStorage.getItem(storageKey);
      if (storedKey) {
        apiKey = storedKey;
      }
    }

    // If still not found, log an error
    if (!apiKey) {
      console.error(`API key not found: ${keyName}`);
      return null;
    }

    // Cache the API key
    apiKeyCache[keyName] = apiKey;

    return apiKey;
  } catch (error) {
    console.error(`Error getting API key ${keyName}:`, error);
    return null;
  }
};

/**
 * Set an API key in secure storage
 * @param {string} keyName - Name of the API key
 * @param {string} storageKey - Storage key for the API key
 * @param {string} apiKey - API key to store
 * @returns {Promise<boolean>} Whether the API key was stored successfully
 */
const setApiKey = async (keyName, storageKey, apiKey) => {
  try {
    // Store the API key
    await AsyncStorage.setItem(storageKey, apiKey);

    // Update the cache
    apiKeyCache[keyName] = apiKey;

    return true;
  } catch (error) {
    console.error(`Error setting API key ${keyName}:`, error);
    return false;
  }
};

/**
 * Clear an API key from secure storage and cache
 * @param {string} keyName - Name of the API key
 * @param {string} storageKey - Storage key for the API key
 * @returns {Promise<boolean>} Whether the API key was cleared successfully
 */
const clearApiKey = async (keyName, storageKey) => {
  try {
    // Clear from storage
    await AsyncStorage.removeItem(storageKey);

    // Clear from cache
    delete apiKeyCache[keyName];

    return true;
  } catch (error) {
    console.error(`Error clearing API key ${keyName}:`, error);
    return false;
  }
};

/**
 * Verify that an API key is valid
 * @param {string} apiKey - API key to verify
 * @param {RegExp} pattern - Pattern to match against
 * @returns {boolean} Whether the API key is valid
 */
const verifyApiKey = (apiKey, pattern) => {
  if (!apiKey) {
    return false;
  }

  if (pattern) {
    return pattern.test(apiKey);
  }

  // Default validation: at least 16 characters, alphanumeric plus some special chars
  return /^[a-zA-Z0-9_\-\.]{16,}$/.test(apiKey);
};

/**
 * Get the Weather API key
 * @returns {string} Weather API key
 */
const getWeatherApiKey = () => {
  return getApiKey('WEATHER', API_KEY_STORAGE_KEYS.WEATHER, 'WEATHER_API_KEY');
};

/**
 * Get the Odds API key
 * @returns {string} Odds API key
 */
const getOddsApiKey = () => {
  return getApiKey('ODDS', API_KEY_STORAGE_KEYS.ODDS, 'ODDS_API_KEY');
};

/**
 * Get the Firebase API key
 * @returns {string} Firebase API key
 */
const getFirebaseApiKey = () => {
  return getApiKey('FIREBASE', API_KEY_STORAGE_KEYS.FIREBASE, 'FIREBASE_API_KEY');
};

/**
 * Get the Stripe API key
 * @returns {string} Stripe API key
 */
const getStripeApiKey = () => {
  return getApiKey('STRIPE', API_KEY_STORAGE_KEYS.STRIPE, 'STRIPE_API_KEY');
};

/**
 * Get the Stripe Publishable key
 * @returns {string} Stripe Publishable key
 */
const getStripePublishableKey = () => {
  return getApiKey(
    'STRIPE_PUBLISHABLE',
    API_KEY_STORAGE_KEYS.STRIPE_PUBLISHABLE,
    'STRIPE_PUBLISHABLE_KEY'
  );
};

/**
 * Get the Google Maps API key
 * @returns {string} Google Maps API key
 */
const getGoogleMapsApiKey = () => {
  return getApiKey('GOOGLE_MAPS', API_KEY_STORAGE_KEYS.GOOGLE_MAPS, 'GOOGLE_MAPS_API_KEY');
};

/**
 * Verify API connection by making a test request
 * @param {string} apiName - Name of the API
 * @param {string} apiKey - API key to verify
 * @param {string} testUrl - URL to test the API connection
 * @returns {Promise<boolean>} Whether the API connection is valid
 */
const verifyApiConnection = async (apiName, apiKey, testUrl) => {
  try {
    // Make a test request to the API
    const response = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Check if the response is successful
    if (response.ok) {
      console.log(`API connection verified: ${apiName}`);
      return true;
    } else {
      console.error(`API connection failed: ${apiName} (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`Error verifying API connection ${apiName}:`, error);
    return false;
  }
};

/**
 * Verify all API connections
 * @returns {Promise<object>} Results of API connection verification
 */
const verifyAllApiConnections = async () => {
  const results = {};

  // Verify Weather API
  const weatherApiKey = await getWeatherApiKey();
  if (weatherApiKey) {
    results.weather = await verifyApiConnection(
      'Weather',
      weatherApiKey,
      `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${weatherApiKey}`
    );
  } else {
    results.weather = false;
  }

  // Verify Odds API
  const oddsApiKey = await getOddsApiKey();
  if (oddsApiKey) {
    results.odds = await verifyApiConnection(
      'Odds',
      oddsApiKey,
      `https://api.the-odds-api.com/v4/sports?apiKey=${oddsApiKey}`
    );
  } else {
    results.odds = false;
  }

  // Verify Stripe API
  const stripeApiKey = await getStripeApiKey();
  if (stripeApiKey) {
    results.stripe = await verifyApiConnection(
      'Stripe',
      stripeApiKey,
      'https://api.stripe.com/v1/balance'
    );
  } else {
    results.stripe = false;
  }

  return results;
};

module.exports = {
  getWeatherApiKey,
  getOddsApiKey,
  getFirebaseApiKey,
  getStripeApiKey,
  getStripePublishableKey,
  getGoogleMapsApiKey,
  setApiKey,
  clearApiKey,
  verifyApiKey,
  verifyApiConnection,
  verifyAllApiConnections,
  API_KEY_STORAGE_KEYS,
};
