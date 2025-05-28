#!/bin/bash

# Deploy script for AI Sports Edge theme toggle and auth fixes
# This script deploys all changes made to the app including:
# - ThemeToggle component across all platforms
# - Firebase auth fixes
# - New SignupScreen component

echo "🚀 Starting deployment of AI Sports Edge updates..."

# 1. Build the web app
echo "📦 Building web app..."
cd web
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Web build failed. Aborting deployment."
  exit 1
fi
cd ..

# 2. Build the mobile app
echo "📱 Building mobile app..."
expo build:web
if [ $? -ne 0 ]; then
  echo "❌ Mobile web build failed. Aborting deployment."
  exit 1
fi

# 3. Deploy to Firebase hosting
echo "🔥 Deploying to Firebase hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
  echo "❌ Firebase hosting deployment failed."
  exit 1
fi

# 4. Deploy Firebase functions
echo "⚙️ Deploying Firebase functions..."
firebase deploy --only functions
if [ $? -ne 0 ]; then
  echo "❌ Firebase functions deployment failed."
  exit 1
fi

# 5. Deploy Firestore rules
echo "📝 Deploying Firestore rules..."
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
  echo "❌ Firestore rules deployment failed."
  exit 1
fi

# 6. Update Expo project
echo "🔄 Updating Expo project..."
expo publish
if [ $? -ne 0 ]; then
  echo "❌ Expo publish failed."
  exit 1
fi

# 7. Verify deployment
echo "✅ Verifying deployment..."
curl -s https://aisportsedge.app > /dev/null
if [ $? -ne 0 ]; then
  echo "⚠️ Website verification failed, but deployment may still be in progress."
else
  echo "✅ Website is accessible."
fi

echo "🎉 Deployment completed successfully!"
echo "📱 Mobile app updates will be available after app store review."
echo "🌐 Web app updates are live at https://aisportsedge.app"