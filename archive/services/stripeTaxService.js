/**
 * Stripe Tax Service
 * 
 * This service provides functions for tax calculation, transaction recording,
 * and tax reporting using the Stripe Tax API.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Cache TTL for tax calculations (5 minutes)
const TAX_CALCULATION_CACHE_TTL = 5 * 60 * 1000;

// Default tax behavior
const DEFAULT_TAX_BEHAVIOR = 'exclusive';

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
async function calculateTax({
  currency,
  customerId,
  customerDetails,
  lineItems,
  useCache = true
}) {
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
      tax_code: item.taxCode || 'txcd_10103001', // Default to digital goods
      tax_behavior: item.taxBehavior || DEFAULT_TAX_BEHAVIOR,
    }));
    
    // Create tax calculation
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
  metadata = {}
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
async function recordTaxTransaction({
  calculationId,
  reference,
}) {
  try {
    // Validate inputs
    if (!calculationId) throw new Error('Tax calculation ID is required');
    if (!reference) throw new Error('Reference ID is required');
    
    // Create tax transaction
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
    
    // Store transaction in database
    await storeTransactionInDatabase(taxTransaction, reference);
    
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
  metadata = {}
}) {
  try {
    // Validate inputs
    if (!amount) throw new Error('Amount is required');
    if (!currency) throw new Error('Currency is required');
    if (!customerId) throw new Error('Customer ID is required');
    if (!taxDetails) throw new Error('Tax details are required');
    
    // Create payment intent with custom tax
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
            tax_code: 'txcd_92010001', // Shipping tax code
          },
          line_items: taxDetails.lineItems.map(item => ({
            amount: Math.round(item.amount * 100), // Convert to cents
            reference: item.id || `item_${Date.now()}`,
            tax_code: item.taxCode || 'txcd_10103001', // Default to digital goods
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

/**
 * Store tax transaction in database
 * 
 * @param {Object} taxTransaction - Tax transaction from Stripe
 * @param {string} reference - Reference ID (e.g., payment intent ID)
 * @returns {Promise<void>}
 */
