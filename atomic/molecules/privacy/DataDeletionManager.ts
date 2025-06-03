/**
 * Data Deletion Manager
 *
 * This class manages data deletion requests, allowing users to request deletion of their personal data.
 * It handles the creation, processing, and completion of data deletion requests, as well as
 * providing status updates on deletion progress.
 */

import { getAuth, deleteUser } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

import { getDataCategory } from '../../atoms/privacy/dataCategories';
import { PrivacyRequestStatus, PrivacyRequestType } from '../../atoms/privacy/gdprConfig';
import { DataDeletionRequest } from '../../atoms/privacy/privacyTypes';

/**
 * Class for managing data deletion requests
 */
export class DataDeletionManager {
  private db = getFirestore();
  private auth = getAuth();
  private requestsCollection = 'privacyRequests';

  /**
   * Create a data deletion request
   * @param userId The user ID
   * @param fullDeletion Whether to delete all data or just specific categories
   * @param dataCategories The data categories to delete (if not full deletion)
   * @returns The ID of the created request
   */
  async createDataDeletionRequest(
    userId: string,
    fullDeletion: boolean = true,
    dataCategories?: string[]
  ): Promise<string> {
    try {
      // Create the request
      const request: Omit<DataDeletionRequest, 'id'> = {
        userId,
        type: PrivacyRequestType.DELETION,
        status: PrivacyRequestStatus.PENDING,
        verificationStatus: 'pending',
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
        completedAt: undefined,
        requestData: {
          fullDeletion,
          dataCategories: fullDeletion ? undefined : dataCategories,
        },
      };

      // Add the request to Firestore
      const docRef = await addDoc(collection(this.db, this.requestsCollection), request);

      console.log(`Created data deletion request ${docRef.id} for user ${userId}`);

      // Start processing the request asynchronously
      this.processDataDeletionRequest(docRef.id).catch(error => {
        console.error(`Error processing data deletion request ${docRef.id}:`, error);
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating data deletion request:', error);
      throw error;
    }
  }

  /**
   * Get a data deletion request by ID
   * @param requestId The request ID
   * @returns The data deletion request, or null if not found
   */
  async getDataDeletionRequest(requestId: string): Promise<DataDeletionRequest | null> {
    try {
      const docRef = doc(this.db, this.requestsCollection, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as Omit<DataDeletionRequest, 'id'>;

      // Verify that this is a data deletion request
      if (data.type !== PrivacyRequestType.DELETION) {
        return null;
      }

      return {
        id: docSnap.id,
        ...data,
      };
    } catch (error) {
      console.error(`Error getting data deletion request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get all data deletion requests for a user
   * @param userId The user ID
   * @returns Array of data deletion requests
   */
  async getUserDataDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const q = query(
        collection(this.db, this.requestsCollection),
        where('userId', '==', userId),
        where('type', '==', PrivacyRequestType.DELETION)
      );

      const querySnapshot = await getDocs(q);
      const requests: DataDeletionRequest[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<DataDeletionRequest, 'id'>;
        requests.push({
          id: doc.id,
          ...data,
        });
      });

      return requests;
    } catch (error) {
      console.error(`Error getting data deletion requests for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process a data deletion request
   * @param requestId The request ID
   */
  async processDataDeletionRequest(requestId: string): Promise<void> {
    try {
      // Get the request
      const request = await this.getDataDeletionRequest(requestId);
      if (!request) {
        throw new Error(`Data deletion request ${requestId} not found`);
      }

      // Update the request status to processing
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.PROCESSING,
        updatedAt: Timestamp.now(),
      });

      // Perform the data deletion
      const result = await this.deleteUserData(
        request.userId,
        request.requestData.fullDeletion,
        request.requestData.dataCategories
      );

      // Update the request status to completed
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.COMPLETED,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        responseData: {
          deletedCategories: result.deletedCategories,
          anonymizedCategories: result.anonymizedCategories,
          retainedCategories: result.retainedCategories,
          retentionReasons: result.retentionReasons,
          accountDeleted: result.accountDeleted,
        },
      });

      console.log(`Completed data deletion request ${requestId}`);
    } catch (error) {
      console.error(`Error processing data deletion request ${requestId}:`, error);

      // Update the request status to failed
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.FAILED,
        updatedAt: Timestamp.now(),
      });
    }
  }

