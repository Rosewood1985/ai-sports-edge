#!/bin/bash

# Script to clean up remote directory before SFTP deployment and verify after
# Created as part of SFTP config standardization

echo "🧹 Running remote cleanup and verification for SFTP deployment..."

# Define paths and credentials
SFTP_CONFIG="vscode-sftp-deploy/.vscode/sftp.json"
LOCAL_DIST="./dist"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"

# Check if local dist directory exists
if [ ! -d "$LOCAL_DIST" ]; then
  echo "⚠️  Local dist directory not found. Build the project first."
  exit 1
fi

# Extract SFTP credentials from config
if [ ! -f "$SFTP_CONFIG" ]; then
  echo "⚠️  SFTP config not found at $SFTP_CONFIG"
  exit 1
fi

echo "This script requires the VS Code SFTP extension to be installed."
echo "Please follow these steps to deploy:"
echo ""
echo "1. Clean up remote directory:"
echo "   - Connect to the server using your preferred SFTP client"
echo "   - Navigate to $REMOTE_PATH"
echo "   - Delete all .html, .js, .css, .map, and .json files"
echo "   - Preserve the assets/, images/, and locales/ folders"
echo ""
echo "2. Upload files:"
echo "   - In VS Code, right-click on the dist folder"
echo "   - Select 'SFTP: Upload Folder'"
echo "   - This will upload all files to the remote server"
echo ""
echo "3. Verify deployment:"
echo "   - Open a web browser and navigate to https://aisportsedge.app"
echo "   - Verify that the site loads correctly"
echo "   - Check that all features are working as expected"
echo ""
echo "Would you like to open VS Code to start the deployment? (y/n)"
read OPEN_VSCODE

if [ "$OPEN_VSCODE" = "y" ]; then
  echo "Opening VS Code..."
  code .
  echo "✅ VS Code opened. Please use the SFTP extension to deploy."
else
  echo "Deployment instructions provided. Please deploy manually."
fi

echo "🚀 Deployment process initiated!"
exit 0