/**
 * Firebase Backup Service
 *
 * This file provides an integrated service for Firebase Firestore backups.
 */

import { backupConfig } from '../atoms/firebaseBackupConfig';
import { exportFirestoreData } from '../molecules/firebaseBackupExport';
import { logBackupEvent, sendEmailNotification } from '../molecules/firebaseBackupMonitoring';
import { applyRetentionPolicy, listAvailableBackups } from '../molecules/firebaseBackupStorage';

/**
 * Executes a complete backup process
 * @returns {Promise<Object>} The result of the backup operation
 */
export const executeBackup = async () => {
  try {
    // Log backup start
    await logBackupEvent({
      type: 'backup_started',
      status: 'in_progress',
    });

    // Export Firestore data
    const exportResult = await exportFirestoreData();

    if (!exportResult.success) {
      // Log backup failure
      await logBackupEvent({
        type: 'backup_failed',
        status: 'failed',
        error: exportResult.error,
      });

      // Send notification if configured
      if (backupConfig.notifications.onFailure) {
        await sendEmailNotification(
          'Firestore Backup Failed',
          `The Firestore backup failed with error: ${exportResult.error.message}`
        );
      }

      return {
        success: false,
        error: exportResult.error,
      };
    }

    // Apply retention policy
    await applyRetentionPolicy();

    // Log backup completion
    await logBackupEvent({
      type: 'backup_completed',
      status: 'success',
      path: exportResult.path,
    });

    // Send notification if configured
    if (backupConfig.notifications.onSuccess) {
      await sendEmailNotification(
        'Firestore Backup Completed',
        `The Firestore backup was completed successfully. Path: ${exportResult.path}`
      );
    }

    return {
      success: true,
      path: exportResult.path,
    };
  } catch (error) {
    console.error('Backup execution failed:', error);

    // Log backup error
    await logBackupEvent({
      type: 'backup_error',
      status: 'error',
      error: error.message,
    });

    // Send notification
    if (backupConfig.notifications.onFailure) {
      await sendEmailNotification(
        'Firestore Backup Error',
        `An unexpected error occurred during the Firestore backup: ${error.message}`
      );
    }

    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    };
  }
};

/**
 * Gets the current status of the backup system
 * @returns {Promise<Object>} The backup system status
 */
export const getBackupStatus = async () => {
  try {
    const backups = await listAvailableBackups();

    if (!backups.success) {
      return {
        success: false,
        error: backups.error,
      };
    }

    // Get the most recent backup events
    const firestore = require('firebase-admin').firestore();
    const eventsSnapshot = await firestore
      .collection('system_logs')
      .doc('backups')
      .collection('events')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const events = [];
    eventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      backups: backups.backups,
      recentEvents: events,
    };
  } catch (error) {
    console.error('Error getting backup status:', error);
    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    };
  }
};

export default {
  executeBackup,
  getBackupStatus,
};
