/**
 * Stripe Tax Configuration Atom
 *
 * This file contains the basic configuration for Stripe Tax integration.
 * It provides tax-related constants and configuration settings.
 */

const { getStripe } = require('./stripeConfig');
const logger = require('../../../utils/logger');

/**
 * Default tax behavior
 * 'exclusive': Tax is added to the price (most common in US)
 * 'inclusive': Price includes tax (common in EU)
 */
const DEFAULT_TAX_BEHAVIOR = 'exclusive';

/**
 * Cache TTL for tax calculations (5 minutes)
 */
const TAX_CALCULATION_CACHE_TTL = 5 * 60 * 1000;

/**
 * Common tax codes for different product types
 * See full list at: https://stripe.com/docs/tax/tax-codes
 */
const TAX_CODES = {
  // Digital goods
  DIGITAL_GOODS: 'txcd_10103001',
  SAAS: 'txcd_10103000',
  DIGITAL_SERVICES: 'txcd_10103002',

  // Physical goods
  PHYSICAL_GOODS: 'txcd_99999999',
  CLOTHING: 'txcd_20010000',
  BOOKS: 'txcd_35010000',

  // Services
  SERVICES: 'txcd_20030000',
  PROFESSIONAL_SERVICES: 'txcd_10201000',

  // Shipping
  SHIPPING: 'txcd_92010001',

  // Other
  OTHER: 'txcd_00000000',
};

/**
 * Tax jurisdictions where we have nexus
 * This should be kept up to date as business expands
 */
const TAX_JURISDICTIONS = [
  {
    country: 'US',
    state: 'CA',
    description: 'California',
  },
  {
    country: 'US',
    state: 'NY',
    description: 'New York',
  },
  {
    country: 'US',
    state: 'TX',
    description: 'Texas',
  },
  // Add more jurisdictions as needed
];

/**
 * Check if Stripe Tax is enabled and properly configured
 * @returns {Promise<boolean>} True if Stripe Tax is enabled
 */
async function isStripeTaxEnabled() {
  try {
    const stripe = getStripe();

    // Make a simple tax calculation to verify Stripe Tax is enabled
    await stripe.tax.calculations.create({
      currency: 'usd',
      customer_details: {
        address: {
          country: 'US',
          state: 'CA',
          postal_code: '94111',
        },
        address_source: 'billing',
      },
      line_items: [
        {
          amount: 1000, // $10.00
          reference: 'test_item',
          tax_code: TAX_CODES.DIGITAL_GOODS,
          tax_behavior: DEFAULT_TAX_BEHAVIOR,
        },
      ],
    });

    logger.info('Stripe Tax is enabled and properly configured');
    return true;
  } catch (error) {
    if (error.code === 'tax.calculation.tax_not_configured') {
      logger.warn('Stripe Tax is not enabled for this account');
      return false;
    }

    logger.error('Error checking Stripe Tax configuration', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Get tax settings for a specific country
 * @param {string} countryCode - ISO country code
 * @returns {Object} Tax settings for the country
 */
function getTaxSettingsForCountry(countryCode) {
  // Default tax settings
  const defaultSettings = {
    enabled: true,
    automaticTax: true,
    displayPricesIncludingTax: false,
  };

  // Country-specific settings
  const countrySettings = {
    // European countries typically display prices including tax
    GB: { displayPricesIncludingTax: true },
    DE: { displayPricesIncludingTax: true },
    FR: { displayPricesIncludingTax: true },
    IT: { displayPricesIncludingTax: true },
    ES: { displayPricesIncludingTax: true },

    // Countries where we don't have tax nexus or don't collect tax
    JP: { enabled: false },
    CN: { enabled: false },
    RU: { enabled: false },
  };

  return {
    ...defaultSettings,
    ...(countrySettings[countryCode] || {}),
  };
}

module.exports = {
  DEFAULT_TAX_BEHAVIOR,
  TAX_CALCULATION_CACHE_TTL,
  TAX_CODES,
  TAX_JURISDICTIONS,
  isStripeTaxEnabled,
  getTaxSettingsForCountry,
};
