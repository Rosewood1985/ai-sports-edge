/**
 * Initialize Data Retention
 *
 * This file provides functionality for initializing and managing data retention policies.
 * It includes functions for scheduling data retention jobs, stopping them, and performing
 * data retention operations.
 */

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import {
  retentionPeriods,
  defaultRetentionPolicies,
  dataRetentionConfig,
  shouldDeleteData,
  shouldAnonymize,
  getRetentionExceptions,
} from '../../atoms/privacy/dataRetentionPolicies';
import { getDataCategory } from '../../atoms/privacy/dataCategories';

// Interval ID for the data retention job
let dataRetentionIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize data retention
 * This function sets up the data retention job to run at the specified frequency
 */
export function initializeDataRetention(): void {
  if (!dataRetentionConfig.enableAutoRetention) {
    console.log('Data retention is disabled');
    return;
  }

  // Stop any existing data retention job
  stopDataRetention();

  // Schedule the data retention job
  const intervalMs = dataRetentionConfig.retentionJobFrequency * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  dataRetentionIntervalId = setInterval(performDataRetention, intervalMs);

  console.log(
    `Data retention job scheduled to run every ${dataRetentionConfig.retentionJobFrequency} day(s)`
  );

  // Run the data retention job immediately
  performDataRetention();
}

/**
 * Stop data retention
 * This function stops the data retention job
 */
export function stopDataRetention(): void {
  if (dataRetentionIntervalId) {
    clearInterval(dataRetentionIntervalId);
    dataRetentionIntervalId = null;
    console.log('Data retention job stopped');
  }
}

/**
 * Perform data retention
 * This function performs data retention operations on all data categories
 */
export async function performDataRetention(): Promise<void> {
  console.log('Performing data retention...');

  const db = getFirestore();

  try {
    // Process each collection that has data retention policies
    await processUserData(db);
    await processActivityData(db);
    await processAnalyticsData(db);
    await processMarketingData(db);
    await processLocationData(db);
    await processTemporaryData(db);

    console.log('Data retention completed successfully');
  } catch (error) {
    console.error('Error performing data retention:', error);
  }
}

/**
 * Process user data for retention
 * @param db Firestore database instance
 */
async function processUserData(db: any): Promise<void> {
  const usersCollection = collection(db, 'users');

  // Get all users
  const snapshot = await getDocs(usersCollection);

  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();

    // Check if the user has any data that should be deleted
    if (userData.deletedAt) {
      const deletedAt = userData.deletedAt.toDate();
      const now = new Date();

      // Check if the user's personal data should be deleted
      if (shouldDeleteData('personalInfo', deletedAt)) {
        // Anonymize the user's personal data instead of deleting the account
        await updateDoc(doc(db, 'users', userDoc.id), {
          email: `deleted-${userDoc.id}@example.com`,
          displayName: 'Deleted User',
          phoneNumber: null,
          address: null,
          photoURL: null,
          // Keep the deletedAt field to track when the user was deleted
          deletedAt: userData.deletedAt,
        });

        console.log(`Anonymized personal data for user ${userDoc.id}`);
      }
    }
  }
}

/**
 * Process activity data for retention
 * @param db Firestore database instance
 */
async function processActivityData(db: any): Promise<void> {
  const activityCollection = collection(db, 'activity');

  // Get all activity data
  const snapshot = await getDocs(activityCollection);

  for (const activityDoc of snapshot.docs) {
    const activityData = activityDoc.data();

    // Check if the activity data should be deleted
    if (activityData.timestamp) {
      const timestamp = activityData.timestamp.toDate();

      if (shouldDeleteData('usageData', timestamp)) {
        if (shouldAnonymize('usageData')) {
          // Anonymize the activity data
          await updateDoc(doc(db, 'activity', activityDoc.id), {
            userId: 'anonymous',
            deviceInfo: null,
            location: null,
            // Keep the timestamp and action for analytics purposes
            timestamp: activityData.timestamp,
            action: activityData.action,
          });

          console.log(`Anonymized activity data ${activityDoc.id}`);
        } else {
          // Delete the activity data
          await deleteDoc(doc(db, 'activity', activityDoc.id));

          console.log(`Deleted activity data ${activityDoc.id}`);
        }
      }
    }
  }
}

