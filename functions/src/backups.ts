/**
 * Firebase Cloud Functions for Firestore Backups
 *
 * This file contains Cloud Functions for scheduling and managing Firestore backups.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import the backup service
// Since this is a JavaScript module without type definitions, we need to use require
// and add a type declaration to avoid TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const backupService = require('../../atomic/organisms/firebaseBackupService');

/**
 * Scheduled Cloud Function that runs daily at 3 AM UTC to backup Firestore
 */
export const scheduledFirestoreBackup = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('Starting scheduled Firestore backup...');

    try {
      const result = await backupService.executeBackup();

      if (result.success) {
        console.log(`Backup completed successfully. Path: ${result.path}`);
        return null;
      } else {
        console.error(`Backup failed: ${result.error.message}`);
        return null;
      }
    } catch (error) {
      console.error('Unexpected error in backup function:', error);
      return null;
    }
  });

/**
 * HTTP Function to manually trigger a Firestore backup
 */
export const manualFirestoreBackup = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to trigger a backup.'
    );
  }

  // In a real implementation, you would check if the user has admin privileges
  // For now, we'll just check if they're authenticated

  console.log(`Manual backup triggered by user: ${context.auth.uid}`);

  try {
    const result = await backupService.executeBackup();

    if (result.success) {
      console.log(`Manual backup completed successfully. Path: ${result.path}`);
      return {
        success: true,
        path: result.path,
      };
    } else {
      console.error(`Manual backup failed: ${result.error.message}`);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Unexpected error in manual backup function:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred during the backup.',
      { message: error instanceof Error ? error.message : String(error) }
    );
  }
});

/**
 * HTTP Function to get the status of the backup system
 */
export const getBackupSystemStatus = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to get backup status.'
    );
  }

  try {
    const status = await backupService.getBackupStatus();
    return status;
  } catch (error) {
    console.error('Error getting backup status:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while getting backup status.',
      { message: error instanceof Error ? error.message : String(error) }
    );
  }
});
