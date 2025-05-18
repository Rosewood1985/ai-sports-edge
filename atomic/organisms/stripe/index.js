/**
 * Stripe Module Index
 *
 * This file exports the Stripe service and related components.
 */

const stripeService = require('./stripeService');
const StripeProvider = require('./StripeProvider').default;
const { useStripe } = require('./StripeProvider');

module.exports = {
  ...stripeService,
  StripeProvider,
  useStripe,
};
