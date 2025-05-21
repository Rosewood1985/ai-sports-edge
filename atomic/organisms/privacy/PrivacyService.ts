/**
 * Privacy Service
 *
 * This service provides functionality for managing privacy settings,
 * data access requests, and data deletion requests.
 */

import {
  initializeDataRetentionOnStartup,
  stopDataRetention,
} from '../../molecules/privacy/initializeDataRetention';
import { PrivacyManager } from '../../molecules/privacy/PrivacyManager';
import { DataAccessManager } from '../../molecules/privacy/DataAccessManager';
import { DataDeletionManager } from '../../molecules/privacy/DataDeletionManager';

/**
 * Privacy Service class
 */
class PrivacyService {
  private initialized: boolean = false;
  private privacyManager: PrivacyManager;
  private dataAccessManager: DataAccessManager;
  private dataDeletionManager: DataDeletionManager;

  constructor() {
    this.privacyManager = new PrivacyManager();
    this.dataAccessManager = new DataAccessManager();
    this.dataDeletionManager = new DataDeletionManager();
  }

  /**
   * Initialize the privacy service
   */
  initialize(): void {
    if (this.initialized) {
      console.log('Privacy service already initialized');
      return;
    }

    console.log('Initializing privacy service...');

    // Initialize data retention job
    initializeDataRetentionOnStartup();

    this.initialized = true;
    console.log('Privacy service initialized successfully');
  }

  /**
   * Get the privacy manager instance
   * @returns The privacy manager instance
   */
  getPrivacyManager(): PrivacyManager {
    return this.privacyManager;
  }

  /**
   * Get the data access manager instance
   * @returns The data access manager instance
   */
  getDataAccessManager(): DataAccessManager {
    return this.dataAccessManager;
  }

  /**
   * Get the data deletion manager instance
   * @returns The data deletion manager instance
   */
  getDataDeletionManager(): DataDeletionManager {
    return this.dataDeletionManager;
  }

  /**
   * Update user privacy preferences
   * @param userId The user ID
   * @param preferences The privacy preferences to update
   */
  updatePrivacyPreferences(userId: string, preferences: any): Promise<void> {
    return this.privacyManager.updatePrivacyPreferences(userId, preferences);
  }

  /**
   * Get user privacy preferences
   * @param userId The user ID
   * @returns The user's privacy preferences
   */
  getPrivacyPreferences(userId: string): Promise<any> {
    return this.privacyManager.getPrivacyPreferences(userId);
  }

  /**
   * Request data access
   * @param userId The user ID
   * @param categories The data categories to include in the request
   * @param format The format of the data (e.g., 'json', 'csv')
   * @returns A promise that resolves when the request is submitted
   */
  requestDataAccess(userId: string, categories: string[], format: string): Promise<void> {
    return this.dataAccessManager.requestDataAccess(userId, categories, format);
  }

  /**
   * Request data deletion
   * @param userId The user ID
   * @param categories The data categories to delete
   * @returns A promise that resolves when the request is submitted
   */
  requestDataDeletion(userId: string, categories: string[]): Promise<void> {
    return this.dataDeletionManager.requestDataDeletion(userId, categories);
  }

  /**
   * Request account deletion
   * @param userId The user ID
   * @returns A promise that resolves when the request is submitted
   */
  requestAccountDeletion(userId: string): Promise<void> {
    return this.dataDeletionManager.requestAccountDeletion(userId);
  }

  /**
   * Get data access request status
   * @param requestId The request ID
   * @returns The status of the data access request
   */
  getDataAccessRequestStatus(requestId: string): Promise<string> {
    return this.dataAccessManager.getRequestStatus(requestId);
  }

  /**
   * Get data deletion request status
   * @param requestId The request ID
   * @returns The status of the data deletion request
   */
  getDataDeletionRequestStatus(requestId: string): Promise<string> {
    return this.dataDeletionManager.getRequestStatus(requestId);
  }

  /**
   * Get user data access requests
   * @param userId The user ID
   * @returns The user's data access requests
   */
  getUserDataAccessRequests(userId: string): Promise<any[]> {
    return this.dataAccessManager.getUserRequests(userId);
  }

  /**
   * Get user data deletion requests
   * @param userId The user ID
   * @returns The user's data deletion requests
   */
  getUserDataDeletionRequests(userId: string): Promise<any[]> {
    return this.dataDeletionManager.getUserRequests(userId);
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  cleanup(): void {
    stopDataRetention();
    this.initialized = false;
    console.log('Privacy service cleaned up');
  }
}

// Create a singleton instance
export const privacyService = new PrivacyService();

export default privacyService;
