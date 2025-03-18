#!/bin/bash
# Script to update the web app with all changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Install dependencies (if needed)
echo "Installing dependencies..."
npm install

# Build the web app
echo "Building web app..."
npm run build-web

# Deploy the web app
echo "Deploying web app..."
# The project uses Firebase for deployment
npm run firebase:deploy

echo "Web app successfully updated and deployed!"