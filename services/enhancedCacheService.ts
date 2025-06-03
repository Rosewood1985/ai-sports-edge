import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { safeErrorCapture } from './errorUtils';
import { info, error as logError, LogCategory } from './loggingService';

/**
 * Cache entry with expiration and versioning
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

/**
 * Cache configuration options
 */
interface CacheConfig {
  // Default expiration time in milliseconds
  defaultExpiration: number;

  // Custom expiration times for specific cache keys
  customExpirations: Record<string, number>;

  // Maximum number of entries to keep in memory cache
  maxEntries: number;

  // Current app version for cache invalidation
  appVersion: string;

  // Debug mode
  debug: boolean;
}

/**
 * Cache strategy options
 */
export enum CacheStrategy {
  // Cache first, then network
  CACHE_FIRST = 'cache-first',

  // Network first, then cache
  NETWORK_FIRST = 'network-first',

  // Cache only
  CACHE_ONLY = 'cache-only',

  // Network only
  NETWORK_ONLY = 'network-only',

  // Cache then network (returns cache immediately, then updates with network)
  CACHE_THEN_NETWORK = 'cache-then-network',
}

/**
 * Cache result
 */
export interface CacheResult<T> {
  data: T | null;
  source: 'cache' | 'network' | 'none';
  timestamp: number | null;
  fromMemory: boolean;
}

/**
 * Enhanced Cache Service for optimizing data access
 */
class EnhancedCacheService {
  // In-memory cache
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  // Cache configuration
  private config: CacheConfig = {
    defaultExpiration: 1000 * 60 * 60, // 1 hour
    customExpirations: {
      user: 1000 * 60 * 30, // 30 minutes
      teams: 1000 * 60 * 60 * 24, // 24 hours
      odds: 1000 * 60 * 5, // 5 minutes
      preferences: 1000 * 60 * 60 * 24, // 24 hours
    },
    maxEntries: 100,
    appVersion: '1.0.0',
    debug: false,
  };

  // Cache key prefixes
  private readonly STORAGE_PREFIX = 'enhanced_cache:';

  /**
   * Initialize the cache service
   * @param config Optional configuration overrides
   */
  constructor(config?: Partial<CacheConfig>) {
    // Override default config with provided values
    if (config) {
      this.config = {
        ...this.config,
        ...config,
        customExpirations: {
          ...this.config.customExpirations,
          ...(config.customExpirations || {}),
        },
      };
    }

    this.log('EnhancedCacheService initialized with config:', this.config);

    // Preload frequently accessed cache items
    this.preloadCache();
  }

  /**
   * Set app version for cache invalidation
   * @param version App version
   */
  setAppVersion(version: string): void {
    this.config.appVersion = version;
    this.log(`App version set to ${version}`);
  }

