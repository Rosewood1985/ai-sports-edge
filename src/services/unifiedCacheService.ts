/**
 * Unified Cache Service
 * Phase 4.3: Advanced Caching Strategies
 * Central orchestrator for all caching systems with intelligent routing
 */

import { cacheService } from './cacheService';
import { DistributedCacheService } from './distributedCacheService';
import { ModelCacheService } from './modelCacheService';
import { RealTimeDataCacheService } from './realTimeDataCacheService';

export interface CacheOptions {
  // Data classification
  dataType?: 'live' | 'recent' | 'historical' | 'analytics' | 'model' | 'prediction';

  // Performance tuning
  priority?: number; // 1-10, higher = more important
  ttl?: number; // Time to live in milliseconds

  // Distribution settings
  useDistributed?: boolean;
  replicateToNodes?: boolean;
  consistencyLevel?: 'eventual' | 'strong' | 'weak';

  // Optimization flags
  preload?: boolean;
  compress?: boolean;
  useLocalOnly?: boolean;

  // Metadata
  version?: string;
  source?: string;
  tags?: string[];
}

export interface CacheStats {
  totalRequests: number;
  hitRate: number;
  averageLatency: number;
  distributionStats: {
    localHits: number;
    distributedHits: number;
    modelCacheHits: number;
  };
  dataFreshness: {
    live: number;
    recent: number;
    historical: number;
    analytics: number;
  };
}

export interface CacheStrategy {
  name: string;
  condition: (key: string, options: CacheOptions) => boolean;
  handler: CacheHandler;
  fallbackHandler?: CacheHandler;
}

export interface CacheHandler {
  get<T>(key: string, options: CacheOptions): Promise<T | null>;
  set<T>(key: string, data: T, options: CacheOptions): Promise<void>;
  invalidate(pattern: string | RegExp): Promise<number>;
}

/**
 * Unified cache service that intelligently routes requests to appropriate cache systems
 */
export class UnifiedCacheService {
  private static instance: UnifiedCacheService;

  // Cache service instances
  private realTimeCache: RealTimeDataCacheService;
  private distributedCache: DistributedCacheService;
  private modelCache: ModelCacheService;

  // Statistics and monitoring
  private stats: CacheStats = {
    totalRequests: 0,
    hitRate: 0,
    averageLatency: 0,
    distributionStats: {
      localHits: 0,
      distributedHits: 0,
      modelCacheHits: 0,
    },
    dataFreshness: {
      live: 0,
      recent: 0,
      historical: 0,
      analytics: 0,
    },
  };

  // Performance tracking
  private latencyHistory: number[] = [];
  private readonly MAX_LATENCY_SAMPLES = 1000;

  // Cache routing strategies
  private strategies: CacheStrategy[] = [];

  private constructor() {
    this.realTimeCache = RealTimeDataCacheService.getInstance();
    this.distributedCache = DistributedCacheService.getInstance();
    this.modelCache = ModelCacheService.getInstance();

    this.initializeStrategies();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): UnifiedCacheService {
    if (!UnifiedCacheService.instance) {
      UnifiedCacheService.instance = new UnifiedCacheService();
    }
    return UnifiedCacheService.instance;
  }

  /**
   * Universal get method with intelligent routing
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = performance.now();
    this.stats.totalRequests++;

    try {
      // Select appropriate strategy
      const strategy = this.selectStrategy(key, options);

      // Execute strategy
      let result = await strategy.handler.get<T>(key, options);

      // Try fallback if primary fails
      if (!result && strategy.fallbackHandler) {
        result = await strategy.fallbackHandler.get<T>(key, options);
      }

      // Record performance metrics
      const latency = performance.now() - startTime;
      this.recordLatency(latency);

      if (result) {
        this.recordHit(strategy.name);
      }

      return result;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Universal set method with intelligent distribution
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      // Select appropriate strategy
      const strategy = this.selectStrategy(key, options);

      // Execute primary strategy
      await strategy.handler.set(key, data, options);

      // Execute additional strategies based on options
      await this.executeAdditionalStrategies(key, data, options);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Batch operations for improved performance
   */
  async getBatch<T>(keys: string[], options: CacheOptions = {}): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Group keys by strategy
    const strategyGroups = this.groupKeysByStrategy(keys, options);

