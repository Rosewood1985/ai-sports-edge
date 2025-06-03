/**
 * Environment Validator Molecule
 *
 * Combines atomic environment validation utilities to provide
 * a complete environment validation solution.
 */

import { validateConfig, isDevelopment } from '../atoms/envConfig';
import {
  checkEnvVars,
  getMissingEnvVarsMessage,
  getCategoryInstructions,
} from '../atoms/envValidator';

/**
 * Validate environment at startup
 * @param {Object} options - Validation options
 * @param {boolean} options.exitOnError - Whether to exit the process on error
 * @param {boolean} options.logResults - Whether to log validation results
 * @returns {boolean} Whether validation passed
 */
export function validateEnvironment(options = { exitOnError: true, logResults: true }) {
  if (options.logResults) {
    console.log('Validating environment variables...');
  }

  const result = checkEnvVars();

  if (!result.success) {
    // Get detailed error messages
    const missingVarsMessage = getMissingEnvVarsMessage(result.missing);
    const categoryInstructions = getCategoryInstructions(result.missing);

    // Log error messages
    console.error(missingVarsMessage);
    console.error(categoryInstructions);

    // Exit if required
    if (options.exitOnError) {
      console.error('Exiting due to missing environment variables');
      process.exit(1);
    }

    return false;
  }

  if (options.logResults) {
    console.log('Environment validation passed');
  }

  return true;
}

/**
 * Validate service configuration
 * @param {Object} config - Configuration object to validate
 * @param {Array<string>} requiredKeys - Required keys in the configuration
 * @param {string} serviceName - Name of the service for logging
 * @param {Object} options - Validation options
 * @param {boolean} options.exitOnError - Whether to exit the process on error
 * @param {boolean} options.logResults - Whether to log validation results
 * @returns {boolean} Whether validation passed
 */
export function validateServiceConfig(
  config,
  requiredKeys,
  serviceName,
  options = { exitOnError: false, logResults: true }
) {
  if (options.logResults) {
    console.log(`Validating ${serviceName} configuration...`);
  }

  const isValid = validateConfig(config, requiredKeys);

  if (!isValid) {
    const missingKeys = requiredKeys.filter(key => !config[key]);
    console.error(`${serviceName} configuration is incomplete. Missing: ${missingKeys.join(', ')}`);

    if (options.exitOnError) {
      console.error(`Exiting due to invalid ${serviceName} configuration`);
      process.exit(1);
    }

    return false;
  }

  if (options.logResults) {
    console.log(`${serviceName} configuration validation passed`);
  }

  return true;
}

/**
 * Log environment information
 * Useful for debugging environment issues
 */
export function logEnvironmentInfo() {
  if (!isDevelopment) {
    return; // Only log in development
  }

  console.log('Environment Information:');
  console.log('------------------------');
  console.log(`Node Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Current Directory: ${process.cwd()}`);
  console.log('------------------------');
}
