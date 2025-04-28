import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';
import networkService, { ConnectionStatus } from './networkService';
import offlineQueueService, {
  QueuedActionType,
  ConflictResolutionStrategy,
  DataSyncAction
} from './offlineQueueService';

/**
 * Sync status for an entity
 */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error'
}

/**
 * Entity type
 */
export enum EntityType {
  USER = 'user',
  GAME = 'game',
  TEAM = 'team',
  PLAYER = 'player',
  BET = 'bet',
  ARTICLE = 'article',
  NOTIFICATION = 'notification',
  SUBSCRIPTION = 'subscription',
  SETTING = 'setting',
  PREFERENCE = 'preference'
}

/**
 * Entity data
 */
export interface EntityData {
  id: string;
  type: EntityType;
  data: any;
  version: number;
  lastModified: number;
  syncStatus: SyncStatus;
  lastSynced?: number;
  conflictData?: any;
  errorMessage?: string;
}

/**
 * Sync options
 */
export interface SyncOptions {
  forceSync?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
  batchSize?: number;
  syncOrder?: EntityType[];
  onProgress?: (progress: number, total: number) => void;
  onComplete?: (results: SyncResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  totalEntities: number;
  syncedEntities: number;
  pendingEntities: number;
  conflictEntities: number;
  errorEntities: number;
  entityResults: Record<EntityType, {
    total: number;
    synced: number;
    pending: number;
    conflict: number;
    error: number;
  }>;
  timestamp: number;
}

/**
 * Storage options
 */
export interface StorageOptions {
  maxStorageSize?: number; // in bytes
  priorityEntities?: EntityType[];
  expirationTime?: number; // in milliseconds
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
}

/**
 * Service for data synchronization
 */
class DataSyncService {
  private static readonly STORAGE_PREFIX = '@AISportsEdge:entity:';
  private static readonly SYNC_STATE_KEY = '@AISportsEdge:syncState';
  private static readonly DEFAULT_BATCH_SIZE = 50;
  private static readonly DEFAULT_MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DEFAULT_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  private syncInProgress: boolean = false;
  private lastSyncResult: SyncResult | null = null;
  private storageOptions: StorageOptions = {
    maxStorageSize: DataSyncService.DEFAULT_MAX_STORAGE_SIZE,
    priorityEntities: [
      EntityType.USER,
      EntityType.GAME,
      EntityType.BET,
      EntityType.PREFERENCE
    ],
    expirationTime: DataSyncService.DEFAULT_EXPIRATION_TIME,
    compressionEnabled: true,
    encryptionEnabled: false
  };
  
  /**
   * Initialize the data sync service
   */
  async initialize(): Promise<void> {
    try {
      // Subscribe to network status changes
      networkService.addListener(this.handleNetworkStatusChange);
      
      // Initialize storage
      await this.initializeStorage();
      
      console.log('Data sync service initialized');
    } catch (error) {
      console.error('Error initializing data sync service:', error);
      analyticsService.trackError(error as Error, { method: 'initialize' });
    }
  }
  
  /**
   * Clean up the data sync service
   */
  cleanup(): void {
    console.log('Data sync service cleaned up');
  }
  
  /**
   * Set storage options
   * @param options Storage options
   */
  setStorageOptions(options: Partial<StorageOptions>): void {
    this.storageOptions = {
      ...this.storageOptions,
      ...options
    };
    
    console.log('Storage options updated:', this.storageOptions);
  }
  
  /**
   * Get storage options
   * @returns Storage options
   */
  getStorageOptions(): StorageOptions {
    return { ...this.storageOptions };
  }
  
  /**
   * Get entity by ID
   * @param type Entity type
   * @param id Entity ID
   * @returns Entity data or null if not found
   */
  async getEntity<T = any>(type: EntityType, id: string): Promise<EntityData | null> {
    try {
      const key = this.getEntityKey(type, id);
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as EntityData;
    } catch (error) {
      console.error(`Error getting entity ${type}:${id}:`, error);
      analyticsService.trackError(error as Error, { method: 'getEntity', type, id });
      return null;
    }
  }
  
