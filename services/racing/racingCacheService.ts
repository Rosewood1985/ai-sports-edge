/**
 * Racing Data Cache Service
 * Tiered caching system with priority-based access
 *
 * Phase 3: Storage and Caching Layer
 * Part of Racing Data Integration System
 */

import {
  CacheConfiguration,
  MLFeatureDocument,
  PredictionDocument,
} from '../../database/racing/racingDataSchema';
import { MLFeatureVector, RacingSport, CacheMetadata } from '../../types/racing/commonTypes';

export interface CacheEntry {
  key: string;
  data: any;
  metadata: {
    tier: 'hot' | 'warm' | 'cold';
    priority: number;
    size: number;
    compressed: boolean;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    ttl: number;
    sport: RacingSport;
    dataType: 'features' | 'predictions' | 'race_data' | 'performance';
  };
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageLatency: number;
  tierStats: {
    [tier: string]: {
      hitRate: number;
      size: number;
      count: number;
      evictions: number;
    };
  };
}

export class RacingCacheService {
  private hotCache: Map<string, CacheEntry>;
  private warmCache: Map<string, CacheEntry>;
  private coldCache: Map<string, CacheEntry>;

  private config: CacheConfiguration;
  private stats: CacheStats;

  private compressionService: CompressionService;
  private metricsCollector: CacheMetricsCollector;

  constructor() {
    this.hotCache = new Map();
    this.warmCache = new Map();
    this.coldCache = new Map();

    this.config = this.getDefaultConfiguration();
    this.stats = this.initializeStats();

    this.compressionService = new CompressionService();
    this.metricsCollector = new CacheMetricsCollector();

    // Start background processes
    this.startEvictionProcess();
    this.startMetricsCollection();
    this.startPrefetchProcess();
  }

