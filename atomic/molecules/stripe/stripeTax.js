/**
 * Stripe Tax Molecule
 *
 * This file contains tax calculation and reporting functionality using Stripe Tax.
 * It combines stripe configuration atoms to provide tax-related functions.
 */

const { getStripe } = require('../../atoms/stripe/stripeConfig');
const {
  DEFAULT_TAX_BEHAVIOR,
  TAX_CALCULATION_CACHE_TTL,
  TAX_CODES,
} = require('../../atoms/stripe/stripeTaxConfig');
const logger = require('../../../utils/logger');
const cache = require('../../../utils/cache');

/**
 * Calculate tax for a transaction
 *
 * @param {Object} options - Tax calculation options
 * @param {string} options.currency - Currency code (e.g., 'usd')
 * @param {string} options.customerId - Stripe customer ID
 * @param {Object} options.customerDetails - Customer details for tax calculation
 * @param {Array} options.lineItems - Line items for tax calculation
 * @param {boolean} options.useCache - Whether to use cached calculations (default: true)
 * @returns {Promise<Object>} Tax calculation result
 */
async function calculateTax({ currency, customerId, customerDetails, lineItems, useCache = true }) {
  try {
    // Validate inputs
    if (!currency) throw new Error('Currency is required');
    if (!lineItems || !lineItems.length) throw new Error('Line items are required');

    // Generate cache key
    const cacheKey = `tax_calc_${customerId}_${JSON.stringify(lineItems)}_${currency}`;

    // Check cache if enabled
    if (useCache) {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Using cached tax calculation', { customerId, cacheKey });
        return cachedResult;
      }
    }

    // Prepare line items for Stripe Tax API
    const taxLineItems = lineItems.map(item => ({
      amount: Math.round(item.amount * 100), // Convert to cents
      reference: item.id || `item_${Date.now()}`,
      tax_code: item.taxCode || TAX_CODES.DIGITAL_GOODS, // Default to digital goods
      tax_behavior: item.taxBehavior || DEFAULT_TAX_BEHAVIOR,
    }));

    // Create tax calculation
    const stripe = getStripe();
    const taxCalculation = await stripe.tax.calculations.create({
      currency: currency.toLowerCase(),
      customer: customerId,
      customer_details: customerDetails,
      line_items: taxLineItems,
    });

    // Cache the result
    if (useCache) {
      cache.set(cacheKey, taxCalculation, TAX_CALCULATION_CACHE_TTL);
    }

    // Log success
    logger.info('Tax calculation completed', {
      calculationId: taxCalculation.id,
      customerId,
      totalTax: taxCalculation.tax_amount_exclusive,
    });

    return taxCalculation;
  } catch (error) {
    logger.error('Tax calculation failed', {
      error: error.message,
      customerId,
      lineItems,
    });
    throw error;
  }
}

/**
 * Create a payment intent with tax calculation
 *
 * @param {Object} options - Payment options
 * @param {string} options.currency - Currency code (e.g., 'usd')
 * @param {string} options.customerId - Stripe customer ID
 * @param {Object} options.customerDetails - Customer details for tax calculation
 * @param {Array} options.lineItems - Line items for payment
 * @param {Object} options.metadata - Additional metadata for the payment intent
 * @returns {Promise<Object>} Payment intent with tax
 */
async function createPaymentIntentWithTax({
  currency,
  customerId,
  customerDetails,
  lineItems,
  metadata = {},
}) {
  try {
    // Calculate subtotal (pre-tax amount)
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // Calculate tax
    const taxCalculation = await calculateTax({
      currency,
      customerId,
      customerDetails,
      lineItems,
    });

    // Calculate total amount (including tax)
    const totalAmount = Math.round(subtotal * 100) + taxCalculation.tax_amount_exclusive;

    // Create payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        ...metadata,
        tax_calculation_id: taxCalculation.id,
        subtotal_amount: Math.round(subtotal * 100),
        tax_amount: taxCalculation.tax_amount_exclusive,
      },
    });

    // Log success
    logger.info('Payment intent with tax created', {
      paymentIntentId: paymentIntent.id,
      customerId,
      amount: totalAmount,
      taxAmount: taxCalculation.tax_amount_exclusive,
    });

    return {
      paymentIntent,
      taxCalculation,
    };
  } catch (error) {
    logger.error('Failed to create payment intent with tax', {
      error: error.message,
      customerId,
      lineItems,
    });
    throw error;
  }
}

/**
 * Record a tax transaction for reporting
 *
 * @param {Object} options - Transaction options
 * @param {string} options.calculationId - Tax calculation ID
 * @param {string} options.reference - Reference ID (e.g., payment intent ID)
 * @returns {Promise<Object>} Tax transaction
 */
