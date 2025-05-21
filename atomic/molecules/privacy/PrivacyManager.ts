/**
 * Privacy Manager
 *
 * This component serves as the main entry point for privacy-related functionality,
 * including data access, data deletion, and consent management in compliance with
 * GDPR and CCPA requirements.
 */

import {
  createDataAccessRequest,
  getDataAccessRequest,
  processDataAccessRequest,
  collectUserData,
  formatUserData,
  generateDownloadUrl,
  verifyDataAccessRequest,
} from './DataAccessManager';

import {
  createDataDeletionRequest,
  getDataDeletionRequest,
  processDataDeletionRequest,
  deleteUserData,
} from './DataDeletionManager';

import { PrivacyRequestType } from '../../../atomic/atoms/privacy/gdprConfig';
import {
  ConsentRecord,
  PrivacyPreferences,
  PrivacyRequestUnion,
} from '../../../atomic/atoms/privacy/privacyTypes';

import { getFirestore, doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';

// Initialize Firestore
const db: Firestore = getFirestore();

/**
 * Get all privacy requests for a user
 * @param userId The ID of the user to get requests for
 * @returns Array of privacy requests
 */
export async function getUserPrivacyRequests(userId: string): Promise<PrivacyRequestUnion[]> {
  try {
    // In a real implementation, we would query Firestore for all privacy requests for the user
    // For now, we'll just return an empty array
    return [];
  } catch (error) {
    console.error('Error getting user privacy requests:', error);
    throw new Error('Failed to get user privacy requests');
  }
}

/**
 * Update a user's privacy preferences
 * @param userId The ID of the user to update preferences for
 * @param preferences The new privacy preferences
 * @returns The updated privacy preferences
 */
export async function updatePrivacyPreferences(
  userId: string,
  preferences: Partial<PrivacyPreferences>
): Promise<PrivacyPreferences> {
  try {
    // Get the user's current privacy preferences
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const currentPreferences = userData.privacyPreferences || {
      marketingCommunications: false,
      dataAnalytics: false,
      thirdPartySharing: false,
      profiling: false,
    };

    // Update the preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    // Save the updated preferences to Firestore
    await updateDoc(doc(db, 'users', userId), {
      privacyPreferences: updatedPreferences,
      privacySettingsUpdatedAt: new Date(),
    });

    // Return the updated preferences
    return updatedPreferences;
  } catch (error) {
    console.error('Error updating privacy preferences:', error);
    throw new Error('Failed to update privacy preferences');
  }
}

/**
 * Record a user's consent for a specific purpose
 * @param userId The ID of the user giving consent
 * @param consentRecord The consent record to save
 * @returns The saved consent record
 */
export async function recordConsent(
  userId: string,
  consentRecord: ConsentRecord
): Promise<ConsentRecord> {
  try {
    // Save the consent record to Firestore
    await setDoc(doc(db, 'consents', consentRecord.id), consentRecord);

    // Update the user's consent records
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const consentRecords = userData.consentRecords || {};

      // Update the consent record for this type
      consentRecords[consentRecord.consentType] = {
        given: consentRecord.given,
        timestamp: consentRecord.timestamp,
        method: consentRecord.method,
        version: consentRecord.policyVersion,
      };

      // Save the updated consent records to the user document
      await updateDoc(doc(db, 'users', userId), {
        consentRecords,
      });
    }

    // Return the consent record
    return consentRecord;
  } catch (error) {
    console.error('Error recording consent:', error);
    throw new Error('Failed to record consent');
  }
}

/**
 * Check if a user has given consent for a specific purpose
 * @param userId The ID of the user to check consent for
 * @param consentType The type of consent to check
 * @returns Whether the user has given consent
 */
export async function hasConsent(userId: string, consentType: string): Promise<boolean> {
  try {
    // Get the user's consent records
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const consentRecords = userData.consentRecords || {};

    // Check if the user has given consent for this type
    const consentRecord = consentRecords[consentType];
    return consentRecord ? consentRecord.given : false;
  } catch (error) {
    console.error('Error checking consent:', error);
    throw new Error('Failed to check consent');
  }
}

