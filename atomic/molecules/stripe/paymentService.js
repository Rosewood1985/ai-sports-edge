/**
 * Payment Service Molecule
 *
 * This service handles payment processing with Stripe.
 * It combines stripe configuration atoms to provide payment functionality.
 */

const cache = require('../../../utils/cache');
const logger = require('../../../utils/logger');
const { getStripe } = require('../../atoms/stripe/stripeConfig');
const { DEFAULT_TAX_BEHAVIOR, TAX_CODES } = require('../../atoms/stripe/stripeTaxConfig');

/**
 * Validate that the customer is in the United States
 *
 * @param {Object} customerDetails - Customer details
 * @param {Object} customerDetails.address - Customer address
 * @param {string} customerDetails.address.country - Country code
 * @param {string} [ipAddress] - Customer IP address
 * @returns {boolean} True if the customer is in the US
 */
function isCustomerInUS(customerDetails, ipAddress) {
  // Check address country code
  if (customerDetails?.address?.country && customerDetails.address.country !== 'US') {
    logger.info('Customer rejected: non-US country code', {
      country: customerDetails.address.country,
    });
    return false;
  }

  // Check postal code format (optional)
  if (customerDetails?.address?.postal_code) {
    // US postal codes are 5 digits or 5+4 digits (ZIP+4)
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZipRegex.test(customerDetails.address.postal_code)) {
      logger.info('Customer rejected: invalid US postal code format', {
        postalCode: customerDetails.address.postal_code,
      });
      return false;
    }
  }

  // IP geolocation check could be added here
  // This would require an IP geolocation service
  if (ipAddress) {
    // Example implementation (would need a real geolocation service)
    // const geoData = geoLocationService.lookup(ipAddress);
    // if (geoData.countryCode !== 'US') {
    //   logger.info('Customer rejected: non-US IP address', {
    //     ipAddress,
    //     country: geoData.countryCode
    //   });
    //   return false;
    // }
  }

  return true;
}

/**
 * Create a payment intent with US-only restrictions
 *
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in cents
 * @param {string} options.currency - Currency code (must be 'usd')
 * @param {Object} options.customerDetails - Customer details
 * @param {string} [options.ipAddress] - Customer IP address
 * @param {string} [options.customerId] - Stripe customer ID
 * @param {Object} [options.metadata] - Additional metadata
 * @param {boolean} [options.automaticTax] - Whether to calculate tax automatically
 * @returns {Promise<Object>} Payment intent
 * @throws {Error} If the customer is not in the US or other validation fails
 */
async function createPaymentIntent(options) {
  const {
    amount,
    currency,
    customerDetails,
    ipAddress,
    customerId,
    metadata,
    automaticTax = false,
  } = options;

  // Validate currency is USD
  if (currency.toLowerCase() !== 'usd') {
    throw new Error('Only USD currency is supported');
  }

  // Validate customer is in the US
  if (!isCustomerInUS(customerDetails, ipAddress)) {
    throw new Error('Payments are only accepted from customers in the United States');
  }

  // Get Stripe instance
  const stripe = getStripe();

  // Create payment intent
  try {
    const paymentIntentOptions = {
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      customer: customerId,
      metadata: {
        ...metadata,
        us_only: 'true',
        ip_address: ipAddress,
      },
    };

    // Add automatic tax calculation if enabled
    if (automaticTax) {
      paymentIntentOptions.automatic_tax = {
        enabled: true,
      };

      // Add customer details for tax calculation
      if (customerDetails) {
        paymentIntentOptions.customer_details = {
          address: customerDetails.address,
          address_source: 'shipping',
          ...customerDetails,
        };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount,
      customerId,
      automaticTax,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', {
      error: error.message,
      amount,
      customerId,
    });

    throw error;
  }
}

/**
 * Confirm a payment intent
 *
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Confirmed payment intent
 */
async function confirmPaymentIntent(paymentIntentId, paymentMethodId) {
  try {
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    logger.info('Payment intent confirmed', {
      paymentIntentId,
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to confirm payment intent', {
      error: error.message,
      paymentIntentId,
    });

    throw error;
  }
}

/**
 * Create a setup intent for saving a payment method
 *
 * @param {Object} options - Setup options
 * @param {string} options.customerId - Stripe customer ID
 * @param {Object} options.customerDetails - Customer details
 * @param {string} [options.ipAddress] - Customer IP address
 * @returns {Promise<Object>} Setup intent
 * @throws {Error} If the customer is not in the US
 */
async function createSetupIntent(options) {
  const { customerId, customerDetails, ipAddress } = options;

  // Validate customer is in the US
  if (!isCustomerInUS(customerDetails, ipAddress)) {
    throw new Error('Payment methods can only be saved for customers in the United States');
  }

  // Get Stripe instance
  const stripe = getStripe();

  // Create setup intent
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        us_only: 'true',
        ip_address: ipAddress,
      },
    });

    logger.info('Setup intent created', {
      setupIntentId: setupIntent.id,
      customerId,
    });

    return setupIntent;
  } catch (error) {
    logger.error('Failed to create setup intent', {
      error: error.message,
      customerId,
    });

    throw error;
  }
}

/**
 * Validate a payment method is from the US
 *
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<boolean>} True if the payment method is from the US
 */
async function validatePaymentMethod(paymentMethodId) {
  try {
    const stripe = getStripe();

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Check if the card is from a US bank
    if (paymentMethod.card && paymentMethod.card.country !== 'US') {
      logger.info('Payment method rejected: non-US card', {
        paymentMethodId,
        country: paymentMethod.card.country,
      });
      return false;
    }

    // Check billing address country
    if (
      paymentMethod.billing_details &&
      paymentMethod.billing_details.address &&
      paymentMethod.billing_details.address.country &&
      paymentMethod.billing_details.address.country !== 'US'
    ) {
      logger.info('Payment method rejected: non-US billing address', {
        paymentMethodId,
        country: paymentMethod.billing_details.address.country,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to validate payment method', {
      error: error.message,
      paymentMethodId,
    });

    return false;
  }
}

/**
 * Create a Stripe customer
 *
 * @param {Object} options - Customer options
 * @param {string} options.email - Customer email
 * @param {string} [options.name] - Customer name
 * @param {Object} [options.address] - Customer address
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Stripe customer
 */
async function createCustomer(options) {
  const { email, name, address, metadata } = options;

  try {
    const stripe = getStripe();

    const customer = await stripe.customers.create({
      email,
      name,
      address,
      metadata,
    });

    logger.info('Customer created', {
      customerId: customer.id,
      email,
    });

    return customer;
  } catch (error) {
    logger.error('Failed to create customer', {
      error: error.message,
      email,
    });

    throw error;
  }
}

/**
 * Attach a payment method to a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Payment method
 */
async function attachPaymentMethodToCustomer(customerId, paymentMethodId) {
  try {
    const stripe = getStripe();

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    logger.info('Payment method attached to customer', {
      customerId,
      paymentMethodId,
    });

    return paymentMethod;
  } catch (error) {
    logger.error('Failed to attach payment method to customer', {
      error: error.message,
      customerId,
      paymentMethodId,
    });

    throw error;
  }
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  createSetupIntent,
  validatePaymentMethod,
  isCustomerInUS,
  createCustomer,
  attachPaymentMethodToCustomer,
};
