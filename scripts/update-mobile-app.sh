#!/bin/bash
# Script to update the mobile app with all changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Install dependencies (if needed)
echo "Installing dependencies..."
npm install

# Install EAS CLI locally if not already in the project
if ! npm list eas-cli > /dev/null 2>&1; then
    echo "EAS CLI not found in project dependencies. Installing locally..."
    npm install --save-dev eas-cli
fi

# Set path to local EAS CLI
EAS_CLI="npx eas"

# Login to EAS (if needed)
echo "Checking EAS login status..."
$EAS_CLI whoami || $EAS_CLI login

# Build and submit the iOS app
echo "Building and submitting iOS app..."
$EAS_CLI build --platform ios --profile ios-beta

# Build and submit the Android app
echo "Building and submitting Android app..."
$EAS_CLI build --platform android --profile android-beta

# Push an update to existing apps
echo "Pushing update to existing apps..."
$EAS_CLI update

echo "Mobile app updates have been submitted!"
echo "Note: The builds will take some time to complete on the EAS servers."
echo "You can check the status of your builds with '$EAS_CLI build:list'"