  /**
   * Save entity
   * @param entity Entity data
   * @returns Promise that resolves when the entity is saved
   */
  async saveEntity(entity: EntityData): Promise<void> {
    try {
      // Validate entity
      if (!entity.id || !entity.type) {
        throw new Error('Entity must have id and type');
      }
      
      // Update last modified
      entity.lastModified = Date.now();
      
      // Set sync status to pending if not already set
      if (!entity.syncStatus) {
        entity.syncStatus = SyncStatus.PENDING;
      }
      
      // Save entity
      const key = this.getEntityKey(entity.type, entity.id);
      await AsyncStorage.setItem(key, JSON.stringify(entity));
      
      // Queue sync action if pending
      if (entity.syncStatus === SyncStatus.PENDING) {
        await this.queueSyncAction(entity);
      }
      
      // Check storage usage
      await this.checkStorageUsage();
      
      console.log(`Entity ${entity.type}:${entity.id} saved`);
    } catch (error) {
      console.error(`Error saving entity ${entity.type}:${entity.id}:`, error);
      analyticsService.trackError(error as Error, { method: 'saveEntity', entity });
      throw error;
    }
  }
  
  /**
   * Delete entity
   * @param type Entity type
   * @param id Entity ID
   * @returns Promise that resolves when the entity is deleted
   */
  async deleteEntity(type: EntityType, id: string): Promise<void> {
    try {
      // Get entity
      const entity = await this.getEntity(type, id);
      
      if (!entity) {
        console.log(`Entity ${type}:${id} not found, nothing to delete`);
        return;
      }
      
      // Delete entity
      const key = this.getEntityKey(type, id);
      await AsyncStorage.removeItem(key);
      
      // Queue delete action
      await offlineQueueService.addToQueue<DataSyncAction>({
        type: QueuedActionType.DATA_SYNC,
        priority: 5,
        maxRetries: 3,
        entityType: type,
        entityId: id,
        data: null,
        operation: 'delete'
      });
      
      console.log(`Entity ${type}:${id} deleted`);
    } catch (error) {
      console.error(`Error deleting entity ${type}:${id}:`, error);
      analyticsService.trackError(error as Error, { method: 'deleteEntity', type, id });
      throw error;
    }
  }
  
  /**
   * Get entities by type
   * @param type Entity type
   * @param filter Optional filter function
   * @returns Array of entities
   */
  async getEntitiesByType<T = any>(
    type: EntityType,
    filter?: (entity: EntityData) => boolean
  ): Promise<EntityData[]> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys by type
      const typePrefix = `${DataSyncService.STORAGE_PREFIX}${type}:`;
      const typeKeys = allKeys.filter(key => key.startsWith(typePrefix));
      
      if (typeKeys.length === 0) {
        return [];
      }
      
      // Get entities
      const entityDataArray = await AsyncStorage.multiGet(typeKeys);
      
      // Parse entities
      const entities: EntityData[] = entityDataArray
        .map(([key, value]) => (value ? JSON.parse(value) : null))
        .filter(entity => entity !== null);
      
      // Apply filter if provided
      if (filter) {
        return entities.filter(filter);
      }
      
