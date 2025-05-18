/**
 * Stripe Service Organism
 *
 * This file provides a complete Stripe payment and tax service.
 * It combines stripe payment and tax molecules to provide a unified interface.
 */

const {
  createPaymentIntent,
  confirmPaymentIntent,
  createSetupIntent,
  validatePaymentMethod,
  isCustomerInUS,
  createCustomer,
  attachPaymentMethod,
} = require('../../molecules/stripe/stripePayment');

const {
  calculateTax,
  createPaymentIntentWithTax,
  recordTaxTransaction,
  getTaxRatesForLocation,
  createPaymentIntentWithCustomTax,
} = require('../../molecules/stripe/stripeTax');

const { getStripe, validateStripeApiKey } = require('../../atoms/stripe/stripeConfig');

const {
  isStripeTaxEnabled,
  getTaxSettingsForCountry,
  TAX_CODES,
} = require('../../atoms/stripe/stripeTaxConfig');

const logger = require('../../../utils/logger');

/**
 * Initialize the Stripe service
 * @returns {Promise<boolean>} True if initialization was successful
 */
async function initialize() {
  try {
    // Validate Stripe API key
    const isApiKeyValid = await validateStripeApiKey();
    if (!isApiKeyValid) {
      logger.error('Invalid Stripe API key');
      return false;
    }

    // Check if Stripe Tax is enabled
    const isTaxEnabled = await isStripeTaxEnabled();
    logger.info('Stripe service initialized', {
      apiKeyValid: isApiKeyValid,
      taxEnabled: isTaxEnabled,
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Stripe service', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Process a payment with tax calculation
 *
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in dollars (will be converted to cents)
 * @param {string} options.currency - Currency code (e.g., 'usd')
 * @param {string} options.customerId - Stripe customer ID
 * @param {Object} options.customerDetails - Customer details
 * @param {Array} options.lineItems - Line items for the payment
 * @param {string} [options.paymentMethodId] - Payment method ID (if provided, payment will be confirmed immediately)
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Payment result
 */
async function processPayment(options) {
  const {
    amount,
    currency,
    customerId,
    customerDetails,
    lineItems,
    paymentMethodId,
    metadata = {},
  } = options;

  try {
    // Validate customer is in the US
    if (!isCustomerInUS(customerDetails)) {
      throw new Error('Payments are only accepted from customers in the United States');
    }

    // Get tax settings for the customer's country
    const countryCode = customerDetails?.address?.country || 'US';
    const taxSettings = getTaxSettingsForCountry(countryCode);

    // Check if tax should be calculated
    let paymentResult;
    if (taxSettings.enabled && (await isStripeTaxEnabled())) {
      // Create payment intent with tax
      paymentResult = await createPaymentIntentWithTax({
        currency,
        customerId,
        customerDetails,
        lineItems,
        metadata: {
          ...metadata,
          automatic_tax: 'true',
        },
      });

      // Record tax transaction for reporting
      await recordTaxTransaction({
        calculationId: paymentResult.taxCalculation.id,
        reference: paymentResult.paymentIntent.id,
      });
    } else {
      // Create payment intent without tax
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await createPaymentIntent({
        amount: amountInCents,
        currency,
        customerDetails,
        customerId,
        metadata: {
          ...metadata,
          automatic_tax: 'false',
        },
      });

      paymentResult = { paymentIntent };
    }

    // Confirm payment if payment method is provided
    if (paymentMethodId) {
      const confirmedPaymentIntent = await confirmPaymentIntent(
        paymentResult.paymentIntent.id,
        paymentMethodId
      );

      paymentResult.paymentIntent = confirmedPaymentIntent;
    }

    return paymentResult;
  } catch (error) {
    logger.error('Payment processing failed', {
      error: error.message,
      customerId,
      amount,
    });
    throw error;
  }
}

/**
 * Set up a customer for future payments
 *
 * @param {Object} options - Setup options
 * @param {string} options.email - Customer email
 * @param {string} [options.name] - Customer name
 * @param {Object} [options.address] - Customer address
 * @param {string} [options.paymentMethodId] - Payment method ID to attach
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Setup result
 */
async function setupCustomer(options) {
  const { email, name, address, paymentMethodId, metadata } = options;

  try {
    // Create customer
    const customer = await createCustomer({
      email,
      name,
      address,
      metadata,
    });

    // Attach payment method if provided
    let paymentMethod;
    if (paymentMethodId) {
      paymentMethod = await attachPaymentMethod(customer.id, paymentMethodId);
    }

    return {
      customer,
      paymentMethod,
    };
  } catch (error) {
    logger.error('Customer setup failed', {
      error: error.message,
      email,
    });
    throw error;
  }
}

/**
 * Get tax information for a location
 *
 * @param {Object} options - Location options
 * @param {string} options.countryCode - Country code (e.g., 'US')
 * @param {string} [options.stateCode] - State code (e.g., 'CA')
 * @param {string} [options.postalCode] - Postal code (e.g., '94111')
 * @param {string} [options.city] - City name (e.g., 'San Francisco')
 * @returns {Promise<Object>} Tax information
 */
async function getTaxInfo(options) {
  const { countryCode, stateCode, postalCode, city } = options;

  try {
    // Get tax settings for the country
    const taxSettings = getTaxSettingsForCountry(countryCode);

    // If tax is not enabled for this country, return empty rates
    if (!taxSettings.enabled) {
      return {
        enabled: false,
        displayPricesIncludingTax: taxSettings.displayPricesIncludingTax,
        rates: {},
      };
    }

    // Get tax rates for the location
    const taxRates = await getTaxRatesForLocation({
      countryCode,
      stateCode,
      postalCode,
      city,
    });

    return {
      enabled: true,
      displayPricesIncludingTax: taxSettings.displayPricesIncludingTax,
      rates: taxRates,
    };
  } catch (error) {
    logger.error('Failed to get tax information', {
      error: error.message,
      countryCode,
      stateCode,
      postalCode,
    });

    // Return default tax info on error
    return {
      enabled: false,
      displayPricesIncludingTax: false,
      rates: {},
      error: error.message,
    };
  }
}

module.exports = {
  initialize,
  processPayment,
  setupCustomer,
  getTaxInfo,

  // Re-export from molecules for convenience
  createPaymentIntent,
  confirmPaymentIntent,
  createSetupIntent,
  validatePaymentMethod,
  isCustomerInUS,
  createCustomer,
  attachPaymentMethod,
  calculateTax,
  createPaymentIntentWithTax,
  recordTaxTransaction,
  getTaxRatesForLocation,
  createPaymentIntentWithCustomTax,

  // Re-export from atoms for convenience
  getStripe,
  validateStripeApiKey,
  isStripeTaxEnabled,
  getTaxSettingsForCountry,
  TAX_CODES,
};
