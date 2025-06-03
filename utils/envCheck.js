/**
 * Environment Variable Checker
 *
 * This script checks for required environment variables at startup
 * and provides clear error messages for missing variables.
 */

// Use console for logging since this might run before logger is initialized
// Don't require apiKeys to avoid circular dependency

// Required environment variables grouped by category
const REQUIRED_ENV_VARS = {
  firebase: [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
  ],
  api: ['ODDS_API_KEY', 'STRIPE_SECRET_KEY', 'FANDUEL_AFFILIATE_ID', 'FANDUEL_API_KEY'],
  app: ['APP_ENV', 'API_BASE_URL'],
};

/**
 * Check if required environment variables are set
 * @returns {Object} Result of the check with missing variables
 */
function checkEnvVars() {
  const missing = {};
  let hasErrors = false;

  // Check each category
  Object.entries(REQUIRED_ENV_VARS).forEach(([category, vars]) => {
    const missingInCategory = vars.filter(varName => !process.env[varName]);

    if (missingInCategory.length > 0) {
      missing[category] = missingInCategory;
      hasErrors = true;
    }
  });

  return {
    success: !hasErrors,
    missing,
  };
}

/**
 * Validate environment at startup
 * @param {Object} options - Validation options
 * @param {boolean} options.exitOnError - Whether to exit the process on error
 * @returns {boolean} Whether validation passed
 */
function validateEnvironment(options = { exitOnError: true }) {
  console.log('Validating environment variables...');

  const result = checkEnvVars();

  if (!result.success) {
    console.error('Missing required environment variables:', result.missing);

    // Log specific instructions for each category
    if (result.missing.firebase) {
      console.error(
        'Firebase config is incomplete. Check firebase-config directory for setup instructions.'
      );
    }

    if (result.missing.api) {
      console.error('API keys are missing. See .env.example for required keys.');
    }

    if (options.exitOnError) {
      console.error('Exiting due to missing environment variables');
      process.exit(1);
    }

    return false;
  }

  console.log('Environment validation passed');
  return true;
}

// Export functions
module.exports = {
  checkEnvVars,
  validateEnvironment,
};
