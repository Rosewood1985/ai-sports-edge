#!/bin/bash

# Deploy Firebase Firestore Backup System
# This script deploys the Firebase Firestore backup system to production.
# It deploys the Cloud Functions and sets up the necessary permissions.

# Exit on error
set -e

echo "=== Deploying Firebase Firestore Backup System ==="

# Step 1: Create the backup storage bucket if it doesn't exist
echo "Step 1: Creating backup storage bucket..."
gsutil ls -b gs://ai-sports-edge-firestore-backups > /dev/null 2>&1 || gsutil mb -l us-central1 gs://ai-sports-edge-firestore-backups

# Step 2: Set up bucket permissions
echo "Step 2: Setting up bucket permissions..."
gsutil iam ch serviceAccount:$(gcloud config get-value project).appspot.com:admin gs://ai-sports-edge-firestore-backups

# Step 3: Set up bucket lifecycle policy for 30-day retention
echo "Step 3: Setting up bucket lifecycle policy..."
cat > /tmp/lifecycle.json << EOL
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30
        }
      }
    ]
  }
}
EOL
gsutil lifecycle set /tmp/lifecycle.json gs://ai-sports-edge-firestore-backups
rm /tmp/lifecycle.json

# Step 4: Deploy Cloud Functions
echo "Step 4: Deploying Cloud Functions..."
cd functions
npm install
npx firebase deploy --only functions:scheduledFirestoreBackup,functions:manualFirestoreBackup,functions:getBackupStatus

# Step 5: Verify deployment
echo "Step 5: Verifying deployment..."
npx firebase functions:list | grep -E 'scheduledFirestoreBackup|manualFirestoreBackup|getBackupStatus'

echo "=== Deployment Completed ==="
echo "The Firebase Firestore backup system has been deployed successfully."
echo "Daily backups will run at 3 AM UTC."
echo "You can manually trigger a backup using the manualFirestoreBackup function."
echo "You can check the backup status using the getBackupStatus function."