      return entities;
    } catch (error) {
      console.error(`Error getting entities by type ${type}:`, error);
      analyticsService.trackError(error as Error, { method: 'getEntitiesByType', type });
      return [];
    }
  }
  
  /**
   * Sync all pending entities
   * @param options Sync options
   * @returns Promise with sync result
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    // If sync already in progress, return last result
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return this.lastSyncResult || {
        success: false,
        totalEntities: 0,
        syncedEntities: 0,
        pendingEntities: 0,
        conflictEntities: 0,
        errorEntities: 0,
        entityResults: {} as Record<EntityType, any>,
        timestamp: Date.now()
      };
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Starting sync with options:', options);
      
      // Check network status
      if (!networkService.isConnected() && !options.forceSync) {
        console.log('Network not connected, skipping sync');
        
        const result: SyncResult = {
          success: false,
          totalEntities: 0,
          syncedEntities: 0,
          pendingEntities: 0,
          conflictEntities: 0,
          errorEntities: 0,
          entityResults: {} as Record<EntityType, any>,
          timestamp: Date.now()
        };
        
        this.lastSyncResult = result;
        
        if (options.onError) {
          options.onError(new Error('Network not connected'));
        }
        
        return result;
      }
      
      // Get all entity types
      const entityTypes = Object.values(EntityType);
      
      // Reorder entity types if sync order provided
      const syncOrder = options.syncOrder || this.storageOptions.priorityEntities || entityTypes;
      
      // Create ordered list of entity types
      const orderedTypes: EntityType[] = [
        ...syncOrder,
        ...entityTypes.filter(type => !syncOrder.includes(type))
      ];
      
      // Initialize result
      const result: SyncResult = {
        success: true,
        totalEntities: 0,
        syncedEntities: 0,
        pendingEntities: 0,
        conflictEntities: 0,
        errorEntities: 0,
        entityResults: {} as Record<EntityType, any>,
        timestamp: Date.now()
      };
      
      // Initialize entity results
      entityTypes.forEach(type => {
        result.entityResults[type] = {
          total: 0,
          synced: 0,
          pending: 0,
          conflict: 0,
          error: 0
        };
      });
      
      // Sync each entity type
      for (const type of orderedTypes) {
        // Get pending entities
        const pendingEntities = await this.getEntitiesByType(
          type,
          entity => entity.syncStatus === SyncStatus.PENDING
        );
        
        result.entityResults[type].total += pendingEntities.length;
        result.totalEntities += pendingEntities.length;
        
        if (pendingEntities.length === 0) {
          continue;
        }
        
        console.log(`Syncing ${pendingEntities.length} ${type} entities`);
        
        // Process in batches
        const batchSize = options.batchSize || DataSyncService.DEFAULT_BATCH_SIZE;
        
        for (let i = 0; i < pendingEntities.length; i += batchSize) {
          const batch = pendingEntities.slice(i, i + batchSize);
          
          // Sync batch
          const batchResult = await this.syncBatch(type, batch, options);
          
          // Update result
          result.syncedEntities += batchResult.synced;
          result.pendingEntities += batchResult.pending;
          result.conflictEntities += batchResult.conflict;
          result.errorEntities += batchResult.error;
          
          result.entityResults[type].synced += batchResult.synced;
          result.entityResults[type].pending += batchResult.pending;
          result.entityResults[type].conflict += batchResult.conflict;
          result.entityResults[type].error += batchResult.error;
          
          // Report progress
          if (options.onProgress) {
            const progress = i + batch.length;
            options.onProgress(progress, pendingEntities.length);
          }
        }
      }
      
      // Update last sync result
      this.lastSyncResult = result;
      
      // Save sync state
      await this.saveSyncState({
        lastSync: Date.now(),
        result
      });
      
      console.log('Sync completed:', result);
      
      // Call onComplete callback
      if (options.onComplete) {
        options.onComplete(result);
      }
      
      return result;
    } catch (error) {
      console.error('Error syncing entities:', error);
      analyticsService.trackError(error as Error, { method: 'syncAll' });
      
      const result: SyncResult = {
        success: false,
        totalEntities: 0,
        syncedEntities: 0,
        pendingEntities: 0,
        conflictEntities: 0,
        errorEntities: 0,
        entityResults: {} as Record<EntityType, any>,
        timestamp: Date.now()
      };
      
      this.lastSyncResult = result;
      
      if (options.onError) {
        options.onError(error as Error);
      }
      
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Resolve conflict
   * @param entity Entity with conflict
   * @param resolution Resolution strategy
   * @returns Promise that resolves when the conflict is resolved
   */
  async resolveConflict(
    entity: EntityData,
    resolution: ConflictResolutionStrategy
  ): Promise<void> {
    try {
      if (entity.syncStatus !== SyncStatus.CONFLICT || !entity.conflictData) {
        throw new Error('Entity does not have a conflict');
      }
      
      console.log(`Resolving conflict for ${entity.type}:${entity.id} with strategy ${resolution}`);
      
      switch (resolution) {
        case ConflictResolutionStrategy.CLIENT_WINS:
          // Keep local data, increment version
          entity.version = Math.max(entity.version, entity.conflictData.version) + 1;
          entity.syncStatus = SyncStatus.PENDING;
          entity.conflictData = undefined;
          entity.errorMessage = undefined;
          break;
          
        case ConflictResolutionStrategy.SERVER_WINS:
          // Use server data
          entity.data = entity.conflictData.data;
          entity.version = entity.conflictData.version;
          entity.syncStatus = SyncStatus.SYNCED;
          entity.lastSynced = Date.now();
          entity.conflictData = undefined;
          entity.errorMessage = undefined;
          break;
          
        case ConflictResolutionStrategy.MERGE:
          // Merge data (implementation depends on entity type)
          entity.data = this.mergeEntityData(entity.type, entity.data, entity.conflictData.data);
          entity.version = Math.max(entity.version, entity.conflictData.version) + 1;
          entity.syncStatus = SyncStatus.PENDING;
          entity.conflictData = undefined;
          entity.errorMessage = undefined;
          break;
          
        default:
          throw new Error(`Unsupported conflict resolution strategy: ${resolution}`);
      }
      
      // Save resolved entity
      await this.saveEntity(entity);
      
      // Queue sync action if pending
      if (entity.syncStatus === SyncStatus.PENDING) {
        await this.queueSyncAction(entity);
      }
      
      console.log(`Conflict resolved for ${entity.type}:${entity.id}`);
    } catch (error) {
      console.error(`Error resolving conflict for ${entity.type}:${entity.id}:`, error);
      analyticsService.trackError(error as Error, { method: 'resolveConflict', entity });
      throw error;
    }
  }
  
  /**
   * Get storage usage
   * @returns Promise with storage usage in bytes
   */
  async getStorageUsage(): Promise<number> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys by prefix
      const entityKeys = allKeys.filter(key => key.startsWith(DataSyncService.STORAGE_PREFIX));
      
      if (entityKeys.length === 0) {
        return 0;
      }
      
      // Get entities
      const entityDataArray = await AsyncStorage.multiGet(entityKeys);
      
      // Calculate total size
      let totalSize = 0;
      
      entityDataArray.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      analyticsService.trackError(error as Error, { method: 'getStorageUsage' });
      return 0;
    }
  }
  
  /**
   * Clear all entities
   * @returns Promise that resolves when all entities are cleared
   */
  async clearAllEntities(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys by prefix
      const entityKeys = allKeys.filter(key => key.startsWith(DataSyncService.STORAGE_PREFIX));
      
      if (entityKeys.length === 0) {
        return;
      }
      
      // Remove all entities
      await AsyncStorage.multiRemove(entityKeys);
      
      console.log(`Cleared ${entityKeys.length} entities`);
    } catch (error) {
      console.error('Error clearing all entities:', error);
      analyticsService.trackError(error as Error, { method: 'clearAllEntities' });
      throw error;
    }
  }
  
  /**
   * Get entity key
   * @param type Entity type
   * @param id Entity ID
   * @returns Storage key
   */
  private getEntityKey(type: EntityType, id: string): string {
    return `${DataSyncService.STORAGE_PREFIX}${type}:${id}`;
  }
  
  /**
   * Initialize storage
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Check storage usage
      await this.checkStorageUsage();
      
      // Clean up expired entities
      await this.cleanupExpiredEntities();
      
      console.log('Storage initialized');
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }
  
  /**
   * Check storage usage
   */
  private async checkStorageUsage(): Promise<void> {
    try {
      // Get current usage
      const usage = await this.getStorageUsage();
      
      // Check if over limit
      if (usage > this.storageOptions.maxStorageSize!) {
        console.log(`Storage usage (${usage} bytes) exceeds limit (${this.storageOptions.maxStorageSize} bytes), cleaning up`);
        
        // Clean up storage
        await this.cleanupStorage(usage);
      }
    } catch (error) {
      console.error('Error checking storage usage:', error);
      throw error;
    }
  }
  
  /**
   * Clean up storage
   * @param currentUsage Current storage usage in bytes
   */
  private async cleanupStorage(currentUsage: number): Promise<void> {
    try {
      // Target usage (80% of max)
      const targetUsage = this.storageOptions.maxStorageSize! * 0.8;
      
      // If current usage is below target, no need to clean up
      if (currentUsage <= targetUsage) {
        return;
      }
      
      // Get all entities
      const allKeys = await AsyncStorage.getAllKeys();
      const entityKeys = allKeys.filter(key => key.startsWith(DataSyncService.STORAGE_PREFIX));
      
      if (entityKeys.length === 0) {
        return;
      }
      
      // Get entities
      const entityDataArray = await AsyncStorage.multiGet(entityKeys);
      
      // Parse entities and add size
      const entities: (EntityData & { size: number; key: string })[] = entityDataArray
        .map(([key, value]) => {
          if (!value) return null;
          
          const entity = JSON.parse(value) as EntityData;
          return {
            ...entity,
            size: value.length,
            key
          };
        })
        .filter(entity => entity !== null) as any[];
      
      // Sort entities by priority (non-priority first)
      const priorityTypes = this.storageOptions.priorityEntities || [];
      
      entities.sort((a, b) => {
        // Sort by priority
        const aPriority = priorityTypes.includes(a.type);
        const bPriority = priorityTypes.includes(b.type);
        
        if (aPriority && !bPriority) return 1;
        if (!aPriority && bPriority) return -1;
        
        // Then by sync status (synced first)
        if (a.syncStatus === SyncStatus.SYNCED && b.syncStatus !== SyncStatus.SYNCED) return -1;
        if (a.syncStatus !== SyncStatus.SYNCED && b.syncStatus === SyncStatus.SYNCED) return 1;
        
        // Then by last modified (oldest first)
        return a.lastModified - b.lastModified;
      });
      
      // Remove entities until target usage is reached
      let removedSize = 0;
      const keysToRemove: string[] = [];
      
      for (const entity of entities) {
        // Skip if entity is pending or in conflict
        if (entity.syncStatus === SyncStatus.PENDING || entity.syncStatus === SyncStatus.CONFLICT) {
          continue;
        }
        
        // Add to removal list
        keysToRemove.push(entity.key);
        removedSize += entity.size;
        
        // Check if target reached
        if (currentUsage - removedSize <= targetUsage) {
          break;
        }
      }
      
      // Remove entities
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`Removed ${keysToRemove.length} entities (${removedSize} bytes)`);
      }
    } catch (error) {
      console.error('Error cleaning up storage:', error);
      throw error;
    }
  }
  
  /**
   * Clean up expired entities
   */
  private async cleanupExpiredEntities(): Promise<void> {
    try {
      // Get all entities
      const allKeys = await AsyncStorage.getAllKeys();
      const entityKeys = allKeys.filter(key => key.startsWith(DataSyncService.STORAGE_PREFIX));
      
      if (entityKeys.length === 0) {
        return;
      }
      
      // Get entities
      const entityDataArray = await AsyncStorage.multiGet(entityKeys);
      
      // Find expired entities
      const now = Date.now();
      const expirationTime = this.storageOptions.expirationTime!;
      const keysToRemove: string[] = [];
      
      entityDataArray.forEach(([key, value]) => {
        if (!value) return;
        
        try {
          const entity = JSON.parse(value) as EntityData;
          
          // Skip if entity is pending or in conflict
          if (entity.syncStatus === SyncStatus.PENDING || entity.syncStatus === SyncStatus.CONFLICT) {
            return;
          }
          
          // Check if expired
          if (now - entity.lastModified > expirationTime) {
            keysToRemove.push(key);
          }
        } catch (error) {
          console.error(`Error parsing entity ${key}:`, error);
          // Add to removal list if can't parse
          keysToRemove.push(key);
        }
      });
      
      // Remove expired entities
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`Removed ${keysToRemove.length} expired entities`);
      }
    } catch (error) {
      console.error('Error cleaning up expired entities:', error);
      throw error;
    }
  }
  
  /**
   * Queue sync action
   * @param entity Entity to sync
   */
  private async queueSyncAction(entity: EntityData): Promise<void> {
    try {
      // Skip if not pending
      if (entity.syncStatus !== SyncStatus.PENDING) {
        return;
      }
      
      // Determine operation
      const operation = entity.data === null ? 'delete' : 'update';
      
      // Add to queue
      await offlineQueueService.addToQueue<DataSyncAction>({
        type: QueuedActionType.DATA_SYNC,
        priority: 5,
        maxRetries: 3,
        entityType: entity.type.toString(),
        entityId: entity.id,
        data: entity.data,
        operation
      });
      
      console.log(`Queued sync action for ${entity.type}:${entity.id}`);
    } catch (error) {
      console.error(`Error queuing sync action for ${entity.type}:${entity.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Sync batch of entities
   * @param type Entity type
   * @param entities Entities to sync
   * @param options Sync options
   * @returns Batch result
   */
  private async syncBatch(
    type: EntityType,
    entities: EntityData[],
    options: SyncOptions
  ): Promise<{ synced: number; pending: number; conflict: number; error: number }> {
    try {
      // Initialize result
      const result = {
        synced: 0,
        pending: 0,
        conflict: 0,
        error: 0
      };
      
      // Process each entity
      for (const entity of entities) {
        try {
          // Sync entity
          const syncResult = await this.syncEntity(entity, options);
          
          // Update result
          switch (syncResult.syncStatus) {
            case SyncStatus.SYNCED:
              result.synced++;
              break;
            case SyncStatus.PENDING:
              result.pending++;
              break;
            case SyncStatus.CONFLICT:
              result.conflict++;
              break;
            case SyncStatus.ERROR:
              result.error++;
              break;
          }
        } catch (error) {
          console.error(`Error syncing entity ${entity.type}:${entity.id}:`, error);
          result.error++;
          
          // Update entity with error
          entity.syncStatus = SyncStatus.ERROR;
          entity.errorMessage = (error as Error).message;
          await AsyncStorage.setItem(this.getEntityKey(entity.type, entity.id), JSON.stringify(entity));
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error syncing batch of ${type} entities:`, error);
      throw error;
    }
  }
  
  /**
   * Sync entity
   * @param entity Entity to sync
   * @param options Sync options
   * @returns Updated entity
   */
  private async syncEntity(
    entity: EntityData,
    options: SyncOptions
  ): Promise<EntityData> {
    try {
      // Skip if not pending
      if (entity.syncStatus !== SyncStatus.PENDING) {
        return entity;
      }
      
      console.log(`Syncing entity ${entity.type}:${entity.id}`);
      
      // Simulate API call
      // In a real implementation, this would call an API endpoint
      const apiResult = await this.simulateApiCall(entity);
      
      // Handle result
      if (apiResult.success) {
        // Update entity
        entity.syncStatus = SyncStatus.SYNCED;
        entity.lastSynced = Date.now();
        entity.version = apiResult.version || entity.version + 1;
        entity.conflictData = undefined;
        entity.errorMessage = undefined;
      } else if (apiResult.conflict) {
        // Handle conflict
        if (options.conflictResolution) {
          // Auto-resolve conflict
          await this.resolveConflict(entity, options.conflictResolution);
        } else {
          // Mark as conflict
          entity.syncStatus = SyncStatus.CONFLICT;
          entity.conflictData = apiResult.serverData;
          entity.errorMessage = 'Conflict with server data';
        }
      } else {
        // Handle error
        entity.syncStatus = SyncStatus.ERROR;
        entity.errorMessage = apiResult.error || 'Unknown error';
      }
      
      // Save updated entity
      await AsyncStorage.setItem(this.getEntityKey(entity.type, entity.id), JSON.stringify(entity));
      
      return entity;
    } catch (error) {
      console.error(`Error syncing entity ${entity.type}:${entity.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Simulate API call
   * @param entity Entity to sync
   * @returns API result
   */
  private async simulateApiCall(entity: EntityData): Promise<{
    success: boolean;
    version?: number;
    conflict?: boolean;
    serverData?: any;
    error?: string;
  }> {
    // This is a simulation of an API call
    // In a real implementation, this would call an API endpoint
    
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
    
    // Simulate different scenarios
    const random = Math.random();
    
    if (random < 0.7) {
      // Success (70% chance)
      return {
        success: true,
        version: entity.version + 1
      };
    } else if (random < 0.9) {
      // Conflict (20% chance)
      return {
        success: false,
        conflict: true,
        serverData: {
          ...entity.data,
          serverField: 'server value',
          version: entity.version + 1
        }
      };
    } else {
      // Error (10% chance)
      return {
        success: false,
        error: 'Simulated API error'
      };
    }
  }
  
  /**
   * Merge entity data
   * @param type Entity type
   * @param clientData Client data
   * @param serverData Server data
   * @returns Merged data
   */
  private mergeEntityData(type: EntityType, clientData: any, serverData: any): any {
    // This is a simple merge implementation
    // In a real implementation, this would be more sophisticated and type-specific
    
    // Start with server data
    const mergedData = { ...serverData };
    
    // Override with client data
    Object.entries(clientData).forEach(([key, value]) => {
      // Skip null values
      if (value !== null) {
        mergedData[key] = value;
      }
    });
    
    return mergedData;
  }
  
  /**
   * Save sync state
   * @param state Sync state
   */
  private async saveSyncState(state: { lastSync: number; result: SyncResult }): Promise<void> {
    try {
      await AsyncStorage.setItem(DataSyncService.SYNC_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }
  
  /**
   * Get sync state
   * @returns Sync state
   */
  async getSyncState(): Promise<{ lastSync: number; result: SyncResult } | null> {
    try {
      const state = await AsyncStorage.getItem(DataSyncService.SYNC_STATE_KEY);
      
      if (!state) {
        return null;
      }
      
      return JSON.parse(state);
    } catch (error) {
      console.error('Error getting sync state:', error);
      return null;
    }
  }
  
  /**
   * Handle network status change
   */
  private handleNetworkStatusChange = (info: any): void => {
    // If connected, process queue
    if (info.status === ConnectionStatus.CONNECTED) {
      console.log('Network connected, syncing pending entities');
      this.syncAll();
    }
  };
  
  /**
   * Get conflicts
   * @returns Promise with conflicts
   */
  async getConflicts(): Promise<EntityData[]> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys by prefix
      const entityKeys = allKeys.filter(key => key.startsWith(DataSyncService.STORAGE_PREFIX));
      
      if (entityKeys.length === 0) {
        return [];
      }
      
      // Get entities
      const entityDataArray = await AsyncStorage.multiGet(entityKeys);
      
      // Filter conflicts
      const conflicts: EntityData[] = entityDataArray
        .map(([key, value]) => (value ? JSON.parse(value) : null))
        .filter(entity => entity !== null && entity.syncStatus === SyncStatus.CONFLICT);
      
      return conflicts;
    } catch (error) {
      console.error('Error getting conflicts:', error);
      analyticsService.trackError(error as Error, { method: 'getConflicts' });
      return [];
    }
  }
}

export const dataSyncService = new DataSyncService();
export default dataSyncService;