/**
 * Process analytics data for retention
 * @param db Firestore database instance
 */
async function processAnalyticsData(db: any): Promise<void> {
  const analyticsCollection = collection(db, 'analytics');

  // Get all analytics data
  const snapshot = await getDocs(analyticsCollection);

  for (const analyticsDoc of snapshot.docs) {
    const analyticsData = analyticsDoc.data();

    // Check if the analytics data should be deleted
    if (analyticsData.timestamp) {
      const timestamp = analyticsData.timestamp.toDate();

      if (shouldDeleteData('analyticsData', timestamp)) {
        if (shouldAnonymize('analyticsData')) {
          // Anonymize the analytics data
          await updateDoc(doc(db, 'analytics', analyticsDoc.id), {
            userId: 'anonymous',
            deviceInfo: null,
            location: null,
            // Keep the timestamp and event data for analytics purposes
            timestamp: analyticsData.timestamp,
            event: analyticsData.event,
            properties: analyticsData.properties,
          });

          console.log(`Anonymized analytics data ${analyticsDoc.id}`);
        } else {
          // Delete the analytics data
          await deleteDoc(doc(db, 'analytics', analyticsDoc.id));

          console.log(`Deleted analytics data ${analyticsDoc.id}`);
        }
      }
    }
  }
}

/**
 * Process marketing data for retention
 * @param db Firestore database instance
 */
async function processMarketingData(db: any): Promise<void> {
  const marketingCollection = collection(db, 'marketing');

  // Get all marketing data
  const snapshot = await getDocs(marketingCollection);

  for (const marketingDoc of snapshot.docs) {
    const marketingData = marketingDoc.data();

    // Check if the marketing data should be deleted
    if (marketingData.timestamp) {
      const timestamp = marketingData.timestamp.toDate();

      if (shouldDeleteData('marketingData', timestamp)) {
        // Delete the marketing data
        await deleteDoc(doc(db, 'marketing', marketingDoc.id));

        console.log(`Deleted marketing data ${marketingDoc.id}`);
      }
    }
  }
}

/**
 * Process location data for retention
 * @param db Firestore database instance
 */
async function processLocationData(db: any): Promise<void> {
  const locationCollection = collection(db, 'locations');

  // Get all location data
  const snapshot = await getDocs(locationCollection);

  for (const locationDoc of snapshot.docs) {
    const locationData = locationDoc.data();

    // Check if the location data should be deleted
    if (locationData.timestamp) {
      const timestamp = locationData.timestamp.toDate();

      if (shouldDeleteData('locationData', timestamp)) {
        // Delete the location data
        await deleteDoc(doc(db, 'locations', locationDoc.id));

        console.log(`Deleted location data ${locationDoc.id}`);
      }
    }
  }
}

/**
 * Process temporary data for retention
 * @param db Firestore database instance
 */
async function processTemporaryData(db: any): Promise<void> {
  const tempCollection = collection(db, 'temporary');

  // Get all temporary data
  const snapshot = await getDocs(tempCollection);

  for (const tempDoc of snapshot.docs) {
    const tempData = tempDoc.data();

    // Check if the temporary data should be deleted
    if (tempData.timestamp) {
      const timestamp = tempData.timestamp.toDate();

      if (shouldDeleteData('temporaryData', timestamp)) {
        // Delete the temporary data
        await deleteDoc(doc(db, 'temporary', tempDoc.id));

        console.log(`Deleted temporary data ${tempDoc.id}`);
      }
    }
  }
}

/**
 * Log data deletion for audit purposes
 * @param db Firestore database instance
 * @param userId The user ID
 * @param dataCategory The data category
 * @param documentId The document ID
 * @param action The action performed (delete or anonymize)
 */
async function logDataDeletion(
  db: any,
  userId: string,
  dataCategory: string,
  documentId: string,
  action: 'delete' | 'anonymize'
): Promise<void> {
  if (!dataRetentionConfig.keepDeletionLogs) {
    return;
  }

  try {
    const logCollection = collection(db, 'dataRetentionLogs');

    await addDoc(logCollection, {
      userId,
      dataCategory,
      documentId,
      action,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging data deletion:', error);
  }
}

// Export the functions
export default {
  initializeDataRetention,
  stopDataRetention,
  performDataRetention,
};
