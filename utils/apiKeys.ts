/**
 * API Keys Management
 * 
 * This module centralizes all API key access and provides proper error handling
 * for missing keys. In production, all keys should be set as environment variables.
 */

import logger from './logger';

// Interface for API configuration
interface ApiConfig {
  key: string;
  isRequired: boolean;
  serviceName: string;
}

// Get API key with proper error handling
export function getApiKey(key: string, isRequired: boolean = true, serviceName: string): string {
  const apiKey = process.env[key] || '';
  
  if (!apiKey && isRequired) {
    const errorMessage = `Missing required API key: ${key} for service: ${serviceName}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  if (!apiKey && !isRequired) {
    logger.warn(`Missing optional API key: ${key} for service: ${serviceName}`);
  }
  
  return apiKey;
}

// API key configurations
const API_KEYS = {
  ODDS_API_KEY: {
    key: 'ODDS_API_KEY',
    isRequired: true,
    serviceName: 'The Odds API'
  },
  WEATHER_API_KEY: {
    key: 'WEATHER_API_KEY',
    isRequired: true,
    serviceName: 'Weather API'
  },
  STRIPE_SECRET_KEY: {
    key: 'STRIPE_SECRET_KEY',
    isRequired: true,
    serviceName: 'Stripe Payments'
  },
  FANDUEL_AFFILIATE_ID: {
    key: 'FANDUEL_AFFILIATE_ID',
    isRequired: true,
    serviceName: 'FanDuel Affiliate'
  },
  FANDUEL_API_KEY: {
    key: 'FANDUEL_API_KEY',
    isRequired: true,
    serviceName: 'FanDuel API'
  },
  SPORTRADAR_API_KEY: {
    key: 'SPORTRADAR_API_KEY',
    isRequired: true,
    serviceName: 'SportRadar API'
  },
  NCAA_BASKETBALL_API_KEY: {
    key: 'NCAA_BASKETBALL_API_KEY',
    isRequired: true,
    serviceName: 'NCAA Basketball API'
  }
};

// Export API key getters
export const getOddsApiKey = () => getApiKey(API_KEYS.ODDS_API_KEY.key, API_KEYS.ODDS_API_KEY.isRequired, API_KEYS.ODDS_API_KEY.serviceName);
export const getWeatherApiKey = () => getApiKey(API_KEYS.WEATHER_API_KEY.key, API_KEYS.WEATHER_API_KEY.isRequired, API_KEYS.WEATHER_API_KEY.serviceName);
export const getStripeSecretKey = () => getApiKey(API_KEYS.STRIPE_SECRET_KEY.key, API_KEYS.STRIPE_SECRET_KEY.isRequired, API_KEYS.STRIPE_SECRET_KEY.serviceName);
export const getFanDuelAffiliateId = () => getApiKey(API_KEYS.FANDUEL_AFFILIATE_ID.key, API_KEYS.FANDUEL_AFFILIATE_ID.isRequired, API_KEYS.FANDUEL_AFFILIATE_ID.serviceName);
export const getFanDuelApiKey = () => getApiKey(API_KEYS.FANDUEL_API_KEY.key, API_KEYS.FANDUEL_API_KEY.isRequired, API_KEYS.FANDUEL_API_KEY.serviceName);
export const getSportRadarApiKey = () => getApiKey(API_KEYS.SPORTRADAR_API_KEY.key, API_KEYS.SPORTRADAR_API_KEY.isRequired, API_KEYS.SPORTRADAR_API_KEY.serviceName);
export const getNcaaBasketballApiKey = () => getApiKey(API_KEYS.NCAA_BASKETBALL_API_KEY.key, API_KEYS.NCAA_BASKETBALL_API_KEY.isRequired, API_KEYS.NCAA_BASKETBALL_API_KEY.serviceName);

export default {
  getOddsApiKey,
  getWeatherApiKey,
  getStripeSecretKey,
  getFanDuelAffiliateId,
  getFanDuelApiKey,
  getSportRadarApiKey,
  getNcaaBasketballApiKey
};