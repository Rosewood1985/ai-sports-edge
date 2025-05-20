/**
 * Firebase Backup Utilities
 *
 * This file contains utility functions for the Firebase Firestore backup process.
 */

/**
 * Generates a backup path based on the current date
 * @param {Date} date - The date to use for the path (defaults to current date)
 * @returns {string} The generated backup path
 */
export const generateBackupPath = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}/firestore-backup-${year}${month}${day}`;
};

/**
 * Formats a date for use in backup filenames and logs
 * @param {Date} date - The date to format (defaults to current date)
 * @returns {string} The formatted date string (YYYY-MM-DD)
 */
export const formatBackupDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates the expiration date for a backup based on retention period
 * @param {Date} date - The backup date (defaults to current date)
 * @param {number} retentionDays - The number of days to retain the backup
 * @returns {Date} The calculated expiration date
 */
export const calculateExpirationDate = (date = new Date(), retentionDays = 30) => {
  const expirationDate = new Date(date);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  return expirationDate;
};

/**
 * Formats an error for logging and notification
 * @param {Error} error - The error to format
 * @returns {Object} The formatted error object
 */
export const formatError = error => {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
};

export default {
  generateBackupPath,
  formatBackupDate,
  calculateExpirationDate,
  formatError,
};
