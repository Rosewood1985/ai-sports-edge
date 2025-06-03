import AsyncStorage from '@react-native-async-storage/async-storage';

import { analyticsService } from './analyticsService';
import networkService from './networkService';

/**
 * Action types that can be queued
 */
export enum QueuedActionType {
  API_REQUEST = 'api_request',
  DATA_SYNC = 'data_sync',
  USER_ACTION = 'user_action',
  ANALYTICS_EVENT = 'analytics_event',
}

/**
 * Status of a queued action
 */
export enum QueuedActionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  MERGE = 'merge',
  PROMPT_USER = 'prompt_user',
}

/**
 * Base interface for all queued actions
 */
export interface QueuedActionBase {
  id: string;
  type: QueuedActionType;
  createdAt: number;
  status: QueuedActionStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  error?: string;
  conflictResolution?: ConflictResolutionStrategy;
}

/**
 * API request action
 */
export interface ApiRequestAction extends QueuedActionBase {
  type: QueuedActionType.API_REQUEST;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
}

/**
 * Data sync action
 */
export interface DataSyncAction extends QueuedActionBase {
  type: QueuedActionType.DATA_SYNC;
  entityType: string;
  entityId: string;
  data: any;
  operation: 'create' | 'update' | 'delete';
}

/**
 * User action
 */
export interface UserAction extends QueuedActionBase {
  type: QueuedActionType.USER_ACTION;
  actionType: string;
  payload: any;
}

/**
 * Analytics event action
 */
export interface AnalyticsEventAction extends QueuedActionBase {
  type: QueuedActionType.ANALYTICS_EVENT;
  eventName: string;
  eventParams: Record<string, any>;
}

/**
 * Union type for all queued actions
 */
export type QueuedAction = ApiRequestAction | DataSyncAction | UserAction | AnalyticsEventAction;

/**
 * Action processor function type
 */
export type ActionProcessor<T extends QueuedAction> = (action: T) => Promise<boolean>;

/**
 * Conflict handler function type
 */
export type ConflictHandler<T extends QueuedAction> = (action: T, serverData: any) => Promise<any>;

/**
 * Service for managing offline actions queue
 */
class OfflineQueueService {
  private static readonly STORAGE_KEY = '@AISportsEdge:offlineQueue';
  private queue: QueuedAction[] = [];
  private isProcessing: boolean = false;
  private processors: Map<QueuedActionType, ActionProcessor<any>> = new Map();
  private conflictHandlers: Map<string, ConflictHandler<any>> = new Map();
  private listeners: ((queue: QueuedAction[]) => void)[] = [];
  private syncInterval: any = null;

  /**
   * Initialize the offline queue service
   */
  async initialize(): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();

      // Register default processors
      this.registerDefaultProcessors();

      // Subscribe to network status changes
      networkService.addListener(this.handleNetworkStatusChange);

      // Start sync interval
      this.startSyncInterval();