/**
 * Create a privacy request (data access or deletion)
 * @param userId The ID of the user making the request
 * @param requestType The type of request (access or deletion)
 * @param options Additional options for the request
 * @returns The created request
 */
export async function createPrivacyRequest(
  userId: string,
  requestType: PrivacyRequestType,
  options: {
    dataCategories?: string[];
    format?: 'json' | 'csv' | 'pdf';
    fullDeletion?: boolean;
  } = {}
): Promise<PrivacyRequestUnion> {
  try {
    switch (requestType) {
      case PrivacyRequestType.ACCESS:
        return await createDataAccessRequest(userId, options.dataCategories, options.format);

      case PrivacyRequestType.DELETION:
        return await createDataDeletionRequest(
          userId,
          options.dataCategories,
          options.fullDeletion || false
        );

      default:
        throw new Error(`Unsupported request type: ${requestType}`);
    }
  } catch (error) {
    console.error('Error creating privacy request:', error);
    throw new Error('Failed to create privacy request');
  }
}

/**
 * Get a privacy request by ID
 * @param requestId The ID of the request to get
 * @returns The request, or null if not found
 */
export async function getPrivacyRequest(requestId: string): Promise<PrivacyRequestUnion | null> {
  try {
    // Try to get the request as a data access request
    const accessRequest = await getDataAccessRequest(requestId);
    if (accessRequest) {
      return accessRequest;
    }

    // Try to get the request as a data deletion request
    const deletionRequest = await getDataDeletionRequest(requestId);
    if (deletionRequest) {
      return deletionRequest;
    }

    // Request not found
    return null;
  } catch (error) {
    console.error('Error getting privacy request:', error);
    throw new Error('Failed to get privacy request');
  }
}

/**
 * Process a privacy request
 * @param requestId The ID of the request to process
 * @returns The updated request
 */
export async function processPrivacyRequest(requestId: string): Promise<PrivacyRequestUnion> {
  try {
    // Get the request
    const request = await getPrivacyRequest(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Process the request based on its type
    switch (request.type) {
      case PrivacyRequestType.ACCESS:
        return await processDataAccessRequest(requestId);

      case PrivacyRequestType.DELETION:
        return await processDataDeletionRequest(requestId);

      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  } catch (error) {
    console.error('Error processing privacy request:', error);
    throw new Error('Failed to process privacy request');
  }
}

/**
 * Verify a user's identity for a privacy request
 * @param requestId The ID of the request to verify
 * @param verificationMethod The method used to verify the user's identity
 * @param verificationData Data used for verification
 * @returns The updated request
 */
export async function verifyPrivacyRequest(
  requestId: string,
  verificationMethod: string,
  verificationData: any
): Promise<PrivacyRequestUnion> {
  try {
    // Get the request
    const request = await getPrivacyRequest(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Verify the request based on its type
    switch (request.type) {
      case PrivacyRequestType.ACCESS:
        return await verifyDataAccessRequest(requestId, verificationMethod, verificationData);

      case PrivacyRequestType.DELETION:
        // For now, we'll use the same verification method for both types
        return await verifyDataAccessRequest(requestId, verificationMethod, verificationData);

      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  } catch (error) {
    console.error('Error verifying privacy request:', error);
    throw new Error('Failed to verify privacy request');
  }
}

export default {
  // Data access functions
  createDataAccessRequest,
  getDataAccessRequest,
  processDataAccessRequest,
  collectUserData,
  formatUserData,
  generateDownloadUrl,
  verifyDataAccessRequest,

  // Data deletion functions
  createDataDeletionRequest,
  getDataDeletionRequest,
  processDataDeletionRequest,
  deleteUserData,

  // Privacy management functions
  getUserPrivacyRequests,
  updatePrivacyPreferences,
  recordConsent,
  hasConsent,
  createPrivacyRequest,
  getPrivacyRequest,
  processPrivacyRequest,
  verifyPrivacyRequest,
};
