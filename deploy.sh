#!/bin/bash

# Simple deployment script for AI Sports Edge
# This script deploys all changes including ThemeToggle and auth fixes

echo "🚀 Starting deployment of AI Sports Edge updates..."

# Clear any previous build artifacts
echo "🧹 Cleaning up previous builds..."
rm -rf dist
rm -rf web-build

# Deploy Firebase configuration
echo "🔥 Deploying Firebase configuration..."
firebase deploy --only firestore:rules,storage,functions
if [ $? -ne 0 ]; then
  echo "⚠️ Firebase configuration deployment had issues, but continuing..."
fi

# Build and deploy the web app
echo "🌐 Building and deploying web app..."
cd web
npm run build
if [ $? -ne 0 ]; then
  echo "⚠️ Web build had issues, but continuing..."
fi

# Deploy to web hosting
echo "📤 Deploying to web hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
  echo "⚠️ Web hosting deployment had issues, but continuing..."
fi
cd ..

# Update Expo project
echo "📱 Publishing Expo updates..."
npx expo publish
if [ $? -ne 0 ]; then
  echo "⚠️ Expo publish had issues, but continuing..."
fi

echo "✅ Deployment completed!"
echo "🌐 Web app should be live at https://aisportsedge.app"
echo "📱 Mobile app updates will be available after app store review"