#!/bin/bash
# Script to update the mobile app with all changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Install dependencies (if needed)
echo "Installing dependencies..."
npm install

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Login to EAS (if needed)
echo "Checking EAS login status..."
eas whoami || eas login

# Build and submit the iOS app
echo "Building and submitting iOS app..."
eas build --platform ios --profile ios-beta

# Build and submit the Android app
echo "Building and submitting Android app..."
eas build --platform android --profile android-beta

# Push an update to existing apps
echo "Pushing update to existing apps..."
eas update

echo "Mobile app updates have been submitted!"
echo "Note: The builds will take some time to complete on the EAS servers."
echo "You can check the status of your builds with 'eas build:list'"