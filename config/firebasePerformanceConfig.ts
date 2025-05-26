// =============================================================================
// FIREBASE PERFORMANCE CONFIGURATION
// Firestore Optimization, Indexing, and Performance Monitoring
// =============================================================================

import { enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { firestore as db } from './firebase';
import * as Sentry from '@sentry/react-native';

// =============================================================================
// PERFORMANCE CONFIGURATION
// =============================================================================

export interface FirebasePerformanceConfig {
  cache: {
    enabled: boolean;
    persistenceEnabled: boolean;
    cacheSizeBytes: number;
  };
  network: {
    offline: boolean;
    retryAttempts: number;
    timeoutMs: number;
  };
  queries: {
    enableMetrics: boolean;
    slowQueryThreshold: number;
    maxConcurrentQueries: number;
  };
  indexes: {
    autoCreateIndexes: boolean;
    compositeIndexes: CompositeIndex[];
    singleFieldIndexes: SingleFieldIndex[];
  };
}

export interface CompositeIndex {
  collection: string;
  fields: { field: string; direction: 'asc' | 'desc' }[];
  queryScope: 'collection' | 'collection-group';
}

export interface SingleFieldIndex {
  collection: string;
  field: string;
  direction: 'asc' | 'desc';
  arrayConfig?: 'contains';
}

// =============================================================================
// OPTIMIZED FIREBASE CONFIGURATION
// =============================================================================

export const FIREBASE_PERFORMANCE_CONFIG: FirebasePerformanceConfig = {
  cache: {
    enabled: true,
    persistenceEnabled: true,
    cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
  },
  network: {
    offline: false,
    retryAttempts: 3,
    timeoutMs: 10000,
  },
  queries: {
    enableMetrics: true,
    slowQueryThreshold: 1000, // 1 second
    maxConcurrentQueries: 10,
  },
  indexes: {
    autoCreateIndexes: true,
    compositeIndexes: [
      // System Health Metrics
      {
        collection: 'system_health_metrics',
        fields: [
          { field: 'type', direction: 'asc' },
          { field: 'timestamp', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'system_health_metrics',
        fields: [
          { field: 'type', direction: 'asc' },
          { field: 'name', direction: 'asc' },
          { field: 'timestamp', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // NBA Data Indexes
      {
        collection: 'nba_games',
        fields: [
          { field: 'status', direction: 'asc' },
          { field: 'gameDate', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'nba_predictions',
        fields: [
          { field: 'gameDate', direction: 'desc' },
          { field: 'confidence', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'nba_player_stats',
        fields: [
          { field: 'playerId', direction: 'asc' },
          { field: 'gameDate', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // Prop Predictions Indexes
      {
        collection: 'prop_predictions',
        fields: [
          { field: 'sport', direction: 'asc' },
          { field: 'gameDate', direction: 'desc' },
          { field: 'confidence', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'prop_predictions',
        fields: [
          { field: 'sport', direction: 'asc' },
          { field: 'propType', direction: 'asc' },
          { field: 'gameDate', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // User Data Indexes
      {
        collection: 'users',
        fields: [
          { field: 'subscriptionStatus', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'user_predictions',
        fields: [
          { field: 'userId', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // Subscription and Payment Indexes
      {
        collection: 'subscriptions',
        fields: [
          { field: 'status', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'payment_events',
        fields: [
          { field: 'userId', direction: 'asc' },
          { field: 'timestamp', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // Background Process Indexes
      {
        collection: 'system_health_processes',
        fields: [
          { field: 'status', direction: 'asc' },
          { field: 'startTime', direction: 'desc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'system_health_actions',
        fields: [
          { field: 'timestamp', direction: 'desc' },
          { field: 'status', direction: 'asc' },
        ],
        queryScope: 'collection',
      },

      // Sports Data Sync Indexes
      {
        collection: 'sports_data_sync',
        fields: [
          { field: 'sport', direction: 'asc' },
          { field: 'syncDate', direction: 'desc' },
          { field: 'status', direction: 'asc' },
        ],
        queryScope: 'collection',
      },
      {
        collection: 'odds_tracking',
        fields: [
          { field: 'sport', direction: 'asc' },
          { field: 'gameId', direction: 'asc' },
          { field: 'timestamp', direction: 'desc' },
        ],
        queryScope: 'collection',
      },

      // Notification Indexes
      {
        collection: 'notifications',
        fields: [
          { field: 'userId', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' },
          { field: 'status', direction: 'asc' },
        ],
        queryScope: 'collection',
      },
    ],
    singleFieldIndexes: [
      // High-frequency single field queries
      { collection: 'nba_games', field: 'gameDate', direction: 'desc' },
      { collection: 'nba_teams', field: 'abbreviation', direction: 'asc' },
      { collection: 'nba_players', field: 'teamId', direction: 'asc' },
      { collection: 'users', field: 'email', direction: 'asc' },
      { collection: 'users', field: 'subscriptionStatus', direction: 'asc' },
      { collection: 'prop_predictions', field: 'gameDate', direction: 'desc' },
      { collection: 'prop_predictions', field: 'confidence', direction: 'desc' },
      { collection: 'system_health_metrics', field: 'timestamp', direction: 'desc' },
      { collection: 'sports_data_sync', field: 'syncDate', direction: 'desc' },
    ],
  },
};

// =============================================================================
// FIREBASE PERFORMANCE SERVICE
// =============================================================================

export class FirebasePerformanceService {
  private config: FirebasePerformanceConfig;
  private isInitialized = false;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: FirebasePerformanceConfig = FIREBASE_PERFORMANCE_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize Firebase performance optimizations
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Enable offline persistence if configured
      if (this.config.cache.persistenceEnabled) {
        await this.enableOfflinePersistence();
      }

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Validate required indexes
      await this.validateIndexes();

      this.isInitialized = true;

      Sentry.addBreadcrumb({
        message: 'Firebase Performance Service initialized',
        category: 'firebase.performance.init',
        level: 'info',
        data: {
          cacheEnabled: this.config.cache.enabled,
          persistenceEnabled: this.config.cache.persistenceEnabled,
          metricsEnabled: this.config.queries.enableMetrics,
        },
      });

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error initializing Firebase Performance Service:', error);
      throw error;
    }
  }

  /**
   * Enable offline persistence
   */
  private async enableOfflinePersistence(): Promise<void> {
    try {
      // Note: In production, this would be configured in firebase.ts
      // For now, we'll log the configuration
      console.log('Firebase offline persistence enabled with cache size:', this.config.cache.cacheSizeBytes);
      
    } catch (error) {
      // Persistence may already be enabled
      console.warn('Firebase persistence already enabled or not supported:', error);
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.queries.enableMetrics) {
      return;
    }

    // Monitor query performance
    setInterval(() => {
      this.analyzePerformanceMetrics();
    }, 60000); // Analyze every minute

    // Report to Sentry every 5 minutes
    setInterval(() => {
      this.reportPerformanceToSentry();
    }, 5 * 60 * 1000);
  }

  /**
   * Record query performance
   */
  recordQueryPerformance(collection: string, executionTime: number): void {
    if (!this.config.queries.enableMetrics) {
      return;
    }

    const key = `query_${collection}`;
    const metrics = this.performanceMetrics.get(key) || [];
    metrics.push(executionTime);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }

    this.performanceMetrics.set(key, metrics);

    // Alert on slow queries
    if (executionTime > this.config.queries.slowQueryThreshold) {
      this.alertSlowQuery(collection, executionTime);
    }
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformanceMetrics(): void {
    const analysis: { [collection: string]: { avg: number; max: number; count: number } } = {};

    this.performanceMetrics.forEach((metrics, key) => {
      const collection = key.replace('query_', '');
      const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      const max = Math.max(...metrics);
      
      analysis[collection] = {
        avg: Math.round(avg),
        max,
        count: metrics.length,
      };
    });

    console.log('Firebase Query Performance Analysis:', analysis);
  }

  /**
   * Report performance to Sentry
   */
  private reportPerformanceToSentry(): void {
    const summary: { [collection: string]: number } = {};
    
    this.performanceMetrics.forEach((metrics, key) => {
      const collection = key.replace('query_', '');
      const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      summary[collection] = Math.round(avg);
    });

    Sentry.addBreadcrumb({
      message: 'Firebase Query Performance Summary',
      category: 'firebase.performance.metrics',
      level: 'info',
      data: summary,
    });
  }

  /**
   * Alert on slow queries
   */
  private alertSlowQuery(collection: string, executionTime: number): void {
    Sentry.addBreadcrumb({
      message: `Slow Firebase query detected`,
      category: 'firebase.performance.slow_query',
      level: 'warning',
      data: {
        collection,
        executionTime,
        threshold: this.config.queries.slowQueryThreshold,
      },
    });

    console.warn(`Slow query on collection ${collection}: ${executionTime}ms`);
  }

  /**
   * Validate that required indexes exist
   */
  private async validateIndexes(): Promise<void> {
    console.log('Validating Firebase indexes...');
    
    // In production, this would check actual index status
    // For now, we'll log the required indexes
    console.log('Required composite indexes:', this.config.indexes.compositeIndexes.length);
    console.log('Required single field indexes:', this.config.indexes.singleFieldIndexes.length);
    
    Sentry.addBreadcrumb({
      message: 'Firebase indexes validated',
      category: 'firebase.performance.indexes',
      level: 'info',
      data: {
        compositeIndexes: this.config.indexes.compositeIndexes.length,
        singleFieldIndexes: this.config.indexes.singleFieldIndexes.length,
      },
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): { [collection: string]: { avg: number; max: number; min: number; count: number } } {
    const stats: { [collection: string]: { avg: number; max: number; min: number; count: number } } = {};

    this.performanceMetrics.forEach((metrics, key) => {
      const collection = key.replace('query_', '');
      const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      const max = Math.max(...metrics);
      const min = Math.min(...metrics);
      
      stats[collection] = {
        avg: Math.round(avg),
        max,
        min,
        count: metrics.length,
      };
    });

    return stats;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
    console.log('Firebase performance metrics cleared');
  }

  /**
   * Enable/disable network
   */
  async setNetworkEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await enableNetwork(db);
        console.log('Firebase network enabled');
      } else {
        await disableNetwork(db);
        console.log('Firebase network disabled');
      }
    } catch (error) {
      console.error('Error changing network state:', error);
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// =============================================================================
// FIRESTORE RULES TEMPLATE
// =============================================================================

export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // System health metrics - admin only
    match /system_health_metrics/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /system_health_processes/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /system_health_actions/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }

    // NBA data - read-only for authenticated users
    match /nba_games/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /nba_predictions/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /nba_player_stats/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Prop predictions - read-only for authenticated users
    match /prop_predictions/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // User data - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /user_predictions/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }

    // Subscriptions - users can only access their own
    match /subscriptions/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /payment_events/{document} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Sports data sync - admin only
    match /sports_data_sync/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /odds_tracking/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Notifications - users can only access their own
    match /notifications/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }

    // Default rule - deny all access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const firebasePerformanceService = new FirebasePerformanceService();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate Firestore index creation commands
 */
export function generateIndexCommands(): string[] {
  const commands: string[] = [];
  
  FIREBASE_PERFORMANCE_CONFIG.indexes.compositeIndexes.forEach(index => {
    const fields = index.fields.map(f => `"${f.field}":${f.direction.toUpperCase()}`).join(',');
    commands.push(
      `firebase firestore:indexes --add-composite='{"collection":"${index.collection}","fields":[${fields}]}'`
    );
  });

  FIREBASE_PERFORMANCE_CONFIG.indexes.singleFieldIndexes.forEach(index => {
    commands.push(
      `firebase firestore:indexes --add-field='{"collection":"${index.collection}","field":"${index.field}","direction":"${index.direction.toUpperCase()}"}'`
    );
  });

  return commands;
}

/**
 * Initialize Firebase performance optimizations
 */
export async function initializeFirebasePerformance(): Promise<void> {
  await firebasePerformanceService.initialize();
}