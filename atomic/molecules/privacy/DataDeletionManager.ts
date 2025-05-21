/**
 * Data Deletion Manager
 *
 * This class manages data deletion requests from users.
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getDataCategory } from '../../atoms/privacy/dataCategories';

/**
 * Request status enum
 */
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/**
 * Deletion type enum
 */
export enum DeletionType {
  SPECIFIC_CATEGORIES = 'specificCategories',
  ACCOUNT = 'account',
}

/**
 * Data deletion request interface
 */
export interface DataDeletionRequest {
  id: string;
  userId: string;
  type: DeletionType;
  categories?: string[];
  status: RequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  rejectionReason?: string;
}

/**
 * Data Deletion Manager class
 */
class DataDeletionManager {
  private db = getFirestore();
  private collectionPath = 'dataDeletionRequests';

  /**
   * Request data deletion
   * @param userId The user ID
   * @param categories The data categories to delete
   * @returns A promise that resolves when the request is submitted
   */
  async requestDataDeletion(userId: string, categories: string[]): Promise<void> {
    try {
      // Create request ID
      const requestId = `${userId}_${Date.now()}`;
      const docRef = doc(this.db, this.collectionPath, requestId);

      // Create request
      const request: DataDeletionRequest = {
        id: requestId,
        userId,
        type: DeletionType.SPECIFIC_CATEGORIES,
        categories,
        status: RequestStatus.PENDING,
        requestedAt: new Date(),
      };

      // Save request
      await setDoc(docRef, request);

      // Trigger background job to process request
      // This would typically be done with a Cloud Function
      console.log(`Data deletion request submitted: ${requestId}`);
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  }

  /**
   * Request account deletion
   * @param userId The user ID
   * @returns A promise that resolves when the request is submitted
   */
  async requestAccountDeletion(userId: string): Promise<void> {
    try {
      // Create request ID
      const requestId = `${userId}_account_${Date.now()}`;
      const docRef = doc(this.db, this.collectionPath, requestId);

      // Create request
      const request: DataDeletionRequest = {
        id: requestId,
        userId,
        type: DeletionType.ACCOUNT,
        status: RequestStatus.PENDING,
        requestedAt: new Date(),
      };

      // Save request
      await setDoc(docRef, request);

      // Trigger background job to process request
      // This would typically be done with a Cloud Function
      console.log(`Account deletion request submitted: ${requestId}`);
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  /**
   * Get request status
   * @param requestId The request ID
   * @returns The status of the request
   */
  async getRequestStatus(requestId: string): Promise<string> {
    try {
      const docRef = doc(this.db, this.collectionPath, requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.status;
      } else {
        throw new Error(`Request not found: ${requestId}`);
      }
    } catch (error) {
      console.error('Error getting request status:', error);
      throw error;
    }
  }

  /**
   * Get user requests
   * @param userId The user ID
   * @returns The user's data deletion requests
   */
  async getUserRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const q = query(collection(this.db, this.collectionPath), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const requests: DataDeletionRequest[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();

        // Convert Firestore timestamps to Date objects
        const request: DataDeletionRequest = {
          ...data,
          requestedAt: this.convertTimestampToDate(data.requestedAt),
          completedAt: this.convertTimestampToDate(data.completedAt),
        } as DataDeletionRequest;

        requests.push(request);
      });

      return requests;
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  }

  /**
   * Convert Firestore timestamp to Date
   * @param timestamp The timestamp to convert
   * @returns The converted Date or undefined if the timestamp is undefined
   */
  private convertTimestampToDate(timestamp: any): Date | undefined {
    if (!timestamp) return undefined;

    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp) {
      return new Date(timestamp);
    }

    return undefined;
  }

  /**
   * Cancel deletion request
   * @param requestId The request ID
   * @returns A promise that resolves when the request is cancelled
   */
  async cancelRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionPath, requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.status === RequestStatus.COMPLETED) {
          throw new Error(`Cannot cancel completed request: ${requestId}`);
        }

        // Update request status
        await setDoc(
          docRef,
          {
            ...data,
            status: RequestStatus.REJECTED,
            rejectionReason: 'Cancelled by user',
          },
          { merge: true }
        );

        console.log(`Deletion request cancelled: ${requestId}`);
      } else {
        throw new Error(`Request not found: ${requestId}`);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }
}

export default DataDeletionManager;
