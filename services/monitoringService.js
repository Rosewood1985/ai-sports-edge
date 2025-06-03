/**
 * Monitoring Service
 *
 * This service provides monitoring for tax calculations and API usage.
 */

const fs = require('fs');
const path = require('path');

const logger = require('../utils/logger').default;

// Configuration
const config = {
  // Directory for storing monitoring logs
  logsDir: path.join(process.cwd(), 'logs'),

  // Maximum number of events to keep in memory
  maxEvents: 1000,

  // Whether to write logs to disk
  writeLogsToDisk: true,

  // Alert thresholds
  alertThresholds: {
    errorRate: 0.05, // 5% error rate
    responseTime: 1000, // 1 second
    cacheHitRate: 0.7, // 70% cache hit rate
  },
};

// Ensure logs directory exists
if (config.writeLogsToDisk && !fs.existsSync(config.logsDir)) {
  fs.mkdirSync(config.logsDir, { recursive: true });
}

// In-memory storage for monitoring data
const monitoringData = {
  // Tax calculation events
  taxCalculations: [],

  // Tax rate lookup events
  taxRateLookups: [],

  // API usage events
  apiUsage: [],

  // Error events
  errors: [],

  // Cache statistics
  cacheStats: {
    hits: 0,
    misses: 0,
    hitRate: 0,
  },

  // Performance metrics
  performance: {
    averageResponseTime: 0,
    totalRequests: 0,
    totalResponseTime: 0,
  },
};

/**
 * Record a tax calculation event
 *
 * @param {Object} event - Tax calculation event
 * @param {string} event.userId - User ID
 * @param {string} event.customerId - Customer ID
 * @param {string} event.currency - Currency code
 * @param {number} event.amount - Transaction amount
 * @param {number} event.taxAmount - Tax amount
 * @param {number} event.responseTime - Response time in milliseconds
 * @param {boolean} event.success - Whether the calculation was successful
 * @param {string} [event.error] - Error message if calculation failed
 * @returns {void}
 */
function recordTaxCalculation(event) {
  // Add timestamp
  const eventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Add to in-memory storage
  monitoringData.taxCalculations.unshift(eventWithTimestamp);

  // Trim to max events
  if (monitoringData.taxCalculations.length > config.maxEvents) {
    monitoringData.taxCalculations.pop();
  }

  // Update performance metrics
  if (event.responseTime) {
    monitoringData.performance.totalRequests++;
    monitoringData.performance.totalResponseTime += event.responseTime;
    monitoringData.performance.averageResponseTime =
      monitoringData.performance.totalResponseTime / monitoringData.performance.totalRequests;
  }

  // Record error if calculation failed
  if (!event.success && event.error) {
    recordError({
      type: 'tax_calculation',
      message: event.error,
      userId: event.userId,
      customerId: event.customerId,
      details: event,
    });
  }

  // Write to log file
  if (config.writeLogsToDisk) {
    const logFile = path.join(config.logsDir, 'tax_calculations.log');
    fs.appendFile(logFile, JSON.stringify(eventWithTimestamp) + '\n', err => {
      if (err) {
        logger.error('Failed to write tax calculation log', { error: err.message });
      }
    });
  }

  // Check for alerts
  checkAlerts();
}

/**
 * Record a tax rate lookup event
 *
 * @param {Object} event - Tax rate lookup event
 * @param {string} event.userId - User ID
 * @param {string} event.countryCode - Country code
 * @param {string} [event.stateCode] - State code
 * @param {string} [event.postalCode] - Postal code
 * @param {string} [event.city] - City name
 * @param {boolean} event.cacheHit - Whether the lookup was a cache hit
 * @param {number} event.responseTime - Response time in milliseconds
 * @param {boolean} event.success - Whether the lookup was successful
 * @param {string} [event.error] - Error message if lookup failed
 * @returns {void}
 */
function recordTaxRateLookup(event) {
  // Add timestamp
  const eventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Add to in-memory storage
  monitoringData.taxRateLookups.unshift(eventWithTimestamp);

  // Trim to max events
  if (monitoringData.taxRateLookups.length > config.maxEvents) {
    monitoringData.taxRateLookups.pop();
  }

  // Update cache statistics
  if (event.cacheHit) {
    monitoringData.cacheStats.hits++;
  } else {
    monitoringData.cacheStats.misses++;
  }

  monitoringData.cacheStats.hitRate =
    monitoringData.cacheStats.hits /
    (monitoringData.cacheStats.hits + monitoringData.cacheStats.misses);

  // Update performance metrics
  if (event.responseTime) {
    monitoringData.performance.totalRequests++;
    monitoringData.performance.totalResponseTime += event.responseTime;
    monitoringData.performance.averageResponseTime =
      monitoringData.performance.totalResponseTime / monitoringData.performance.totalRequests;
  }

  // Record error if lookup failed
  if (!event.success && event.error) {
    recordError({
      type: 'tax_rate_lookup',
      message: event.error,
      userId: event.userId,
      countryCode: event.countryCode,
      stateCode: event.stateCode,
      details: event,
    });
  }

  // Write to log file
  if (config.writeLogsToDisk) {
    const logFile = path.join(config.logsDir, 'tax_rate_lookups.log');
    fs.appendFile(logFile, JSON.stringify(eventWithTimestamp) + '\n', err => {
      if (err) {
        logger.error('Failed to write tax rate lookup log', { error: err.message });
      }
    });
  }

  // Check for alerts
  checkAlerts();
}

