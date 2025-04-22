/**
 * Environment Validator Atom
 *
 * Provides primitive functions for validating environment variables.
 */

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
export function checkEnvVars() {
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
 * Get missing environment variables message
 * @param {Object} missing - Missing variables by category
 * @returns {string} Formatted message
 */
export function getMissingEnvVarsMessage(missing) {
  let message = 'Missing required environment variables:\n';

  Object.entries(missing).forEach(([category, vars]) => {
    message += `\n${category.toUpperCase()}:\n`;
    vars.forEach(varName => {
      message += `  - ${varName}\n`;
    });
  });

  return message;
}

/**
 * Get category-specific instructions
 * @param {Object} missing - Missing variables by category
 * @returns {string} Instructions message
 */
export function getCategoryInstructions(missing) {
  let message = '';

  if (missing.firebase) {
    message +=
      'Firebase config is incomplete. Check firebase-config directory for setup instructions.\n';
  }

  if (missing.api) {
    message += 'API keys are missing. See .env.example for required keys.\n';
  }

  return message;
}
