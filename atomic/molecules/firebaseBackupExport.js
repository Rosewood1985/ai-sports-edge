/**
 * Firebase Backup Export
 *
 * This file contains functions for exporting Firestore data for backup purposes.
 */

import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { backupConfig } from '../atoms/firebaseBackupConfig';
import { generateBackupPath, formatError } from '../atoms/firebaseBackupUtils';

// Initialize Firebase Admin if not already initialized
let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp();
}

const firestore = getFirestore(app);
const storage = getStorage(app);

/**
 * Exports Firestore data to Google Cloud Storage
 * @returns {Promise<Object>} The result of the export operation
 */
export const exportFirestoreData = async () => {
  try {
    const backupPath = generateBackupPath();
    const bucket = storage.bucket(backupConfig.storage.bucketName);

    // Create a Firestore export
    const [operation] = await firestore.client.databaseAdminClient.exportDocuments({
      name: firestore.client.databaseAdminClient.databasePath,
      outputUriPrefix: `gs://${backupConfig.storage.bucketName}/${backupConfig.storage.pathPrefix}/${backupPath}`,
      collectionIds: [], // Empty array means all collections
    });

    // Wait for the export operation to complete
    await operation.promise();

    return {
      success: true,
      path: `${backupConfig.storage.pathPrefix}/${backupPath}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Firestore export failed:', error);
    return {
      success: false,
      error: formatError(error),
      timestamp: new Date().toISOString(),
    };
  }
};

export default {
  exportFirestoreData,
};