async function storeTransactionInDatabase(taxTransaction, reference) {
  try {
    // Get transaction details from database
    const transaction = await db.query(
      'SELECT id FROM transactions WHERE stripe_payment_intent_id = $1',
      [reference]
    );
    
    if (transaction.rows.length === 0) {
      logger.warn('Transaction not found in database', { reference });
      return;
    }
    
    const transactionId = transaction.rows[0].id;
    
    // Update transaction with tax details
    await db.query(
      `UPDATE transactions 
       SET tax_transaction_id = $1, 
           tax_amount = $2, 
           tax_jurisdiction = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        taxTransaction.id,
        taxTransaction.tax_amount / 100, // Convert from cents
        JSON.stringify(taxTransaction.jurisdictions || {}),
        transactionId,
      ]
    );
    
    logger.debug('Tax transaction stored in database', {
      transactionId,
      taxTransactionId: taxTransaction.id,
    });
  } catch (error) {
    logger.error('Failed to store tax transaction in database', {
      error: error.message,
      taxTransactionId: taxTransaction.id,
      reference,
    });
    // Don't throw error to prevent blocking the main flow
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
async function getTaxRatesForLocation({
  countryCode,
  stateCode,
  postalCode,
  city,
}) {
  try {
    // Generate cache key
    const cacheKey = `tax_rates_${countryCode}_${stateCode || ''}_${postalCode || ''}_${city || ''}`;
    
    // Check cache
    const cachedRates = cache.get(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }
    
    // Create a test calculation to get tax rates
    const testCalculation = await stripe.tax.calculations.create({
      currency: 'usd',
      line_items: [
        {
          amount: 1000, // $10.00
          reference: 'test_item',
          tax_code: 'txcd_10103001', // Digital goods
          tax_behavior: 'exclusive',
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
 * Generate a tax report for a specific period
 * 
 * @param {Object} options - Report options
 * @param {Date} options.startDate - Start date for the report
 * @param {Date} options.endDate - End date for the report
 * @returns {Promise<Object>} Tax report data
 */
async function generateTaxReport({
  startDate,
  endDate,
}) {
  try {
    // Validate inputs
    if (!startDate) throw new Error('Start date is required');
    if (!endDate) throw new Error('End date is required');
    
    // Format dates for Stripe API
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Get transactions from database
    const transactions = await db.query(
      `SELECT * FROM transactions 
       WHERE created_at BETWEEN $1 AND $2
       AND tax_transaction_id IS NOT NULL`,
      [startDate, endDate]
    );
    
    // Get tax transactions from Stripe
    // Note: This is a simplified approach. For a large number of transactions,
    // you would need to paginate through the results.
    const taxTransactions = await stripe.tax.transactions.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });
    
    // Process transactions for reporting
    const reportData = processTaxTransactionsForReport(transactions.rows, taxTransactions.data);
    
    // Store report in database
    const reportId = await storeTaxReportInDatabase(reportData, formattedStartDate, formattedEndDate);
    
    return {
      report_id: reportId,
      ...reportData,
    };
  } catch (error) {
    logger.error('Failed to generate tax report', {
      error: error.message,
      startDate,
      endDate,
    });
    throw error;
  }
}

/**
 * Process tax transactions for reporting
 * 
 * @param {Array} dbTransactions - Transactions from database
 * @param {Array} stripeTaxTransactions - Tax transactions from Stripe
 * @returns {Object} Processed report data
 */
function processTaxTransactionsForReport(dbTransactions, stripeTaxTransactions) {
  // Create a map of tax transactions by ID for quick lookup
  const taxTransactionMap = stripeTaxTransactions.reduce((map, transaction) => {
    map[transaction.id] = transaction;
    return map;
  }, {});
  
  // Process transactions
  const jurisdictionTotals = {};
  const transactions = [];
  
  let totalTaxableAmount = 0;
  let totalTaxAmount = 0;
  
  dbTransactions.forEach(dbTransaction => {
    const stripeTaxTransaction = taxTransactionMap[dbTransaction.tax_transaction_id];
    
    if (!stripeTaxTransaction) {
      logger.warn('Tax transaction not found in Stripe', {
        taxTransactionId: dbTransaction.tax_transaction_id,
      });
      return;
    }
    
    // Add to totals
    totalTaxableAmount += dbTransaction.amount - dbTransaction.tax_amount;
    totalTaxAmount += dbTransaction.tax_amount;
    
    // Process jurisdiction breakdown
    if (stripeTaxTransaction.jurisdictions) {
      stripeTaxTransaction.jurisdictions.forEach(jurisdiction => {
        const key = `${jurisdiction.country}_${jurisdiction.state || ''}_${jurisdiction.type}`;
        
        if (!jurisdictionTotals[key]) {
          jurisdictionTotals[key] = {
            country: jurisdiction.country,
            state: jurisdiction.state,
            type: jurisdiction.type,
            name: jurisdiction.name,
            taxable_amount: 0,
            tax_amount: 0,
          };
        }
        
        // Find the tax amount for this jurisdiction
        const taxBreakdown = stripeTaxTransaction.tax_breakdown.find(
          breakdown => breakdown.jurisdiction_code === jurisdiction.code
        );
        
        if (taxBreakdown) {
          jurisdictionTotals[key].taxable_amount += taxBreakdown.taxable_amount / 100;
          jurisdictionTotals[key].tax_amount += taxBreakdown.tax_amount / 100;
        }
      });
    }
    
    // Add transaction to list
    transactions.push({
      id: dbTransaction.id,
      date: dbTransaction.created_at,
      customer_id: dbTransaction.customer_id,
      amount: dbTransaction.amount,
      tax_amount: dbTransaction.tax_amount,
      tax_transaction_id: dbTransaction.tax_transaction_id,
    });
  });
  
  return {
    total_taxable_amount: totalTaxableAmount,
    total_tax_amount: totalTaxAmount,
    transaction_count: transactions.length,
    jurisdictions: Object.values(jurisdictionTotals),
    transactions,
  };
}

/**
 * Store tax report in database
 * 
 * @param {Object} reportData - Report data
 * @param {string} startDate - Start date for the report
 * @param {string} endDate - End date for the report
 * @returns {Promise<string>} Report ID
 */
async function storeTaxReportInDatabase(reportData, startDate, endDate) {
  try {
    const result = await db.query(
      `INSERT INTO revenue_reports (
         report_type, 
         start_date, 
         end_date, 
         total_revenue, 
         total_tax, 
         status, 
         report_data
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        'tax',
        startDate,
        endDate,
        reportData.total_taxable_amount,
        reportData.total_tax_amount,
        'completed',
        JSON.stringify(reportData),
      ]
    );
    
    return result.rows[0].id;
  } catch (error) {
    logger.error('Failed to store tax report in database', {
      error: error.message,
      startDate,
      endDate,
    });
    throw error;
  }
}

module.exports = {
  calculateTax,
  createPaymentIntentWithTax,
  recordTaxTransaction,
  createPaymentIntentWithCustomTax,
  getTaxRatesForLocation,
  generateTaxReport,
};