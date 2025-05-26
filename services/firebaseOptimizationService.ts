// =============================================================================
// FIREBASE OPTIMIZATION SERVICE
// Advanced Query Optimization, Caching, and Performance Monitoring
// =============================================================================

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  QuerySnapshot, 
  DocumentSnapshot,
  QueryConstraint,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import * as Sentry from '@sentry/react-native';

// =============================================================================
// INTERFACES
// =============================================================================

export interface QueryCacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  queryKey: string;
  version: number;
}

export interface QueryMetrics {
  queryKey: string;
  executionTime: number;
  resultCount: number;
  cacheHit: boolean;
  timestamp: Date;
  queryPath: string;
  constraints: string[];
}

export interface BatchOperationConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  persistLocal: boolean; // Whether to persist cache to local storage
  invalidateOnMutation: boolean; // Auto-invalidate related queries on writes
}

export interface OptimizedQueryOptions {
  useCache?: boolean;
  cacheTtl?: number;
  enablePagination?: boolean;
  pageSize?: number;
  enableMetrics?: boolean;
  timeoutMs?: number;
  retryAttempts?: number;
}

// =============================================================================
// FIREBASE OPTIMIZATION SERVICE
// =============================================================================

export class FirebaseOptimizationService {
  private cache = new Map<string, QueryCacheItem>();
  private queryMetrics: QueryMetrics[] = [];
  private pendingQueries = new Map<string, Promise<any>>();
  
