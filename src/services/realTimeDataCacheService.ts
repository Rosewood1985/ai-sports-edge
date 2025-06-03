/**
 * Real-Time Data Cache Service
 * Phase 4.3: Advanced Caching Strategies
 * Multi-level cache system optimized for real-time sports data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { cacheService } from './cacheService';

export interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'fifo';
  persistToDisk: boolean;
  compressionEnabled: boolean;
}

export interface RealTimeDataEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  priority: number; // 1-10, higher = more important
  size: number;
  compressed: boolean;
  source: string;
  version: string;
}

export interface CacheLevel {
  name: string;
  storage: Map<string, RealTimeDataEntry<any>>;
  strategy: CacheStrategy;
  currentSize: number;
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  levelHits: Record<string, number>;
  levelMisses: Record<string, number>;
  hitRate: number;
  averageLatency: number;
  dataFreshness: number;
  memoryUsage: number;
  compressionRatio: number;
}

/**
 * Advanced multi-level cache service for real-time sports data
 */
export class RealTimeDataCacheService {
  private static instance: RealTimeDataCacheService;
  private cacheLevels: Map<string, CacheLevel> = new Map();
  private metrics: CacheMetrics = {
    totalHits: 0,
    totalMisses: 0,
    levelHits: {},
    levelMisses: {},
    hitRate: 0,
    averageLatency: 0,
    dataFreshness: 0,
    memoryUsage: 0,
    compressionRatio: 0,
  };

  // Cache level configurations
  private readonly cacheStrategies: Record<string, CacheStrategy> = {
    // L1: In-memory, ultra-fast for live scores/odds
    l1_live: {
      name: 'Live Data L1',
      ttl: 5000, // 5 seconds
      maxSize: 10 * 1024 * 1024, // 10MB
      evictionPolicy: 'lru',
      persistToDisk: false,
      compressionEnabled: false,
    },

    // L2: Compressed memory for recent game data
    l2_recent: {
      name: 'Recent Data L2',
      ttl: 60000, // 1 minute
      maxSize: 50 * 1024 * 1024, // 50MB
      evictionPolicy: 'lfu',
      persistToDisk: false,
      compressionEnabled: true,
    },

    // L3: Persistent storage for historical data
    l3_historical: {
      name: 'Historical Data L3',
      ttl: 3600000, // 1 hour
      maxSize: 200 * 1024 * 1024, // 200MB
      evictionPolicy: 'ttl',
      persistToDisk: true,
      compressionEnabled: true,
    },

    // L4: Analytics cache for aggregated data
    l4_analytics: {
      name: 'Analytics Data L4',
      ttl: 86400000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100MB
      evictionPolicy: 'lru',
      persistToDisk: true,
      compressionEnabled: true,
    },
  };

  private readonly STORAGE_PREFIX = 'rtdc_';
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress data > 1KB
  private latencyTracker: number[] = [];

  private constructor() {
    this.initializeCacheLevels();
    this.startMaintenanceTimer();
    this.loadPersistedData();
  }

  public static getInstance(): RealTimeDataCacheService {
    if (!RealTimeDataCacheService.instance) {
      RealTimeDataCacheService.instance = new RealTimeDataCacheService();
    }
    return RealTimeDataCacheService.instance;
  }

  /**
   * Get data with intelligent cache level selection
   */
  async get<T>(
    key: string,
    dataType: 'live' | 'recent' | 'historical' | 'analytics' = 'recent'
  ): Promise<T | null> {
    const startTime = performance.now();
    const levels = this.getCacheLevelsForDataType(dataType);

    for (const levelName of levels) {
      const level = this.cacheLevels.get(levelName);
      if (!level) continue;

      const entry = level.storage.get(key);
      if (entry && this.isValidEntry(entry, level.strategy)) {
        // Update access metrics
        entry.lastAccessed = Date.now();
        entry.accessCount++;

        // Promote to higher cache level if frequently accessed
        if (entry.accessCount > 10 && levelName !== levels[0]) {
          await this.promoteEntry(key, entry, levels[0]);
        }

        this.recordHit(levelName, performance.now() - startTime);
        return this.deserializeData<T>(entry);
      }
    }

    this.recordMiss();
    return null;
  }