/**
 * Record an API usage event
 *
 * @param {Object} event - API usage event
 * @param {string} event.endpoint - API endpoint
 * @param {string} event.method - HTTP method
 * @param {string} event.userId - User ID
 * @param {string} [event.apiClientId] - API client ID
 * @param {number} event.responseTime - Response time in milliseconds
 * @param {number} event.statusCode - HTTP status code
 * @returns {void}
 */
function recordApiUsage(event) {
  // Add timestamp
  const eventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Add to in-memory storage
  monitoringData.apiUsage.unshift(eventWithTimestamp);

  // Trim to max events
  if (monitoringData.apiUsage.length > config.maxEvents) {
    monitoringData.apiUsage.pop();
  }

  // Update performance metrics
  if (event.responseTime) {
    monitoringData.performance.totalRequests++;
    monitoringData.performance.totalResponseTime += event.responseTime;
    monitoringData.performance.averageResponseTime =
      monitoringData.performance.totalResponseTime / monitoringData.performance.totalRequests;
  }

  // Write to log file
  if (config.writeLogsToDisk) {
    const logFile = path.join(config.logsDir, 'api_usage.log');
    fs.appendFile(logFile, JSON.stringify(eventWithTimestamp) + '\n', err => {
      if (err) {
        logger.error('Failed to write API usage log', { error: err.message });
      }
    });
  }
}

/**
 * Record an error event
 *
 * @param {Object} event - Error event
 * @param {string} event.type - Error type
 * @param {string} event.message - Error message
 * @param {Object} [event.details] - Error details
 * @returns {void}
 */
function recordError(event) {
  // Add timestamp
  const eventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Add to in-memory storage
  monitoringData.errors.unshift(eventWithTimestamp);

  // Trim to max events
  if (monitoringData.errors.length > config.maxEvents) {
    monitoringData.errors.pop();
  }

  // Write to log file
  if (config.writeLogsToDisk) {
    const logFile = path.join(config.logsDir, 'errors.log');
    fs.appendFile(logFile, JSON.stringify(eventWithTimestamp) + '\n', err => {
      if (err) {
        logger.error('Failed to write error log', { error: err.message });
      }
    });
  }

  // Log error
  logger.error(event.message, event.details || {});
}

/**
 * Check for alerts based on monitoring data
 *
 * @returns {void}
 */
function checkAlerts() {
  // Calculate error rate
  const totalRequests = monitoringData.performance.totalRequests;
  const errorRate = monitoringData.errors.length / totalRequests;

  // Check error rate threshold
  if (totalRequests > 10 && errorRate > config.alertThresholds.errorRate) {
    logger.warn('High error rate detected', {
      errorRate,
      threshold: config.alertThresholds.errorRate,
      totalErrors: monitoringData.errors.length,
      totalRequests,
    });
  }

  // Check response time threshold
  if (
    totalRequests > 10 &&
    monitoringData.performance.averageResponseTime > config.alertThresholds.responseTime
  ) {
    logger.warn('High average response time detected', {
      averageResponseTime: monitoringData.performance.averageResponseTime,
      threshold: config.alertThresholds.responseTime,
      totalRequests,
    });
  }

  // Check cache hit rate threshold
  const totalCacheLookups = monitoringData.cacheStats.hits + monitoringData.cacheStats.misses;
  if (
    totalCacheLookups > 10 &&
    monitoringData.cacheStats.hitRate < config.alertThresholds.cacheHitRate
  ) {
    logger.warn('Low cache hit rate detected', {
      hitRate: monitoringData.cacheStats.hitRate,
      threshold: config.alertThresholds.cacheHitRate,
      hits: monitoringData.cacheStats.hits,
      misses: monitoringData.cacheStats.misses,
    });
  }
}

/**
 * Get monitoring data
 *
 * @returns {Object} Monitoring data
 */
function getMonitoringData() {
  return {
    taxCalculations: monitoringData.taxCalculations,
    taxRateLookups: monitoringData.taxRateLookups,
    apiUsage: monitoringData.apiUsage,
    errors: monitoringData.errors,
    cacheStats: monitoringData.cacheStats,
    performance: monitoringData.performance,
  };
}

/**
 * Get monitoring summary
 *
 * @returns {Object} Monitoring summary
 */
function getMonitoringSummary() {
  return {
    totalRequests: monitoringData.performance.totalRequests,
    averageResponseTime: monitoringData.performance.averageResponseTime,
    errorCount: monitoringData.errors.length,
    errorRate: monitoringData.errors.length / monitoringData.performance.totalRequests,
    cacheHitRate: monitoringData.cacheStats.hitRate,
    recentErrors: monitoringData.errors.slice(0, 5),
  };
}

module.exports = {
  recordTaxCalculation,
  recordTaxRateLookup,
  recordApiUsage,
  recordError,
  getMonitoringData,
  getMonitoringSummary,
};
