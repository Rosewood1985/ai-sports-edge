/**
 * Test Script for Firebase Firestore Backup System
 *
 * This script tests the Firebase Firestore backup system by:
 * 1. Manually triggering a backup
 * 2. Checking the backup status
 * 3. Listing available backups
 *
 * Usage: node scripts/test-firestore-backup.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('../firebase-config/serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Import the backup service
const { executeBackup, getBackupStatus } = require('../atomic/organisms/firebaseBackupService');
const { listAvailableBackups } = require('../atomic/molecules/firebaseBackupStorage');

/**
 * Test the backup system
 */
async function testBackupSystem() {
  console.log('=== Firebase Firestore Backup System Test ===');

  try {
    // Step 1: Manually trigger a backup
    console.log('\n1. Triggering manual backup...');
    const backupResult = await executeBackup();

    if (backupResult.success) {
      console.log('✅ Backup completed successfully');
      console.log(`   Path: ${backupResult.path}`);
    } else {
      console.error('❌ Backup failed');
      console.error(`   Error: ${backupResult.error.message}`);
    }

    // Step 2: Check backup status
    console.log('\n2. Checking backup status...');
    const statusResult = await getBackupStatus();

    if (statusResult.success) {
      console.log('✅ Backup status retrieved successfully');
      console.log('   Recent events:');
      statusResult.recentEvents.forEach(event => {
        console.log(
          `   - ${event.type} (${event.status}) at ${new Date(
            event.timestamp.toDate()
          ).toLocaleString()}`
        );
      });
    } else {
      console.error('❌ Failed to retrieve backup status');
      console.error(`   Error: ${statusResult.error.message}`);
    }

    // Step 3: List available backups
    console.log('\n3. Listing available backups...');
    const backupsResult = await listAvailableBackups();

    if (backupsResult.success) {
      console.log('✅ Backups listed successfully');
      const backupDates = Object.keys(backupsResult.backups);

      if (backupDates.length === 0) {
        console.log('   No backups found');
      } else {
        console.log(`   Found ${backupDates.length} backup dates:`);
        backupDates.forEach(date => {
          const files = backupsResult.backups[date];
          console.log(`   - ${date}: ${files.length} files`);
        });
      }
    } else {
      console.error('❌ Failed to list backups');
      console.error(`   Error: ${backupsResult.error.message}`);
    }

    console.log('\n=== Test Completed ===');
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test
testBackupSystem();
