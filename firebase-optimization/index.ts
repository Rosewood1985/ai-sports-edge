/**
 * Firebase Optimization Package
 *
 * This package provides services and utilities for optimizing Firebase usage
 * in the AI Sports Edge application.
 */

// Import services and utilities
import { enhancedCacheService, CacheStrategy } from '../services/enhancedCacheService';
import {
  getUserData,
  updateUserData,
  updateUserPreferences,
  addFavoriteTeam,
  removeFavoriteTeam,
  saveVerificationData,
  hasCompletedVerification,
  updateUserStreak,
  followPick,
  unfollowPick,
  getFollowedPicks,
  migrateUserData as migrateUserDataToOptimized,
} from '../services/optimizedUserService';
import type { OptimizedUserData } from '../services/optimizedUserService';
import { batchLoadingService } from '../services/batchLoadingService';
import type { BatchLoadedData } from '../services/batchLoadingService';
import {
  firebaseMonitoringService,
  FirebaseOperationType,
  FirebaseServiceType,
} from '../services/firebaseMonitoringService';
import type {
  FirebaseOperation,
  FirebaseUsageStats
} from '../services/firebaseMonitoringService';
import {
  migrateUserData,
  migrateUser,
  rollbackUserMigration,
} from '../utils/dataMigrationUtils';
import type {
  MigrationProgress,
  MigrationOptions
} from '../utils/dataMigrationUtils';

// Re-export services
export { enhancedCacheService, CacheStrategy };
export {
  getUserData,
  updateUserData,
  updateUserPreferences,
  addFavoriteTeam,
  removeFavoriteTeam,
  saveVerificationData,
  hasCompletedVerification,
  updateUserStreak,
  followPick,
  unfollowPick,
  getFollowedPicks,
  migrateUserDataToOptimized,
};
export type { OptimizedUserData };
export { batchLoadingService };
export type { BatchLoadedData };
export {
  firebaseMonitoringService,
  FirebaseOperationType,
  FirebaseServiceType,
};
export type {
  FirebaseOperation,
  FirebaseUsageStats
};

// Re-export utilities
export {
  migrateUserData,
  migrateUser,
  rollbackUserMigration,
};
export type {
  MigrationProgress,
  MigrationOptions
};

/**
 * Initialize Firebase optimization services
 * @param options Initialization options
 */
export function initFirebaseOptimization(options?: {
  appVersion?: string;
  enableMonitoring?: boolean;
  cacheExpiration?: number;
}): void {
  // Set app version for cache invalidation
  if (options?.appVersion) {
    enhancedCacheService.setAppVersion(options.appVersion);
  }
  
  // Enable or disable monitoring
  if (options?.enableMonitoring !== undefined) {
    firebaseMonitoringService.setEnabled(options.enableMonitoring);
  }
  
  // Set custom cache expiration
  if (options?.cacheExpiration) {
    enhancedCacheService.setCustomExpiration('user', options.cacheExpiration);
  }
  
  console.log('Firebase optimization services initialized');
}

// Default export
export default {
  initFirebaseOptimization,
  enhancedCacheService,
  batchLoadingService,
  firebaseMonitoringService,
  migrateUserData,
  migrateUser,
  rollbackUserMigration
};