/**
 * Tax Rate Cache Utility
 * 
 * This utility provides caching for tax rates to improve performance.
 */

const NodeCache = require('node-cache');

// Create cache instance with default TTL of 1 day (in seconds)
const cache = new NodeCache({
  stdTTL: 86400, // 24 hours
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Don't clone objects (for performance)
});

/**
 * Generate cache key for tax rates
 * 
 * @param {Object} location - Location object
 * @param {string} location.countryCode - Country code
 * @param {string} [location.stateCode] - State code
 * @param {string} [location.postalCode] - Postal code
 * @param {string} [location.city] - City name
 * @returns {string} Cache key
 */
function generateCacheKey(location) {
  const { countryCode, stateCode, postalCode, city } = location;
  return `tax_rates:${countryCode}:${stateCode || ''}:${postalCode || ''}:${city || ''}`;
}

/**
 * Get tax rates from cache
 * 
 * @param {Object} location - Location object
 * @returns {Object|null} Tax rates or null if not in cache
 */
function getTaxRates(location) {
  const key = generateCacheKey(location);
  return cache.get(key);
}

/**
 * Set tax rates in cache
 * 
 * @param {Object} location - Location object
 * @param {Object} taxRates - Tax rates object
 * @param {number} [ttl] - Time to live in seconds (optional)
 * @returns {boolean} True if successful
 */
function setTaxRates(location, taxRates, ttl) {
  const key = generateCacheKey(location);
  return cache.set(key, taxRates, ttl);
}

/**
 * Delete tax rates from cache
 * 
 * @param {Object} location - Location object
 * @returns {number} Number of deleted entries (0 or 1)
 */
function deleteTaxRates(location) {
  const key = generateCacheKey(location);
  return cache.del(key);
}

/**
 * Clear all tax rates from cache
 * 
 * @returns {void}
 */
function clearAllTaxRates() {
  cache.flushAll();
}

/**
 * Get cache statistics
 * 
 * @returns {Object} Cache statistics
 */
function getStats() {
  return cache.getStats();
}

/**
 * Get all cached tax rates
 * 
 * @returns {Object} Object with keys and values
 */
function getAllTaxRates() {
  return cache.keys().reduce((result, key) => {
    if (key.startsWith('tax_rates:')) {
      result[key] = cache.get(key);
    }
    return result;
  }, {});
}

module.exports = {
  getTaxRates,
  setTaxRates,
  deleteTaxRates,
  clearAllTaxRates,
  getStats,
  getAllTaxRates
};