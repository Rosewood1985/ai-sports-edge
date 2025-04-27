#!/bin/bash

# Deploy fixed build to aisportsedge.app using scp
echo "Deploying fixed build to aisportsedge.app..."

# Source and destination paths
LOCAL_PATH="./build/"
REMOTE_USER="deploy"
REMOTE_HOST="aisportsedge.app"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app/"

# Create a temporary archive of the build directory
echo "Creating temporary archive..."
tar -czf build.tar.gz -C $LOCAL_PATH .

# Upload the archive
echo "Uploading files..."
scp build.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

# Extract the archive on the remote server
echo "Extracting files on the server..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && tar -xzf build.tar.gz && rm build.tar.gz"

# Clean up local archive
rm build.tar.gz

echo "Deployment complete!"
echo "Verify at https://aisportsedge.app"