import { STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_IDS } from '../../config/stripe';

/**
 * Stripe Configuration Tests
 *
 * These tests verify that Stripe is properly configured in the application.
 */
describe('Stripe Configuration', () => {
  // Test ID: STRIPE-CONFIG-001
  describe('API Key Configuration', () => {
    test('STRIPE_PUBLISHABLE_KEY should be defined', () => {
      expect(STRIPE_PUBLISHABLE_KEY).toBeDefined();
      expect(typeof STRIPE_PUBLISHABLE_KEY).toBe('string');
      expect(STRIPE_PUBLISHABLE_KEY.startsWith('pk_')).toBe(true);
    });

    test('STRIPE_PUBLISHABLE_KEY should not be a placeholder', () => {
      // Check that the key is not just a placeholder value
      expect(STRIPE_PUBLISHABLE_KEY).not.toBe('your_publishable_key_here');
      expect(STRIPE_PUBLISHABLE_KEY.length).toBeGreaterThan(10);
    });
  });

  // Test ID: STRIPE-CONFIG-002
  describe('Price ID Configuration', () => {
    test('STRIPE_PRICE_IDS should be defined', () => {
      expect(STRIPE_PRICE_IDS).toBeDefined();
      expect(typeof STRIPE_PRICE_IDS).toBe('object');
    });

    test('STRIPE_PRICE_IDS should contain all required price IDs', () => {
      // Individual subscription plans
      expect(STRIPE_PRICE_IDS.BASIC_MONTHLY).toBeDefined();
      expect(STRIPE_PRICE_IDS.PREMIUM_MONTHLY).toBeDefined();
      expect(STRIPE_PRICE_IDS.PREMIUM_YEARLY).toBeDefined();

      // Group subscription
      expect(STRIPE_PRICE_IDS.GROUP_PRO_MONTHLY).toBeDefined();

      // One-time purchases
      expect(STRIPE_PRICE_IDS.WEEKEND_PASS).toBeDefined();
      expect(STRIPE_PRICE_IDS.GAME_DAY_PASS).toBeDefined();

      // Microtransactions
      expect(STRIPE_PRICE_IDS.SINGLE_PREDICTION).toBeDefined();
      expect(STRIPE_PRICE_IDS.PARLAY_SUGGESTION).toBeDefined();
    });

    test('Price IDs should have the correct format', () => {
      // Check that price IDs follow the Stripe format (price_*)
      Object.values(STRIPE_PRICE_IDS).forEach(priceId => {
        expect(typeof priceId).toBe('string');
        expect(priceId.startsWith('price_')).toBe(true);
      });
    });

    test('Price IDs should not be placeholders', () => {
      // Check that price IDs are not just placeholder values
      Object.values(STRIPE_PRICE_IDS).forEach(priceId => {
        expect(priceId).not.toBe('price_placeholder');
        expect(priceId.length).toBeGreaterThan(10);
      });
    });
  });
});
