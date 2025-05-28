#!/bin/bash

# Script to deploy Remote Config and Firebase Functions
# This ensures that the Remote Config is updated before the functions are deployed

set -e  # Exit on error

echo "===== Deploying AI Sports Edge Remote Config and Functions ====="

# Step 1: Build the functions
echo "Building Firebase Functions..."
cd functions
npm run build
cd ..

# Step 2: Update and deploy Remote Config
echo "Updating and deploying Remote Config..."
node update_remote_config.js

# Step 3: Deploy the functions
echo "Deploying Firebase Functions..."
firebase deploy --only functions:predictTodayGames,functions:markAIPickOfDay --force

echo "===== Deployment Complete ====="
echo "ML model path: https://ai-sports-edge-com.web.app/models/model.pkl"
echo "Remote Config and Functions have been deployed successfully!"