async function recordTaxTransaction({ calculationId, reference }) {
  try {
    // Validate inputs
    if (!calculationId) throw new Error('Tax calculation ID is required');
    if (!reference) throw new Error('Reference ID is required');

    // Create tax transaction
    const stripe = getStripe();
    const taxTransaction = await stripe.tax.transactions.createFromCalculation({
      calculation: calculationId,
      reference,
    });

    // Log success
    logger.info('Tax transaction recorded', {
      transactionId: taxTransaction.id,
      calculationId,
      reference,
    });

    return taxTransaction;
  } catch (error) {
    logger.error('Failed to record tax transaction', {
      error: error.message,
      calculationId,
      reference,
    });
    throw error;
  }
}

/**
 * Get tax rates for a specific location
 *
 * @param {Object} options - Location options
 * @param {string} options.countryCode - Country code (e.g., 'US')
 * @param {string} options.stateCode - State code (e.g., 'CA')
 * @param {string} options.postalCode - Postal code (e.g., '94111')
 * @param {string} options.city - City name (e.g., 'San Francisco')
 * @returns {Promise<Object>} Tax rates for the location
 */
async function getTaxRatesForLocation({ countryCode, stateCode, postalCode, city }) {
  try {
    // Generate cache key
    const cacheKey = `tax_rates_${countryCode}_${stateCode || ''}_${postalCode || ''}_${
      city || ''
    }`;

    // Check cache
    const cachedRates = cache.get(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }

    // Create a test calculation to get tax rates
    const stripe = getStripe();
    const testCalculation = await stripe.tax.calculations.create({
      currency: 'usd',
      line_items: [
        {
          amount: 1000, // $10.00
          reference: 'test_item',
          tax_code: TAX_CODES.DIGITAL_GOODS,
          tax_behavior: DEFAULT_TAX_BEHAVIOR,
        },
      ],
      customer_details: {
        address: {
          country: countryCode,
          state: stateCode,
          postal_code: postalCode,
          city: city,
        },
        address_source: 'billing',
      },
    });

    // Extract tax rates from calculation
    const taxRates = {
      calculation_id: testCalculation.id,
      tax_date: testCalculation.tax_date,
      tax_breakdown: testCalculation.tax_breakdown,
      jurisdictions: testCalculation.jurisdictions,
    };

    // Cache the result (1 day TTL)
    cache.set(cacheKey, taxRates, 24 * 60 * 60 * 1000);

    return taxRates;
  } catch (error) {
    logger.error('Failed to get tax rates for location', {
      error: error.message,
      countryCode,
      stateCode,
      postalCode,
    });
    throw error;
  }
}

/**
 * Create a payment intent with custom tax details
 *
 * @param {Object} options - Payment options
 * @param {number} options.amount - Total amount (including tax) in cents
 * @param {string} options.currency - Currency code (e.g., 'usd')
 * @param {string} options.customerId - Stripe customer ID
 * @param {Object} options.taxDetails - Custom tax details
 * @param {Object} options.metadata - Additional metadata for the payment intent
 * @returns {Promise<Object>} Payment intent with custom tax
 */
async function createPaymentIntentWithCustomTax({
  amount,
  currency,
  customerId,
  taxDetails,
  metadata = {},
}) {
  try {
    // Validate inputs
    if (!amount) throw new Error('Amount is required');
    if (!currency) throw new Error('Currency is required');
    if (!customerId) throw new Error('Customer ID is required');
    if (!taxDetails) throw new Error('Tax details are required');

    // Create payment intent with custom tax
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata,
      tax: {
        calculation_behavior: 'custom',
        transaction: {
          tax_date: new Date().toISOString().split('T')[0],
          shipping_cost: taxDetails.shippingCost || {
            amount: 0,
            tax_code: TAX_CODES.SHIPPING,
          },
          line_items: taxDetails.lineItems.map(item => ({
            amount: Math.round(item.amount * 100), // Convert to cents
            reference: item.id || `item_${Date.now()}`,
            tax_code: item.taxCode || TAX_CODES.DIGITAL_GOODS,
            tax_behavior: item.taxBehavior || DEFAULT_TAX_BEHAVIOR,
          })),
          customer: taxDetails.customer,
          tax_details: taxDetails.taxDetails,
        },
      },
    });

    // Log success
    logger.info('Payment intent with custom tax created', {
      paymentIntentId: paymentIntent.id,
      customerId,
      amount,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent with custom tax', {
      error: error.message,
      customerId,
      amount,
    });
    throw error;
  }
}

module.exports = {
  calculateTax,
  createPaymentIntentWithTax,
  recordTaxTransaction,
  getTaxRatesForLocation,
  createPaymentIntentWithCustomTax,
};
