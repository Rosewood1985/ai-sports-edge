/**
 * Data Retention Policies
 *
 * This file defines data retention policies for different data categories.
 * It includes configuration for retention periods, automatic deletion, and
 * retention exceptions based on legal requirements.
 */

import { DataCategoryDefinition } from './dataCategories';

/**
 * Retention period in days for different data categories
 */
export const retentionPeriods: Record<string, number> = {
  // User account data
  personalInfo: 365 * 2, // 2 years after account deletion
  accountActivity: 365, // 1 year

  // Analytics and usage data
  analyticsData: 90, // 3 months
  usageStatistics: 180, // 6 months

  // Marketing data
  marketingData: 365, // 1 year
  communicationPreferences: 365 * 2, // 2 years

  // Betting-related data
  bettingHistory: 365 * 5, // 5 years (legal requirement)
  transactionHistory: 365 * 7, // 7 years (tax requirements)

  // App usage data
  appUsageData: 90, // 3 months
  deviceInfo: 180, // 6 months

  // Location data
  locationData: 30, // 1 month

  // Temporary data
  temporaryData: 7, // 1 week
  cacheData: 1, // 1 day
};

/**
 * Default retention policies for data categories
 */
export const defaultRetentionPolicies: Record<
  string,
  {
    retentionPeriod: number;
    autoDelete: boolean;
    retentionExceptions?: string[];
  }
> = {
  personalInfo: {
    retentionPeriod: retentionPeriods.personalInfo,
    autoDelete: true,
    retentionExceptions: ['legalRequirement', 'ongoingDispute'],
  },
  accountActivity: {
    retentionPeriod: retentionPeriods.accountActivity,
    autoDelete: true,
  },
  analyticsData: {
    retentionPeriod: retentionPeriods.analyticsData,
    autoDelete: true,
  },
  usageStatistics: {
    retentionPeriod: retentionPeriods.usageStatistics,
    autoDelete: true,
  },
  marketingData: {
    retentionPeriod: retentionPeriods.marketingData,
    autoDelete: true,
  },
  communicationPreferences: {
    retentionPeriod: retentionPeriods.communicationPreferences,
    autoDelete: false,
  },
  bettingHistory: {
    retentionPeriod: retentionPeriods.bettingHistory,
    autoDelete: false,
    retentionExceptions: ['legalRequirement', 'taxRequirement'],
  },
  transactionHistory: {
    retentionPeriod: retentionPeriods.transactionHistory,
    autoDelete: false,
    retentionExceptions: ['legalRequirement', 'taxRequirement'],
  },
  appUsageData: {
    retentionPeriod: retentionPeriods.appUsageData,
    autoDelete: true,
  },
  deviceInfo: {
    retentionPeriod: retentionPeriods.deviceInfo,
    autoDelete: true,
  },
  locationData: {
    retentionPeriod: retentionPeriods.locationData,
    autoDelete: true,
  },
  temporaryData: {
    retentionPeriod: retentionPeriods.temporaryData,
    autoDelete: true,
  },
  cacheData: {
    retentionPeriod: retentionPeriods.cacheData,
    autoDelete: true,
  },
};

/**
 * Data retention configuration
 */
export const dataRetentionConfig = {
  // Whether to enable automatic data retention
  enableAutoRetention: true,

  // How often to run the data retention job (in days)
  retentionJobFrequency: 1,

  // Whether to keep audit logs of deleted data
  keepDeletionLogs: true,

  // How long to keep deletion logs (in days)
  deletionLogRetention: 365 * 2, // 2 years

  // Whether to anonymize data instead of deleting it
  anonymizeInsteadOfDelete: {
    analyticsData: true,
    usageStatistics: true,
    appUsageData: true,
  },
};

/**
 * Get the retention period for a data category
 * @param category The data category
 * @returns The retention period in days
 */
export function getRetentionPeriod(category: string): number {
  return retentionPeriods[category] || 365; // Default to 1 year
}

/**
 * Check if a data category should be automatically deleted
 * @param category The data category
 * @returns True if the category should be automatically deleted
 */
export function shouldAutoDelete(category: string): boolean {
  const policy = defaultRetentionPolicies[category];
  return policy?.autoDelete || false;
}

/**
 * Check if a data category should be anonymized instead of deleted
 * @param category The data category
 * @returns True if the category should be anonymized
 */
export function shouldAnonymize(category: string): boolean {
  return (
    (dataRetentionConfig.anonymizeInsteadOfDelete as Record<string, boolean>)[category] || false
  );
}

/**
 * Get retention exceptions for a data category
 * @param category The data category
 * @returns Array of retention exceptions, or empty array if none
 */
export function getRetentionExceptions(category: string): string[] {
  const policy = defaultRetentionPolicies[category];
  return policy?.retentionExceptions || [];
}

/**
 * Calculate the deletion date for a data item
 * @param category The data category
 * @param creationDate The creation date of the data
 * @returns The date when the data should be deleted
 */
export function calculateDeletionDate(category: string, creationDate: Date): Date {
  const retentionPeriod = getRetentionPeriod(category);
  const deletionDate = new Date(creationDate);
  deletionDate.setDate(deletionDate.getDate() + retentionPeriod);
  return deletionDate;
}

/**
 * Check if a data item should be deleted based on its age
 * @param category The data category
 * @param creationDate The creation date of the data
 * @returns True if the data should be deleted
 */
export function shouldDeleteData(category: string, creationDate: Date): boolean {
  if (!shouldAutoDelete(category)) {
    return false;
  }

  const deletionDate = calculateDeletionDate(category, creationDate);
  const now = new Date();

  return now >= deletionDate;
}

export default {
  retentionPeriods,
  defaultRetentionPolicies,
  dataRetentionConfig,
  getRetentionPeriod,
  shouldAutoDelete,
  shouldAnonymize,
  getRetentionExceptions,
  calculateDeletionDate,
  shouldDeleteData,
};