  /**
   * Enable or disable debug mode
   * @param enabled Whether debug mode is enabled
   */
  setDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[EnhancedCache] ${message}`, ...args);
    }
  }

  /**
   * Preload frequently accessed cache items into memory
   */
  private async preloadCache(): Promise<void> {
    try {
      const keysToPreload = ['user', 'preferences'];

      this.log('Preloading cache items:', keysToPreload);

      for (const key of keysToPreload) {
        const data = await this.getFromStorage(key);
        if (data) {
          this.memoryCache.set(key, data);
          this.log(`Preloaded ${key} into memory cache`);
        }
      }

      this.log('Cache preloading completed');
      info(LogCategory.STORAGE, 'Cache preloaded successfully');
    } catch (error) {
      console.error('Error preloading cache:', error);
      logError(LogCategory.STORAGE, 'Error preloading cache', error as Error);
      safeErrorCapture(error as Error);
    }
  }

  /**
   * Get expiration time for a cache key
   * @param key Cache key
   * @returns Expiration time in milliseconds
   */
  private getExpiration(key: string): number {
    const baseKey = key.split(':')[0];
    return this.config.customExpirations[baseKey] || this.config.defaultExpiration;
  }

  /**
   * Check if a cache entry is expired
   * @param entry Cache entry
   * @returns True if expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Check if a cache entry is outdated (different version)
   * @param entry Cache entry
   * @returns True if outdated
   */
  private isOutdated(entry: CacheEntry<any>): boolean {
    return entry.version !== this.config.appVersion;
  }

  /**
   * Get data from AsyncStorage
   * @param key Cache key
   * @returns Cache entry or null if not found
   */
  private async getFromStorage<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_PREFIX + key);

      if (data) {
        const entry = JSON.parse(data) as CacheEntry<T>;

        // Check if expired
        if (this.isExpired(entry)) {
          this.log(`Cache entry for ${key} is expired`);
          await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
          return null;
        }

        // Check if outdated (different app version)
        if (this.isOutdated(entry)) {
          this.log(
            `Cache entry for ${key} is outdated (version ${entry.version} vs ${this.config.appVersion})`
          );
          await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
          return null;
        }

        this.log(`Retrieved ${key} from storage cache`);
        return entry;
      }

      this.log(`No cache entry found for ${key} in storage`);
      return null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      logError(LogCategory.STORAGE, `Error getting ${key} from storage`, error as Error);
      safeErrorCapture(error as Error);
      return null;
    }
  }

  /**
   * Save data to AsyncStorage
   * @param key Cache key
   * @param data Data to cache
   * @param expiration Optional custom expiration time in milliseconds
   */
  private async saveToStorage<T>(key: string, data: T, expiration?: number): Promise<void> {
    try {
      const expirationTime = expiration || this.getExpiration(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + expirationTime,
        version: this.config.appVersion,
      };

      await AsyncStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
      this.log(`Saved ${key} to storage cache (expires in ${expirationTime / 1000}s)`);
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      logError(LogCategory.STORAGE, `Error saving ${key} to storage`, error as Error);
      safeErrorCapture(error as Error);
    }
  }

  /**
   * Get data from cache with advanced options
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param options Cache options
   * @returns Cache result with data and metadata
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: {
      expiration?: number;
      strategy?: CacheStrategy;
      forceRefresh?: boolean;
      callback?: (result: CacheResult<T>) => void;
    }
  ): Promise<CacheResult<T>> {
    const strategy = options?.strategy || CacheStrategy.CACHE_FIRST;
    const forceRefresh = options?.forceRefresh || false;

    this.log(`Getting ${key} with strategy ${strategy}${forceRefresh ? ' (force refresh)' : ''}`);

    // Handle different cache strategies
    switch (strategy) {
      case CacheStrategy.CACHE_ONLY:
        return this.getCacheOnly<T>(key);

      case CacheStrategy.NETWORK_ONLY:
        return this.getNetworkOnly<T>(key, fetchFn, options?.expiration);

      case CacheStrategy.NETWORK_FIRST:
        return this.getNetworkFirst<T>(key, fetchFn, options?.expiration);

      case CacheStrategy.CACHE_THEN_NETWORK:
        // Get from cache immediately
        const cacheResult = await this.getCacheOnly<T>(key);

        // If we have a callback, use it to return cache result immediately
        if (options?.callback && cacheResult.data) {
          options.callback(cacheResult);
        }

        // Then fetch from network and update cache
        if (!cacheResult.data || forceRefresh) {
          const networkResult = await this.getNetworkOnly<T>(key, fetchFn, options?.expiration);

          // Call callback again with network result
          if (options?.callback) {
            options.callback(networkResult);
          }

          return networkResult;
        }

        return cacheResult;

      case CacheStrategy.CACHE_FIRST:
      default:
        return this.getCacheFirst<T>(key, fetchFn, options?.expiration, forceRefresh);
    }
  }

  /**
   * Get data from cache only (no network)
   * @param key Cache key
   * @returns Cache result
   */
  private async getCacheOnly<T>(key: string): Promise<CacheResult<T>> {
    this.log(`Getting ${key} from cache only`);

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;

      // If not expired and not outdated, return cached data
      if (!this.isExpired(entry) && !this.isOutdated(entry)) {
        this.log(`Retrieved ${key} from memory cache`);
        return {
          data: entry.data,
          source: 'cache',
          timestamp: entry.timestamp,
          fromMemory: true,
        };
      }

      // If expired or outdated, remove from memory cache
      this.log(`Memory cache entry for ${key} is expired or outdated`);
      this.memoryCache.delete(key);
    }

    // Check storage cache
    const storageEntry = await this.getFromStorage<T>(key);
    if (storageEntry) {
      // Add to memory cache
      this.memoryCache.set(key, storageEntry);

      // Enforce max entries limit
      if (this.memoryCache.size > this.config.maxEntries) {
        // Remove oldest entry
        const oldestKey = this.memoryCache.keys().next().value;
        if (oldestKey) {
          this.memoryCache.delete(oldestKey);
          this.log(`Removed oldest entry ${oldestKey} from memory cache`);
        }
      }

      return {
        data: storageEntry.data,
        source: 'cache',
        timestamp: storageEntry.timestamp,
        fromMemory: false,
      };
    }

    // Not found in cache
    return {
      data: null,
      source: 'none',
      timestamp: null,
      fromMemory: false,
    };
  }

  /**
   * Get data from network only (no cache check)
   * @param key Cache key
   * @param fetchFn Function to fetch data
   * @param expiration Optional custom expiration time
   * @returns Cache result
   */
  private async getNetworkOnly<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiration?: number
  ): Promise<CacheResult<T>> {
    this.log(`Getting ${key} from network only`);

    try {
      // Fetch data
      const data = await fetchFn();

      // Save to both caches
      const expirationTime = expiration || this.getExpiration(key);
      const timestamp = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp,
        expiresAt: timestamp + expirationTime,
        version: this.config.appVersion,
      };

      this.memoryCache.set(key, entry);
      await this.saveToStorage(key, data, expirationTime);

      return {
        data,
        source: 'network',
        timestamp,
        fromMemory: false,
      };
    } catch (error) {
      console.error(`Error fetching ${key} from network:`, error);
      logError(LogCategory.STORAGE, `Error fetching ${key} from network`, error as Error);
      safeErrorCapture(error as Error);

      return {
        data: null,
        source: 'none',
        timestamp: null,
        fromMemory: false,
      };
    }
  }

  /**
   * Get data from cache first, then network if not found
   * @param key Cache key
   * @param fetchFn Function to fetch data
   * @param expiration Optional custom expiration time
   * @param forceRefresh Whether to force a refresh from network
   * @returns Cache result
   */
  private async getCacheFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiration?: number,
    forceRefresh: boolean = false
  ): Promise<CacheResult<T>> {
    this.log(`Getting ${key} with cache-first strategy${forceRefresh ? ' (force refresh)' : ''}`);

    // If force refresh, skip cache
    if (forceRefresh) {
      return this.getNetworkOnly<T>(key, fetchFn, expiration);
    }

    // Check cache first
    const cacheResult = await this.getCacheOnly<T>(key);
    if (cacheResult.data !== null) {
      return cacheResult;
    }

    // If not in cache, fetch from network
    return this.getNetworkOnly<T>(key, fetchFn, expiration);
  }

  /**
   * Get data from network first, then cache if network fails
   * @param key Cache key
   * @param fetchFn Function to fetch data
   * @param expiration Optional custom expiration time
   * @returns Cache result
   */
  private async getNetworkFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiration?: number
  ): Promise<CacheResult<T>> {
    this.log(`Getting ${key} with network-first strategy`);

    try {
      // Try network first
      return await this.getNetworkOnly<T>(key, fetchFn, expiration);
    } catch (error) {
      // If network fails, try cache
      this.log(`Network request for ${key} failed, falling back to cache`);
      return await this.getCacheOnly<T>(key);
    }
  }

  /**
   * Invalidate a cache entry
   * @param key Cache key
   */
  async invalidate(key: string): Promise<void> {
    this.log(`Invalidating cache for ${key}`);

    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from storage
    await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    this.log('Clearing all cache entries');

    // Clear memory cache
    this.memoryCache.clear();

    // Clear storage cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        this.log(`Removed ${cacheKeys.length} items from storage cache`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      logError(LogCategory.STORAGE, 'Error clearing cache', error as Error);
      safeErrorCapture(error as Error);
    }
  }

  /**
   * Set a custom expiration time for a specific cache key type
   * @param keyType Key type (e.g., 'user', 'teams')
   * @param expiration Expiration time in milliseconds
   */
  setCustomExpiration(keyType: string, expiration: number): void {
    this.config.customExpirations[keyType] = expiration;
    this.log(`Set custom expiration for ${keyType} to ${expiration}ms`);
  }

  /**
   * Manually cache data
   * @param key Cache key
   * @param data Data to cache
   * @param expiration Optional custom expiration time
   */
  async set<T>(key: string, data: T, expiration?: number): Promise<void> {
    this.log(`Manually caching data for ${key}`);

    // Save to both caches
    const expirationTime = expiration || this.getExpiration(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime,
      version: this.config.appVersion,
    };

    this.memoryCache.set(key, entry);
    await this.saveToStorage(key, data, expirationTime);
  }

  /**
   * Check if a key exists in cache and is valid
   * @param key Cache key
   * @returns Whether the key exists in cache
   */
  async has(key: string): Promise<boolean> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;

      // If not expired and not outdated, it exists
      if (!this.isExpired(entry) && !this.isOutdated(entry)) {
        return true;
      }

      // If expired or outdated, remove from memory cache
      this.memoryCache.delete(key);
    }

    // Check storage cache
    const storageEntry = await this.getFromStorage(key);
    return storageEntry !== null;
  }

  /**
   * Get multiple cache entries at once
   * @param keys Array of cache keys
   * @returns Object with keys mapped to cache results
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, CacheResult<T>>> {
    this.log(`Getting multiple keys: ${keys.join(', ')}`);

    const results: Record<string, CacheResult<T>> = {};

    // Process each key in parallel
    await Promise.all(
      keys.map(async key => {
        results[key] = await this.getCacheOnly<T>(key);
      })
    );

    return results;
  }

  /**
   * Prefetch data into cache
   * @param key Cache key
   * @param fetchFn Function to fetch data
   * @param expiration Optional custom expiration time
   */
  async prefetch<T>(key: string, fetchFn: () => Promise<T>, expiration?: number): Promise<void> {
    this.log(`Prefetching data for ${key}`);

    try {
      // Only fetch if not already in cache
      const exists = await this.has(key);
      if (!exists) {
        await this.getNetworkOnly<T>(key, fetchFn, expiration);
      }
    } catch (error) {
      console.error(`Error prefetching ${key}:`, error);
      logError(LogCategory.STORAGE, `Error prefetching ${key}`, error as Error);
      safeErrorCapture(error as Error);
    }
  }
}

// Export as singleton
export const enhancedCacheService = new EnhancedCacheService({
  debug: process.env.NODE_ENV === 'development',
  appVersion: process.env.APP_VERSION || '1.0.0',
});

export default enhancedCacheService;
