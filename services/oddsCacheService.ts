/**
 * Odds Cache Service
 * Provides caching functionality for odds data to reduce API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Cache keys
const CACHE_KEYS = {
  ODDS_DATA: 'odds_cache_data',
  LAST_UPDATED: 'odds_cache_last_updated',
  CACHE_TTL: 'odds_cache_ttl',
};

// Default TTL (Time To Live) in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const EXTENDED_TTL = 30 * 60 * 1000; // 30 minutes (used when offline)
const MAX_TTL = 24 * 60 * 60 * 1000; // 24 hours (maximum cache age)

// Cache item interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'api' | 'cache' | 'stale';
}

class OddsCacheService {
  /**
   * Get cached data if available and not expired
   * @param key Cache key
   * @returns Cached data or null if not available or expired
   */
  async getCachedData<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      // Get cached data
      const cachedDataString = await AsyncStorage.getItem(`${CACHE_KEYS.ODDS_DATA}_${key}`);
      if (!cachedDataString) return null;

      const cachedData: CacheItem<T> = JSON.parse(cachedDataString);
      const now = Date.now();

      // Check if cache is expired
      if (now - cachedData.timestamp > cachedData.ttl) {
        // Check network status
        const netInfo = await NetInfo.fetch();

        // If offline, extend TTL and mark as stale
        if (!netInfo.isConnected) {
          // If cache is too old, don't use it
          if (now - cachedData.timestamp > MAX_TTL) {
            return null;
          }

          // Extend TTL and mark as stale
          cachedData.ttl = EXTENDED_TTL;
          cachedData.source = 'stale';
          await this.setCachedData(key, cachedData.data, EXTENDED_TTL, 'stale');
          return cachedData;
        }

        // If online but cache expired, return null
        return null;
      }

      return cachedData;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Set cached data
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional)
   * @param source Source of the data (api, cache, stale)
   */
  async setCachedData<T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_TTL,
    source: 'api' | 'cache' | 'stale' = 'api'
  ): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        source,
      };

      await AsyncStorage.setItem(`${CACHE_KEYS.ODDS_DATA}_${key}`, JSON.stringify(cacheItem));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, Date.now().toString());
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ODDS_DATA));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getCacheStats(): Promise<{
    lastUpdated: number | null;
    cacheSize: number;
    cacheItems: number;
  }> {
    try {
      // Get last updated timestamp
      const lastUpdatedString = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED);
      const lastUpdated = lastUpdatedString ? parseInt(lastUpdatedString) : null;

      // Get all cache keys
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ODDS_DATA));

      // Get cache size
      let cacheSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          cacheSize += value.length;
        }
      }

      return {
        lastUpdated,
        cacheSize,
        cacheItems: cacheKeys.length,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        lastUpdated: null,
        cacheSize: 0,
        cacheItems: 0,
      };
    }
  }

  /**
   * Set cache TTL (Time To Live)
   * @param ttl Time to live in milliseconds
   */
  async setCacheTTL(ttl: number): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_TTL, ttl.toString());
    } catch (error) {
      console.error('Error setting cache TTL:', error);
    }
  }

  /**
   * Get cache TTL (Time To Live)
   * @returns Cache TTL in milliseconds
   */
  async getCacheTTL(): Promise<number> {
    try {
      const ttlString = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TTL);
      return ttlString ? parseInt(ttlString) : DEFAULT_TTL;
    } catch (error) {
      console.error('Error getting cache TTL:', error);
      return DEFAULT_TTL;
    }
  }

  /**
   * Prefetch odds data
   * @param fetchFunction Function to fetch odds data
   * @param key Cache key
   */
  async prefetchOddsData<T>(fetchFunction: () => Promise<T>, key: string): Promise<void> {
    try {
      // Check if we already have cached data
      const cachedData = await this.getCachedData<T>(key);

      // If cache is fresh, don't prefetch
      if (cachedData && cachedData.source === 'api') {
        return;
      }

      // Fetch new data
      const data = await fetchFunction();

      // Cache the data
      await this.setCachedData(key, data);
    } catch (error) {
      console.error('Error prefetching odds data:', error);
    }
  }
}

export const oddsCacheService = new OddsCacheService();
