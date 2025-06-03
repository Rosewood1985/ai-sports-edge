/**
 * Affiliate and Payment Configuration
 *
 * This file contains configuration settings for affiliate programs and payment processing.
 * Values are loaded from environment variables for security.
 */
import {
  FANDUEL_AFFILIATE_ID,
  FANDUEL_AFFILIATE_LINK,
  API_BASE_URL,
  ENABLE_MICROTRANSACTIONS,
  ENABLE_AFFILIATE_LINKS,
  ENABLE_AB_TESTING,
  ENABLE_GAME_URL_INTEGRATION,
} from '@env';

// FanDuel Affiliate Configuration
export const FANDUEL_CONFIG = {
  // Affiliate ID loaded from environment variables
  AFFILIATE_ID: FANDUEL_AFFILIATE_ID || 'PLACEHOLDER_AFFILIATE_ID',

  // Base URL for FanDuel
  BASE_URL: 'https://sportsbook.fanduel.com/',

  // Affiliate link from environment variable
  AFFILIATE_URL: FANDUEL_AFFILIATE_LINK || 'https://fndl.co/lr9jbkg',

  // Default tracking parameters
  TRACKING_PARAMS: {
    utm_source: 'aisportsedge',
    utm_medium: 'affiliate',
    utm_campaign: 'betbutton',
  },
};

// Stripe Configuration
export const STRIPE_CONFIG = {
  // Stripe configuration is now in config/stripe.ts
  // and loaded from environment variables

  // Merchant identifier
  MERCHANT_IDENTIFIER: 'merchant.com.aisportsedge',

  // Default product pricing (in cents)
  PRICING: {
    ODDS_ACCESS: 199, // $1.99 for odds access
  },
};

// API Configuration
export const API_CONFIG = {
  // Base URL for your API - loaded from environment variables
  BASE_URL: API_BASE_URL || 'https://ai-sports-edge.firebaseapp.com/api',

  // API endpoints
  ENDPOINTS: {
    CREATE_PAYMENT: '/create-payment',
    UPDATE_PURCHASE: '/update-purchase-record',
    CHECK_PURCHASE: '/check-purchase-status',
  },
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  // Firestore collections
  COLLECTIONS: {
    USER_PURCHASES: 'user_purchases',
    GAME_URLS: 'gameUrls',
    API_KEYS: 'apiKeys',
  },
};

// Feature Flags - loaded from environment variables
export const FEATURE_FLAGS = {
  // Enable/disable features
  ENABLE_MICROTRANSACTIONS: ENABLE_MICROTRANSACTIONS === 'true',
  ENABLE_AFFILIATE_LINKS: ENABLE_AFFILIATE_LINKS === 'true',
  ENABLE_AB_TESTING: ENABLE_AB_TESTING === 'true',
  ENABLE_GAME_URL_INTEGRATION: ENABLE_GAME_URL_INTEGRATION === 'true',
};
