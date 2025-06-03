/**
 * Firebase Backup Monitoring
 *
 * This file contains functions for monitoring the backup process and sending notifications.
 */

import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { backupConfig } from '../atoms/firebaseBackupConfig';
import { formatError } from '../atoms/firebaseBackupUtils';

// Initialize Firebase Admin if not already initialized
let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp();
}

const firestore = getFirestore(app);

/**
 * Logs a backup event to Firestore
 * @param {Object} event - The event to log
 * @returns {Promise<Object>} The result of the logging operation
 */
export const logBackupEvent = async event => {
  try {
    const backupLogRef = firestore.collection('system_logs').doc('backups');
    const backupEventRef = backupLogRef.collection('events').doc();

    await backupEventRef.set({
      ...event,
      timestamp: new Date(),
    });

    return {
      success: true,
      eventId: backupEventRef.id,
    };
  } catch (error) {
    console.error('Error logging backup event:', error);
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Sends an email notification
 * @param {string} subject - The email subject
 * @param {string} message - The email message
 * @param {Array<string>} recipients - The email recipients
 * @returns {Promise<Object>} The result of the notification operation
 */
export const sendEmailNotification = async (
  subject,
  message,
  recipients = backupConfig.notifications.recipients
) => {
  try {
    // This is a placeholder for an actual email sending implementation
    // In a real implementation, you would use a service like SendGrid, Mailgun, or SMTP
    console.log(`EMAIL NOTIFICATION: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Recipients: ${recipients.join(', ')}`);

    // Log the notification to Firestore
    const notificationRef = firestore.collection('system_logs').doc('notifications');
    const notificationEventRef = notificationRef.collection('events').doc();

    await notificationEventRef.set({
      subject,
      message,
      recipients,
      type: 'email',
      timestamp: new Date(),
    });

    return {
      success: true,
      notificationId: notificationEventRef.id,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: formatError(error),
    };
  }
};

export default {
  logBackupEvent,
  sendEmailNotification,
};
