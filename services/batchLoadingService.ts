import { Auth } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore,
} from 'firebase/firestore';

import { enhancedCacheService, CacheStrategy } from './enhancedCacheService';
import { safeErrorCapture } from './errorUtils';
import { info, error as logError, LogCategory } from './loggingService';
import { OptimizedUserData } from './optimizedUserService';

// Import Firebase services
import * as firebaseConfig from '../config/firebase';

// Get Firebase services with type assertions
const auth = firebaseConfig.auth as Auth;
const firestore = firebaseConfig.firestore as Firestore;

/**
 * Interface for batch loaded data
 */
export interface BatchLoadedData {
  user: OptimizedUserData | null;
  pickOfDay: any | null;
  topPicks: any[];
  recentGames: any[];
  notifications: any[];
  appConfig: any | null;
}

/**
 * Default batch loaded data
 */
const defaultBatchData: BatchLoadedData = {
  user: null,
  pickOfDay: null,
  topPicks: [],
  recentGames: [],
  notifications: [],
  appConfig: null,
};

/**
 * Batch loading service for optimizing Firebase reads
 */
class BatchLoadingService {
  // Cache key for batch loaded data
  private readonly BATCH_DATA_CACHE_KEY = 'batch_data';

  // Cache TTL for batch loaded data (5 minutes)
  private readonly BATCH_DATA_CACHE_TTL = 1000 * 60 * 5;

  /**
   * Load critical app data in a single batch operation
   * @param userId User ID
   * @param options Batch loading options
   * @returns Batch loaded data
   */
  async loadCriticalData(
    userId?: string,
    options?: {
      forceRefresh?: boolean;
      includePicks?: boolean;
      includeGames?: boolean;
      includeNotifications?: boolean;
      includeAppConfig?: boolean;
    }
  ): Promise<BatchLoadedData> {
    try {
      // Get user ID
      const uid = userId || auth.currentUser?.uid;

      if (!uid) {
        console.warn('batchLoadingService: No user ID provided or user not authenticated');
        return defaultBatchData;
      }

      // Cache key with user ID
      const cacheKey = `${this.BATCH_DATA_CACHE_KEY}:${uid}`;

      // Get batch data with caching
      const result = await enhancedCacheService.get<BatchLoadedData>(
        cacheKey,
        async () => {
          console.log('batchLoadingService: Loading critical data from Firestore');
          info(LogCategory.STORAGE, 'Loading critical data from Firestore', { userId: uid });

          // Prepare promises for parallel execution
          const promises: Promise<any>[] = [];
          const promiseResults: any[] = [];

          // 1. User data promise
          promises.push(this.getUserData(uid));

          // 2. Pick of the day promise (if requested)
          if (options?.includePicks !== false) {
            promises.push(this.getPickOfDay());
          } else {
            promiseResults.push(null);
          }

          // 3. Top picks promise (if requested)
          if (options?.includePicks !== false) {
            promises.push(this.getTopPicks());
          } else {
            promiseResults.push([]);
          }

          // 4. Recent games promise (if requested)
          if (options?.includeGames !== false) {
            promises.push(this.getRecentGames());
          } else {
            promiseResults.push([]);
          }

          // 5. Notifications promise (if requested)
          if (options?.includeNotifications !== false) {
            promises.push(this.getUserNotifications(uid));
          } else {
            promiseResults.push([]);
          }

          // 6. App config promise (if requested)
          if (options?.includeAppConfig !== false) {
            promises.push(this.getAppConfig());
          } else {
            promiseResults.push(null);
          }

          // Execute all promises in parallel
          const results = await Promise.all(promises);

          // Combine results
          const batchData: BatchLoadedData = {
            user: results[0] || null,
            pickOfDay: options?.includePicks !== false ? results[1] : null,
            topPicks: options?.includePicks !== false ? results[2] || [] : [],
            recentGames: options?.includeGames !== false ? results[3] || [] : [],
            notifications: options?.includeNotifications !== false ? results[4] || [] : [],
            appConfig: options?.includeAppConfig !== false ? results[5] : null,
          };

          console.log('batchLoadingService: Critical data loaded successfully');
          info(LogCategory.STORAGE, 'Critical data loaded successfully', { userId: uid });

          return batchData;
        },
        {
          strategy: CacheStrategy.CACHE_FIRST,
          forceRefresh: options?.forceRefresh || false,
          expiration: this.BATCH_DATA_CACHE_TTL,
        }
      );

      return result.data || defaultBatchData;
    } catch (error) {
      console.error('batchLoadingService: Error loading critical data:', error);
      logError(LogCategory.STORAGE, 'Error loading critical data', error as Error);
      safeErrorCapture(error as Error);
      return defaultBatchData;
    }
  }

