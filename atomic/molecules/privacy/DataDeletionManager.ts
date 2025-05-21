/**
 * Data Deletion Manager
 *
 * This component handles data deletion requests, including full account deletion
 * and selective data deletion in compliance with GDPR and CCPA requirements.
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore,
} from 'firebase/firestore';

import { DataDeletionRequest } from '../../../atomic/atoms/privacy/privacyTypes';
import { PrivacyRequestStatus, PrivacyRequestType } from '../../../atomic/atoms/privacy/gdprConfig';
import {
  getAllDataCategories,
  getDataCategory,
} from '../../../atomic/atoms/privacy/dataCategories';
import { anonymizeData } from '../../../atomic/atoms/privacy/storageUtils';

// Initialize Firestore
const db: Firestore = getFirestore();

/**
 * Create a new data deletion request
 * @param userId The ID of the user requesting deletion of their data
 * @param dataCategories Optional array of specific data categories to delete
 * @param fullDeletion Whether to delete all user data and the account
 * @returns The created request object
 */
export async function createDataDeletionRequest(
  userId: string,
  dataCategories?: string[],
  fullDeletion: boolean = false
): Promise<DataDeletionRequest> {
  try {
    // Create the request object
    const requestId = `ddr_${Date.now()}_${userId}`;
    const request: DataDeletionRequest = {
      id: requestId,
      userId,
      type: PrivacyRequestType.DELETION,
      status: PrivacyRequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: 'pending',
      requestData: {
        dataCategories,
        fullDeletion,
      },
    };

    // Save the request to Firestore
    await setDoc(doc(db, 'privacyRequests', requestId), request);

    // Return the created request
    return request;
  } catch (error) {
    console.error('Error creating data deletion request:', error);
    throw new Error('Failed to create data deletion request');
  }
}

/**
 * Get a data deletion request by ID
 * @param requestId The ID of the request to get
 * @returns The request object, or null if not found
 */
export async function getDataDeletionRequest(
  requestId: string
): Promise<DataDeletionRequest | null> {
  try {
    // Get the request from Firestore
    const docRef = doc(db, 'privacyRequests', requestId);
    const docSnap = await getDoc(docRef);

    // Return null if the request doesn't exist
    if (!docSnap.exists()) {
      return null;
    }

    // Return the request data
    return docSnap.data() as DataDeletionRequest;
  } catch (error) {
    console.error('Error getting data deletion request:', error);
    throw new Error('Failed to get data deletion request');
  }
}

/**
 * Process a data deletion request
 * @param requestId The ID of the request to process
 * @returns The updated request object
 */
