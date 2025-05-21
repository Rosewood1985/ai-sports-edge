/**
 * Data Retention Policies
 *
 * This module defines data retention policies and provides utilities for
 * automatically enforcing these policies.
 */

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getDataCategory } from './dataCategories';

// Define the data categories
export type DataCategory =
  | 'personalInfo'
  | 'paymentInfo'
  | 'activityData'
  | 'analyticsData'
  | 'marketingPreferences'
  | 'deviceInfo'
  | 'locationData'
  | 'communicationHistory'
  | 'userContent'
  | 'thirdPartyData';

/**
 * Retention period in days for different data categories
 */
export const retentionPeriods: Record<DataCategory, number> = {
  personalInfo: 365 * 2, // 2 years
  paymentInfo: 365 * 5, // 5 years (legal requirement)
  activityData: 180, // 6 months
  analyticsData: 90, // 3 months
  marketingPreferences: 365 * 2, // 2 years
  deviceInfo: 30, // 1 month
  locationData: 30, // 1 month
  communicationHistory: 365, // 1 year
  userContent: 365 * 2, // 2 years
  thirdPartyData: 90, // 3 months
};

/**
 * Interface for data retention policy
 */
export interface DataRetentionPolicy {
  category: DataCategory;
  retentionPeriod: number; // in days
  archiveAfterExpiry?: boolean;
  anonymizeAfterExpiry?: boolean;
  deleteAfterExpiry?: boolean;
}

/**
 * Default data retention policies
 */
export const defaultRetentionPolicies: DataRetentionPolicy[] = Object.entries(retentionPeriods).map(
  ([category, period]) => ({
    category: category as DataCategory,
    retentionPeriod: period,
    anonymizeAfterExpiry: true,
    deleteAfterExpiry: false,
  })
);

/**
 * Checks if a data item has expired based on its creation date and retention policy
 *
 * @param creationDate The date when the data was created
 * @param retentionPeriod The retention period in days
 * @returns True if the data has expired, false otherwise
 */
export const isDataExpired = (creationDate: Date, retentionPeriod: number): boolean => {
  const expiryDate = new Date(creationDate);
  expiryDate.setDate(expiryDate.getDate() + retentionPeriod);
  return new Date() > expiryDate;
};

/**
 * Applies data retention policies to a Firestore collection
 *
 * @param collectionPath The path to the Firestore collection
 * @param dateField The field containing the creation date
 * @param categoryField The field containing the data category
 * @param policies The data retention policies to apply
 */
export const applyRetentionPolicies = async (
  collectionPath: string,
  dateField: string = 'createdAt',
  categoryField: string = 'category',
  policies: DataRetentionPolicy[] = defaultRetentionPolicies
): Promise<void> => {
  const db = getFirestore();
  const batch = writeBatch(db);
  let batchCount = 0;
  const batchLimit = 500; // Firestore batch limit

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    const q = query(
      collection(db, collectionPath),
      where(categoryField, '==', policy.category),
      where(dateField, '<', cutoffDate)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((document: QueryDocumentSnapshot<DocumentData>) => {
      const data = document.data();

      if (policy.deleteAfterExpiry) {
        // Delete the document
        batch.delete(document.ref);
      } else if (policy.anonymizeAfterExpiry) {
        // Anonymize the data by removing personal identifiers
        const anonymizedData = anonymizeData(data, policy.category);
        batch.update(document.ref, anonymizedData);
      } else if (policy.archiveAfterExpiry) {
        // Mark as archived
        batch.update(document.ref, { archived: true });
      }

      batchCount++;

      // Commit batch if it reaches the limit
      if (batchCount >= batchLimit) {
        batch.commit();
        batchCount = 0;
      }
    });
  }

  // Commit any remaining operations
  if (batchCount > 0) {
    await batch.commit();
  }
};

/**
 * Anonymizes data based on its category
 *
 * @param data The data to anonymize
 * @param category The data category
 * @returns Anonymized data
 */
export const anonymizeData = (data: any, category: DataCategory): any => {
  const anonymizedData = { ...data };

  switch (category) {
    case 'personalInfo':
      delete anonymizedData.name;
      delete anonymizedData.email;
      delete anonymizedData.phone;
      delete anonymizedData.address;
      anonymizedData.anonymized = true;
      break;
    case 'locationData':
      delete anonymizedData.latitude;
      delete anonymizedData.longitude;
      delete anonymizedData.address;
      anonymizedData.anonymized = true;
      break;
    case 'deviceInfo':
      delete anonymizedData.deviceId;
      delete anonymizedData.ipAddress;
      anonymizedData.anonymized = true;
      break;
    // Add more cases for other categories
    default:
      // For other categories, just mark as anonymized
      anonymizedData.anonymized = true;
  }

  return anonymizedData;
};

/**
 * Schedules a data retention job to run periodically
 *
 * @param collectionPaths Array of collection paths to apply retention policies to
 * @param intervalInDays How often to run the job (in days)
 * @param policies The data retention policies to apply
 */
export const scheduleDataRetentionJob = (
  collectionPaths: string[],
  intervalInDays: number = 1,
  policies: DataRetentionPolicy[] = defaultRetentionPolicies
): NodeJS.Timeout => {
  const intervalMs = intervalInDays * 24 * 60 * 60 * 1000;

  const job = async () => {
    try {
      for (const path of collectionPaths) {
        await applyRetentionPolicies(path, 'createdAt', 'category', policies);
      }
      console.log(`Data retention job completed successfully at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error in data retention job:', error);
    }
  };

  // Run immediately and then schedule
  job();
  return setInterval(job, intervalMs);
};

/**
 * Stops a scheduled data retention job
 *
 * @param jobId The job ID returned by scheduleDataRetentionJob
 */
export const stopDataRetentionJob = (jobId: NodeJS.Timeout): void => {
  clearInterval(jobId);
};
