# Firestore Backup Restoration Guide

This guide provides instructions for manually restoring a Firestore database from a backup.

## Prerequisites

- Firebase Admin SDK access
- Google Cloud SDK installed
- Appropriate IAM permissions

## Restoration Steps

1. **List Available Backups**

   Use the Firebase Admin SDK to list available backups:

   ```javascript
   const { listAvailableBackups } = require('../atomic/molecules/firebaseBackupStorage');

   async function listBackups() {
     const result = await listAvailableBackups();
     console.log(JSON.stringify(result.backups, null, 2));
   }

   listBackups();
   ```

2. **Select a Backup to Restore**

   Identify the backup date and path you want to restore.

3. **Import Data from Backup**

   Use the Firebase Admin SDK to import the data:

   ```javascript
   const admin = require('firebase-admin');
   admin.initializeApp();

   async function restoreBackup(backupPath) {
     try {
       const firestore = admin.firestore();
       const [operation] = await firestore.client.databaseAdminClient.importDocuments({
         name: firestore.client.databaseAdminClient.databasePath,
         inputUriPrefix: `gs://ai-sports-edge-firestore-backups/${backupPath}`,
       });

       // Wait for the import operation to complete
       await operation.promise();
       console.log('Restoration completed successfully');
     } catch (error) {
       console.error('Restoration failed:', error);
     }
   }

   // Example: Restore from a specific backup
   restoreBackup('daily-backups/2025/05/19/firestore-backup-20250519');
   ```

4. **Verify Restoration**

   After restoration, verify that the data has been properly restored by checking key collections and documents.

## Important Notes

- Restoration will overwrite existing data in the Firestore database
- Consider restoring to a temporary database first for verification
- Ensure that no critical operations are in progress during restoration
