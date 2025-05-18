/**
 * Stripe Configuration Atom
 *
 * This file contains the basic configuration for Stripe integration.
 * It provides the Stripe instance and basic configuration settings.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../../../utils/logger');

/**
 * Stripe API version to use
 * Always specify a version to ensure API stability
 */
const STRIPE_API_VERSION = '2023-10-16';

/**
 * Stripe configuration options
 */
const STRIPE_CONFIG = {
  apiVersion: STRIPE_API_VERSION,
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
};

/**
 * Configure Stripe with the specified options
 */
function configureStripe() {
  try {
    stripe.setApiVersion(STRIPE_CONFIG.apiVersion);
    stripe.setMaxNetworkRetries(STRIPE_CONFIG.maxNetworkRetries);
    stripe.setTelemetryEnabled(true);

    logger.info('Stripe configured successfully', {
      apiVersion: STRIPE_CONFIG.apiVersion,
      maxNetworkRetries: STRIPE_CONFIG.maxNetworkRetries,
    });

    return stripe;
  } catch (error) {
    logger.error('Failed to configure Stripe', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get the configured Stripe instance
 * @returns {Object} Configured Stripe instance
 */
function getStripe() {
  return configureStripe();
}

/**
 * Validate that the Stripe API key is properly configured
 * @returns {Promise<boolean>} True if the API key is valid
 */
async function validateStripeApiKey() {
  try {
    // Make a simple API call to verify the API key
    await stripe.balance.retrieve();
    logger.info('Stripe API key is valid');
    return true;
  } catch (error) {
    logger.error('Invalid Stripe API key', {
      error: error.message,
    });
    return false;
  }
}

module.exports = {
  getStripe,
  validateStripeApiKey,
  STRIPE_CONFIG,
};