      console.log('Offline queue service initialized');
    } catch (error) {
      console.error('Error initializing offline queue service:', error);
      analyticsService.trackError(error as Error, { method: 'initialize' });
    }
  }

  /**
   * Clean up the offline queue service
   */
  cleanup(): void {
    // Clear sync interval
    this.stopSyncInterval();

    // Clear listeners
    this.listeners = [];

    console.log('Offline queue service cleaned up');
  }

  /**
   * Add an action to the queue
   * @param action Action to add
   * @returns Promise with the queued action
   */
  async addToQueue<T extends QueuedAction>(
    action: Omit<T, 'id' | 'createdAt' | 'status' | 'retryCount'>
  ): Promise<T> {
    try {
      // Generate ID if not provided
      const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create queued action
      const queuedAction: T = {
        ...(action as any),
        id,
        createdAt: Date.now(),
        status: QueuedActionStatus.PENDING,
        retryCount: 0,
      } as T;

      // Add to queue
      this.queue.push(queuedAction);

      // Save queue
      await this.saveQueue();

      // Notify listeners
      this.notifyListeners();

      // Track event
      analyticsService.trackEvent('offline_action_queued', {
        actionType: action.type,
        priority: action.priority,
      });

      // Process queue if online
      if (networkService.isConnected()) {
        this.processQueue();
      }

      return queuedAction;
    } catch (error) {
      console.error('Error adding action to queue:', error);
      analyticsService.trackError(error as Error, { method: 'addToQueue' });
      throw error;
    }
  }

  /**
   * Remove an action from the queue
   * @param actionId ID of the action to remove
   * @returns Promise that resolves when the action is removed
   */
  async removeFromQueue(actionId: string): Promise<void> {
    try {
      // Find action index
      const index = this.queue.findIndex(action => action.id === actionId);

      // If action not found, return
      if (index === -1) {
        console.warn(`Action with ID ${actionId} not found in queue`);
        return;
      }

      // Remove action
      this.queue.splice(index, 1);

      // Save queue
      await this.saveQueue();

      // Notify listeners
      this.notifyListeners();

      console.log(`Action with ID ${actionId} removed from queue`);
    } catch (error) {
      console.error('Error removing action from queue:', error);
      analyticsService.trackError(error as Error, { method: 'removeFromQueue' });
      throw error;
    }
  }

  /**
   * Clear the entire queue
   * @returns Promise that resolves when the queue is cleared
   */
  async clearQueue(): Promise<void> {
    try {
      // Clear queue
      this.queue = [];

      // Save queue
      await this.saveQueue();

      // Notify listeners
      this.notifyListeners();

      console.log('Queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
      analyticsService.trackError(error as Error, { method: 'clearQueue' });
      throw error;
    }
  }

  /**
   * Get all actions in the queue
   * @returns Array of queued actions
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Get actions in the queue by status
   * @param status Status to filter by
   * @returns Array of queued actions with the specified status
   */
  getQueueByStatus(status: QueuedActionStatus): QueuedAction[] {
    return this.queue.filter(action => action.status === status);
  }

  /**
   * Get actions in the queue by type
   * @param type Type to filter by
   * @returns Array of queued actions with the specified type
   */
  getQueueByType<T extends QueuedAction>(type: QueuedActionType): T[] {
    return this.queue.filter(action => action.type === type) as T[];
  }

  /**
   * Register a processor for a specific action type
   * @param type Action type
   * @param processor Processor function
   */
  registerProcessor<T extends QueuedAction>(
    type: QueuedActionType,
    processor: ActionProcessor<T>
  ): void {
    this.processors.set(type, processor);
    console.log(`Processor registered for action type: ${type}`);
  }

  /**
   * Register a conflict handler for a specific entity type
   * @param entityType Entity type
   * @param handler Conflict handler function
   */
  registerConflictHandler<T extends QueuedAction>(
    entityType: string,
    handler: ConflictHandler<T>
  ): void {
    this.conflictHandlers.set(entityType, handler);
    console.log(`Conflict handler registered for entity type: ${entityType}`);
  }

  /**
   * Add a listener for queue changes
   * @param listener Function to call when the queue changes
   * @returns Function to remove the listener
   */
  addListener(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.push(listener);

    // Notify listener immediately
    listener(this.getQueue());

    // Return function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Process the queue
   * @returns Promise that resolves when the queue is processed
   */
  async processQueue(): Promise<void> {
    // If already processing or offline, return
    if (this.isProcessing || !networkService.isConnected()) {
      return;
    }

    try {
      // Set processing flag
      this.isProcessing = true;

      // Get pending actions sorted by priority (highest first)
      const pendingActions = this.queue
        .filter(
          action =>
            action.status === QueuedActionStatus.PENDING ||
            action.status === QueuedActionStatus.RETRYING
        )
        .sort((a, b) => b.priority - a.priority);

      // If no pending actions, return
      if (pendingActions.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing ${pendingActions.length} pending actions`);

      // Process each action
      for (const action of pendingActions) {
        // Skip if offline
        if (!networkService.isConnected()) {
          console.log('Network disconnected, stopping queue processing');
          break;
        }

        // Get processor for action type
        const processor = this.processors.get(action.type);

        // If no processor, mark as failed
        if (!processor) {
          console.warn(`No processor registered for action type: ${action.type}`);
          await this.updateActionStatus(
            action.id,
            QueuedActionStatus.FAILED,
            'No processor registered'
          );
          continue;
        }

        // Update status to processing
        await this.updateActionStatus(action.id, QueuedActionStatus.PROCESSING);

        try {
          // Process action
          const success = await processor(action);

          // Update status based on result
          if (success) {
            await this.updateActionStatus(action.id, QueuedActionStatus.COMPLETED);
          } else {
            // Increment retry count
            const updatedAction = this.queue.find(a => a.id === action.id);

            if (updatedAction) {
              updatedAction.retryCount++;

              // Check if max retries reached
              if (updatedAction.retryCount >= updatedAction.maxRetries) {
                await this.updateActionStatus(
                  action.id,
                  QueuedActionStatus.FAILED,
                  'Max retries reached'
                );
              } else {
                await this.updateActionStatus(action.id, QueuedActionStatus.RETRYING);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing action ${action.id}:`, error);

          // Increment retry count
          const updatedAction = this.queue.find(a => a.id === action.id);

          if (updatedAction) {
            updatedAction.retryCount++;
            updatedAction.error = (error as Error).message;

            // Check if max retries reached
            if (updatedAction.retryCount >= updatedAction.maxRetries) {
              await this.updateActionStatus(
                action.id,
                QueuedActionStatus.FAILED,
                (error as Error).message
              );
            } else {
              await this.updateActionStatus(
                action.id,
                QueuedActionStatus.RETRYING,
                (error as Error).message
              );
            }
          }
        }
      }

      // Save queue
      await this.saveQueue();

      // Track event
      analyticsService.trackEvent('offline_queue_processed', {
        queueSize: this.queue.length,
        pendingCount: this.getQueueByStatus(QueuedActionStatus.PENDING).length,
        completedCount: this.getQueueByStatus(QueuedActionStatus.COMPLETED).length,
        failedCount: this.getQueueByStatus(QueuedActionStatus.FAILED).length,
      });
    } catch (error) {
      console.error('Error processing queue:', error);
      analyticsService.trackError(error as Error, { method: 'processQueue' });
    } finally {
      // Clear processing flag
      this.isProcessing = false;
    }
  }

  /**
   * Load the queue from storage
   * @returns Promise that resolves when the queue is loaded
   */
  private async loadQueue(): Promise<void> {
    try {
      // Get queue from storage
      const queueJson = await AsyncStorage.getItem(OfflineQueueService.STORAGE_KEY);

      // If queue exists, parse it
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`Loaded ${this.queue.length} actions from storage`);
      } else {
        this.queue = [];
        console.log('No actions found in storage');
      }

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading queue from storage:', error);
      analyticsService.trackError(error as Error, { method: 'loadQueue' });

      // Initialize empty queue
      this.queue = [];
    }
  }

  /**
   * Save the queue to storage
   * @returns Promise that resolves when the queue is saved
   */
  private async saveQueue(): Promise<void> {
    try {
      // Convert queue to JSON
      const queueJson = JSON.stringify(this.queue);

      // Save to storage
      await AsyncStorage.setItem(OfflineQueueService.STORAGE_KEY, queueJson);

      console.log(`Saved ${this.queue.length} actions to storage`);
    } catch (error) {
      console.error('Error saving queue to storage:', error);
      analyticsService.trackError(error as Error, { method: 'saveQueue' });
    }
  }

  /**
   * Update the status of an action
   * @param actionId ID of the action to update
   * @param status New status
   * @param error Optional error message
   * @returns Promise that resolves when the action is updated
   */
  private async updateActionStatus(
    actionId: string,
    status: QueuedActionStatus,
    error?: string
  ): Promise<void> {
    // Find action
    const action = this.queue.find(a => a.id === actionId);

    // If action not found, return
    if (!action) {
      console.warn(`Action with ID ${actionId} not found in queue`);
      return;
    }

    // Update status
    action.status = status;

    // Update last attempt
    action.lastAttempt = Date.now();

    // Update error if provided
    if (error) {
      action.error = error;
    }

    // If completed, track event
    if (status === QueuedActionStatus.COMPLETED) {
      analyticsService.trackEvent('offline_action_completed', {
        actionType: action.type,
        retryCount: action.retryCount,
      });
    }

    // If failed, track event
    if (status === QueuedActionStatus.FAILED) {
      analyticsService.trackEvent('offline_action_failed', {
        actionType: action.type,
        retryCount: action.retryCount,
        error: action.error,
      });
    }

    // Save queue
    await this.saveQueue();

    // Notify listeners
    this.notifyListeners();

    console.log(`Action ${actionId} status updated to ${status}`);
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const queue = this.getQueue();

    this.listeners.forEach(listener => {
      try {
        listener(queue);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  /**
   * Register default processors for each action type
   */
  private registerDefaultProcessors(): void {
    // API request processor
    this.registerProcessor<ApiRequestAction>(QueuedActionType.API_REQUEST, async action => {
      try {
        // Implement API request processing
        console.log(`Processing API request to ${action.endpoint}`);

        // This would be implemented with actual API call logic
        return true;
      } catch (error) {
        console.error(`Error processing API request to ${action.endpoint}:`, error);
        throw error;
      }
    });

    // Data sync processor
    this.registerProcessor<DataSyncAction>(QueuedActionType.DATA_SYNC, async action => {
      try {
        // Implement data sync processing
        console.log(`Processing data sync for ${action.entityType}:${action.entityId}`);

        // This would be implemented with actual data sync logic
        return true;
      } catch (error) {
        console.error(
          `Error processing data sync for ${action.entityType}:${action.entityId}:`,
          error
        );
        throw error;
      }
    });

    // User action processor
    this.registerProcessor<UserAction>(QueuedActionType.USER_ACTION, async action => {
      try {
        // Implement user action processing
        console.log(`Processing user action: ${action.actionType}`);

        // This would be implemented with actual user action logic
        return true;
      } catch (error) {
        console.error(`Error processing user action ${action.actionType}:`, error);
        throw error;
      }
    });

    // Analytics event processor
    this.registerProcessor<AnalyticsEventAction>(QueuedActionType.ANALYTICS_EVENT, async action => {
      try {
        // Implement analytics event processing
        console.log(`Processing analytics event: ${action.eventName}`);

        // Track the event
        analyticsService.trackEvent(action.eventName, action.eventParams);

        return true;
      } catch (error) {
        console.error(`Error processing analytics event ${action.eventName}:`, error);
        throw error;
      }
    });
  }

  /**
   * Handle network status change
   */
  private handleNetworkStatusChange = (info: any): void => {
    // If connected, process queue
    if (info.isConnected) {
      console.log('Network connected, processing queue');
      this.processQueue();
    }
  };

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    // Clear any existing interval
    this.stopSyncInterval();

    // Start new interval (every 5 minutes)
    this.syncInterval = setInterval(
      () => {
        // If online, process queue
        if (networkService.isConnected() && !this.isProcessing) {
          console.log('Sync interval triggered, processing queue');
          this.processQueue();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    console.log('Sync interval started');
  }

  /**
   * Stop sync interval
   */
  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Sync interval stopped');
    }
  }
}

export const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
