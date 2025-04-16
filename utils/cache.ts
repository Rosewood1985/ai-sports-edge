/**
 * Cache Utility
 * 
 * A simple in-memory cache with TTL support.
 */

export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
}

interface CacheItem<T> {
  value: T;
  expiry: number | null;
}

class MemoryCache implements Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Set up periodic cleanup of expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : null;
    
    this.cache.set(key, {
      value,
      expiry,
    });
  }

  /**
   * Delete a value from the cache
   * 
   * @param key - Cache key
   * @returns True if the key was found and deleted, false otherwise
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all values from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Use forEach instead of for...of to avoid TypeScript downlevelIteration issues
    this.cache.forEach((item, key) => {
      if (item.expiry !== null && item.expiry < now) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Destroy the cache and clean up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Create a singleton instance
const cache: Cache = new MemoryCache();

export default cache;