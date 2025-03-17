/**
 * Stripe configuration
 * 
 * This file contains Stripe-related configuration values.
 * In a production environment, these should be loaded from environment variables.
 */

// Stripe publishable key
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51NxSdILkdIwIjOxOG8VKMq2pZ0XxuzQumDOtC9cRiRlSKpYfKyYMQvUeKjGQpLFrKVgxKvQXdLrF9zJ5U5VbKVgx00aBcdefgh';

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

// Stripe webhook secret
// This is only used on the server side, but included here for reference
export const STRIPE_WEBHOOK_SECRET = 'whsec_your_webhook_secret';

export default {
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_IDS
};