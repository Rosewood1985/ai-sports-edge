/**
 * Environment configuration utility
 * Provides consistent access to environment variables with fallbacks
 */

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if environment variable is not set
 * @returns {string} - Environment variable value or default
 */
export const getEnvVar = (key, defaultValue = '') => {
  // In a real app, this would use process.env or another method
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Check if we have a global __FIREBASE_DEFAULTS__ object (used in some environments)
  try {
    const defaults = 
      typeof window !== 'undefined' && window.__FIREBASE_DEFAULTS__ ? 
      window.__FIREBASE_DEFAULTS__ : 
      typeof global !== 'undefined' && global.__FIREBASE_DEFAULTS__ ?
      global.__FIREBASE_DEFAULTS__ : 
      {};
      
    if (defaults && defaults[key]) {
      return defaults[key];
    }
  } catch (e) {
    console.warn(`Error accessing Firebase defaults: ${e.message}`);
  }
  
  return defaultValue;
};

/**
 * Validate required environment variables
 * @param {Object} config - Configuration object
 * @param {Array<string>} requiredKeys - Required keys
 * @returns {boolean} - True if all required keys are present
 */
export const validateConfig = (config, requiredKeys) => {
  const missingKeys = requiredKeys.filter(key => !config[key]);
  
  if (missingKeys.length > 0) {
    console.error(`Missing required configuration: ${missingKeys.join(', ')}`);
    console.error('Please check your .env file or environment variables');
    return false;
  }
  return true;
};

// Firebase configuration
export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID')
};

// Stripe configuration
export const stripeConfig = {
  publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  secretKey: getEnvVar('STRIPE_SECRET_KEY'),
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET')
};

// Sports data API configuration
export const sportsDataConfig = {
  sportsDataApiKey: getEnvVar('SPORTS_DATA_API_KEY'),
  oddsApiKey: getEnvVar('ODDS_API_KEY'),
  sportradarApiKey: getEnvVar('SPORTRADAR_API_KEY')
};

// OneSignal configuration
export const oneSignalConfig = {
  apiKey: getEnvVar('ONESIGNAL_API_KEY'),
  appId: getEnvVar('ONESIGNAL_APP_ID')
};

// ML model configuration
export const mlConfig = {
  modelPath: getEnvVar('ML_MODEL_PATH', 'https://ai-sports-edge-com.web.app/models/model.pkl'),
  minConfidenceThreshold: parseInt(getEnvVar('MIN_CONFIDENCE_THRESHOLD', '65'), 10)
};

// Environment
export const isDevelopment = getEnvVar('NODE_ENV', 'development') === 'development';
export const isProduction = getEnvVar('NODE_ENV') === 'production';
export const isTest = getEnvVar('NODE_ENV') === 'test';