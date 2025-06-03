/**
 * Environment Bootstrap Organism
 * This is a high-level component that combines multiple molecules and atoms
 * to provide a complete environment initialization solution.
 * Orchestrates the environment setup and validation process.
 */

// External imports

// Internal imports
import {
  firebaseConfig,
  sentryConfig,
  stripeConfig,
  mlConfig,
  oneSignalConfig,
  sportsDataConfig,
} from '../atoms/serviceConfig';
import {
  validateEnvironment,
  validateServiceConfig,
  logEnvironmentInfo,
} from '../molecules/environmentValidator';

/**
 * Bootstrap environment configuration
 * Validates all required environment variables and service configurations
 *
 * @param {Object} options - Bootstrap options
 * @param {boolean} options.exitOnError - Whether to exit the process on error
 * @param {boolean} options.logEnvironmentInfo - Whether to log environment information
 * @param {boolean} options.logResults - Whether to log validation results
 * @returns {Object} Bootstrap result with validation status for each service
 */
export function bootstrapEnvironment(options = {}) {
  // Initialize result object
  const result = {
    success: true,
    environment: false,
    services: {
      firebase: false,
      sentry: false,
      stripe: false,
      ml: false,
      oneSignal: false,
      sportsData: false,
    },
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'not set',
    nodeVersion: process.version,
    platform: process.platform,
  };

  // Validate environment variables
  result.environment = validateEnvironment({
    exitOnError: options.exitOnError,
    logResults: options.logResults,
  });

  if (!result.environment) {
    result.success = false;
    return result;
  }

  // Validate Firebase configuration
  result.services.firebase = validateServiceConfig(
    firebaseConfig,
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'],
    'Firebase',
    { exitOnError: options.exitOnError, logResults: options.logResults }
  );

  // Validate Sentry configuration
  result.services.sentry = validateServiceConfig(sentryConfig, ['dsn', 'environment'], 'Sentry', {
    exitOnError: false,
    logResults: options.logResults,
  });

  // Validate Stripe configuration
  result.services.stripe = validateServiceConfig(
    stripeConfig,
    ['publishableKey', 'secretKey'],
    'Stripe',
    { exitOnError: false, logResults: options.logResults }
  );

  // Validate ML configuration
  result.services.ml = validateServiceConfig(
    mlConfig,
    ['modelPath', 'minConfidenceThreshold'],
    'ML',
    { exitOnError: false, logResults: options.logResults }
  );

  // Validate OneSignal configuration
  result.services.oneSignal = validateServiceConfig(
    oneSignalConfig,
    ['apiKey', 'appId'],
    'OneSignal',
    { exitOnError: false, logResults: options.logResults }
  );

  // Validate Sports Data configuration
  result.services.sportsData = validateServiceConfig(
    sportsDataConfig,
    ['oddsApiKey'],
    'Sports Data',
    { exitOnError: false, logResults: options.logResults }
  );

  // Update overall success status
  result.success = result.environment && result.services.firebase; // Only Firebase is critical

  // Log environment information if requested
  if (options.logEnvironmentInfo) {
    logEnvironmentInfo();
  }

  // Log final result
  if (options.logResults) {
    if (result.success) {
      console.log('Environment bootstrap completed successfully');
    } else {
      console.error('Environment bootstrap completed with errors');
    }
  }

  return result;
}

/**
 * Get environment status summary
 * Useful for displaying environment status in admin panels or logs
 *
 * @param {Object} bootstrapResult - Result from bootstrapEnvironment
 * @returns {Object} Environment status
 */
export function getEnvironmentStatus(bootstrapResult) {
  return {
    success: bootstrapResult.success,
    environment: bootstrapResult.environment,
    services: {
      ...bootstrapResult.services,
    },
  };
}

/**
 * Initialize environment
 * Convenience function that bootstraps the environment and returns the status
 *
 * @param {Object} options - Bootstrap options
 * @returns {Object} Environment status summary
 */
export function initializeEnvironment(options = {}) {
  // If environment validation failed and exitOnError is true,
  // the process would have exited already
  const bootstrapResult = bootstrapEnvironment(options);
  return getEnvironmentStatus(bootstrapResult);
}

export default {
  bootstrapEnvironment,
  getEnvironmentStatus,
  initializeEnvironment,
};
