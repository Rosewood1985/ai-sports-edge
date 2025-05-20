/**
 * Firebase Backup Storage
 *
 * This file contains functions for managing backup storage in Google Cloud Storage.
 */

import { initializeApp, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { backupConfig } from '../atoms/firebaseBackupConfig';
import { calculateExpirationDate, formatError } from '../atoms/firebaseBackupUtils';

// Initialize Firebase Admin if not already initialized
let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp();
}

const storage = getStorage(app);

/**
 * Applies the retention policy to remove expired backups
 * @returns {Promise<Object>} The result of the retention policy application
 */
export const applyRetentionPolicy = async () => {
  try {
    const bucket = storage.bucket(backupConfig.storage.bucketName);
    const [files] = await bucket.getFiles({
      prefix: backupConfig.storage.pathPrefix,
    });

    const now = new Date();
    const retentionThreshold = new Date(now);
    retentionThreshold.setDate(retentionThreshold.getDate() - backupConfig.retention.days);

    const expiredFiles = files.filter(file => {
      const fileCreationDate = new Date(file.metadata.timeCreated);
      return fileCreationDate < retentionThreshold;
    });

    for (const file of expiredFiles) {
      await file.delete();
      console.log(`Deleted expired backup file: ${file.name}`);
    }

    return {
      success: true,
      deletedCount: expiredFiles.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error('Error applying retention policy:', error);
    return {
      success: false,
      error: formatError(error),
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Lists available backups in the storage bucket
 * @returns {Promise<Object>} The list of available backups
 */
export const listAvailableBackups = async () => {
  try {
    const bucket = storage.bucket(backupConfig.storage.bucketName);
    const [files] = await bucket.getFiles({
      prefix: backupConfig.storage.pathPrefix,
    });

    // Group files by backup date
    const backups = {};
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 5) {
        const year = pathParts[1];
        const month = pathParts[2];
        const day = pathParts[3];
        const date = `${year}-${month}-${day}`;

        if (!backups[date]) {
          backups[date] = [];
        }

        backups[date].push({
          name: file.name,
          size: parseInt(file.metadata.size, 10),
          created: file.metadata.timeCreated,
        });
      }
    });

    return {
      success: true,
      backups,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error listing backups:', error);
    return {
      success: false,
      error: formatError(error),
      timestamp: new Date().toISOString(),
    };
  }
};

export default {
  applyRetentionPolicy,
  listAvailableBackups,
};
