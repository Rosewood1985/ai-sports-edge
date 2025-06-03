// Tax API endpoints
const stripeTaxService = require('../services/stripeTaxService');
const taxRateCache = require('../utils/taxRateCache');
const logger = require('../utils/logger').default;
const monitoringService = require('../services/monitoringService');

// Calculate tax for a transaction
async function calculateTax(req, res) {
  const startTime = Date.now();

  // Log the request for monitoring
  logger.info('Tax calculation request', {
    userId: req.user?.id,
    apiClient: req.apiClient?.id,
    currency: req.body.currency,
    customerId: req.body.customerId,
    lineItemCount: req.body.lineItems?.length,
  });

  try {
    const { currency, customerId, customerDetails, lineItems } = req.body;

    // Validate inputs
    if (!currency || !customerId || !customerDetails || !lineItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate tax
    const tax = await stripeTaxService.calculateTax({
      currency,
      customerId,
      customerDetails,
      lineItems,
    });

    // Calculate total amount
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = tax.tax_amount_exclusive ? tax.tax_amount_exclusive / 100 : 0; // Convert from cents

    // Record monitoring data
    monitoringService.recordTaxCalculation({
      userId: req.user?.id,
      customerId,
      currency,
      amount: subtotal,
      taxAmount,
      responseTime: Date.now() - startTime,
      success: true,
    });

    // Record API usage
    monitoringService.recordApiUsage({
      endpoint: '/api/tax/calculate',
      method: 'POST',
      userId: req.user?.id,
      apiClientId: req.apiClient?.id,
      responseTime: Date.now() - startTime,
      statusCode: 200,
    });

    res.json({ success: true, data: tax });
  } catch (error) {
    // Record error in monitoring
    monitoringService.recordTaxCalculation({
      userId: req.user?.id,
      customerId: req.body?.customerId,
      currency: req.body?.currency,
      amount: req.body?.lineItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
      taxAmount: 0,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message,
    });

    // Record API usage
    monitoringService.recordApiUsage({
      endpoint: '/api/tax/calculate',
      method: 'POST',
      userId: req.user?.id,
      apiClientId: req.apiClient?.id,
      responseTime: Date.now() - startTime,
      statusCode: 500,
    });

    res.status(500).json({ error: error.message });
  }
}

// Get tax rates for a location
async function getTaxRates(req, res) {
  const startTime = Date.now();

  try {
    const { countryCode, stateCode, postalCode, city } = req.query;

    // Log the request for monitoring
    logger.info('Tax rates request', {
      userId: req.user?.id,
      apiClient: req.apiClient?.id,
      countryCode,
      stateCode,
      postalCode,
      city,
    });

    if (!countryCode) {
      return res.status(400).json({ error: 'Country code is required' });
    }

    const location = { countryCode, stateCode, postalCode, city };

    // Try to get rates from cache first
    const cachedRates = taxRateCache.getTaxRates(location);

    if (cachedRates) {
      logger.debug('Tax rates cache hit', { countryCode, stateCode });

      // Record tax rate lookup with cache hit
      monitoringService.recordTaxRateLookup({
        userId: req.user?.id,
        countryCode,
        stateCode,
        postalCode,
        city,
        cacheHit: true,
        responseTime: Date.now() - startTime,
        success: true,
      });

      // Record API usage
      monitoringService.recordApiUsage({
        endpoint: '/api/tax/rates',
        method: 'GET',
        userId: req.user?.id,
        apiClientId: req.apiClient?.id,
        responseTime: Date.now() - startTime,
        statusCode: 200,
      });

      return res.json({ success: true, data: cachedRates, source: 'cache' });
    }

    // If not in cache, get from Stripe Tax service
    logger.debug('Tax rates cache miss', { countryCode, stateCode });
    const rates = await stripeTaxService.getTaxRatesForLocation(location);

    // Store in cache for future requests
    taxRateCache.setTaxRates(location, rates);

    // Record tax rate lookup with cache miss
    monitoringService.recordTaxRateLookup({
      userId: req.user?.id,
      countryCode,
      stateCode,
      postalCode,
      city,
      cacheHit: false,
      responseTime: Date.now() - startTime,
      success: true,
    });

    // Record API usage
    monitoringService.recordApiUsage({
      endpoint: '/api/tax/rates',
      method: 'GET',
      userId: req.user?.id,
      apiClientId: req.apiClient?.id,
      responseTime: Date.now() - startTime,
      statusCode: 200,
    });

    res.json({ success: true, data: rates, source: 'api' });
  } catch (error) {
    logger.error('Failed to get tax rates', {
      error: error.message,
      countryCode: req.query.countryCode,
      stateCode: req.query.stateCode,
    });

    // Record tax rate lookup error
    monitoringService.recordTaxRateLookup({
      userId: req.user?.id,
      countryCode: req.query.countryCode,
      stateCode: req.query.stateCode,
      postalCode: req.query.postalCode,
      city: req.query.city,
      cacheHit: false,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message,
    });

    // Record API usage
    monitoringService.recordApiUsage({
      endpoint: '/api/tax/rates',
      method: 'GET',
      userId: req.user?.id,
      apiClientId: req.apiClient?.id,
      responseTime: Date.now() - startTime,
      statusCode: 500,
    });

    res.status(500).json({ error: error.message });
  }
}

module.exports = { calculateTax, getTaxRates };
