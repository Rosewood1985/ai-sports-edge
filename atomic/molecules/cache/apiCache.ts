/**
 * API Cache Molecule
 *
 * This module provides a generic caching mechanism for API responses.
 * It builds on top of the existing cacheService to provide a consistent
 * caching solution for all API calls.
 */

import { cacheService } from '../../../services/cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API cache prefix
const API_CACHE_PREFIX = 'api:';

// Default cache TTL in milliseconds (5 minutes)
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Cache options interface
 */
export interface ApiCacheOptions {
  // Whether to use cache
  useCache?: boolean;

  // Cache TTL in milliseconds
  ttl?: number;

  // Cache key prefix
  prefix?: string;

  // Whether to use memory cache
  useMemory?: boolean;
}

/**
 * Default cache options
 */
const defaultCacheOptions: ApiCacheOptions = {
  useCache: true,
  ttl: DEFAULT_CACHE_TTL,
  prefix: API_CACHE_PREFIX,
  useMemory: true,
};

/**
 * Generate cache key for an API endpoint
 *
 * @param endpoint API endpoint
 * @param params Optional query parameters
 * @param prefix Cache key prefix
 * @returns Cache key
 */
export const generateCacheKey = (
  endpoint: string,
  params?: Record<string, any>,
  prefix: string = API_CACHE_PREFIX
): string => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Base key is prefix + endpoint
  let key = `${prefix}${cleanEndpoint}`;

  // Add params to key if present
  if (params && Object.keys(params).length > 0) {
    // Sort params by key to ensure consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    // Add params to key
    key += `:${JSON.stringify(sortedParams)}`;
  }

  return key;
};

/**
 * Get data from cache
 *
 * @param key Cache key
 * @param options Cache options
 * @returns Cached data or null if not found
 */
export const getFromCache = async <T>(
  key: string,
  options: ApiCacheOptions = defaultCacheOptions
): Promise<T | null> => {
  try {
    // Get from cache service
    const data = await cacheService.get<T>(key, async () => null as any);

    // Return data if found
    return data;
  } catch (error) {
    console.error(`Error getting ${key} from cache:`, error);
    return null;
  }
};

/**
 * Save data to cache
 *
 * @param key Cache key
 * @param data Data to cache
 * @param options Cache options
 */
export const saveToCache = async <T>(
  key: string,
  data: T,
  options: ApiCacheOptions = defaultCacheOptions
): Promise<void> => {
  try {
    // Save to cache service with expiration time
    const expirationTime = options.ttl || DEFAULT_CACHE_TTL;
    const entry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime,
    };

    await AsyncStorage.setItem(key, JSON.stringify(entry));

    // If using memory cache, also update the memory cache
    if (options.useMemory) {
      // Note: This assumes cacheService has an internal memory cache
      // that will be updated on the next get operation
    }
  } catch (error) {
    console.error(`Error saving ${key} to cache:`, error);
  }
};

/**
 * Invalidate cache for a specific key
 *
 * @param key Cache key
 */
export const invalidateCache = async (key: string): Promise<void> => {
  try {
    // Invalidate in cache service
    await cacheService.invalidate(key);
  } catch (error) {
    console.error(`Error invalidating ${key} in cache:`, error);
  }
};

/**
 * Invalidate all API cache
 *
 * @param prefix Cache key prefix
 */
export const invalidateAllCache = async (prefix: string = API_CACHE_PREFIX): Promise<void> => {
  try {
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();

    // Filter keys by prefix
    const cacheKeys = keys.filter((key: string) => key.startsWith(prefix));

    // Remove all matching keys
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error invalidating all cache:', error);
  }
};

/**
 * Cached API request function
 *
 * @param endpoint API endpoint
 * @param fetchFn Function to fetch data if not in cache
 * @param params Optional query parameters
 * @param options Cache options
 * @returns Data from cache or fetch function
 */
export const cachedRequest = async <T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
  params?: Record<string, any>,
  options: ApiCacheOptions = defaultCacheOptions
): Promise<T> => {
  // Merge options with defaults
  const mergedOptions = { ...defaultCacheOptions, ...options };

  // Generate cache key
  const key = generateCacheKey(endpoint, params, mergedOptions.prefix);

  // Check if cache should be used
  if (mergedOptions.useCache) {
    // Try to get from cache
    const cachedData = await getFromCache<T>(key, mergedOptions);

    // Return cached data if found
    if (cachedData) {
      return cachedData;
    }
  }

  // Fetch data if not in cache or cache disabled
  const data = await fetchFn();

  // Save to cache if cache is enabled
  if (mergedOptions.useCache) {
    await saveToCache(key, data, mergedOptions);
  }

  return data;
};

/**
 * API Cache module
 */
export const apiCache = {
  generateCacheKey,
  getFromCache,
  saveToCache,
  invalidateCache,
  invalidateAllCache,
  cachedRequest,
};

export default apiCache;
