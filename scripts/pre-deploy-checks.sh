#!/bin/bash

# Pre-deployment checks for AI Sports Edge
# Runs SFTP configuration and sync checks before deployment

echo "🔍 Running pre-deployment checks..."
echo ""

# Check for duplicate SFTP configs
echo "Step 1: Checking SFTP configurations..."
./scripts/check-sftp-configs.sh

if [ $? -ne 0 ]; then
  echo "⚠️  SFTP configuration check failed. Please fix issues before deploying."
  exit 1
fi

echo ""

# Check for file sync issues
echo "Step 2: Checking file synchronization..."
./scripts/check-sftp-sync.sh

if [ $? -ne 0 ]; then
  echo "⚠️  SFTP sync check failed. Please fix issues before deploying."
  exit 1
fi

echo ""
echo "✅ All pre-deployment checks passed!"

# Ask if user wants to proceed with deployment
read -p "Do you want to proceed with deployment? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ]; then
  echo ""
  echo "Step 3: Running deployment with cleanup and verification..."
  ./scripts/sftp-deploy-cleanup.sh
  
  if [ $? -ne 0 ]; then
    echo "⚠️  Deployment failed. Please check the logs."
    exit 1
  fi
  
  echo "🚀 Deployment completed successfully!"
else
  echo "Deployment cancelled."
fi

exit 0