import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
import { analyticsService } from './analyticsService';

/**
 * Offline Service
 * 
 * This service provides offline functionality for the app, including:
 * - Network status monitoring
 * - Data caching
 * - Offline data access
 * - Sync queue for offline operations
 */

// Cache keys
const CACHE_PREFIX = 'offline_cache_';
const CACHE_METADATA_PREFIX = 'offline_cache_metadata_';
const SYNC_QUEUE_KEY = 'offline_sync_queue';

// Cache TTL (time to live) in milliseconds
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cache item interface
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Sync operation interface
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: any;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

// Offline mode interface
export interface OfflineMode {
  enabled: boolean;
  cacheEnabled: boolean;
  syncEnabled: boolean;
  maxCacheSize: number; // in MB
  maxSyncQueueSize: number;
  cacheTTL: number; // in milliseconds
}

class OfflineService {
  private isOnline: boolean = true;
  private unsubscribeNetInfo: (() => void) | null = null;
  private syncInProgress: boolean = false;
  private offlineMode: OfflineMode = {
    enabled: true,
    cacheEnabled: true,
    syncEnabled: true,
    maxCacheSize: 50, // 50 MB
    maxSyncQueueSize: 100,
    cacheTTL: DEFAULT_CACHE_TTL
  };
  private listeners: ((isOnline: boolean) => void)[] = [];

