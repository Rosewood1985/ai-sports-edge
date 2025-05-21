/**
 * Data Access Manager
 *
 * This component handles data access requests, compiles user data from various sources,
 * and formats data for export in compliance with GDPR and CCPA requirements.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore,
} from 'firebase/firestore';

import { DataAccessRequest } from '../../../atomic/atoms/privacy/privacyTypes';
import {
  PrivacyRequestStatus,
  PrivacyRequestType,
  privacyRequestConfig,
} from '../../../atomic/atoms/privacy/gdprConfig';
import {
  getAllDataCategories,
  getDataCategory,
  getFieldsForCategory,
  getCategoryForField,
} from '../../../atomic/atoms/privacy/dataCategories';
import { encryptData, anonymizeData } from '../../../atomic/atoms/privacy/storageUtils';

// Initialize Firestore
// Note: In a real implementation, we would use the Firebase config from the config file
// For this example, we'll use a placeholder Firestore instance
const db: Firestore = getFirestore();

/**
 * Create a new data access request
 * @param userId The ID of the user requesting access to their data
 * @param dataCategories Optional array of specific data categories to include
 * @param format The format to export the data in
 * @returns The created request object
 */
export async function createDataAccessRequest(
  userId: string,
  dataCategories?: string[],
  format: 'json' | 'csv' | 'pdf' = 'json'
): Promise<DataAccessRequest> {
  try {
    // Create the request object
    const requestId = `dar_${Date.now()}_${userId}`;
    const request: DataAccessRequest = {
      id: requestId,
      userId,
      type: PrivacyRequestType.ACCESS,
      status: PrivacyRequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: 'pending',
      requestData: {
        dataCategories,
        format,
      },
    };

    // Save the request to Firestore
    await setDoc(doc(db, 'privacyRequests', requestId), request);

    // Return the created request
    return request;
  } catch (error) {
    console.error('Error creating data access request:', error);
    throw new Error('Failed to create data access request');
  }
}

/**
 * Get a data access request by ID
 * @param requestId The ID of the request to get
 * @returns The request object, or null if not found
 */
export async function getDataAccessRequest(requestId: string): Promise<DataAccessRequest | null> {
  try {
    // Get the request from Firestore
    const docRef = doc(db, 'privacyRequests', requestId);
    const docSnap = await getDoc(docRef);

    // Return null if the request doesn't exist
    if (!docSnap.exists()) {
      return null;
    }

    // Return the request data
    return docSnap.data() as DataAccessRequest;
  } catch (error) {
    console.error('Error getting data access request:', error);
    throw new Error('Failed to get data access request');
  }
}

/**
 * Process a data access request
 * @param requestId The ID of the request to process
 * @returns The updated request object
 */
export async function processDataAccessRequest(requestId: string): Promise<DataAccessRequest> {
  try {
    // Get the request
    const request = await getDataAccessRequest(requestId);
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

    // Collect the user data
    const userData = await collectUserData(request.userId, request.requestData?.dataCategories);

    // Format the data based on the requested format
    const formattedData = formatUserData(userData, request.requestData?.format || 'json');

    // Generate a download URL for the data
    const downloadUrl = await generateDownloadUrl(
      formattedData,
      request.requestData?.format || 'json'
    );

    // Calculate the expiration date for the download URL
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // URL expires in 24 hours

    // Update the request with the download URL and mark as completed
    await updateDoc(docRef, {
      status: PrivacyRequestStatus.COMPLETED,
      updatedAt: new Date(),
      completedAt: new Date(),
      responseData: {
        downloadUrl,
        expiresAt,
        size: formattedData.length,
      },
    });

    // Return the updated request
    return {
      ...request,
      status: PrivacyRequestStatus.COMPLETED,
      updatedAt: new Date(),
      completedAt: new Date(),
      responseData: {
        downloadUrl,
        expiresAt,
        size: formattedData.length,
      },
    };
  } catch (error) {
    console.error('Error processing data access request:', error);
    throw new Error('Failed to process data access request');
  }
}

/**
 * Collect user data from various sources
 * @param userId The ID of the user to collect data for
 * @param specificCategories Optional array of specific data categories to include
 * @returns Object containing the collected user data
 */
