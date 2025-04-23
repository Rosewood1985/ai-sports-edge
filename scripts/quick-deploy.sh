#!/bin/bash

# Quick deploy script for AI Sports Edge
# Deploys directly without running all checks
# Use with caution - only when you're confident in your changes

echo "🚀 Running quick deployment for AI Sports Edge..."

# Check if dist directory exists
if [ ! -d "./dist" ]; then
  echo "⚠️  Error: ./dist directory not found. Build the project first."
  exit 1
fi

# Run the deployment with cleanup and verification
echo "Running deployment with cleanup and verification..."
./scripts/sftp-deploy-cleanup.sh

if [ $? -ne 0 ]; then
  echo "⚠️  Deployment failed. Please check the logs."
  exit 1
fi

echo "✅ Quick deployment completed successfully!"
exit 0