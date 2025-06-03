import { enhancedCacheService, CacheStrategy } from './enhancedCacheService';
import { safeErrorCapture } from './errorUtils';
import { info, error as logError, LogCategory } from './loggingService';

/**
 * Firebase operation types
 */
export enum FirebaseOperationType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  QUERY = 'query',
  BATCH = 'batch',
  TRANSACTION = 'transaction',
}

/**
 * Firebase service types
 */
export enum FirebaseServiceType {
  FIRESTORE = 'firestore',
  AUTH = 'auth',
  STORAGE = 'storage',
  FUNCTIONS = 'functions',
  REALTIME_DB = 'realtime_db',
}

/**
 * Firebase operation interface
 */
export interface FirebaseOperation {
  type: FirebaseOperationType;
  service: FirebaseServiceType;
  path: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Firebase usage statistics
 */
export interface FirebaseUsageStats {
  reads: number;
  writes: number;
  deletes: number;
  queries: number;
  batches: number;
  transactions: number;
  totalOperations: number;
  averageDuration: number;
  errorRate: number;
  byService: Record<FirebaseServiceType, number>;
  byPath: Record<string, number>;
}

/**
 * Firebase Monitoring Service
 *
 * This service tracks Firebase operations to help optimize usage and reduce costs.
 */
class FirebaseMonitoringService {
  // Maximum number of operations to store
  private readonly MAX_OPERATIONS = 1000;

  // Operations array
  private operations: FirebaseOperation[] = [];

  // Cache key for usage statistics
  private readonly STATS_CACHE_KEY = 'firebase_usage_stats';

  // Cache TTL for usage statistics (1 hour)
  private readonly STATS_CACHE_TTL = 1000 * 60 * 60;

