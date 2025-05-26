// =============================================================================
// FOOTBALL CACHE OPTIMIZATION SERVICE
// Advanced caching strategies for NFL & CFB with cost optimization
// =============================================================================

import * as admin from 'firebase-admin';
import { initSentry } from './sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface CacheConfig {
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'adaptive';
  ttl: number; // Time to live in milliseconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  refreshOnExpiry: boolean;
  maxSize?: number; // Maximum cache size in MB
  costWeight: number; // Cost factor for API calls (1-10)
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  apiCallsSaved: number;
  estimatedCostSavings: number;
  averageResponseTime: number;
  cacheSize: number;
  lastCleanup: Date;
}

export interface OptimizationRule {
  condition: (key: string, data: any, context: CacheContext) => boolean;
  action: 'extend_ttl' | 'reduce_ttl' | 'change_strategy' | 'compress' | 'encrypt' | 'purge';
  value?: any;
  reason: string;
}

export interface CacheContext {
  isGameDay: boolean;
  isPostseason: boolean;
  userTier: 'free' | 'premium' | 'admin';
  regionLoad: 'low' | 'medium' | 'high';
  timeOfDay: 'peak' | 'off-peak' | 'night';
  season: 'preseason' | 'regular' | 'postseason' | 'offseason';
}

export class FootballCacheOptimizationService {
  private db: admin.firestore.Firestore;
  private readonly CACHE_COLLECTION = 'football_cache_optimized';
  private readonly METRICS_COLLECTION = 'football_cache_metrics';
  
  // Base cache configurations optimized for football data
  private readonly CACHE_CONFIGS: Record<string, CacheConfig> = {
    // Critical real-time data
    'live_scores': {
      strategy: 'adaptive',
      ttl: 15000, // 15 seconds
      priority: 'critical',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: true,
      costWeight: 8,
    },
    'injury_reports': {
      strategy: 'network-first',
      ttl: 300000, // 5 minutes
      priority: 'critical',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: true,
      costWeight: 6,
    },
    'line_movements': {
      strategy: 'adaptive',
      ttl: 30000, // 30 seconds during games, longer otherwise
      priority: 'high',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: true,
      costWeight: 7,
    },

    // Frequently accessed data
    'team_stats': {
      strategy: 'cache-first',
      ttl: 3600000, // 1 hour
      priority: 'high',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 4,
    },
    'player_stats': {
      strategy: 'cache-first',
      ttl: 7200000, // 2 hours
      priority: 'medium',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 5,
    },
    'weather_data': {
      strategy: 'cache-first',
      ttl: 900000, // 15 minutes
      priority: 'medium',
      compressionEnabled: false,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 3,
    },

    // College football specific
    'transfer_portal': {
      strategy: 'network-first',
      ttl: 1800000, // 30 minutes
      priority: 'medium',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: true,
      costWeight: 4,
    },
    'recruiting_data': {
      strategy: 'cache-first',
      ttl: 21600000, // 6 hours
      priority: 'medium',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 3,
    },
    'coaching_changes': {
      strategy: 'network-first',
      ttl: 3600000, // 1 hour
      priority: 'medium',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: true,
      costWeight: 2,
    },

    // Infrequently changing data
    'team_rosters': {
      strategy: 'cache-first',
      ttl: 86400000, // 24 hours
      priority: 'low',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 2,
    },
    'historical_data': {
      strategy: 'cache-only',
      ttl: 604800000, // 7 days
      priority: 'low',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 1,
    },
    'venue_info': {
      strategy: 'cache-only',
      ttl: 2592000000, // 30 days
      priority: 'low',
      compressionEnabled: true,
      encryptionEnabled: false,
      refreshOnExpiry: false,
      costWeight: 1,
    },
  };