  private readonly defaultCacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    persistLocal: true,
    invalidateOnMutation: true,
  };

  private readonly defaultBatchConfig: BatchOperationConfig = {
    batchSize: 25,
    delayBetweenBatches: 100,
    maxConcurrentBatches: 3,
    retryAttempts: 3,
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize optimization service
   */
  private async initialize(): Promise<void> {
    try {
      // Setup cache cleanup interval
      this.setupCacheCleanup();
      
      // Setup metrics collection
      this.setupMetricsCollection();
      
      // Load persisted cache if enabled
      await this.loadPersistedCache();
      
      Sentry.addBreadcrumb({
        message: 'Firebase Optimization Service initialized',
        category: 'firebase.optimization.init',
        level: 'info',
      });

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error initializing Firebase Optimization Service:', error);
    }
  }

  // =============================================================================
  // OPTIMIZED QUERY METHODS
  // =============================================================================

  /**
   * Execute optimized collection query with caching and metrics
   */
  async optimizedCollectionQuery<T = any>(
    collectionPath: string,
    constraints: QueryConstraint[] = [],
    options: OptimizedQueryOptions = {}
  ): Promise<T[]> {
    const queryKey = this.generateQueryKey(collectionPath, constraints);
    const startTime = Date.now();

    try {
      // Check cache first if enabled
      if (options.useCache !== false) {
        const cached = this.getCachedResult<T[]>(queryKey);
        if (cached) {
          this.recordMetrics({
            queryKey,
            executionTime: Date.now() - startTime,
            resultCount: cached.length,
            cacheHit: true,
            timestamp: new Date(),
            queryPath: collectionPath,
            constraints: constraints.map(c => c.toString()),
          });
          return cached;
        }
      }

      // Check for duplicate pending queries
      if (this.pendingQueries.has(queryKey)) {
        return await this.pendingQueries.get(queryKey);
      }

      // Execute query with timeout and retry logic
      const queryPromise = this.executeQueryWithRetry(
        () => this.executeCollectionQuery<T>(collectionPath, constraints),
        options.retryAttempts || 3,
        options.timeoutMs || 10000
      );

      this.pendingQueries.set(queryKey, queryPromise);

      const result = await queryPromise;
      
      // Cache result if enabled
      if (options.useCache !== false) {
        this.setCacheResult(queryKey, result, options.cacheTtl);
      }

      // Record metrics
      if (options.enableMetrics !== false) {
        this.recordMetrics({
          queryKey,
          executionTime: Date.now() - startTime,
          resultCount: result.length,
          cacheHit: false,
          timestamp: new Date(),
          queryPath: collectionPath,
          constraints: constraints.map(c => c.toString()),
        });
      }

      this.pendingQueries.delete(queryKey);
      return result;

    } catch (error) {
      this.pendingQueries.delete(queryKey);
      Sentry.captureException(error);
      throw new Error(`Optimized query failed for ${collectionPath}: ${error.message}`);
    }
  }

  /**
   * Execute optimized document query with caching
   */
  async optimizedDocumentQuery<T = any>(
    documentPath: string,
    options: OptimizedQueryOptions = {}
  ): Promise<T | null> {
    const queryKey = `doc_${documentPath}`;
    const startTime = Date.now();

    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getCachedResult<T>(queryKey);
        if (cached) {
          this.recordMetrics({
            queryKey,
            executionTime: Date.now() - startTime,
            resultCount: 1,
            cacheHit: true,
            timestamp: new Date(),
            queryPath: documentPath,
            constraints: [],
          });
          return cached;
        }
      }

      // Execute query
      const result = await this.executeDocumentQuery<T>(documentPath);
      
      // Cache result
      if (options.useCache !== false && result) {
        this.setCacheResult(queryKey, result, options.cacheTtl);
      }

      // Record metrics
      this.recordMetrics({
        queryKey,
        executionTime: Date.now() - startTime,
        resultCount: result ? 1 : 0,
        cacheHit: false,
        timestamp: new Date(),
        queryPath: documentPath,
        constraints: [],
      });

      return result;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Optimized document query failed for ${documentPath}: ${error.message}`);
    }
  }

  /**
   * Execute paginated query with optimizations
   */
  async optimizedPaginatedQuery<T = any>(
    collectionPath: string,
    constraints: QueryConstraint[] = [],
    pageSize: number = 25,
    lastDoc?: DocumentSnapshot,
    options: OptimizedQueryOptions = {}
  ): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      const paginationConstraints = [...constraints];
      
      if (lastDoc) {
        paginationConstraints.push(startAfter(lastDoc));
      }
      
      paginationConstraints.push(limit(pageSize + 1)); // +1 to check if there are more

      const queryKey = this.generateQueryKey(collectionPath, paginationConstraints);
      const startTime = Date.now();

      // Execute query
      const queryRef = query(collection(db, collectionPath), ...paginationConstraints);
      const snapshot = await getDocs(queryRef);
      
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;
      const data = docs.slice(0, pageSize).map(doc => ({ id: doc.id, ...doc.data() }) as T);
      const newLastDoc = docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null;

      // Record metrics
      this.recordMetrics({
        queryKey,
        executionTime: Date.now() - startTime,
        resultCount: data.length,
        cacheHit: false,
        timestamp: new Date(),
        queryPath: collectionPath,
        constraints: paginationConstraints.map(c => c.toString()),
      });

      return {
        data,
        lastDoc: newLastDoc,
        hasMore,
      };

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Paginated query failed for ${collectionPath}: ${error.message}`);
    }
  }

  /**
   * Execute batch operations with optimizations
   */
  async optimizedBatchOperation<T>(
    items: T[],
    operationFn: (batch: T[]) => Promise<any>,
    config: Partial<BatchOperationConfig> = {}
  ): Promise<any[]> {
    const batchConfig = { ...this.defaultBatchConfig, ...config };
    const results: any[] = [];
    const batches: T[][] = [];

    // Split into batches
    for (let i = 0; i < items.length; i += batchConfig.batchSize) {
      batches.push(items.slice(i, i + batchConfig.batchSize));
    }

    try {
      // Process batches with concurrency control
      for (let i = 0; i < batches.length; i += batchConfig.maxConcurrentBatches) {
        const currentBatches = batches.slice(i, i + batchConfig.maxConcurrentBatches);
        
        const batchPromises = currentBatches.map(async (batch, index) => {
          // Add delay between batches to avoid rate limiting
          if (i + index > 0) {
            await this.delay(batchConfig.delayBetweenBatches);
          }
          
          return await this.executeWithRetry(
            () => operationFn(batch),
            batchConfig.retryAttempts
          );
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return results;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Batch operation failed: ${error.message}`);
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  /**
   * Get cached result if valid
   */
  private getCachedResult<T>(queryKey: string): T | null {
    const cached = this.cache.get(queryKey);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(queryKey);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache result
   */
  private setCacheResult<T>(queryKey: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.defaultCacheConfig.ttl;
    const cacheItem: QueryCacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      queryKey,
      version: 1,
    };

    // Check cache size and cleanup if needed
    if (this.cache.size >= this.defaultCacheConfig.maxSize) {
      this.cleanupOldestCacheEntries();
    }

    this.cache.set(queryKey, cacheItem);
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );

    keysToDelete.forEach(key => this.cache.delete(key));

    Sentry.addBreadcrumb({
      message: `Cache invalidated for pattern: ${pattern}`,
      category: 'firebase.optimization.cache',
      level: 'info',
    });
  }

  /**
   * Cleanup oldest cache entries
   */
  private cleanupOldestCacheEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toDelete = Math.ceil(this.cache.size * 0.2); // Delete 20% of oldest entries
    
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Setup cache cleanup interval
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys = Array.from(this.cache.entries())
        .filter(([, item]) => now > item.expiresAt)
        .map(([key]) => key);

      expiredKeys.forEach(key => this.cache.delete(key));
    }, 60000); // Cleanup every minute
  }

  // =============================================================================
  // QUERY EXECUTION HELPERS
  // =============================================================================

  /**
   * Execute collection query
   */
  private async executeCollectionQuery<T>(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    const queryRef = query(collection(db, collectionPath), ...constraints);
    const snapshot = await getDocs(queryRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }) as T);
  }

  /**
   * Execute document query
   */
  private async executeDocumentQuery<T>(documentPath: string): Promise<T | null> {
    const docRef = doc(db, documentPath);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as T;
  }

  /**
   * Execute query with retry logic
   */
  private async executeQueryWithRetry<T>(
    queryFn: () => Promise<T>,
    retryAttempts: number,
    timeoutMs: number
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.withTimeout(queryFn(), timeoutMs),
      retryAttempts
    );
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryAttempts: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.delay(delay);
          continue;
        }
      }
    }

    throw lastError;
  }

  /**
   * Add timeout to promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // =============================================================================
  // METRICS AND MONITORING
  // =============================================================================

  /**
   * Record query metrics
   */
  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (metrics.executionTime > 1000) {
      Sentry.addBreadcrumb({
        message: `Slow query detected: ${metrics.queryPath}`,
        category: 'firebase.optimization.performance',
        level: 'warning',
        data: {
          executionTime: metrics.executionTime,
          queryKey: metrics.queryKey,
          resultCount: metrics.resultCount,
        },
      });
    }
  }

  /**
   * Get query performance analytics
   */
  getQueryAnalytics(): {
    averageQueryTime: number;
    slowQueries: QueryMetrics[];
    cacheHitRate: number;
    totalQueries: number;
    mostExpensiveQueries: QueryMetrics[];
  } {
    if (this.queryMetrics.length === 0) {
      return {
        averageQueryTime: 0,
        slowQueries: [],
        cacheHitRate: 0,
        totalQueries: 0,
        mostExpensiveQueries: [],
      };
    }

    const totalQueries = this.queryMetrics.length;
    const averageQueryTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;
    
    const slowQueries = this.queryMetrics
      .filter(m => m.executionTime > 500)
      .sort((a, b) => b.executionTime - a.executionTime);

    const mostExpensiveQueries = [...this.queryMetrics]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalQueries,
      mostExpensiveQueries,
    };
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    // Send metrics to Sentry every 5 minutes
    setInterval(() => {
      const analytics = this.getQueryAnalytics();
      
      if (analytics.totalQueries > 0) {
        Sentry.addBreadcrumb({
          message: 'Firebase query analytics',
          category: 'firebase.optimization.analytics',
          level: 'info',
          data: analytics,
        });
      }
    }, 5 * 60 * 1000);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Generate unique query key for caching
   */
  private generateQueryKey(collectionPath: string, constraints: QueryConstraint[]): string {
    const constraintStrings = constraints.map(constraint => {
      // Convert constraint to string representation
      return constraint.toString();
    }).sort(); // Sort to ensure consistent keys regardless of constraint order

    return `${collectionPath}_${constraintStrings.join('_')}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Load persisted cache from local storage
   */
  private async loadPersistedCache(): Promise<void> {
    if (!this.defaultCacheConfig.persistLocal) {
      return;
    }

    try {
      // Implementation would depend on the platform (React Native vs Web)
      // For now, we'll skip local persistence
      console.log('Cache persistence not implemented for this platform');
    } catch (error) {
      console.error('Error loading persisted cache:', error);
    }
  }

  /**
   * Clear all caches and reset metrics
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.queryMetrics = [];
    this.pendingQueries.clear();
    
    Sentry.addBreadcrumb({
      message: 'All caches cleared',
      category: 'firebase.optimization.cache',
      level: 'info',
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAge: number;
  } {
    const now = Date.now();
    const cacheEntries = Array.from(this.cache.values());
    
    if (cacheEntries.length === 0) {
      return {
        size: 0,
        maxSize: this.defaultCacheConfig.maxSize,
        hitRate: 0,
        averageAge: 0,
      };
    }

    const totalAge = cacheEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0);
    const averageAge = Math.round(totalAge / cacheEntries.length / 1000); // Convert to seconds

    const analytics = this.getQueryAnalytics();

    return {
      size: this.cache.size,
      maxSize: this.defaultCacheConfig.maxSize,
      hitRate: analytics.cacheHitRate,
      averageAge,
    };
  }
}

// =============================================================================
// OPTIMIZED QUERY BUILDERS
// =============================================================================

export class OptimizedQueryBuilder {
  private constraints: QueryConstraint[] = [];
  private collectionPath: string;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  where(field: string, operator: any, value: any): OptimizedQueryBuilder {
    this.constraints.push(where(field, operator, value));
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): OptimizedQueryBuilder {
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  limit(count: number): OptimizedQueryBuilder {
    this.constraints.push(limit(count));
    return this;
  }

  async execute<T>(options: OptimizedQueryOptions = {}): Promise<T[]> {
    const optimizationService = new FirebaseOptimizationService();
    return optimizationService.optimizedCollectionQuery<T>(
      this.collectionPath,
      this.constraints,
      options
    );
  }

  async executePaginated<T>(
    pageSize: number = 25,
    lastDoc?: DocumentSnapshot,
    options: OptimizedQueryOptions = {}
  ): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
    const optimizationService = new FirebaseOptimizationService();
    return optimizationService.optimizedPaginatedQuery<T>(
      this.collectionPath,
      this.constraints,
      pageSize,
      lastDoc,
      options
    );
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const firebaseOptimizationService = new FirebaseOptimizationService();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create optimized query builder
 */
export function optimizedQuery(collectionPath: string): OptimizedQueryBuilder {
  return new OptimizedQueryBuilder(collectionPath);
}

/**
 * Execute optimized batch write operations
 */
export async function optimizedBatchWrite<T>(
  items: T[],
  writeFn: (batch: T[]) => Promise<any>,
  config?: Partial<BatchOperationConfig>
): Promise<any[]> {
  return firebaseOptimizationService.optimizedBatchOperation(items, writeFn, config);
}

/**
 * Invalidate cache for collection
 */
export function invalidateCacheForCollection(collectionPath: string): void {
  firebaseOptimizationService.invalidateCache(collectionPath);
}