  /**
   * Set data with automatic level assignment
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      dataType?: 'live' | 'recent' | 'historical' | 'analytics';
      priority?: number;
      source?: string;
      version?: string;
      customTtl?: number;
    } = {}
  ): Promise<void> {
    const {
      dataType = 'recent',
      priority = 5,
      source = 'unknown',
      version = '1.0',
      customTtl,
    } = options;

    const levels = this.getCacheLevelsForDataType(dataType);
    const primaryLevel = this.cacheLevels.get(levels[0]);

    if (!primaryLevel) return;

    const serializedData = await this.serializeData(data, primaryLevel.strategy);
    const entry: RealTimeDataEntry<T> = {
      data: serializedData,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      priority,
      size: this.calculateSize(serializedData),
      compressed:
        primaryLevel.strategy.compressionEnabled &&
        this.calculateSize(data) > this.COMPRESSION_THRESHOLD,
      source,
      version,
    };

    // Ensure capacity before insertion
    await this.ensureCapacity(primaryLevel, entry.size);

    // Insert into primary level
    primaryLevel.storage.set(key, entry);
    primaryLevel.currentSize += entry.size;

    // Persist to disk if configured
    if (primaryLevel.strategy.persistToDisk) {
      this.persistToDisk(key, entry, primaryLevel.name).catch(error => {
        console.error(`Failed to persist ${key} to disk:`, error);
      });
    }

    // Optionally replicate to other levels for redundancy
    if (priority >= 8) {
      this.replicateToLowerLevels(key, entry, levels.slice(1));
    }

    this.updateMetrics();
  }

  /**
   * Batch get operation for multiple keys
   */
  async getBatch<T>(
    keys: string[],
    dataType: 'live' | 'recent' | 'historical' | 'analytics' = 'recent'
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const promises = keys.map(async key => {
      const data = await this.get<T>(key, dataType);
      results.set(key, data);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Batch set operation for multiple entries
   */
  async setBatch<T>(
    entries: {
      key: string;
      data: T;
      options?: Parameters<typeof this.set>[2];
    }[]
  ): Promise<void> {
    const promises = entries.map(({ key, data, options }) => this.set(key, data, options));

    await Promise.all(promises);
  }

  /**
   * Invalidate data by pattern or key
   */
  async invalidate(pattern: string | RegExp): Promise<number> {
    let invalidatedCount = 0;
    const isRegex = pattern instanceof RegExp;

    for (const [levelName, level] of this.cacheLevels) {
      const keysToDelete: string[] = [];

      for (const [key] of level.storage) {
        const matches = isRegex ? pattern.test(key) : key.includes(pattern as string);

        if (matches) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        const entry = level.storage.get(key);
        if (entry) {
          level.currentSize -= entry.size;
          level.storage.delete(key);
          invalidatedCount++;

          // Remove from persistent storage
          if (level.strategy.persistToDisk) {
            this.removeFromDisk(key, level.name).catch(error => {
              console.error(`Failed to remove ${key} from disk:`, error);
            });
          }
        }
      }
    }

    this.updateMetrics();
    return invalidatedCount;
  }

  /**
   * Preload data with priority
   */
  async preload<T>(
    entries: {
      key: string;
      loader: () => Promise<T>;
      dataType?: 'live' | 'recent' | 'historical' | 'analytics';
      priority?: number;
    }[]
  ): Promise<void> {
    // Sort by priority (higher first)
    const sortedEntries = entries.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    const promises = sortedEntries.map(async ({ key, loader, dataType, priority }) => {
      try {
        // Check if already cached
        const existing = await this.get(key, dataType);
        if (existing) return;

        // Load and cache
        const data = await loader();
        await this.set(key, data, { dataType, priority });

        console.log(`Preloaded ${key} with priority ${priority || 5}`);
      } catch (error) {
        console.error(`Failed to preload ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get comprehensive cache metrics
   */
  getMetrics(): CacheMetrics & {
    levelDetails: Record<
      string,
      {
        size: number;
        count: number;
        hitRate: number;
        avgDataAge: number;
      }
    >;
  } {
    const levelDetails: Record<string, any> = {};

    for (const [name, level] of this.cacheLevels) {
      const entries = Array.from(level.storage.values());
      const avgAge =
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
          : 0;

      levelDetails[name] = {
        size: level.currentSize,
        count: level.storage.size,
        hitRate: this.calculateLevelHitRate(name),
        avgDataAge: avgAge,
      };
    }

    return {
      ...this.metrics,
      levelDetails,
    };
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(patterns: string[]): Promise<void> {
    console.log('Starting cache warming...');

    for (const pattern of patterns) {
      try {
        // Load from persistent storage first
        await this.loadPatternFromDisk(pattern);

        // You could also trigger API calls here to refresh data
        console.log(`Warmed cache for pattern: ${pattern}`);
      } catch (error) {
        console.error(`Failed to warm cache for pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Clear specific cache level
   */
  async clearLevel(levelName: string): Promise<void> {
    const level = this.cacheLevels.get(levelName);
    if (!level) return;

    // Clear persistent storage
    if (level.strategy.persistToDisk) {
      const keys = Array.from(level.storage.keys());
      for (const key of keys) {
        await this.removeFromDisk(key, levelName);
      }
    }

    level.storage.clear();
    level.currentSize = 0;
    this.updateMetrics();
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.cacheLevels.keys()).map(level => this.clearLevel(level));

    await Promise.all(promises);

    // Reset metrics
    this.metrics = {
      totalHits: 0,
      totalMisses: 0,
      levelHits: {},
      levelMisses: {},
      hitRate: 0,
      averageLatency: 0,
      dataFreshness: 0,
      memoryUsage: 0,
      compressionRatio: 0,
    };
  }

  // Private methods

  private initializeCacheLevels(): void {
    for (const [key, strategy] of Object.entries(this.cacheStrategies)) {
      this.cacheLevels.set(key, {
        name: strategy.name,
        storage: new Map(),
        strategy,
        currentSize: 0,
      });

      this.metrics.levelHits[key] = 0;
      this.metrics.levelMisses[key] = 0;
    }
  }

  private getCacheLevelsForDataType(dataType: string): string[] {
    switch (dataType) {
      case 'live':
        return ['l1_live', 'l2_recent'];
      case 'recent':
        return ['l2_recent', 'l1_live', 'l3_historical'];
      case 'historical':
        return ['l3_historical', 'l2_recent'];
      case 'analytics':
        return ['l4_analytics', 'l3_historical'];
      default:
        return ['l2_recent', 'l3_historical'];
    }
  }

  private isValidEntry(entry: RealTimeDataEntry<any>, strategy: CacheStrategy): boolean {
    const now = Date.now();
    return now - entry.timestamp < strategy.ttl;
  }

  private async ensureCapacity(level: CacheLevel, requiredSize: number): Promise<void> {
    while (level.currentSize + requiredSize > level.strategy.maxSize && level.storage.size > 0) {
      await this.evictEntry(level);
    }
  }

  private async evictEntry(level: CacheLevel): Promise<void> {
    let victimKey = '';
    let victimScore = Infinity;

    for (const [key, entry] of level.storage) {
      let score: number;

      switch (level.strategy.evictionPolicy) {
        case 'lru':
          score = entry.lastAccessed;
          break;
        case 'lfu':
          score = entry.accessCount;
          break;
        case 'ttl':
          score = entry.timestamp;
          break;
        case 'fifo':
          score = entry.timestamp;
          break;
        default:
          score = entry.lastAccessed;
      }

      if (score < victimScore) {
        victimScore = score;
        victimKey = key;
      }
    }

    if (victimKey) {
      const entry = level.storage.get(victimKey);
      if (entry) {
        level.currentSize -= entry.size;
        level.storage.delete(victimKey);

        if (level.strategy.persistToDisk) {
          await this.removeFromDisk(victimKey, level.name);
        }
      }
    }
  }

  private async promoteEntry(
    key: string,
    entry: RealTimeDataEntry<any>,
    targetLevel: string
  ): Promise<void> {
    const level = this.cacheLevels.get(targetLevel);
    if (!level) return;

    await this.ensureCapacity(level, entry.size);
    level.storage.set(key, { ...entry });
    level.currentSize += entry.size;
  }

  private async replicateToLowerLevels(
    key: string,
    entry: RealTimeDataEntry<any>,
    levels: string[]
  ): Promise<void> {
    for (const levelName of levels) {
      const level = this.cacheLevels.get(levelName);
      if (!level) continue;

      if (!level.storage.has(key)) {
        await this.ensureCapacity(level, entry.size);
        level.storage.set(key, { ...entry });
        level.currentSize += entry.size;
      }
    }
  }

  private async serializeData<T>(data: T, strategy: CacheStrategy): Promise<any> {
    if (!strategy.compressionEnabled) {
      return data;
    }

    const jsonString = JSON.stringify(data);
    if (jsonString.length < this.COMPRESSION_THRESHOLD) {
      return data;
    }

    // Simple compression simulation (in real implementation, use actual compression)
    return {
      _compressed: true,
      _data: jsonString,
      _originalSize: jsonString.length,
    };
  }

  private async deserializeData<T>(entry: RealTimeDataEntry<any>): Promise<T> {
    if (!entry.compressed || !entry.data._compressed) {
      return entry.data as T;
    }

    // Decompress data
    return JSON.parse(entry.data._data) as T;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
  }

  private recordHit(levelName: string, latency: number): void {
    this.metrics.totalHits++;
    this.metrics.levelHits[levelName]++;

    this.latencyTracker.push(latency);
    if (this.latencyTracker.length > 1000) {
      this.latencyTracker = this.latencyTracker.slice(-500);
    }

    this.updateMetrics();
  }

  private recordMiss(): void {
    this.metrics.totalMisses++;
    this.updateMetrics();
  }

  private calculateLevelHitRate(levelName: string): number {
    const hits = this.metrics.levelHits[levelName] || 0;
    const misses = this.metrics.levelMisses[levelName] || 0;
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  private updateMetrics(): void {
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    this.metrics.hitRate = total > 0 ? this.metrics.totalHits / total : 0;
    this.metrics.averageLatency =
      this.latencyTracker.length > 0
        ? this.latencyTracker.reduce((sum, lat) => sum + lat, 0) / this.latencyTracker.length
        : 0;

    // Calculate memory usage
    this.metrics.memoryUsage = Array.from(this.cacheLevels.values()).reduce(
      (total, level) => total + level.currentSize,
      0
    );
  }

  private async persistToDisk(
    key: string,
    entry: RealTimeDataEntry<any>,
    levelName: string
  ): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${levelName}_${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`Failed to persist ${key} to disk:`, error);
    }
  }

  private async removeFromDisk(key: string, levelName: string): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${levelName}_${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove ${key} from disk:`, error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));

      // Load in batches to avoid blocking
      const batchSize = 10;
      for (let i = 0; i < cacheKeys.length; i += batchSize) {
        const batch = cacheKeys.slice(i, i + batchSize);

        const promises = batch.map(async storageKey => {
          try {
            const data = await AsyncStorage.getItem(storageKey);
            if (!data) return;

            const entry: RealTimeDataEntry<any> = JSON.parse(data);
            const [, levelName, ...keyParts] = storageKey.split('_');
            const key = keyParts.join('_');

            const level = this.cacheLevels.get(levelName);
            if (level && this.isValidEntry(entry, level.strategy)) {
              level.storage.set(key, entry);
              level.currentSize += entry.size;
            }
          } catch (error) {
            console.error(`Failed to load cached entry ${storageKey}:`, error);
          }
        });

        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Failed to load persisted cache data:', error);
    }
  }

  private async loadPatternFromDisk(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(
        key => key.startsWith(this.STORAGE_PREFIX) && key.includes(pattern)
      );

      for (const storageKey of matchingKeys) {
        const data = await AsyncStorage.getItem(storageKey);
        if (!data) continue;

        const entry: RealTimeDataEntry<any> = JSON.parse(data);
        const [, levelName, ...keyParts] = storageKey.split('_');
        const key = keyParts.join('_');

        const level = this.cacheLevels.get(levelName);
        if (level && this.isValidEntry(entry, level.strategy)) {
          level.storage.set(key, entry);
          level.currentSize += entry.size;
        }
      }
    } catch (error) {
      console.error(`Failed to load pattern ${pattern} from disk:`, error);
    }
  }

  private startMaintenanceTimer(): void {
    setInterval(() => {
      this.performMaintenance();
    }, 60000); // Run every minute
  }

  private performMaintenance(): void {
    const now = Date.now();

    for (const [levelName, level] of this.cacheLevels) {
      const expiredKeys: string[] = [];

      for (const [key, entry] of level.storage) {
        if (!this.isValidEntry(entry, level.strategy)) {
          expiredKeys.push(key);
        }
      }

      // Remove expired entries
      for (const key of expiredKeys) {
        const entry = level.storage.get(key);
        if (entry) {
          level.currentSize -= entry.size;
          level.storage.delete(key);

          if (level.strategy.persistToDisk) {
            this.removeFromDisk(key, levelName).catch(error => {
              console.error(`Failed to remove expired ${key} from disk:`, error);
            });
          }
        }
      }
    }

    this.updateMetrics();
  }
}

export default RealTimeDataCacheService;
