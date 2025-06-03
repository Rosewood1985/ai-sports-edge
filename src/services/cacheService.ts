import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  key: string;
  ttl: number; // Time to live in milliseconds
  version: string; // For cache invalidation on app updates
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

/**
 * Cache Service
 * Provides caching functionality for the app
 */
class CacheService {
  /**
   * Get data from cache
   * @param config Cache configuration
   * @returns Promise resolving to cached data or null if not found or expired
   */
  async get<T>(config: CacheConfig): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(config.key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if cache is expired or version mismatch
      if (Date.now() - entry.timestamp > config.ttl || entry.version !== config.version) {
        await AsyncStorage.removeItem(config.key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   * @param config Cache configuration
   * @param data Data to cache
   */
  async set<T>(config: CacheConfig, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: config.version,
      };

      await AsyncStorage.setItem(config.key, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Remove data from cache
   * @param key Cache key
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get all cache keys
   * @returns Promise resolving to array of cache keys
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Cache getAllKeys error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
