#!/bin/bash

# Direct SFTP Deployment script for index.html only
# This script uploads the index.html file to the server using direct SFTP commands

# SFTP connection details
HOST="p3plzcpnl508920.prod.phx3.secureserver.net"
USER="deploy@aisportsedge.app"
PASS="hTQ3LQ]#P(b,"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
LOCAL_FILE="./aisportsedge-deploy/index.html"

echo "🚀 Starting index.html SFTP deployment..."
echo "Host: $HOST"
echo "User: $USER"
echo "Remote path: $REMOTE_PATH"
echo "Local file: $LOCAL_FILE"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
  echo "❌ sshpass is not installed. Please install it first:"
  echo "  - macOS: brew install hudochenkov/sshpass/sshpass"
  echo "  - Ubuntu/Debian: sudo apt-get install sshpass"
  echo "  - CentOS/RHEL: sudo yum install sshpass"
  exit 1
fi

# Check if the file exists
if [ ! -f "$LOCAL_FILE" ]; then
  echo "❌ File $LOCAL_FILE does not exist."
  exit 1
fi

# Create batch file for sftp commands
BATCH_FILE=$(mktemp)
echo "cd $REMOTE_PATH" > $BATCH_FILE
echo "put $LOCAL_FILE index.html" >> $BATCH_FILE
echo "bye" >> $BATCH_FILE

# Run sftp with sshpass
echo "🔄 Uploading index.html..."
sshpass -p "$PASS" sftp -o StrictHostKeyChecking=no -b $BATCH_FILE $USER@$HOST

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ index.html deployment completed successfully!"
else
  echo "❌ Deployment failed. Please check the logs for errors."
  exit 1
fi

# Clean up batch file
rm $BATCH_FILE

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase initialization works as expected"