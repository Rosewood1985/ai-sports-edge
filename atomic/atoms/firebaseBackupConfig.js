/**
 * Firebase Backup Configuration
 *
 * This file contains configuration settings for the Firebase Firestore backup process.
 */

export const backupConfig = {
  // Backup schedule
  schedule: {
    frequency: 'daily',
    timeOfDay: '03:00', // 3 AM UTC
  },

  // Storage settings
  storage: {
    bucketName: 'ai-sports-edge-firestore-backups',
    pathPrefix: 'daily-backups',
  },

  // Retention settings
  retention: {
    days: 30,
    enforceAutomatically: true,
  },

  // Notification settings
  notifications: {
    onFailure: true,
    onSuccess: false,
    recipients: ['devops@aisportsedge.com'],
  },
};

export default backupConfig;
