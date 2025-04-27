#!/bin/bash

# Test script for secure SFTP deployment
# This script sets up environment variables and runs the secure deployment script

echo "🧪 Testing secure SFTP deployment with environment variables..."

# Set required environment variables
export SFTP_HOST="sftp.aisportsedge.app"
export SFTP_USER="deploy@aisportsedge.app"
export SFTP_REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
export SFTP_LOCAL_DIR="./dist"

# Choose authentication method (uncomment one)

# Option 1: Password authentication (less secure)
# export SFTP_PASSWORD="your_secure_password"
# echo "Using password authentication"

# Option 2: SSH key authentication (more secure)
export SFTP_KEY_PATH="$HOME/.ssh/id_rsa"
echo "Using SSH key authentication with key: $SFTP_KEY_PATH"

# Check if dist directory exists
if [ ! -d "$SFTP_LOCAL_DIR" ]; then
  echo "❌ Local directory $SFTP_LOCAL_DIR not found."
  echo "   Please build the project first with:"
  echo "   ./scripts/deploy-without-htaccess.sh"
  exit 1
fi

# Run the secure deployment script
echo "🚀 Running secure deployment..."
./scripts/secure-sftp-deploy.sh

# Clean up environment variables
unset SFTP_HOST
unset SFTP_USER
unset SFTP_REMOTE_PATH
unset SFTP_LOCAL_DIR
unset SFTP_PASSWORD
unset SFTP_KEY_PATH

echo "✅ Test completed"