  /**
   * Get data from cache with automatic tier promotion
   */
  async get(key: string): Promise<any | null> {
    const startTime = Date.now();

    try {
      // Check hot cache first
      let entry = this.hotCache.get(key);
      if (entry) {
        this.updateAccessMetrics(entry, 'hot');
        this.recordHit('hot', Date.now() - startTime);
        return await this.deserializeData(entry);
      }

      // Check warm cache
      entry = this.warmCache.get(key);
      if (entry) {
        this.updateAccessMetrics(entry, 'warm');

        // Promote to hot cache if high priority
        if (entry.metadata.priority >= 8) {
          await this.promoteToHot(key, entry);
        }

        this.recordHit('warm', Date.now() - startTime);
        return await this.deserializeData(entry);
      }

      // Check cold cache
      entry = this.coldCache.get(key);
      if (entry) {
        this.updateAccessMetrics(entry, 'cold');

        // Promote to warm cache if frequently accessed
        if (entry.metadata.accessCount >= 5) {
          await this.promoteToWarm(key, entry);
        }

        this.recordHit('cold', Date.now() - startTime);
        return await this.deserializeData(entry);
      }

      // Cache miss
      this.recordMiss(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.recordMiss(Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set data in appropriate cache tier based on priority and size
   */
  async set(
    key: string,
    data: any,
    options: {
      sport: RacingSport;
      dataType: 'features' | 'predictions' | 'race_data' | 'performance';
      priority?: number;
      ttl?: number;
      tier?: 'hot' | 'warm' | 'cold';
    }
  ): Promise<boolean> {
    try {
      const priority = options.priority || 5;
      const dataSize = this.calculateDataSize(data);
      const tier = options.tier || this.determineTier(priority, dataSize, options.dataType);

      const entry: CacheEntry = {
        key,
        data: await this.serializeData(data, tier),
        metadata: {
          tier,
          priority,
          size: dataSize,
          compressed: tier !== 'hot',
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          ttl: options.ttl || this.config.tiers[tier].ttl,
          sport: options.sport,
          dataType: options.dataType,
        },
      };

      // Place in appropriate tier
      switch (tier) {
        case 'hot':
          await this.setInHotCache(key, entry);
          break;
        case 'warm':
          await this.setInWarmCache(key, entry);
          break;
        case 'cold':
          await this.setInColdCache(key, entry);
          break;
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache ML features with optimized storage
   */
  async cacheMLFeatures(
    raceId: string,
    sport: RacingSport,
    features: MLFeatureVector[]
  ): Promise<boolean> {
    const key = `ml_features:${sport}:${raceId}`;

    return await this.set(key, features, {
      sport,
      dataType: 'features',
      priority: 9, // High priority for ML features
      tier: 'hot',
    });
  }

  /**
   * Cache prediction results
   */
  async cachePredictions(
    predictionId: string,
    sport: RacingSport,
    predictions: any[]
  ): Promise<boolean> {
    const key = `predictions:${sport}:${predictionId}`;

    return await this.set(key, predictions, {
      sport,
      dataType: 'predictions',
      priority: 8,
      tier: 'warm',
    });
  }

  /**
   * Cache driver/horse performance data
   */
  async cachePerformanceData(
    participantId: string,
    sport: RacingSport,
    data: any
  ): Promise<boolean> {
    const key = `performance:${sport}:${participantId}`;

    return await this.set(key, data, {
      sport,
      dataType: 'performance',
      priority: 6,
      tier: 'warm',
    });
  }

  /**
   * Bulk cache invalidation for race updates
   */
  async invalidateRaceData(raceId: string, sport: RacingSport): Promise<void> {
    const patterns = [
      `ml_features:${sport}:${raceId}`,
      `predictions:${sport}:${raceId}`,
      `race_data:${sport}:${raceId}`,
    ];

    for (const pattern of patterns) {
      await this.invalidate(pattern);
    }

    // Cascade invalidation for related data
    await this.cascadeInvalidation(sport, raceId);
  }

  /**
   * Prefetch commonly needed data
   */
  async prefetchUpcomingRaces(sport: RacingSport, limit: number = 10): Promise<void> {
    try {
      // This would integrate with the database service
      // For now, we'll implement the caching structure

      const upcomingRaces = await this.getUpcomingRaces(sport, limit);

      for (const race of upcomingRaces) {
        // Prefetch ML features for upcoming races
        const key = `ml_features:${sport}:${race.id}`;

        if (!(await this.get(key))) {
          // Features would be generated by the feature extraction service
          const features = await this.generateMLFeatures(race);
          await this.cacheMLFeatures(race.id, sport, features);
        }
      }
    } catch (error) {
      console.error(`Prefetch error for ${sport}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear cache tier or entire cache
   */
  async clear(tier?: 'hot' | 'warm' | 'cold'): Promise<void> {
    if (tier) {
      switch (tier) {
        case 'hot':
          this.hotCache.clear();
          break;
        case 'warm':
          this.warmCache.clear();
          break;
        case 'cold':
          this.coldCache.clear();
          break;
      }
    } else {
      this.hotCache.clear();
      this.warmCache.clear();
      this.coldCache.clear();
    }

    this.stats = this.initializeStats();
  }

  // Private methods

  private getDefaultConfiguration(): CacheConfiguration {
    return {
      tiers: {
        hot: {
          maxSize: 100 * 1024 * 1024, // 100MB
          ttl: 15 * 60 * 1000, // 15 minutes
          compression: false,
          priority: 'high' as const,
        },
        warm: {
          maxSize: 500 * 1024 * 1024, // 500MB
          ttl: 2 * 60 * 60 * 1000, // 2 hours
          compression: true,
          priority: 'medium' as const,
        },
        cold: {
          maxSize: 2 * 1024 * 1024 * 1024, // 2GB
          ttl: 24 * 60 * 60 * 1000, // 24 hours
          compression: true,
          priority: 'low' as const,
        },
      },
      evictionPolicy: 'lru',
      compressionThreshold: 10 * 1024, // 10KB
      prefetchPatterns: ['ml_features:*:upcoming', 'predictions:*:today', 'performance:*:active'],
      invalidationRules: {
        race_data: {
          triggers: ['race_update', 'result_posted'],
          cascadeRules: ['ml_features', 'predictions'],
        },
        driver_data: {
          triggers: ['driver_update', 'performance_change'],
          cascadeRules: ['ml_features'],
        },
      },
    };
  }

  private initializeStats(): CacheStats {
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageLatency: 0,
      tierStats: {
        hot: { hitRate: 0, size: 0, count: 0, evictions: 0 },
        warm: { hitRate: 0, size: 0, count: 0, evictions: 0 },
        cold: { hitRate: 0, size: 0, count: 0, evictions: 0 },
      },
    };
  }

  private determineTier(
    priority: number,
    dataSize: number,
    dataType: string
  ): 'hot' | 'warm' | 'cold' {
    // ML features and active predictions go to hot cache
    if (dataType === 'features' && priority >= 8) {
      return 'hot';
    }

    // Recent predictions and performance data go to warm cache
    if ((dataType === 'predictions' || dataType === 'performance') && priority >= 6) {
      return 'warm';
    }

    // Large historical data goes to cold cache
    if (dataSize > this.config.compressionThreshold) {
      return 'cold';
    }

    // Default based on priority
    if (priority >= 8) return 'hot';
    if (priority >= 5) return 'warm';
    return 'cold';
  }

  private async setInHotCache(key: string, entry: CacheEntry): Promise<void> {
    // Check if we need to evict
    const currentSize = this.calculateCacheSize(this.hotCache);
    if (currentSize + entry.metadata.size > this.config.tiers.hot.maxSize) {
      await this.evictFromHotCache(entry.metadata.size);
    }

    this.hotCache.set(key, entry);
  }

  private async setInWarmCache(key: string, entry: CacheEntry): Promise<void> {
    const currentSize = this.calculateCacheSize(this.warmCache);
    if (currentSize + entry.metadata.size > this.config.tiers.warm.maxSize) {
      await this.evictFromWarmCache(entry.metadata.size);
    }

    this.warmCache.set(key, entry);
  }

  private async setInColdCache(key: string, entry: CacheEntry): Promise<void> {
    const currentSize = this.calculateCacheSize(this.coldCache);
    if (currentSize + entry.metadata.size > this.config.tiers.cold.maxSize) {
      await this.evictFromColdCache(entry.metadata.size);
    }

    this.coldCache.set(key, entry);
  }

  private async evictFromHotCache(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.hotCache.entries()).sort((a, b) => {
      // LRU with priority consideration
      const priorityDiff = a[1].metadata.priority - b[1].metadata.priority;
      if (priorityDiff !== 0) return priorityDiff;

      return a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime();
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      // Move to warm cache instead of completely evicting
      await this.demoteToWarm(key, entry);
      this.hotCache.delete(key);
      freedSpace += entry.metadata.size;

      this.stats.tierStats.hot.evictions++;
    }
  }

  private async evictFromWarmCache(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.warmCache.entries()).sort(
      (a, b) => a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime()
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      // Move to cold cache
      await this.demoteToCold(key, entry);
      this.warmCache.delete(key);
      freedSpace += entry.metadata.size;

      this.stats.tierStats.warm.evictions++;
    }
  }

  private async evictFromColdCache(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.coldCache.entries()).sort(
      (a, b) => a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime()
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      this.coldCache.delete(key);
      freedSpace += entry.metadata.size;

      this.stats.tierStats.cold.evictions++;
    }
  }

  private async promoteToHot(key: string, entry: CacheEntry): Promise<void> {
    this.warmCache.delete(key);
    entry.metadata.tier = 'hot';
    await this.setInHotCache(key, entry);
  }

  private async promoteToWarm(key: string, entry: CacheEntry): Promise<void> {
    this.coldCache.delete(key);
    entry.metadata.tier = 'warm';
    await this.setInWarmCache(key, entry);
  }

  private async demoteToWarm(key: string, entry: CacheEntry): Promise<void> {
    entry.metadata.tier = 'warm';
    await this.setInWarmCache(key, entry);
  }

  private async demoteToCold(key: string, entry: CacheEntry): Promise<void> {
    entry.metadata.tier = 'cold';
    await this.setInColdCache(key, entry);
  }

  private updateAccessMetrics(entry: CacheEntry, tier: string): void {
    entry.metadata.lastAccessed = new Date();
    entry.metadata.accessCount++;

    this.stats.tierStats[tier].count = this.getTierSize(tier);
  }

  private recordHit(tier: string, latency: number): void {
    this.stats.totalHits++;
    this.stats.totalRequests++;
    this.updateRates();
    this.updateLatency(latency);

    this.stats.tierStats[tier].hitRate = this.calculateTierHitRate(tier);
  }

  private recordMiss(latency: number): void {
    this.stats.totalMisses++;
    this.stats.totalRequests++;
    this.updateRates();
    this.updateLatency(latency);
  }

  private updateRates(): void {
    this.stats.hitRate = this.stats.totalHits / this.stats.totalRequests;
    this.stats.missRate = this.stats.totalMisses / this.stats.totalRequests;
  }

  private updateLatency(latency: number): void {
    const totalLatency = this.stats.averageLatency * (this.stats.totalRequests - 1) + latency;
    this.stats.averageLatency = totalLatency / this.stats.totalRequests;
  }

  private calculateTierHitRate(tier: string): number {
    // This would track tier-specific hits in a real implementation
    return 0; // Placeholder
  }

  private getTierSize(tier: string): number {
    switch (tier) {
      case 'hot':
        return this.hotCache.size;
      case 'warm':
        return this.warmCache.size;
      case 'cold':
        return this.coldCache.size;
      default:
        return 0;
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private calculateCacheSize(cache: Map<string, CacheEntry>): number {
    return Array.from(cache.values()).reduce((total, entry) => total + entry.metadata.size, 0);
  }

  private async serializeData(data: any, tier: 'hot' | 'warm' | 'cold'): Promise<any> {
    if (tier === 'hot') {
      return data; // No compression for hot cache
    }

    return await this.compressionService.compress(data);
  }

  private async deserializeData(entry: CacheEntry): Promise<any> {
    if (!entry.metadata.compressed) {
      return entry.data;
    }

    return await this.compressionService.decompress(entry.data);
  }

  private async invalidate(pattern: string): Promise<void> {
    const allCaches = [this.hotCache, this.warmCache, this.coldCache];

    for (const cache of allCaches) {
      const keysToDelete: string[] = [];

      for (const key of cache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key);
      }
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching with wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private async cascadeInvalidation(sport: RacingSport, raceId: string): Promise<void> {
    // Implement cascade rules from configuration
    const rules = this.config.invalidationRules;

    for (const [collection, rule] of Object.entries(rules)) {
      for (const cascadeRule of rule.cascadeRules) {
        await this.invalidate(`${cascadeRule}:${sport}:${raceId}*`);
      }
    }
  }

  private async getUpcomingRaces(sport: RacingSport, limit: number): Promise<any[]> {
    // This would integrate with the database service
    // Placeholder implementation
    return [];
  }

  private async generateMLFeatures(race: any): Promise<MLFeatureVector[]> {
    // This would integrate with the feature extraction service
    // Placeholder implementation
    return [];
  }

  private startEvictionProcess(): void {
    setInterval(() => {
      this.performPeriodicEviction();
    }, 60000); // Every minute
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  private startPrefetchProcess(): void {
    setInterval(() => {
      this.performPrefetch();
    }, 300000); // Every 5 minutes
  }

  private async performPeriodicEviction(): Promise<void> {
    // Remove expired entries
    const now = new Date();

    [this.hotCache, this.warmCache, this.coldCache].forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        const expiryTime = new Date(entry.metadata.createdAt.getTime() + entry.metadata.ttl);
        if (now > expiryTime) {
          cache.delete(key);
        }
      }
    });
  }

  private collectMetrics(): void {
    // Update tier statistics
    this.stats.tierStats.hot.size = this.calculateCacheSize(this.hotCache);
    this.stats.tierStats.warm.size = this.calculateCacheSize(this.warmCache);
    this.stats.tierStats.cold.size = this.calculateCacheSize(this.coldCache);
  }

  private async performPrefetch(): Promise<void> {
    // Implement prefetch logic based on patterns
    for (const sport of ['nascar', 'horse_racing'] as RacingSport[]) {
      await this.prefetchUpcomingRaces(sport, 5);
    }
  }
}

// Helper services
class CompressionService {
  async compress(data: any): Promise<string> {
    // Implement compression (could use gzip, lz4, etc.)
    return JSON.stringify(data); // Placeholder
  }

  async decompress(compressedData: string): Promise<any> {
    // Implement decompression
    return JSON.parse(compressedData); // Placeholder
  }
}

class CacheMetricsCollector {
  collectMetrics(service: RacingCacheService): void {
    // Implement metrics collection for monitoring
  }
}

export default RacingCacheService;
