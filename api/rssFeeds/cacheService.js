/**
 * RSS Feed Cache Service
 * Provides TTL-based caching for RSS feeds
 */

// Cache storage
const cache = new Map();
const metadataCache = new Map();

/**
 * Set an item in the cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds
 * @returns {boolean} Success status
 */
export function setCacheItem(key, value, ttlMs = 30 * 60 * 1000) { // Default 30 minutes
  try {
    // Store the value
    cache.set(key, value);
    
    // Store metadata
    metadataCache.set(key, {
      timestamp: Date.now(),
      ttl: ttlMs,
      expiresAt: Date.now() + ttlMs
    });
    
    // Set up expiration
    setTimeout(() => {
      if (cache.has(key)) {
        cache.delete(key);
        metadataCache.delete(key);
        console.log(`Cache item expired: ${key}`);
      }
    }, ttlMs);
    
    return true;
  } catch (error) {
    console.error('Error setting cache item:', error);
    return false;
  }
}

/**
 * Get an item from the cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined if not found or expired
 */
export function getCacheItem(key) {
  // Check if item exists and is not expired
  if (cache.has(key) && metadataCache.has(key)) {
    const metadata = metadataCache.get(key);
    const now = Date.now();
    
    // Check if expired
    if (now > metadata.expiresAt) {
      // Clean up expired item
      cache.delete(key);
      metadataCache.delete(key);
      return undefined;
    }
    
    // Update access timestamp
    metadata.lastAccessed = now;
    metadataCache.set(key, metadata);
    
    return cache.get(key);
  }
  
  return undefined;
}

/**
 * Check if an item exists in the cache and is not expired
 * @param {string} key - Cache key
 * @returns {boolean} Whether the item exists and is valid
 */
export function hasCacheItem(key) {
  if (cache.has(key) && metadataCache.has(key)) {
    const metadata = metadataCache.get(key);
    return Date.now() <= metadata.expiresAt;
  }
  
  return false;
}

/**
 * Remove an item from the cache
 * @param {string} key - Cache key
 * @returns {boolean} Success status
 */
export function removeCacheItem(key) {
  try {
    cache.delete(key);
    metadataCache.delete(key);
    return true;
  } catch (error) {
    console.error('Error removing cache item:', error);
    return false;
  }
}

/**
 * Clear all items from the cache
 * @returns {boolean} Success status
 */
export function clearCache() {
  try {
    cache.clear();
    metadataCache.clear();
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  const stats = {
    totalItems: cache.size,
    expiredItems: 0,
    averageTtl: 0,
    oldestItem: null,
    newestItem: null,
    keys: []
  };
  
  if (cache.size === 0) {
    return stats;
  }
  
  let totalTtl = 0;
  let oldestTimestamp = Infinity;
  let newestTimestamp = 0;
  
  // Calculate statistics
  for (const [key, metadata] of metadataCache.entries()) {
    // Count expired items
    if (now > metadata.expiresAt) {
      stats.expiredItems++;
    }
    
    // Track oldest and newest items
    if (metadata.timestamp < oldestTimestamp) {
      oldestTimestamp = metadata.timestamp;
      stats.oldestItem = key;
    }
    
    if (metadata.timestamp > newestTimestamp) {
      newestTimestamp = metadata.timestamp;
      stats.newestItem = key;
    }
    
    // Sum TTLs for average
    totalTtl += metadata.ttl;
    
    // Add to keys list
    stats.keys.push(key);
  }
  
  // Calculate average TTL
  stats.averageTtl = totalTtl / cache.size;
  
  return stats;
}

/**
 * Get metadata for a cached item
 * @param {string} key - Cache key
 * @returns {Object|undefined} Item metadata or undefined if not found
 */
export function getCacheItemMetadata(key) {
  if (metadataCache.has(key)) {
    const metadata = metadataCache.get(key);
    const now = Date.now();
    
    return {
      ...metadata,
      age: now - metadata.timestamp,
      remainingTtl: Math.max(0, metadata.expiresAt - now),
      isExpired: now > metadata.expiresAt
    };
  }
  
  return undefined;
}

/**
 * Update TTL for a cached item
 * @param {string} key - Cache key
 * @param {number} newTtlMs - New TTL in milliseconds
 * @returns {boolean} Success status
 */
export function updateCacheTtl(key, newTtlMs) {
  if (cache.has(key) && metadataCache.has(key)) {
    const metadata = metadataCache.get(key);
    const now = Date.now();
    
    // Update TTL and expiration
    metadata.ttl = newTtlMs;
    metadata.expiresAt = now + newTtlMs;
    
    metadataCache.set(key, metadata);
    return true;
  }
  
  return false;
}