  /**
   * Delete user data
   * @param userId The user ID
   * @param fullDeletion Whether to delete all data
   * @param dataCategories The data categories to delete (if not full deletion)
   * @returns The result of the deletion operation
   */
  private async deleteUserData(
    userId: string,
    fullDeletion: boolean,
    dataCategories?: string[]
  ): Promise<{
    deletedCategories: string[];
    anonymizedCategories?: string[];
    retainedCategories?: string[];
    retentionReasons?: { [category: string]: string };
    accountDeleted: boolean;
  }> {
    const result = {
      deletedCategories: [] as string[],
      anonymizedCategories: [] as string[],
      retainedCategories: [] as string[],
      retentionReasons: {} as { [category: string]: string },
      accountDeleted: false,
    };

    try {
      // Get the user's auth record
      const user = await this.auth.currentUser;

      // If full deletion, delete all user data
      if (fullDeletion) {
        // Delete user profile data
        await this.deleteUserProfile(userId);
        result.deletedCategories.push('profileData');

        // Delete user activity data
        await this.deleteUserActivity(userId);
        result.deletedCategories.push('usageData');

        // Delete user analytics data
        await this.deleteUserAnalytics(userId);
        result.deletedCategories.push('analyticsData');

        // Delete user marketing data
        await this.deleteUserMarketing(userId);
        result.deletedCategories.push('marketingData');

        // Delete user payment data (anonymize instead of delete for legal reasons)
        await this.anonymizeUserPayments(userId);
        result.anonymizedCategories.push('paymentData');
        result.retentionReasons['paymentData'] = 'Legal requirement for financial records';

        // Delete user communication data
        await this.deleteUserCommunications(userId);
        result.deletedCategories.push('communicationData');

        // Delete the user's auth record if they are the current user
        if (user && user.uid === userId) {
          await deleteUser(user);
          result.accountDeleted = true;
        }
      } else if (dataCategories && dataCategories.length > 0) {
        // Delete only specified categories
        for (const category of dataCategories) {
          switch (category) {
            case 'profileData':
              await this.deleteUserProfile(userId);
              result.deletedCategories.push('profileData');
              break;
            case 'usageData':
              await this.deleteUserActivity(userId);
              result.deletedCategories.push('usageData');
              break;
            case 'analyticsData':
              await this.deleteUserAnalytics(userId);
              result.deletedCategories.push('analyticsData');
              break;
            case 'marketingData':
              await this.deleteUserMarketing(userId);
              result.deletedCategories.push('marketingData');
              break;
            case 'paymentData':
              // Payment data is anonymized instead of deleted for legal reasons
              await this.anonymizeUserPayments(userId);
              result.anonymizedCategories.push('paymentData');
              result.retentionReasons['paymentData'] = 'Legal requirement for financial records';
              break;
            case 'communicationData':
              await this.deleteUserCommunications(userId);
              result.deletedCategories.push('communicationData');
              break;
            default:
              console.warn(`Unknown data category: ${category}`);
              result.retainedCategories.push(category);
              result.retentionReasons[category] = 'Unknown data category';
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`Error deleting user data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user profile data
   * @param userId The user ID
   */
  private async deleteUserProfile(userId: string): Promise<void> {
    try {
      // Get the user document
      const userDoc = doc(this.db, 'users', userId);

      // Check if the user document exists
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        // Delete the user document
        await deleteDoc(userDoc);
      }
    } catch (error) {
      console.error(`Error deleting user profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user activity data
   * @param userId The user ID
   */
  private async deleteUserActivity(userId: string): Promise<void> {
    try {
      // Get all activity documents for the user
      const activityQuery = query(collection(this.db, 'activity'), where('userId', '==', userId));
      const activitySnapshot = await getDocs(activityQuery);

      // Delete each activity document
      const deletePromises = activitySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting user activity for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user analytics data
   * @param userId The user ID
   */
  private async deleteUserAnalytics(userId: string): Promise<void> {
    try {
      // Get all analytics documents for the user
      const analyticsQuery = query(collection(this.db, 'analytics'), where('userId', '==', userId));
      const analyticsSnapshot = await getDocs(analyticsQuery);

      // Delete each analytics document
      const deletePromises = analyticsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting user analytics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user marketing data
   * @param userId The user ID
   */
  private async deleteUserMarketing(userId: string): Promise<void> {
    try {
      // Get all marketing documents for the user
      const marketingQuery = query(collection(this.db, 'marketing'), where('userId', '==', userId));
      const marketingSnapshot = await getDocs(marketingQuery);

      // Delete each marketing document
      const deletePromises = marketingSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting user marketing for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Anonymize user payment data
   * @param userId The user ID
   */
  private async anonymizeUserPayments(userId: string): Promise<void> {
    try {
      // Get all payment documents for the user
      const paymentsQuery = query(collection(this.db, 'payments'), where('userId', '==', userId));
      const paymentsSnapshot = await getDocs(paymentsQuery);

      // Anonymize each payment document
      const updatePromises = paymentsSnapshot.docs.map(doc => {
        const data = doc.data();

        // Replace personal information with anonymized values
        const anonymizedData = {
          ...data,
          userId: 'ANONYMIZED',
          userEmail: 'anonymized@example.com',
          userName: 'Anonymized User',
          // Keep transaction IDs, amounts, and dates for financial records
        };

        return updateDoc(doc.ref, anonymizedData);
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error(`Error anonymizing user payments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user communication data
   * @param userId The user ID
   */
  private async deleteUserCommunications(userId: string): Promise<void> {
    try {
      // Get all communication documents for the user
      const communicationsQuery = query(
        collection(this.db, 'communications'),
        where('userId', '==', userId)
      );
      const communicationsSnapshot = await getDocs(communicationsQuery);

      // Delete each communication document
      const deletePromises = communicationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting user communications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a data deletion request
   * @param requestId The request ID
   * @returns Whether the cancellation was successful
   */
  async cancelDataDeletionRequest(requestId: string): Promise<boolean> {
    try {
      // Get the request
      const request = await this.getDataDeletionRequest(requestId);
      if (!request) {
        throw new Error(`Data deletion request ${requestId} not found`);
      }

      // Check if the request can be cancelled
      if (request.status !== PrivacyRequestStatus.PENDING) {
        return false;
      }

      // Update the request status to denied
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.DENIED,
        updatedAt: Timestamp.now(),
        notes: 'Request cancelled by user',
      });

      return true;
    } catch (error) {
      console.error(`Error cancelling data deletion request ${requestId}:`, error);
      throw error;
    }
  }
}

export default DataDeletionManager;