  /**
   * Initialize the offline service
   */
  public async initialize(): Promise<void> {
    try {
      // Load offline mode settings
      await this.loadOfflineMode();
      
      // Subscribe to network status changes
      this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetInfoChange);
      
      // Get initial network status
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? true;
      
      // Log initialization
      console.log('Offline service initialized, online status:', this.isOnline);
      
      // If online, try to sync pending operations
      if (this.isOnline && this.offlineMode.syncEnabled) {
        this.syncPendingOperations();
      }
    } catch (error) {
      console.error('Error initializing offline service:', error);
    }
  }

  /**
   * Handle network status change
   */
  private handleNetInfoChange = (state: NetInfoState): void => {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected ?? true;
    
    // Log network status change
    if (wasOnline !== this.isOnline) {
      console.log('Network status changed:', this.isOnline ? 'online' : 'offline');
      
      // Track analytics event
      analyticsService.trackEvent('network_status_changed', {
        isOnline: this.isOnline
      });
      
      // Notify listeners
      this.notifyListeners();
      
      // If coming back online, sync pending operations
      if (!wasOnline && this.isOnline && this.offlineMode.syncEnabled) {
        this.syncPendingOperations();
      }
    }
  };

  /**
   * Notify network status listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Add network status listener
   * @param listener Network status listener function
   * @returns Unsubscribe function
   */
  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if the device is online
   * @returns True if online, false otherwise
   */
  public isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Load offline mode settings
   */
  private async loadOfflineMode(): Promise<void> {
    try {
      const offlineModeStr = await AsyncStorage.getItem('offline_mode');
      if (offlineModeStr) {
        this.offlineMode = { ...this.offlineMode, ...JSON.parse(offlineModeStr) };
      }
    } catch (error) {
      console.error('Error loading offline mode settings:', error);
    }
  }

  /**
   * Save offline mode settings
   */
  public async saveOfflineMode(offlineMode: Partial<OfflineMode>): Promise<void> {
    try {
      this.offlineMode = { ...this.offlineMode, ...offlineMode };
      await AsyncStorage.setItem('offline_mode', JSON.stringify(this.offlineMode));
      
      // Track analytics event
      analyticsService.trackEvent('offline_mode_updated', {
        offlineMode: this.offlineMode
      });
    } catch (error) {
      console.error('Error saving offline mode settings:', error);
    }
  }

  /**
   * Get offline mode settings
   * @returns Offline mode settings
   */
  public getOfflineMode(): OfflineMode {
    return { ...this.offlineMode };
  }

  /**
   * Get data from cache or Firestore
   * @param collectionPath Firestore collection path
   * @param docId Document ID
   * @param options Cache options
   * @returns Document data or null if not found
   */
  public async getData<T>(
    collectionPath: string,
    docId: string,
    options: {
      forceRefresh?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${collectionPath}_${docId}`;
      const { forceRefresh = false, cacheTTL = this.offlineMode.cacheTTL } = options;
      
      // If offline mode is disabled, get data from Firestore
      if (!this.offlineMode.enabled) {
        return this.getDataFromFirestore<T>(collectionPath, docId);
      }
      
      // If online and force refresh, get data from Firestore
      if (this.isOnline && forceRefresh) {
        const data = await this.getDataFromFirestore<T>(collectionPath, docId);
        
        // Cache data if caching is enabled
        if (data && this.offlineMode.cacheEnabled) {
          await this.cacheData(cacheKey, data, cacheTTL);
        }
        
        return data;
      }
      
      // Try to get data from cache
      if (this.offlineMode.cacheEnabled) {
        const cachedData = await this.getCachedData<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // If online, get data from Firestore
      if (this.isOnline) {
        const data = await this.getDataFromFirestore<T>(collectionPath, docId);
        
        // Cache data if caching is enabled
        if (data && this.offlineMode.cacheEnabled) {
          await this.cacheData(cacheKey, data, cacheTTL);
        }
        
        return data;
      }
      
      // If offline and no cached data, return null
      return null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  /**
   * Get data from Firestore
   * @param collectionPath Firestore collection path
   * @param docId Document ID
   * @returns Document data or null if not found
   */
  private async getDataFromFirestore<T>(
    collectionPath: string,
    docId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(firestore, collectionPath, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as T;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting data from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get cached data
   * @param cacheKey Cache key
   * @returns Cached data or null if not found or expired
   */
  private async getCachedData<T>(cacheKey: string): Promise<T | null> {
    try {
      const cachedItemStr = await AsyncStorage.getItem(cacheKey);
      if (!cachedItemStr) {
        return null;
      }
      
      const cachedItem: CacheItem<T> = JSON.parse(cachedItemStr);
      
      // Check if cache is expired
      if (Date.now() > cachedItem.expiresAt) {
        // Remove expired cache
        await AsyncStorage.removeItem(cacheKey);
        await AsyncStorage.removeItem(`${CACHE_METADATA_PREFIX}${cacheKey}`);
        return null;
      }
      
      return cachedItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Cache data
   * @param cacheKey Cache key
   * @param data Data to cache
   * @param cacheTTL Cache TTL in milliseconds
   */
  private async cacheData<T>(
    cacheKey: string,
    data: T,
    cacheTTL: number
  ): Promise<void> {
    try {
      const now = Date.now();
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + cacheTTL
      };
      
      // Store cache item
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      // Store cache metadata
      await AsyncStorage.setItem(`${CACHE_METADATA_PREFIX}${cacheKey}`, JSON.stringify({
        key: cacheKey,
        timestamp: now,
        expiresAt: now + cacheTTL,
        size: JSON.stringify(cacheItem).length
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Query data from cache or Firestore
   * @param collectionPath Firestore collection path
   * @param queryParams Query parameters
   * @param options Cache options
   * @returns Query results or empty array if not found
   */
  public async queryData<T>(
    collectionPath: string,
    queryParams: {
      field?: string;
      operator?: '==' | '<' | '<=' | '>' | '>=';
      value?: any;
      orderByField?: string;
      orderByDirection?: 'asc' | 'desc';
      limitTo?: number;
    },
    options: {
      forceRefresh?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<T[]> {
    try {
      const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
      const { forceRefresh = false, cacheTTL = this.offlineMode.cacheTTL } = options;
      
      // Create cache key from query parameters
      const cacheKey = `${CACHE_PREFIX}${collectionPath}_query_${JSON.stringify(queryParams)}`;
      
      // If offline mode is disabled, query data from Firestore
      if (!this.offlineMode.enabled) {
        return this.queryDataFromFirestore<T>(collectionPath, queryParams);
      }
      
      // If online and force refresh, query data from Firestore
      if (this.isOnline && forceRefresh) {
        const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
        
        // Cache data if caching is enabled
        if (data.length > 0 && this.offlineMode.cacheEnabled) {
          await this.cacheData(cacheKey, data, cacheTTL);
        }
        
        return data;
      }
      
      // Try to get data from cache
      if (this.offlineMode.cacheEnabled) {
        const cachedData = await this.getCachedData<T[]>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // If online, query data from Firestore
      if (this.isOnline) {
        const data = await this.queryDataFromFirestore<T>(collectionPath, queryParams);
        
        // Cache data if caching is enabled
        if (data.length > 0 && this.offlineMode.cacheEnabled) {
          await this.cacheData(cacheKey, data, cacheTTL);
        }
        
        return data;
      }
      
      // If offline and no cached data, return empty array
      return [];
    } catch (error) {
      console.error('Error querying data:', error);
      return [];
    }
  }

  /**
   * Query data from Firestore
   * @param collectionPath Firestore collection path
   * @param queryParams Query parameters
   * @returns Query results or empty array if not found
   */
  private async queryDataFromFirestore<T>(
    collectionPath: string,
    queryParams: {
      field?: string;
      operator?: '==' | '<' | '<=' | '>' | '>=';
      value?: any;
      orderByField?: string;
      orderByDirection?: 'asc' | 'desc';
      limitTo?: number;
    }
  ): Promise<T[]> {
    try {
      const { field, operator, value, orderByField, orderByDirection, limitTo } = queryParams;
      
      // Create collection reference
      const collectionRef = collection(firestore, collectionPath);
      
      // Build query
      let queryRef = query(collectionRef);
      
      // Add where clause if field, operator, and value are provided
      if (field && operator && value !== undefined) {
        queryRef = query(queryRef, where(field, operator, value));
      }
      
      // Add orderBy clause if orderByField is provided
      if (orderByField) {
        queryRef = query(queryRef, orderBy(orderByField, orderByDirection || 'asc'));
      }
      
      // Add limit clause if limitTo is provided
      if (limitTo) {
        queryRef = query(queryRef, limit(limitTo));
      }
      
      // Execute query
      const querySnapshot = await getDocs(queryRef);
      
      // Extract data
      const data: T[] = [];
      querySnapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      
      return data;
    } catch (error) {
      console.error('Error querying data from Firestore:', error);
      throw error;
    }
  }

  /**
   * Save data to Firestore or sync queue
   * @param collectionPath Firestore collection path
   * @param data Data to save
   * @param docId Document ID (optional, will be generated if not provided)
   * @returns Document ID
   */
  public async saveData(
    collectionPath: string,
    data: any,
    docId?: string
  ): Promise<string> {
    try {
      // If online, save data to Firestore
      if (this.isOnline) {
        return this.saveDataToFirestore(collectionPath, data, docId);
      }
      
      // If offline and sync is enabled, add to sync queue
      if (this.offlineMode.syncEnabled) {
        const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const operation: SyncOperation = {
          id: operationId,
          type: docId ? 'update' : 'create',
          collection: collectionPath,
          docId,
          data,
          timestamp: Date.now(),
          attempts: 0
        };
        
        await this.addToSyncQueue(operation);
        
        // Return temporary ID for create operations
        return docId || `temp_${operationId}`;
      }
      
      throw new Error('Cannot save data: offline and sync is disabled');
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  /**
   * Save data to Firestore
   * @param collectionPath Firestore collection path
   * @param data Data to save
   * @param docId Document ID (optional, will be generated if not provided)
   * @returns Document ID
   */
  private async saveDataToFirestore(
    collectionPath: string,
    data: any,
    docId?: string
  ): Promise<string> {
    try {
      if (docId) {
        // Update existing document
        const docRef = doc(firestore, collectionPath, docId);
        await setDoc(docRef, data, { merge: true });
        return docId;
      } else {
        // Create new document
        const collectionRef = collection(firestore, collectionPath);
        const docRef = await addDoc(collectionRef, data);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving data to Firestore:', error);
      throw error;
    }
  }

  /**
   * Delete data from Firestore or add to sync queue
   * @param collectionPath Firestore collection path
   * @param docId Document ID
   */
  public async deleteData(
    collectionPath: string,
    docId: string
  ): Promise<void> {
    try {
      // If online, delete data from Firestore
      if (this.isOnline) {
        await this.deleteDataFromFirestore(collectionPath, docId);
        return;
      }
      
      // If offline and sync is enabled, add to sync queue
      if (this.offlineMode.syncEnabled) {
        const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const operation: SyncOperation = {
          id: operationId,
          type: 'delete',
          collection: collectionPath,
          docId,
          timestamp: Date.now(),
          attempts: 0
        };
        
        await this.addToSyncQueue(operation);
        return;
      }
      
      throw new Error('Cannot delete data: offline and sync is disabled');
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }

  /**
   * Delete data from Firestore
   * @param collectionPath Firestore collection path
   * @param docId Document ID
   */
  private async deleteDataFromFirestore(
    collectionPath: string,
    docId: string
  ): Promise<void> {
    try {
      const docRef = doc(firestore, collectionPath, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting data from Firestore:', error);
      throw error;
    }
  }

  /**
   * Add operation to sync queue
   * @param operation Sync operation
   */
  private async addToSyncQueue(operation: SyncOperation): Promise<void> {
    try {
      // Get current sync queue
      const queue = await this.getSyncQueue();
      
      // Check if queue is full
      if (queue.length >= this.offlineMode.maxSyncQueueSize) {
        throw new Error('Sync queue is full');
      }
      
      // Add operation to queue
      queue.push(operation);
      
      // Save updated queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Track analytics event
      analyticsService.trackEvent('sync_operation_queued', {
        operationType: operation.type,
        collection: operation.collection
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   * @returns Sync queue
   */
  private async getSyncQueue(): Promise<SyncOperation[]> {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Sync pending operations
   */
  public async syncPendingOperations(): Promise<void> {
    try {
      // If sync is already in progress, return
      if (this.syncInProgress || !this.isOnline || !this.offlineMode.syncEnabled) {
        return;
      }
      
      this.syncInProgress = true;
      
      // Get sync queue
      const queue = await this.getSyncQueue();
      
      if (queue.length === 0) {
        this.syncInProgress = false;
        return;
      }
      
      console.log(`Syncing ${queue.length} pending operations...`);
      
      // Track analytics event
      analyticsService.trackEvent('sync_started', {
        operationCount: queue.length
      });
      
      // Process operations
      const updatedQueue: SyncOperation[] = [];
      let successCount = 0;
      
      for (const operation of queue) {
        try {
          // Update attempt count and timestamp
          operation.attempts += 1;
          operation.lastAttempt = Date.now();
          
          switch (operation.type) {
            case 'create':
            case 'update':
              if (operation.collection && operation.data) {
                const docId = await this.saveDataToFirestore(
                  operation.collection,
                  operation.data,
                  operation.type === 'update' ? operation.docId : undefined
                );
                
                // If this was a create operation, update any references to the temporary ID
                if (operation.type === 'create' && operation.docId && operation.docId.startsWith('temp_')) {
                  await this.updateTempIdReferences(operation.docId, docId);
                }
              }
              break;
              
            case 'delete':
              if (operation.collection && operation.docId) {
                await this.deleteDataFromFirestore(operation.collection, operation.docId);
              }
              break;
          }
          
          // Operation succeeded
          successCount += 1;
        } catch (error) {
          console.error('Error processing sync operation:', error);
          
          // Add error information to operation
          operation.error = error instanceof Error ? error.message : 'Unknown error';
          
          // If operation has failed too many times, log error and continue
          if (operation.attempts >= 5) {
            console.error(`Operation ${operation.id} failed too many times, removing from queue`);
            
            // Track analytics event
            analyticsService.trackEvent('sync_operation_failed', {
              operationType: operation.type,
              collection: operation.collection,
              attempts: operation.attempts,
              error: operation.error
            });
          } else {
            // Add operation back to queue for retry
            updatedQueue.push(operation);
          }
        }
      }
      
      // Save updated queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      // Track analytics event
      analyticsService.trackEvent('sync_completed', {
        successCount,
        failureCount: queue.length - successCount,
        remainingCount: updatedQueue.length
      });
      
      console.log(`Sync completed: ${successCount} succeeded, ${queue.length - successCount} failed, ${updatedQueue.length} remaining`);
      
      this.syncInProgress = false;
    } catch (error) {
      console.error('Error syncing pending operations:', error);
      this.syncInProgress = false;
    }
  }

  /**
   * Update references to temporary IDs
   * @param tempId Temporary ID
   * @param actualId Actual ID
   */
  private async updateTempIdReferences(tempId: string, actualId: string): Promise<void> {
    // This is a placeholder for updating references to temporary IDs
    // In a real implementation, you would need to scan through relevant collections
    // and update any references to the temporary ID with the actual ID
    console.log(`Updating references from temporary ID ${tempId} to actual ID ${actualId}`);
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter cache keys
      const cacheKeys = keys.filter(key => 
        key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_METADATA_PREFIX)
      );
      
      // Remove cache keys
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      // Track analytics event
      analyticsService.trackEvent('cache_cleared', {
        itemCount: cacheKeys.length
      });
      
      console.log(`Cleared ${cacheKeys.length} cache items`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache size
   * @returns Cache size in bytes
   */
  public async getCacheSize(): Promise<number> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter cache metadata keys
      const metadataKeys = keys.filter(key => key.startsWith(CACHE_METADATA_PREFIX));
      
      // Get cache size
      let totalSize = 0;
      
      for (const key of metadataKeys) {
        const metadataStr = await AsyncStorage.getItem(key);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          totalSize += metadata.size || 0;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Clean up expired cache items
   */
  public async cleanupExpiredCache(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter cache metadata keys
      const metadataKeys = keys.filter(key => key.startsWith(CACHE_METADATA_PREFIX));
      
      // Check each cache item
      const now = Date.now();
      let expiredCount = 0;
      
      for (const metadataKey of metadataKeys) {
        const metadataStr = await AsyncStorage.getItem(metadataKey);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          
          // Check if expired
          if (metadata.expiresAt && metadata.expiresAt < now) {
            // Remove cache item and metadata
            const cacheKey = metadataKey.replace(CACHE_METADATA_PREFIX, CACHE_PREFIX);
            await AsyncStorage.removeItem(cacheKey);
            await AsyncStorage.removeItem(metadataKey);
            expiredCount += 1;
          }
        }
      }
      
      // Track analytics event
      if (expiredCount > 0) {
        analyticsService.trackEvent('cache_cleanup', {
          expiredCount
        });
      }
      
      console.log(`Cleaned up ${expiredCount} expired cache items`);
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Unsubscribe from NetInfo
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    
    // Clear listeners
    this.listeners = [];
  }
}

export default new OfflineService();