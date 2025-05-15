import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from './geolocationService';
import { Venue } from './venueService';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
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
}

/**
 * Service for caching data to reduce API calls
 */
class CacheService {
  // In-memory cache
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache configuration
  private config: CacheConfig = {
    defaultExpiration: 1000 * 60 * 60, // 1 hour
    customExpirations: {
      'location': 1000 * 60 * 30, // 30 minutes
      'venues': 1000 * 60 * 60 * 24, // 24 hours
      'teams': 1000 * 60 * 60 * 24, // 24 hours
      'odds': 1000 * 60 * 5, // 5 minutes
    },
    maxEntries: 100
  };
  
  // Cache key prefixes
  private readonly STORAGE_PREFIX = 'cache:';
  private readonly LOCATION_CACHE_KEY = 'location';
  private readonly VENUES_CACHE_KEY = 'venues';
  private readonly TEAMS_CACHE_KEY = 'teams';
  private readonly ODDS_CACHE_KEY = 'odds';
  
  /**
   * Initialize the cache service
   */
  constructor() {
    // Load frequently used cache items into memory
    this.preloadCache();
  }
  
  /**
   * Preload frequently used cache items into memory
   */
  private async preloadCache(): Promise<void> {
    try {
      const keysToPreload = [
        this.LOCATION_CACHE_KEY,
        this.VENUES_CACHE_KEY
      ];
      
      for (const key of keysToPreload) {
        const data = await this.getFromStorage(key);
        if (data) {
          this.memoryCache.set(key, data);
        }
      }
      
      console.log('Cache preloaded');
    } catch (error) {
      console.error('Error preloading cache:', error);
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
          await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
          return null;
        }
        
        return entry;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
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
        expiresAt: Date.now() + expirationTime
      };
      
      await AsyncStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }
  
  /**
   * Get data from cache
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param expiration Optional custom expiration time in milliseconds
   * @returns Cached or fetched data
   */
  async get<T>(key: string, fetchFn: () => Promise<T>, expiration?: number): Promise<T> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      
      // If not expired, return cached data
      if (!this.isExpired(entry)) {
        return entry.data;
      }
      
      // If expired, remove from memory cache
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
        }
      }
      
      return storageEntry.data;
    }
    
    // If not in cache, fetch data
    const data = await fetchFn();
    
    // Save to both caches
    const expirationTime = expiration || this.getExpiration(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime
    };
    
    this.memoryCache.set(key, entry);
    await this.saveToStorage(key, data, expirationTime);
    
    return data;
  }
  
  /**
   * Invalidate a cache entry
   * @param key Cache key
   */
  async invalidate(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // Remove from storage
    await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
  }
  
  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear storage cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  /**
   * Cache location data
   * @param location Location data
   * @param expiration Optional custom expiration time in milliseconds
   */
  async cacheLocation(location: LocationData, expiration?: number): Promise<void> {
    const key = this.LOCATION_CACHE_KEY;
    await this.saveToStorage(key, location, expiration);
    
    // Update memory cache
    const expirationTime = expiration || this.getExpiration(key);
    const entry: CacheEntry<LocationData> = {
      data: location,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime
    };
    
    this.memoryCache.set(key, entry);
  }
  
  /**
   * Get cached location data
   * @returns Cached location data or null if not found
   */
  async getLocation(): Promise<LocationData | null> {
    // Check memory cache first
    if (this.memoryCache.has(this.LOCATION_CACHE_KEY)) {
      const entry = this.memoryCache.get(this.LOCATION_CACHE_KEY)!;
      
      // If not expired, return cached data
      if (!this.isExpired(entry)) {
        return entry.data;
      }
      
      // If expired, remove from memory cache
      this.memoryCache.delete(this.LOCATION_CACHE_KEY);
    }
    
    // Check storage cache
    const storageEntry = await this.getFromStorage<LocationData>(this.LOCATION_CACHE_KEY);
    if (storageEntry) {
      // Add to memory cache
      this.memoryCache.set(this.LOCATION_CACHE_KEY, storageEntry);
      return storageEntry.data;
    }
    
    return null;
  }
  
  /**
   * Cache venues data
   * @param venues Venues data
   * @param expiration Optional custom expiration time in milliseconds
   */
  async cacheVenues(venues: Venue[], expiration?: number): Promise<void> {
    const key = this.VENUES_CACHE_KEY;
    await this.saveToStorage(key, venues, expiration);
    
    // Update memory cache
    const expirationTime = expiration || this.getExpiration(key);
    const entry: CacheEntry<Venue[]> = {
      data: venues,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime
    };
    
    this.memoryCache.set(key, entry);
  }
  
  /**
   * Get cached venues data
   * @returns Cached venues data or null if not found
   */
  async getVenues(): Promise<Venue[] | null> {
    // Check memory cache first
    if (this.memoryCache.has(this.VENUES_CACHE_KEY)) {
      const entry = this.memoryCache.get(this.VENUES_CACHE_KEY)!;
      
      // If not expired, return cached data
      if (!this.isExpired(entry)) {
        return entry.data;
      }
      
      // If expired, remove from memory cache
      this.memoryCache.delete(this.VENUES_CACHE_KEY);
    }
    
    // Check storage cache
    const storageEntry = await this.getFromStorage<Venue[]>(this.VENUES_CACHE_KEY);
    if (storageEntry) {
      // Add to memory cache
      this.memoryCache.set(this.VENUES_CACHE_KEY, storageEntry);
      return storageEntry.data;
    }
    
    return null;
  }
  
  /**
   * Cache teams data
   * @param teams Teams data
   * @param expiration Optional custom expiration time in milliseconds
   */
  async cacheTeams(teams: string[], expiration?: number): Promise<void> {
    await this.saveToStorage(this.TEAMS_CACHE_KEY, teams, expiration);
  }
  
  /**
   * Get cached teams data
   * @returns Cached teams data or null if not found
   */
  async getTeams(): Promise<string[] | null> {
    const entry = await this.getFromStorage<string[]>(this.TEAMS_CACHE_KEY);
    return entry ? entry.data : null;
  }
  
  /**
   * Cache odds data for a specific team
   * @param teamId Team ID
   * @param odds Odds data
   * @param expiration Optional custom expiration time in milliseconds
   */
  async cacheOdds(teamId: string, odds: any, expiration?: number): Promise<void> {
    const key = `${this.ODDS_CACHE_KEY}:${teamId}`;
    await this.saveToStorage(key, odds, expiration);
  }
  
  /**
   * Get cached odds data for a specific team
   * @param teamId Team ID
   * @returns Cached odds data or null if not found
   */
  async getOdds(teamId: string): Promise<any | null> {
    const key = `${this.ODDS_CACHE_KEY}:${teamId}`;
    const entry = await this.getFromStorage<any>(key);
    return entry ? entry.data : null;
  }
}

export const cacheService = new CacheService();
export default cacheService;