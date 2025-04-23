/**
 * Environment Configuration Atom
 * Provides primitive functions for accessing environment variables
 * and configuration objects for various services.
 */

// External imports

// Internal imports

/**
 * Get environment variable with fallback
 * 
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
      typeof window !== 'undefined' && window.__FIREBASE_DEFAULTS__
        ? window.__FIREBASE_DEFAULTS__
        : typeof global !== 'undefined' && global.__FIREBASE_DEFAULTS__
          ? global.__FIREBASE_DEFAULTS__
          : {};
          
    if (defaults && defaults[key]) {
      return defaults[key];
    }
  } catch (e) {
    console.warn(`Error accessing Firebase defaults: ${e.message}`);
  }
  
  return defaultValue;
};

// Environment flags
export const isDevelopment = getEnvVar('NODE_ENV', 'development') === 'development';
export const isProduction = getEnvVar('NODE_ENV') === 'production';
export const isTest = getEnvVar('NODE_ENV') === 'test';

/**
 * Validate required configuration keys
 * 
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
