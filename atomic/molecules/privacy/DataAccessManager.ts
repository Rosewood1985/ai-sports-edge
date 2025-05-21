/**
 * Data Access Manager
 *
 * This class manages data access requests from users.
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
  Timestamp,
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
 * Data format enum
 */
export enum DataFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

/**
 * Data access request interface
 */
export interface DataAccessRequest {
  id: string;
  userId: string;
  categories: string[];
  format: DataFormat;
  status: RequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

/**
 * Data Access Manager class
 */
class DataAccessManager {
  private db = getFirestore();
  private collectionPath = 'dataAccessRequests';

  /**
   * Request data access
   * @param userId The user ID
   * @param categories The data categories to include in the request
   * @param format The format of the data (e.g., 'json', 'csv')
   * @returns A promise that resolves when the request is submitted
   */
  async requestDataAccess(userId: string, categories: string[], format: string): Promise<void> {
    try {
      // Validate format
      if (!Object.values(DataFormat).includes(format as DataFormat)) {
        throw new Error(`Invalid format: ${format}`);
      }

      // Create request ID
      const requestId = `${userId}_${Date.now()}`;
      const docRef = doc(this.db, this.collectionPath, requestId);

      // Create request
      const request: DataAccessRequest = {
        id: requestId,
        userId,
        categories,
        format: format as DataFormat,
        status: RequestStatus.PENDING,
        requestedAt: new Date(),
      };

      // Save request
      await setDoc(docRef, request);

      // Trigger background job to process request
      // This would typically be done with a Cloud Function
      console.log(`Data access request submitted: ${requestId}`);
    } catch (error) {
      console.error('Error requesting data access:', error);
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
   * @returns The user's data access requests
   */
  async getUserRequests(userId: string): Promise<DataAccessRequest[]> {
    try {
      const q = query(collection(this.db, this.collectionPath), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const requests: DataAccessRequest[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();

        // Convert Firestore timestamps to Date objects
        const request: DataAccessRequest = {
          ...data,
          requestedAt: this.convertTimestampToDate(data.requestedAt),
          completedAt: this.convertTimestampToDate(data.completedAt),
          expiresAt: this.convertTimestampToDate(data.expiresAt),
        } as DataAccessRequest;

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
   * Get download URL for a completed request
   * @param requestId The request ID
   * @returns The download URL
   */
  async getDownloadUrl(requestId: string): Promise<string> {
    try {
      const docRef = doc(this.db, this.collectionPath, requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.status !== RequestStatus.COMPLETED) {
          throw new Error(`Request not completed: ${requestId}`);
        }

        if (!data.downloadUrl) {
          throw new Error(`Download URL not available: ${requestId}`);
        }

        return data.downloadUrl;
      } else {
        throw new Error(`Request not found: ${requestId}`);
      }
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
}

export default DataAccessManager;
