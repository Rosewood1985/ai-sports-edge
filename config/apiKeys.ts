/**
 * API Keys Configuration
 * 
 * This file centralizes API key management for the application.
 * In production, these values should be set through environment variables.
 * For local development, you can set them in a .env file.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper function to get API keys from various sources
const getApiKey = (
  envVarName: string,
  expoConfigKey: string,
  defaultValue: string | null = null
): string | null => {
  // Try to get from environment variables
  if (process.env[envVarName]) {
    return process.env[envVarName] as string;
  }
  
  // Try to get from Expo config
  const expoValue = Constants.expoConfig?.extra?.[expoConfigKey] as string;
  if (expoValue) {
    return expoValue;
  }
  
  // Return default value if provided
  return defaultValue;
};

// API Keys
export const API_KEYS = {
  // Sports Data API key
  SPORTS_DATA_API_KEY: getApiKey(
    'REACT_APP_SPORTS_DATA_API_KEY',
    'sportsDataApiKey'
  ),
  
  // Odds API key
  ODDS_API_KEY: getApiKey(
    'REACT_APP_ODDS_API_KEY',
    'oddsApiKey'
  ),
  
  // IP Geolocation API key
  IP_GEOLOCATION_API_KEY: getApiKey(
    'REACT_APP_IPGEOLOCATION_API_KEY',
    'ipgeolocationApiKey'
  ),
  
  // Google Maps API key
  GOOGLE_MAPS_API_KEY: getApiKey(
    'REACT_APP_GOOGLE_MAPS_API_KEY',
    'googleMapsApiKey'
  ),
  
  // Mapbox API key
  MAPBOX_API_KEY: getApiKey(
    'REACT_APP_MAPBOX_API_KEY',
    'mapboxApiKey'
  )
};

// API Base URLs
export const API_BASE_URLS = {
  SPORTS_DATA_API: 'https://api.sportsdata.io/v3',
  ODDS_API: 'https://api.the-odds-api.com/v4',
  IP_GEOLOCATION_API: 'https://api.ipgeolocation.io'
};

// Check if API keys are configured
export const isApiKeyConfigured = (keyName: keyof typeof API_KEYS): boolean => {
  return !!API_KEYS[keyName];
};

// Log warning for missing API keys in development
if (__DEV__) {
  Object.entries(API_KEYS).forEach(([key, value]) => {
    if (!value) {
      console.warn(`Warning: ${key} is not configured. Some features may not work properly.`);
    }
  });
}

export default API_KEYS;