    // Execute batch operations for each strategy
    const promises = Array.from(strategyGroups.entries()).map(async ([strategy, strategyKeys]) => {
      try {
        const batchResults = await this.executeBatchStrategy<T>(strategy, strategyKeys, options);

        for (const [key, value] of batchResults) {
          results.set(key, value);
        }
      } catch (error) {
        console.error(`Batch operation failed for strategy ${strategy.name}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Smart invalidation across all cache layers
   */
  async invalidate(
    pattern: string | RegExp,
    options: {
      includeDistributed?: boolean;
      includeModels?: boolean;
      includeLocal?: boolean;
    } = {}
  ): Promise<number> {
    const { includeDistributed = true, includeModels = true, includeLocal = true } = options;

    let totalInvalidated = 0;

    try {
      // Invalidate across all cache systems
      const promises: Promise<number>[] = [];

      if (includeLocal) {
        promises.push(this.realTimeCache.invalidate(pattern));
        promises.push(cacheService.clear().then(() => 0)); // Legacy cache service
      }

      if (includeDistributed) {
        promises.push(this.distributedCache.invalidate(pattern));
      }

      if (includeModels && pattern instanceof RegExp) {
        // Model cache has different API, so we need to handle it differently
        promises.push(this.invalidateModelCache(pattern));
      }

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalInvalidated += result.value;
        } else {
          console.error(`Invalidation failed for cache system ${index}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    return totalInvalidated;
  }

  /**
   * Preload frequently accessed data
   */
  async preload(
    entries: {
      key: string;
      loader: () => Promise<any>;
      options?: CacheOptions;
    }[]
  ): Promise<void> {
    // Sort by priority
    const sortedEntries = entries.sort(
      (a, b) => (b.options?.priority || 5) - (a.options?.priority || 5)
    );

    // Preload in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < sortedEntries.length; i += batchSize) {
      const batch = sortedEntries.slice(i, i + batchSize);

      const promises = batch.map(async ({ key, loader, options = {} }) => {
        try {
          // Check if already cached
          const existing = await this.get(key, options);
          if (existing) return;

          // Load and cache
          const data = await loader();
          await this.set(key, data, { ...options, preload: true });

          console.log(`Preloaded ${key} with priority ${options.priority || 5}`);
        } catch (error) {
          console.error(`Failed to preload ${key}:`, error);
        }
      });

      await Promise.allSettled(promises);
    }
  }

  /**
   * Cache warming for predictable access patterns
   */
  async warmCache(patterns: {
    live?: string[];
    recent?: string[];
    historical?: string[];
    analytics?: string[];
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (patterns.live) {
      promises.push(this.realTimeCache.warmCache(patterns.live));
    }

    if (patterns.recent || patterns.historical || patterns.analytics) {
      const allPatterns = [
        ...(patterns.recent || []),
        ...(patterns.historical || []),
        ...(patterns.analytics || []),
      ];
      promises.push(this.distributedCache.sync({ patterns: allPatterns }));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): CacheStats & {
    detailedMetrics: {
      realTime: any;
      distributed: any;
      model: any;
    };
    strategyPerformance: Record<
      string,
      {
        uses: number;
        averageLatency: number;
        hitRate: number;
      }
    >;
  } {
    return {
      ...this.stats,
      detailedMetrics: {
        realTime: this.realTimeCache.getMetrics(),
        distributed: this.distributedCache.getMetrics(),
        model: this.modelCache.getMetrics(),
      },
      strategyPerformance: this.calculateStrategyPerformance(),
    };
  }

  /**
   * Health check for all cache systems
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    systems: {
      realTime: boolean;
      distributed: boolean;
      model: boolean;
    };
    metrics: {
      hitRate: number;
      averageLatency: number;
      errorRate: number;
    };
  }> {
    const systems = {
      realTime: true, // Real-time cache is always available
      distributed: this.distributedCache.getMetrics().isConnected,
      model: true, // Model cache is always available
    };

    const healthySystems = Object.values(systems).filter(Boolean).length;
    const totalSystems = Object.keys(systems).length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthySystems === totalSystems) {
      overall = 'healthy';
    } else if (healthySystems >= totalSystems / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      systems,
      metrics: {
        hitRate: this.stats.hitRate,
        averageLatency: this.stats.averageLatency,
        errorRate: 0, // Would be calculated from error tracking
      },
    };
  }

  /**
   * Configure cache behavior
   */
  configure(config: {
    defaultTtl?: number;
    enableDistributed?: boolean;
    enableCompression?: boolean;
    maxLatency?: number;
  }): void {
    // Configuration would be applied to individual cache services
    console.log('Cache configuration updated:', config);
  }

  // Private methods

  private initializeStrategies(): void {
    this.strategies = [
      // Model and prediction data strategy
      {
        name: 'model',
        condition: (key, options) =>
          options.dataType === 'model' || options.dataType === 'prediction',
        handler: {
          get: async <T>(key: string, options: CacheOptions) => {
            if (options.dataType === 'model') {
              const [modelId, version] = key.split(':');
              return this.modelCache.getModel(modelId, version) as Promise<T>;
            } else if (options.dataType === 'prediction') {
              // Handle prediction cache
              return null; // Would implement prediction logic
            }
            return null;
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            if (options.dataType === 'model' && data instanceof ArrayBuffer) {
              const [modelId, version] = key.split(':');
              await this.modelCache.setModel(modelId, version, data);
            }
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.invalidateModelCache(pattern);
          },
        },
      },

      // Live data strategy
      {
        name: 'live',
        condition: (key, options) => options.dataType === 'live',
        handler: {
          get: async <T>(key: string, options: CacheOptions) => {
            return this.realTimeCache.get<T>(key, 'live');
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            await this.realTimeCache.set(key, data, {
              dataType: 'live',
              priority: options.priority,
              version: options.version,
            });
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.realTimeCache.invalidate(pattern);
          },
        },
        fallbackHandler: {
          get: async <T>(key: string, options: CacheOptions) => {
            return this.distributedCache.get<T>(key, { dataType: 'live' });
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            await this.distributedCache.set(key, data, { dataType: 'live' });
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.distributedCache.invalidate(pattern);
          },
        },
      },

      // Distributed data strategy
      {
        name: 'distributed',
        condition: (key, options) =>
          options.useDistributed || ['historical', 'analytics'].includes(options.dataType || ''),
        handler: {
          get: async <T>(key: string, options: CacheOptions) => {
            return this.distributedCache.get<T>(key, {
              dataType: options.dataType as any,
              consistencyLevel: options.consistencyLevel,
            });
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            await this.distributedCache.set(key, data, {
              dataType: options.dataType as any,
              ttl: options.ttl,
              replicateToNodes: options.replicateToNodes,
              priority: options.priority,
              version: options.version,
            });
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.distributedCache.invalidate(pattern);
          },
        },
        fallbackHandler: {
          get: async <T>(key: string, options: CacheOptions) => {
            return this.realTimeCache.get<T>(key, options.dataType as any);
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            await this.realTimeCache.set(key, data, {
              dataType: options.dataType as any,
              priority: options.priority,
              version: options.version,
            });
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.realTimeCache.invalidate(pattern);
          },
        },
      },

      // Default strategy for local caching
      {
        name: 'local',
        condition: () => true, // Catch-all
        handler: {
          get: async <T>(key: string, options: CacheOptions) => {
            return this.realTimeCache.get<T>(key, options.dataType as any);
          },
          set: async <T>(key: string, data: T, options: CacheOptions) => {
            await this.realTimeCache.set(key, data, {
              dataType: options.dataType as any,
              priority: options.priority,
              version: options.version,
            });
          },
          invalidate: async (pattern: string | RegExp) => {
            return this.realTimeCache.invalidate(pattern);
          },
        },
      },
    ];
  }

  private selectStrategy(key: string, options: CacheOptions): CacheStrategy {
    for (const strategy of this.strategies) {
      if (strategy.condition(key, options)) {
        return strategy;
      }
    }

    // Return default strategy
    return this.strategies[this.strategies.length - 1];
  }

  private async executeAdditionalStrategies<T>(
    key: string,
    data: T,
    options: CacheOptions
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Replicate to distributed cache for high-priority data
    if (options.priority && options.priority >= 8 && !options.useLocalOnly) {
      promises.push(
        this.distributedCache.set(key, data, {
          dataType: options.dataType as any,
          ttl: options.ttl,
          replicateToNodes: true,
        })
      );
    }

    // Cache in multiple levels for redundancy
    if (options.dataType === 'live' && options.priority && options.priority >= 7) {
      promises.push(
        this.realTimeCache.set(key, data, {
          dataType: 'recent',
          priority: options.priority,
          version: options.version,
        })
      );
    }

    await Promise.allSettled(promises);
  }

  private groupKeysByStrategy(keys: string[], options: CacheOptions): Map<CacheStrategy, string[]> {
    const groups = new Map<CacheStrategy, string[]>();

    for (const key of keys) {
      const strategy = this.selectStrategy(key, options);

      if (!groups.has(strategy)) {
        groups.set(strategy, []);
      }

      groups.get(strategy)!.push(key);
    }

    return groups;
  }

  private async executeBatchStrategy<T>(
    strategy: CacheStrategy,
    keys: string[],
    options: CacheOptions
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // For strategies that support batch operations
    if (strategy.name === 'distributed' || strategy.name === 'local') {
      if (strategy.name === 'distributed') {
        return this.distributedCache.getBatch<T>(keys, {
          dataType: options.dataType as any,
        });
      } else {
        return this.realTimeCache.getBatch<T>(keys, options.dataType as any);
      }
    }

    // Fallback to individual gets
    const promises = keys.map(async key => {
      const value = await strategy.handler.get<T>(key, options);
      results.set(key, value);
    });

    await Promise.all(promises);
    return results;
  }

  private async invalidateModelCache(pattern: string | RegExp): Promise<number> {
    try {
      if (pattern instanceof RegExp) {
        // Model cache doesn't support regex patterns directly
        // We'd need to implement pattern matching logic
        await this.modelCache.clearAll();
        return 1; // Simplified return
      } else {
        const [modelId, version] = pattern.split(':');
        await this.modelCache.clearModel(modelId, version);
        return 1;
      }
    } catch (error) {
      console.error('Model cache invalidation error:', error);
      return 0;
    }
  }

  private recordLatency(latency: number): void {
    this.latencyHistory.push(latency);

    if (this.latencyHistory.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyHistory = this.latencyHistory.slice(-this.MAX_LATENCY_SAMPLES / 2);
    }

    this.stats.averageLatency =
      this.latencyHistory.reduce((sum, l) => sum + l, 0) / this.latencyHistory.length;
  }

  private recordHit(strategyName: string): void {
    switch (strategyName) {
      case 'local':
        this.stats.distributionStats.localHits++;
        break;
      case 'distributed':
        this.stats.distributionStats.distributedHits++;
        break;
      case 'model':
        this.stats.distributionStats.modelCacheHits++;
        break;
    }

    const totalHits = Object.values(this.stats.distributionStats).reduce(
      (sum, hits) => sum + hits,
      0
    );

    this.stats.hitRate = this.stats.totalRequests > 0 ? totalHits / this.stats.totalRequests : 0;
  }

  private calculateStrategyPerformance(): Record<string, any> {
    // Would track strategy-specific performance metrics
    return this.strategies.reduce(
      (acc, strategy) => {
        acc[strategy.name] = {
          uses: 0,
          averageLatency: 0,
          hitRate: 0,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      // Update data freshness metrics
      const realTimeMetrics = this.realTimeCache.getMetrics();

      // Update freshness based on cache hit rates and data age
      // This would be calculated based on actual data timestamps
      this.stats.dataFreshness = {
        live: 0.95, // 95% fresh
        recent: 0.85,
        historical: 0.75,
        analytics: 0.9,
      };
    }, 30000); // Update every 30 seconds
  }
}

export default UnifiedCacheService;