export async function processDataDeletionRequest(requestId: string): Promise<DataDeletionRequest> {
  try {
    // Get the request
    const request = await getDataDeletionRequest(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Check if the request is already completed or processing
    if (
      request.status === PrivacyRequestStatus.COMPLETED ||
      request.status === PrivacyRequestStatus.PROCESSING
    ) {
      return request;
    }

    // Check if the request is verified
    if (request.verificationStatus !== 'verified') {
      throw new Error(`Request ${requestId} is not verified`);
    }

    // Update the request status to processing
    const docRef = doc(db, 'privacyRequests', requestId);
    await updateDoc(docRef, {
      status: PrivacyRequestStatus.PROCESSING,
      updatedAt: new Date(),
    });

    // Delete or anonymize the user data
    const result = await deleteUserData(
      request.userId,
      request.requestData?.fullDeletion || false,
      request.requestData?.dataCategories
    );

    // Update the request with the result and mark as completed
    await updateDoc(docRef, {
      status: PrivacyRequestStatus.COMPLETED,
      updatedAt: new Date(),
      completedAt: new Date(),
      responseData: {
        deletedCategories: result.deletedCategories,
        anonymizedCategories: result.anonymizedCategories,
        accountDeleted: result.accountDeleted,
      },
    });

    // Return the updated request
    return {
      ...request,
      status: PrivacyRequestStatus.COMPLETED,
      updatedAt: new Date(),
      completedAt: new Date(),
      responseData: {
        deletedCategories: result.deletedCategories,
        anonymizedCategories: result.anonymizedCategories,
        accountDeleted: result.accountDeleted,
      },
    };
  } catch (error) {
    console.error('Error processing data deletion request:', error);
    throw new Error('Failed to process data deletion request');
  }
}

/**
 * Delete or anonymize user data
 * @param userId The ID of the user to delete data for
 * @param fullDeletion Whether to delete all user data and the account
 * @param specificCategories Optional array of specific data categories to delete
 * @returns Object containing the result of the deletion operation
 */
export async function deleteUserData(
  userId: string,
  fullDeletion: boolean = false,
  specificCategories?: string[]
): Promise<{
  deletedCategories: string[];
  anonymizedCategories: string[];
  accountDeleted: boolean;
}> {
  try {
    const deletedCategories: string[] = [];
    const anonymizedCategories: string[] = [];
    let accountDeleted = false;

    // Determine which categories to delete
    const categories = specificCategories
      ? specificCategories.map(id => getDataCategory(id)).filter(Boolean)
      : fullDeletion
      ? getAllDataCategories()
      : [];

    // Delete or anonymize data for each category
    for (const category of categories) {
      if (!category) continue;

      // Some categories can be deleted, others must be anonymized
      if (category.canDelete) {
        await deleteDataForCategory(userId, category.id);
        deletedCategories.push(category.id);
      } else {
        await anonymizeDataForCategory(userId, category.id);
        anonymizedCategories.push(category.id);
      }
    }

    // If full deletion is requested, delete the user account
    if (fullDeletion) {
      await deleteUserAccount(userId);
      accountDeleted = true;
    }

    return {
      deletedCategories,
      anonymizedCategories,
      accountDeleted,
    };
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data');
  }
}

/**
 * Delete data for a specific category
 * @param userId The ID of the user to delete data for
 * @param categoryId The ID of the category to delete
 */
async function deleteDataForCategory(userId: string, categoryId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    switch (categoryId) {
      case 'profileData':
        // Delete user profile data
        batch.delete(doc(db, 'users', userId));
        break;

      case 'paymentData':
        // Delete user payment data
        const subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('userId', '==', userId)
        );
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
        subscriptionsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        break;

      case 'usageData':
        // Delete user activity data
        const activitiesQuery = query(collection(db, 'activity'), where('userId', '==', userId));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        activitiesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        break;

      case 'communicationData':
        // Delete user communication data
        const communicationsQuery = query(collection(db, 'support'), where('userId', '==', userId));
        const communicationsSnapshot = await getDocs(communicationsQuery);
        communicationsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        break;

      case 'marketingData':
        // Delete user marketing data
        const marketingQuery = query(collection(db, 'marketing'), where('userId', '==', userId));
        const marketingSnapshot = await getDocs(marketingQuery);
        marketingSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        break;

      default:
        console.warn(`Unknown category: ${categoryId}`);
        break;
    }

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error(`Error deleting data for category ${categoryId}:`, error);
    throw new Error(`Failed to delete data for category ${categoryId}`);
  }
}

/**
 * Anonymize data for a specific category
 * @param userId The ID of the user to anonymize data for
 * @param categoryId The ID of the category to anonymize
 */
async function anonymizeDataForCategory(userId: string, categoryId: string): Promise<void> {
  try {
    switch (categoryId) {
      case 'accountData':
        // Anonymize user account data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const anonymizedData = anonymizeData(userData, [
            'email',
            'displayName',
            'phoneNumber',
            'photoURL',
          ]);
          await updateDoc(doc(db, 'users', userId), anonymizedData);
        }
        break;

      default:
        console.warn(`Unknown category or category cannot be anonymized: ${categoryId}`);
        break;
    }
  } catch (error) {
    console.error(`Error anonymizing data for category ${categoryId}:`, error);
    throw new Error(`Failed to anonymize data for category ${categoryId}`);
  }
}

/**
 * Delete a user account
 * @param userId The ID of the user to delete
 */
async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // In a real implementation, we would use the auth service to delete the user
    // For now, we'll just mark the user as deleted in Firestore
    await updateDoc(doc(db, 'users', userId), {
      deleted: true,
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete user account');
  }
}

export default {
  createDataDeletionRequest,
  getDataDeletionRequest,
  processDataDeletionRequest,
  deleteUserData,
};
