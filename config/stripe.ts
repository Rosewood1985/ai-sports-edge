/**
 * Stripe configuration
 *
 * This file contains Stripe-related configuration values.
 * Values are loaded from environment variables for security.
 */
import { STRIPE_PUBLISHABLE_KEY as ENV_STRIPE_KEY } from '@env';

// Stripe publishable key - loaded from environment variables
export const STRIPE_PUBLISHABLE_KEY = ENV_STRIPE_KEY || 'pk_test_placeholder_key';

// Stripe price IDs for subscription plans
export const STRIPE_PRICE_IDS = {
  // Subscription plans
  BASIC_MONTHLY: 'price_basic_monthly',
  PREMIUM_MONTHLY: 'price_premium_monthly',
  PREMIUM_YEARLY: 'price_premium_yearly',
  
  // One-time purchases
  WEEKEND_PASS: 'price_weekend_pass',
  GAME_DAY_PASS: 'price_game_day_pass',
  
  // Microtransactions
  SINGLE_PREDICTION: 'price_single_prediction',
  PARLAY_SUGGESTION: 'price_parlay_suggestion',
  PARLAY_PACKAGE: 'price_parlay_package',
  ALERT_PACKAGE_SMALL: 'price_alert_package_small',
  ALERT_PACKAGE_LARGE: 'price_alert_package_large',
  PLAYER_PLUS_MINUS: 'price_player_plus_minus'
};

// Note: Stripe webhook secret should only be used on the server side
// and should be loaded from environment variables there

export default {
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_IDS
};