  /**
   * Get user data
   * @param userId User ID
   * @returns User data
   */
  private async getUserData(userId: string): Promise<OptimizedUserData | null> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as OptimizedUserData;
      userData.id = userId;

      return userData;
    } catch (error) {
      console.error('batchLoadingService: Error getting user data:', error);
      return null;
    }
  }

  /**
   * Get pick of the day
   * @returns Pick of the day
   */
  private async getPickOfDay(): Promise<any | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const picksRef = collection(firestore, 'aiPicks');
      const pickQuery = query(
        picksRef,
        where('isPickOfDay', '==', true),
        where('pickDate', '>=', today),
        orderBy('pickDate', 'asc'),
        limit(1)
      );

      const pickSnapshot = await getDocs(pickQuery);

      if (pickSnapshot.empty) {
        return null;
      }

      const pickDoc = pickSnapshot.docs[0];
      const pickData = pickDoc.data();

      return {
        id: pickDoc.id,
        ...pickData,
      };
    } catch (error) {
      console.error('batchLoadingService: Error getting pick of the day:', error);
      return null;
    }
  }

  /**
   * Get top picks
   * @param count Number of picks to get
   * @returns Top picks
   */
  private async getTopPicks(count: number = 3): Promise<any[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const picksRef = collection(firestore, 'aiPicks');
      const picksQuery = query(
        picksRef,
        where('pickDate', '>=', today),
        where('confidence', '>=', 80),
        orderBy('confidence', 'desc'),
        limit(count)
      );

      const picksSnapshot = await getDocs(picksQuery);

      return picksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('batchLoadingService: Error getting top picks:', error);
      return [];
    }
  }

  /**
   * Get recent games
   * @param count Number of games to get
   * @returns Recent games
   */
  private async getRecentGames(count: number = 5): Promise<any[]> {
    try {
      const now = new Date();

      const gamesRef = collection(firestore, 'games');
      const gamesQuery = query(
        gamesRef,
        where('startTime', '>=', now),
        orderBy('startTime', 'asc'),
        limit(count)
      );

      const gamesSnapshot = await getDocs(gamesQuery);

      return gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('batchLoadingService: Error getting recent games:', error);
      return [];
    }
  }

  /**
   * Get user notifications
   * @param userId User ID
   * @param count Number of notifications to get
   * @returns User notifications
   */
  private async getUserNotifications(userId: string, count: number = 10): Promise<any[]> {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(count)
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);

      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('batchLoadingService: Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Get app configuration
   * @returns App configuration
   */
  private async getAppConfig(): Promise<any | null> {
    try {
      const configRef = doc(firestore, 'appConfig', 'current');
      const configDoc = await getDoc(configRef);

      if (!configDoc.exists()) {
        return null;
      }

      return configDoc.data();
    } catch (error) {
      console.error('batchLoadingService: Error getting app config:', error);
      return null;
    }
  }

  /**
   * Invalidate batch loaded data
   * @param userId User ID
   */
  async invalidateBatchData(userId?: string): Promise<void> {
    try {
      const uid = userId || auth.currentUser?.uid;

      if (!uid) {
        return;
      }

      const cacheKey = `${this.BATCH_DATA_CACHE_KEY}:${uid}`;
      await enhancedCacheService.invalidate(cacheKey);

      console.log('batchLoadingService: Batch data invalidated');
      info(LogCategory.STORAGE, 'Batch data invalidated', { userId: uid });
    } catch (error) {
      console.error('batchLoadingService: Error invalidating batch data:', error);
      logError(LogCategory.STORAGE, 'Error invalidating batch data', error as Error);
      safeErrorCapture(error as Error);
    }
  }

  /**
   * Refresh batch loaded data
   * @param userId User ID
   * @param options Batch loading options
   * @returns Refreshed batch loaded data
   */
  async refreshBatchData(
    userId?: string,
    options?: {
      includePicks?: boolean;
      includeGames?: boolean;
      includeNotifications?: boolean;
      includeAppConfig?: boolean;
    }
  ): Promise<BatchLoadedData> {
    return this.loadCriticalData(userId, {
      ...options,
      forceRefresh: true,
    });
  }
}

// Export as singleton
export const batchLoadingService = new BatchLoadingService();
export default batchLoadingService;