  // Whether monitoring is enabled
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable monitoring
   * @param enabled Whether monitoring is enabled
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`FirebaseMonitoringService: Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Track a Firebase operation
   * @param operation Firebase operation
   */
  trackOperation(operation: Omit<FirebaseOperation, 'timestamp'>): void {
    if (!this.isEnabled) {
      return;
    }

    // Add timestamp
    const fullOperation: FirebaseOperation = {
      ...operation,
      timestamp: Date.now(),
    };

    // Add to operations array
    this.operations.push(fullOperation);

    // Trim operations array if it gets too large
    if (this.operations.length > this.MAX_OPERATIONS) {
      this.operations = this.operations.slice(-this.MAX_OPERATIONS);
    }

    // Log operation
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `FirebaseMonitoringService: ${operation.type} operation on ${operation.service}:${operation.path} (${operation.duration}ms)`
      );
    }

    // Log errors
    if (!operation.success) {
      logError(
        LogCategory.STORAGE,
        `Firebase ${operation.type} operation failed on ${operation.service}:${operation.path}`,
        new Error(operation.error || 'Unknown error')
      );
    }

    // Invalidate stats cache
    enhancedCacheService.invalidate(this.STATS_CACHE_KEY).catch(err => {
      console.error('FirebaseMonitoringService: Error invalidating stats cache:', err);
    });
  }

  /**
   * Track a Firestore read operation
   * @param path Document or collection path
   * @param duration Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   * @param metadata Additional metadata
   */
  trackFirestoreRead(
    path: string,
    duration: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackOperation({
      type: FirebaseOperationType.READ,
      service: FirebaseServiceType.FIRESTORE,
      path,
      duration,
      success,
      error,
      metadata,
    });
  }

  /**
   * Track a Firestore write operation
   * @param path Document path
   * @param duration Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   * @param metadata Additional metadata
   */
  trackFirestoreWrite(
    path: string,
    duration: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackOperation({
      type: FirebaseOperationType.WRITE,
      service: FirebaseServiceType.FIRESTORE,
      path,
      duration,
      success,
      error,
      metadata,
    });
  }

  /**
   * Track a Firestore delete operation
   * @param path Document path
   * @param duration Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   * @param metadata Additional metadata
   */
  trackFirestoreDelete(
    path: string,
    duration: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackOperation({
      type: FirebaseOperationType.DELETE,
      service: FirebaseServiceType.FIRESTORE,
      path,
      duration,
      success,
      error,
      metadata,
    });
  }

  /**
   * Track a Firestore query operation
   * @param path Collection path
   * @param duration Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   * @param metadata Additional metadata
   */
  trackFirestoreQuery(
    path: string,
    duration: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackOperation({
      type: FirebaseOperationType.QUERY,
      service: FirebaseServiceType.FIRESTORE,
      path,
      duration,
      success,
      error,
      metadata,
    });
  }

  /**
   * Track a Firestore batch operation
   * @param paths Document paths
   * @param duration Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   * @param metadata Additional metadata
   */
  trackFirestoreBatch(
    paths: string[],
    duration: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackOperation({
      type: FirebaseOperationType.BATCH,
      service: FirebaseServiceType.FIRESTORE,
      path: paths.join(','),
      duration,
      success,
      error,
      metadata: {
        ...metadata,
        paths,
      },
    });
  }

  /**
   * Get Firebase usage statistics
   * @param forceRefresh Whether to force a refresh of the statistics
   * @returns Firebase usage statistics
   */
  async getUsageStats(forceRefresh: boolean = false): Promise<FirebaseUsageStats> {
    // Return empty stats if monitoring is disabled
    if (!this.isEnabled) {
      return this.getEmptyStats();
    }

    try {
      // Get stats from cache
      const result = await enhancedCacheService.get<FirebaseUsageStats>(
        this.STATS_CACHE_KEY,
        async () => {
          // Calculate stats
          return this.calculateStats();
        },
        {
          strategy: CacheStrategy.CACHE_FIRST,
          forceRefresh,
          expiration: this.STATS_CACHE_TTL,
        }
      );

      return result.data || this.getEmptyStats();
    } catch (error) {
      console.error('FirebaseMonitoringService: Error getting usage stats:', error);
      logError(LogCategory.STORAGE, 'Error getting Firebase usage stats', error as Error);
      safeErrorCapture(error as Error);
      return this.getEmptyStats();
    }
  }

  /**
   * Calculate Firebase usage statistics
   * @returns Firebase usage statistics
   */
  private calculateStats(): FirebaseUsageStats {
    // Return empty stats if no operations
    if (this.operations.length === 0) {
      return this.getEmptyStats();
    }

    // Initialize stats
    const stats: FirebaseUsageStats = {
      reads: 0,
      writes: 0,
      deletes: 0,
      queries: 0,
      batches: 0,
      transactions: 0,
      totalOperations: this.operations.length,
      averageDuration: 0,
      errorRate: 0,
      byService: {
        [FirebaseServiceType.FIRESTORE]: 0,
        [FirebaseServiceType.AUTH]: 0,
        [FirebaseServiceType.STORAGE]: 0,
        [FirebaseServiceType.FUNCTIONS]: 0,
        [FirebaseServiceType.REALTIME_DB]: 0,
      },
      byPath: {},
    };

    // Calculate total duration
    let totalDuration = 0;
    let errorCount = 0;

    // Process operations
    for (const operation of this.operations) {
      // Increment operation type count
      switch (operation.type) {
        case FirebaseOperationType.READ:
          stats.reads++;
          break;
        case FirebaseOperationType.WRITE:
          stats.writes++;
          break;
        case FirebaseOperationType.DELETE:
          stats.deletes++;
          break;
        case FirebaseOperationType.QUERY:
          stats.queries++;
          break;
        case FirebaseOperationType.BATCH:
          stats.batches++;
          break;
        case FirebaseOperationType.TRANSACTION:
          stats.transactions++;
          break;
      }

      // Increment service count
      stats.byService[operation.service]++;

      // Increment path count
      const pathKey = `${operation.service}:${operation.path}`;
      stats.byPath[pathKey] = (stats.byPath[pathKey] || 0) + 1;

      // Add to total duration
      totalDuration += operation.duration;

      // Increment error count
      if (!operation.success) {
        errorCount++;
      }
    }

    // Calculate average duration
    stats.averageDuration = totalDuration / this.operations.length;

    // Calculate error rate
    stats.errorRate = errorCount / this.operations.length;

    return stats;
  }

  /**
   * Get empty Firebase usage statistics
   * @returns Empty Firebase usage statistics
   */
  private getEmptyStats(): FirebaseUsageStats {
    return {
      reads: 0,
      writes: 0,
      deletes: 0,
      queries: 0,
      batches: 0,
      transactions: 0,
      totalOperations: 0,
      averageDuration: 0,
      errorRate: 0,
      byService: {
        [FirebaseServiceType.FIRESTORE]: 0,
        [FirebaseServiceType.AUTH]: 0,
        [FirebaseServiceType.STORAGE]: 0,
        [FirebaseServiceType.FUNCTIONS]: 0,
        [FirebaseServiceType.REALTIME_DB]: 0,
      },
      byPath: {},
    };
  }

  /**
   * Clear all operations
   */
  clearOperations(): void {
    this.operations = [];
    console.log('FirebaseMonitoringService: Operations cleared');

    // Invalidate stats cache
    enhancedCacheService.invalidate(this.STATS_CACHE_KEY).catch(err => {
      console.error('FirebaseMonitoringService: Error invalidating stats cache:', err);
    });
  }

  /**
   * Get recent operations
   * @param limit Maximum number of operations to return
   * @returns Recent operations
   */
  getRecentOperations(limit: number = 100): FirebaseOperation[] {
    return this.operations.slice(-limit);
  }

  /**
   * Get operations by type
   * @param type Operation type
   * @param limit Maximum number of operations to return
   * @returns Operations of the specified type
   */
  getOperationsByType(type: FirebaseOperationType, limit: number = 100): FirebaseOperation[] {
    return this.operations.filter(op => op.type === type).slice(-limit);
  }

  /**
   * Get operations by service
   * @param service Service type
   * @param limit Maximum number of operations to return
   * @returns Operations for the specified service
   */
  getOperationsByService(service: FirebaseServiceType, limit: number = 100): FirebaseOperation[] {
    return this.operations.filter(op => op.service === service).slice(-limit);
  }

  /**
   * Get operations by path
   * @param path Document or collection path
   * @param limit Maximum number of operations to return
   * @returns Operations for the specified path
   */
  getOperationsByPath(path: string, limit: number = 100): FirebaseOperation[] {
    return this.operations
      .filter(op => op.path === path || op.path.startsWith(`${path}/`))
      .slice(-limit);
  }
}

// Export as singleton
export const firebaseMonitoringService = new FirebaseMonitoringService();
export default firebaseMonitoringService;
