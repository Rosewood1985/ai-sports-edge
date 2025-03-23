#!/bin/bash

# Deploy Web App to Firebase Hosting
# This script builds and deploys the web app to Firebase hosting

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge Web App Deployment Script"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it with:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
firebase_status=$(firebase login:list)
if [[ $firebase_status == *"No users"* ]]; then
    echo "You are not logged in to Firebase. Please login with:"
    echo "firebase login"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "Error: firebase.json not found. Please run this script from the project root directory."
    exit 1
fi

# Build the web app
echo "Building web app..."
npm run build:web

# Check if build was successful
if [ ! -d "public" ]; then
    echo "Error: Build failed. The 'public' directory was not created."
    exit 1
fi

# Verify Firebase configuration
echo "Verifying Firebase configuration..."
if [ ! -f "public/firebase-config.js" ]; then
    echo "Warning: firebase-config.js not found in public directory."
    echo "Creating firebase-config.js from environment variables..."
    
    # Create firebase-config.js from environment variables
    cat > public/firebase-config.js << EOF
// Firebase configuration
const firebaseConfig = {
  apiKey: "${REACT_APP_FIREBASE_API_KEY}",
  authDomain: "${REACT_APP_FIREBASE_AUTH_DOMAIN}",
  projectId: "${REACT_APP_FIREBASE_PROJECT_ID}",
  storageBucket: "${REACT_APP_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${REACT_APP_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${REACT_APP_FIREBASE_APP_ID}",
  measurementId: "${REACT_APP_FIREBASE_MEASUREMENT_ID}"
};
EOF
    
    echo "firebase-config.js created."
fi

# Check for Spanish version
echo "Checking for Spanish version..."
if [ ! -d "public/es" ]; then
    echo "Warning: Spanish version directory (public/es) not found."
    echo "Creating Spanish version directory..."
    mkdir -p public/es
    cp public/index.html public/es/index.html
    
    # Update language tag in Spanish version
    sed -i '' 's/<html lang="en">/<html lang="es">/' public/es/index.html
    
    echo "Spanish version directory created."
fi

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting

# Verify deployment
echo "Verifying deployment..."
firebase hosting:channel:list

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "Your app is now live at:"
echo "  - Default site: https://ai-sports-edge.web.app"
echo "  - Custom domain: https://aisportsedge-app.web.app"
echo "=========================================="