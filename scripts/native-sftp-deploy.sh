#!/bin/bash

# Native SFTP Deployment script using the built-in sftp command
# This script uploads the dist folder to the server using native SFTP commands

# SFTP connection details
HOST="sftp.aisportsedge.app"
USER="deploy@aisportsedge.app"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
LOCAL_DIR="./dist"

echo "🚀 Starting native SFTP deployment..."
echo "Host: $HOST"
echo "User: $USER"
echo "Remote path: $REMOTE_PATH"
echo "Local directory: $LOCAL_DIR"

# Create batch file for sftp commands
BATCH_FILE=$(mktemp)
echo "cd $REMOTE_PATH" > $BATCH_FILE
echo "lcd $LOCAL_DIR" >> $BATCH_FILE
echo "put -r *" >> $BATCH_FILE
echo "bye" >> $BATCH_FILE

# Run sftp with batch file
echo "🔄 Uploading files..."
echo "You will be prompted for the password: hTQ3LQ]#P(b,"
sftp -o StrictHostKeyChecking=no -b $BATCH_FILE $USER@$HOST

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment completed successfully!"
else
  echo "❌ Deployment failed. Please check the logs for errors."
  echo "   You may need to use the VS Code SFTP extension instead."
  echo "   See docs/sftp-upload-guide.md for instructions."
fi

# Clean up batch file
rm $BATCH_FILE

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase and routing work as expected"
echo "5. Verify language toggle works and Spanish text appears when selected"