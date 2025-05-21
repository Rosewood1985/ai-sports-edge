/**
 * Initialize Data Retention
 *
 * This module initializes the data retention job when the app starts.
 * It schedules the job to run periodically based on the configured interval.
 */

import {
  scheduleDataRetentionJob,
  defaultRetentionPolicies,
} from '../../atoms/privacy/dataRetentionPolicies';

// Collections that should have data retention policies applied
const collectionsWithRetention = [
  'users',
  'activity',
  'analytics',
  'marketing',
  'support',
  'devices',
  'locations',
  'communications',
  'content',
  'thirdPartyData',
];

// Interval in days for running the data retention job
const retentionJobIntervalDays = 1; // Run daily

/**
 * Initialize data retention job
 *
 * @returns The job ID that can be used to stop the job if needed
 */
export const initializeDataRetention = (): NodeJS.Timeout => {
  console.log('Initializing data retention job...');

  // Schedule the data retention job
  const jobId = scheduleDataRetentionJob(
    collectionsWithRetention,
    retentionJobIntervalDays,
    defaultRetentionPolicies
  );

  console.log(`Data retention job initialized with interval of ${retentionJobIntervalDays} day(s)`);

  return jobId;
};

/**
 * Initialize data retention on app startup
 */
let dataRetentionJobId: NodeJS.Timeout | null = null;

export const initializeDataRetentionOnStartup = (): void => {
  // Only initialize if not already initialized
  if (!dataRetentionJobId) {
    dataRetentionJobId = initializeDataRetention();
  }
};

/**
 * Stop data retention job
 */
export const stopDataRetention = (): void => {
  if (dataRetentionJobId) {
    clearInterval(dataRetentionJobId);
    dataRetentionJobId = null;
    console.log('Data retention job stopped');
  }
};

export default {
  initializeDataRetention,
  initializeDataRetentionOnStartup,
  stopDataRetention,
};