  // Dynamic optimization rules
  private readonly OPTIMIZATION_RULES: OptimizationRule[] = [
    // Game day optimizations
    {
      condition: (key, data, context) => context.isGameDay && key.includes('scores'),
      action: 'reduce_ttl',
      value: 10000, // 10 seconds during games
      reason: 'Game day real-time updates',
    },
    {
      condition: (key, data, context) => context.isGameDay && key.includes('weather'),
      action: 'reduce_ttl',
      value: 300000, // 5 minutes during games
      reason: 'Game day weather changes',
    },

    // Off-season optimizations
    {
      condition: (key, data, context) => context.season === 'offseason',
      action: 'extend_ttl',
      value: 2, // Double the TTL
      reason: 'Off-season data changes less frequently',
    },

    // Peak load optimizations
    {
      condition: (key, data, context) => context.regionLoad === 'high' && context.timeOfDay === 'peak',
      action: 'change_strategy',
      value: 'cache-first',
      reason: 'Reduce load during peak times',
    },

    // Premium user optimizations
    {
      condition: (key, data, context) => context.userTier === 'premium',
      action: 'reduce_ttl',
      value: 0.5, // Half the TTL for premium users
      reason: 'Premium users get fresher data',
    },

    // Cost optimization for large datasets
    {
      condition: (key, data, context) => {
        return typeof data === 'object' && 
               JSON.stringify(data).length > 100000 && // > 100KB
               context.timeOfDay === 'night';
      },
      action: 'compress',
      reason: 'Compress large datasets during low traffic',
    },
  ];

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Get data with optimized caching strategy
   */
  async get<T>(
    key: string, 
    fetchFunction: () => Promise<T>,
    context: CacheContext,
    customConfig?: Partial<CacheConfig>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Get cache configuration
      const config = this.getCacheConfig(key, customConfig);
      
      // Apply dynamic optimizations
      const optimizedConfig = this.applyOptimizationRules(key, config, context);
      
      // Check cache based on strategy
      const cachedResult = await this.checkCache(key, optimizedConfig, context);
      
      if (cachedResult.hit) {
        await this.recordMetric(key, 'hit', Date.now() - startTime);
        return cachedResult.data;
      }

      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Store in cache with optimizations
      await this.storeInCache(key, freshData, optimizedConfig, context);
      
      await this.recordMetric(key, 'miss', Date.now() - startTime);
      
      return freshData;
    } catch (error) {
      Sentry.captureException(error);
      await this.recordMetric(key, 'error', Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Check cache with strategy-specific logic
   */
  private async checkCache(
    key: string, 
    config: CacheConfig, 
    context: CacheContext
  ): Promise<{ hit: boolean; data?: any }> {
    const cacheDoc = await this.db
      .collection(this.CACHE_COLLECTION)
      .doc(key)
      .get();

    if (!cacheDoc.exists) {
      return { hit: false };
    }

    const cachedData = cacheDoc.data();
    const now = Date.now();
    const age = now - cachedData!.timestamp;
    const isExpired = age > config.ttl;

    switch (config.strategy) {
      case 'cache-only':
        return { hit: true, data: this.decompressData(cachedData!.data, config) };

      case 'cache-first':
        if (!isExpired) {
          return { hit: true, data: this.decompressData(cachedData!.data, config) };
        }
        return { hit: false };

      case 'network-first':
        // Always return false to fetch fresh data, but cache will be updated
        return { hit: false };

      case 'network-only':
        return { hit: false };

      case 'adaptive':
        return this.adaptiveStrategy(cachedData!, config, context, age);

      default:
        return { hit: false };
    }
  }

  /**
   * Adaptive caching strategy based on context
   */
  private adaptiveStrategy(
    cachedData: any, 
    config: CacheConfig, 
    context: CacheContext, 
    age: number
  ): { hit: boolean; data?: any } {
    const dynamicTTL = this.calculateDynamicTTL(config.ttl, context);
    
    if (age < dynamicTTL) {
      return { hit: true, data: this.decompressData(cachedData.data, config) };
    }

    // For critical data during games, use network-first approach
    if (config.priority === 'critical' && context.isGameDay) {
      return { hit: false };
    }

    // For non-critical data, extend cache during high load
    if (context.regionLoad === 'high' && config.priority !== 'critical') {
      const extendedTTL = dynamicTTL * 1.5;
      if (age < extendedTTL) {
        return { hit: true, data: this.decompressData(cachedData.data, config) };
      }
    }

    return { hit: false };
  }

  /**
   * Calculate dynamic TTL based on context
   */
  private calculateDynamicTTL(baseTTL: number, context: CacheContext): number {
    let multiplier = 1;

    // Game day adjustments
    if (context.isGameDay) {
      multiplier *= 0.3; // Reduce TTL by 70% during games
    }

    // Season adjustments
    switch (context.season) {
      case 'postseason':
        multiplier *= 0.5;
        break;
      case 'offseason':
        multiplier *= 2;
        break;
      case 'preseason':
        multiplier *= 1.5;
        break;
    }

    // Time of day adjustments
    switch (context.timeOfDay) {
      case 'peak':
        multiplier *= 0.8;
        break;
      case 'night':
        multiplier *= 1.5;
        break;
    }

    // Load adjustments
    if (context.regionLoad === 'high') {
      multiplier *= 1.2;
    }

    return Math.max(baseTTL * multiplier, 5000); // Minimum 5 seconds
  }

  /**
   * Store data in cache with optimizations
   */
  private async storeInCache(
    key: string, 
    data: any, 
    config: CacheConfig, 
    context: CacheContext
  ): Promise<void> {
    try {
      const compressedData = this.compressData(data, config);
      const encryptedData = config.encryptionEnabled ? 
        this.encryptData(compressedData) : compressedData;

      const cacheEntry = {
        data: encryptedData,
        timestamp: Date.now(),
        ttl: config.ttl,
        strategy: config.strategy,
        priority: config.priority,
        compressed: config.compressionEnabled,
        encrypted: config.encryptionEnabled,
        context: {
          season: context.season,
          isGameDay: context.isGameDay,
          userTier: context.userTier,
        },
        size: JSON.stringify(data).length,
      };

      await this.db
        .collection(this.CACHE_COLLECTION)
        .doc(key)
        .set(cacheEntry);

      // Check cache size limits
      if (config.maxSize) {
        await this.enforceMaxSize(config.maxSize);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Get cache configuration with fallback
   */
  private getCacheConfig(key: string, customConfig?: Partial<CacheConfig>): CacheConfig {
    // Find the best matching config
    const matchingConfigKey = Object.keys(this.CACHE_CONFIGS).find(configKey =>
      key.includes(configKey) || configKey.includes(key.split('_')[0])
    );

    const baseConfig = matchingConfigKey ? 
      this.CACHE_CONFIGS[matchingConfigKey] : 
      this.CACHE_CONFIGS['team_stats']; // Default config

    return { ...baseConfig, ...customConfig };
  }

  /**
   * Apply optimization rules to configuration
   */
  private applyOptimizationRules(
    key: string, 
    config: CacheConfig, 
    context: CacheContext
  ): CacheConfig {
    let optimizedConfig = { ...config };

    for (const rule of this.OPTIMIZATION_RULES) {
      if (rule.condition(key, null, context)) {
        switch (rule.action) {
          case 'extend_ttl':
            optimizedConfig.ttl *= typeof rule.value === 'number' ? rule.value : 2;
            break;
          case 'reduce_ttl':
            if (typeof rule.value === 'number') {
              optimizedConfig.ttl = rule.value < 1 ? 
                optimizedConfig.ttl * rule.value : rule.value;
            }
            break;
          case 'change_strategy':
            if (rule.value) {
              optimizedConfig.strategy = rule.value;
            }
            break;
          case 'compress':
            optimizedConfig.compressionEnabled = true;
            break;
          case 'encrypt':
            optimizedConfig.encryptionEnabled = true;
            break;
        }

        Sentry.addBreadcrumb({
          message: `Applied optimization rule: ${rule.action}`,
          data: { key, reason: rule.reason },
        });
      }
    }

    return optimizedConfig;
  }

  /**
   * Record cache metrics for analysis
   */
  private async recordMetric(
    key: string, 
    type: 'hit' | 'miss' | 'error', 
    responseTime: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metricDoc = this.db
        .collection(this.METRICS_COLLECTION)
        .doc(`${today}_${key}`);

      await metricDoc.set({
        key,
        date: today,
        [`${type}s`]: admin.firestore.FieldValue.increment(1),
        totalRequests: admin.firestore.FieldValue.increment(1),
        totalResponseTime: admin.firestore.FieldValue.increment(responseTime),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      // Don't throw on metric recording failures
      Sentry.captureException(error);
    }
  }

  /**
   * Get comprehensive cache metrics
   */
  async getCacheMetrics(days: number = 7): Promise<CacheMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const metricsQuery = await this.db
        .collection(this.METRICS_COLLECTION)
        .where('date', '>=', startDate.toISOString().split('T')[0])
        .where('date', '<=', endDate.toISOString().split('T')[0])
        .get();

      let totalHits = 0;
      let totalMisses = 0;
      let totalRequests = 0;
      let totalResponseTime = 0;
      let cacheSize = 0;

      for (const doc of metricsQuery.docs) {
        const data = doc.data();
        totalHits += data.hits || 0;
        totalMisses += data.misses || 0;
        totalRequests += data.totalRequests || 0;
        totalResponseTime += data.totalResponseTime || 0;
      }

      // Get cache size
      const cacheQuery = await this.db
        .collection(this.CACHE_COLLECTION)
        .get();

      cacheSize = cacheQuery.docs.reduce((sum, doc) => {
        return sum + (doc.data().size || 0);
      }, 0);

      const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
      const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
      
      // Estimate cost savings (assuming $0.001 per API call)
      const apiCallsSaved = totalHits;
      const estimatedCostSavings = apiCallsSaved * 0.001;

      return {
        hits: totalHits,
        misses: totalMisses,
        hitRate,
        totalRequests,
        apiCallsSaved,
        estimatedCostSavings,
        averageResponseTime,
        cacheSize: cacheSize / (1024 * 1024), // Convert to MB
        lastCleanup: new Date(), // TODO: Track actual cleanup times
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get cache metrics: ${error.message}`);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<{ deletedEntries: number; freedSpace: number }> {
    try {
      const now = Date.now();
      const expiredQuery = await this.db
        .collection(this.CACHE_COLLECTION)
        .get();

      const expiredDocs = expiredQuery.docs.filter(doc => {
        const data = doc.data();
        return (now - data.timestamp) > data.ttl;
      });

      let freedSpace = 0;
      const batch = this.db.batch();

      for (const doc of expiredDocs) {
        freedSpace += doc.data().size || 0;
        batch.delete(doc.ref);
      }

      if (expiredDocs.length > 0) {
        await batch.commit();
      }

      console.log(`Cleaned up ${expiredDocs.length} expired cache entries, freed ${freedSpace} bytes`);

      return {
        deletedEntries: expiredDocs.length,
        freedSpace: freedSpace / (1024 * 1024), // Convert to MB
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Cache cleanup failed: ${error.message}`);
    }
  }

  /**
   * Optimize cache for cost and performance
   */
  async optimizeCache(): Promise<{
    optimizationsApplied: number;
    estimatedSavings: number;
    recommendations: string[];
  }> {
    const metrics = await this.getCacheMetrics(7);
    const recommendations: string[] = [];
    let optimizationsApplied = 0;
    let estimatedSavings = 0;

    // Low hit rate optimization
    if (metrics.hitRate < 60) {
      recommendations.push('Consider increasing TTL for frequently accessed data');
      recommendations.push('Review cache strategies for low-performing keys');
    }

    // High memory usage optimization
    if (metrics.cacheSize > 100) { // > 100MB
      await this.cleanupExpiredCache();
      optimizationsApplied++;
      recommendations.push('Enable compression for large datasets');
    }

    // Performance optimization
    if (metrics.averageResponseTime > 1000) { // > 1 second
      recommendations.push('Consider cache-first strategy for slow endpoints');
      recommendations.push('Implement request batching for related data');
    }

    // Cost optimization
    const potentialSavings = metrics.misses * 0.001; // Potential API cost savings
    if (potentialSavings > 10) { // > $10 potential savings
      recommendations.push('Implement smarter prefetching strategies');
      estimatedSavings = potentialSavings * 0.7; // 70% of potential savings
    }

    return {
      optimizationsApplied,
      estimatedSavings,
      recommendations,
    };
  }

  /**
   * Utility methods for data compression/encryption
   */
  private compressData(data: any, config: CacheConfig): any {
    if (!config.compressionEnabled) return data;
    
    // Simple JSON compression - in production, use proper compression library
    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > 10000) { // Only compress large objects
        // Placeholder for actual compression
        return { compressed: true, data: jsonString };
      }
    } catch (error) {
      Sentry.captureException(error);
    }
    
    return data;
  }

  private decompressData(data: any, config: CacheConfig): any {
    if (!config.compressionEnabled) return data;
    
    try {
      if (data && data.compressed) {
        return JSON.parse(data.data);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
    
    return data;
  }

  private encryptData(data: any): any {
    // Placeholder for encryption - implement with proper encryption library
    return data;
  }

  private async enforceMaxSize(maxSizeMB: number): Promise<void> {
    // Implement LRU eviction or similar strategy
    // For now, just cleanup expired entries
    await this.cleanupExpiredCache();
  }

  /**
   * Prefetch commonly accessed data
   */
  async prefetchCommonData(context: CacheContext): Promise<void> {
    try {
      const prefetchKeys = this.getPrefetchKeys(context);
      
      // TODO: Implement actual prefetching logic based on usage patterns
      console.log(`Prefetching ${prefetchKeys.length} common data keys`);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private getPrefetchKeys(context: CacheContext): string[] {
    const keys: string[] = [];

    if (context.isGameDay) {
      keys.push('live_scores', 'injury_reports', 'weather_data');
    }

    if (context.season === 'regular') {
      keys.push('team_stats', 'player_stats', 'line_movements');
    }

    return keys;
  }
}

export const footballCacheOptimizationService = new FootballCacheOptimizationService();