export async function collectUserData(
  userId: string,
  specificCategories?: string[]
): Promise<Record<string, any>> {
  try {
    const userData: Record<string, any> = {};

    // Determine which categories to collect
    const categories = specificCategories
      ? specificCategories.map(id => getDataCategory(id)).filter(Boolean)
      : getAllDataCategories();

    // Collect user account data
    if (!specificCategories || specificCategories.includes('accountData')) {
      // In a real implementation, we would use the auth service to get user data
      // For now, we'll just use a placeholder
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userData.accountData = {
          email: userDoc.data().email,
          displayName: userDoc.data().displayName,
          phoneNumber: userDoc.data().phoneNumber,
          photoURL: userDoc.data().photoURL,
          emailVerified: userDoc.data().emailVerified,
          createdAt: userDoc.data().createdAt,
          lastLoginAt: userDoc.data().lastLoginAt,
        };
      }
    }

    // Collect user profile data
    if (!specificCategories || specificCategories.includes('profileData')) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userData.profileData = userDoc.data();
      }
    }

    // Collect user subscription data
    if (!specificCategories || specificCategories.includes('paymentData')) {
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', userId)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

      if (!subscriptionsSnapshot.empty) {
        userData.paymentData = {
          subscriptions: subscriptionsSnapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => doc.data()
          ),
        };
      }
    }

    // Collect user activity data
    if (!specificCategories || specificCategories.includes('usageData')) {
      const activitiesQuery = query(
        collection(db, 'activity'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);

      if (!activitiesSnapshot.empty) {
        userData.usageData = {
          activities: activitiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
            doc.data()
          ),
        };
      }
    }

    // Collect user communication data
    if (!specificCategories || specificCategories.includes('communicationData')) {
      const communicationsQuery = query(
        collection(db, 'support'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const communicationsSnapshot = await getDocs(communicationsQuery);

      if (!communicationsSnapshot.empty) {
        userData.communicationData = {
          support: communicationsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
            doc.data()
          ),
        };
      }
    }

    // Collect user marketing data
    if (!specificCategories || specificCategories.includes('marketingData')) {
      const marketingQuery = query(collection(db, 'marketing'), where('userId', '==', userId));
      const marketingSnapshot = await getDocs(marketingQuery);

      if (!marketingSnapshot.empty) {
        userData.marketingData = marketingSnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => doc.data()
        );
      }
    }

    return userData;
  } catch (error) {
    console.error('Error collecting user data:', error);
    throw new Error('Failed to collect user data');
  }
}

/**
 * Format user data for export
 * @param userData The user data to format
 * @param format The format to export the data in
 * @returns The formatted data as a string
 */
export function formatUserData(
  userData: Record<string, any>,
  format: 'json' | 'csv' | 'pdf' = 'json'
): string {
  try {
    switch (format) {
      case 'json':
        return JSON.stringify(userData, null, 2);

      case 'csv':
        // Flatten the data structure for CSV format
        const flatData: Record<string, string> = {};

        // Helper function to flatten nested objects
        const flattenObject = (obj: any, prefix = '') => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              flattenObject(obj[key], `${prefix}${key}.`);
            } else if (Array.isArray(obj[key])) {
              flatData[`${prefix}${key}`] = JSON.stringify(obj[key]);
            } else {
              flatData[`${prefix}${key}`] = obj[key]?.toString() || '';
            }
          }
        };

        // Flatten the user data
        flattenObject(userData);

        // Convert to CSV
        const headers = Object.keys(flatData).join(',');
        const values = Object.values(flatData)
          .map(value => `"${value.replace(/"/g, '""')}"`)
          .join(',');

        return `${headers}\n${values}`;

      case 'pdf':
        // For PDF, we'll return JSON for now
        // In a real implementation, we would use a PDF generation library
        return JSON.stringify(userData, null, 2);

      default:
        return JSON.stringify(userData, null, 2);
    }
  } catch (error) {
    console.error('Error formatting user data:', error);
    throw new Error('Failed to format user data');
  }
}

/**
 * Generate a download URL for the data
 * @param data The data to generate a download URL for
 * @param format The format of the data
 * @returns The download URL
 */
export async function generateDownloadUrl(
  data: string,
  format: 'json' | 'csv' | 'pdf' = 'json'
): Promise<string> {
  try {
    // Encrypt the data for security
    const encryptedData = await encryptData(data);

    // In a real implementation, we would upload the encrypted data to a secure storage service
    // and generate a signed URL for download

    // For now, we'll just return a placeholder URL
    return `https://api.aisportsedge.app/privacy/download/${Date.now()}`;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Verify a user's identity for a data access request
 * @param requestId The ID of the request to verify
 * @param verificationMethod The method used to verify the user's identity
 * @param verificationData Data used for verification
 * @returns The updated request object
 */
export async function verifyDataAccessRequest(
  requestId: string,
  verificationMethod: string,
  verificationData: any
): Promise<DataAccessRequest> {
  try {
    // Get the request
    const request = await getDataAccessRequest(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Check if the request is already verified
    if (request.verificationStatus === 'verified') {
      return request;
    }

    // Verify the user's identity based on the verification method
    let verified = false;

    switch (verificationMethod) {
      case 'email':
        // In a real implementation, we would send a verification email
        // and verify the token provided by the user
        verified = true;
        break;

      case 'password':
        // In a real implementation, we would verify the user's password
        verified = true;
        break;

      case 'code':
        // In a real implementation, we would verify the code sent to the user
        verified = true;
        break;

      default:
        throw new Error(`Unsupported verification method: ${verificationMethod}`);
    }

    // Update the request verification status
    const docRef = doc(db, 'privacyRequests', requestId);
    await updateDoc(docRef, {
      verificationStatus: verified ? 'verified' : 'failed',
      verificationMethod,
      updatedAt: new Date(),
    });

    // Return the updated request
    return {
      ...request,
      verificationStatus: verified ? 'verified' : 'failed',
      verificationMethod,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error verifying data access request:', error);
    throw new Error('Failed to verify data access request');
  }
}

export default {
  createDataAccessRequest,
  getDataAccessRequest,
  processDataAccessRequest,
  collectUserData,
  formatUserData,
  generateDownloadUrl,
  verifyDataAccessRequest,
};
