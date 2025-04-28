#!/bin/bash

# Deploy iOS App using Expo EAS
# This script builds and submits the iOS app to the App Store

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge iOS App Deployment Script"
echo "=========================================="
echo ""

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "Expo CLI is not installed. Please install it with:"
    echo "npm install -g expo-cli"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "EAS CLI is not installed. Please install it with:"
    echo "npm install -g eas-cli"
    exit 1
fi

# Check if user is logged in to Expo
expo_whoami=$(expo whoami 2>&1)
if [[ $expo_whoami == *"Not logged in"* ]]; then
    echo "You are not logged in to Expo. Please login with:"
    echo "expo login"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "Error: app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Update app version
echo "Updating app version..."
current_version=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
echo "Current version: $current_version"

# Prompt for new version
read -p "Enter new version number (leave blank to keep current): " new_version
if [ -n "$new_version" ]; then
    # Update version in app.json
    sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" app.json
    echo "Version updated to $new_version"
else
    echo "Keeping current version: $current_version"
    new_version=$current_version
fi

# Check for Spanish localization
echo "Checking for Spanish localization..."
if [ ! -d "ios/AISportsEdge/Supporting/es.lproj" ]; then
    echo "Warning: Spanish localization directory not found."
    echo "Creating Spanish localization directory..."
    mkdir -p ios/AISportsEdge/Supporting/es.lproj
    
    # Copy InfoPlist.strings file
    if [ -f "ios/AISportsEdge/Supporting/en.lproj/InfoPlist.strings" ]; then
        cp ios/AISportsEdge/Supporting/en.lproj/InfoPlist.strings ios/AISportsEdge/Supporting/es.lproj/InfoPlist.strings
        # Update strings for Spanish
        sed -i '' 's/NSLocationWhenInUseUsageDescription = ".*";/NSLocationWhenInUseUsageDescription = "Necesitamos acceso a su ubicación para mostrar equipos y lugares cercanos.";/' ios/AISportsEdge/Supporting/es.lproj/InfoPlist.strings
        sed -i '' 's/NSCameraUsageDescription = ".*";/NSCameraUsageDescription = "Necesitamos acceso a su cámara para escanear códigos QR.";/' ios/AISportsEdge/Supporting/es.lproj/InfoPlist.strings
    else
        echo "Warning: InfoPlist.strings not found. Skipping localization."
    }
    
    echo "Spanish localization directory created."
fi

# Build options
echo ""
echo "Build options:"
echo "1. Build for development (Preview)"
echo "2. Build for internal testing (Internal)"
echo "3. Build for TestFlight (TestFlight)"
echo "4. Build for App Store (Production)"
read -p "Select build type (1-4): " build_type

case $build_type in
    1)
        profile="preview"
        ;;
    2)
        profile="internal"
        ;;
    3)
        profile="testflight"
        ;;
    4)
        profile="production"
        ;;
    *)
        echo "Invalid option. Defaulting to internal."
        profile="internal"
        ;;
esac

# Build the app
echo ""
echo "Building iOS app with profile: $profile"
echo "This may take several minutes..."
eas build --platform ios --profile $profile --non-interactive

# If building for TestFlight or App Store, submit to App Store Connect
if [ "$profile" == "testflight" ] || [ "$profile" == "production" ]; then
    echo ""
    echo "Submitting to App Store Connect..."
    eas submit --platform ios --latest
fi

echo ""
echo "=========================================="
echo "iOS build process completed!"
echo "Version: $new_version"
echo "Profile: $profile"
echo "=========================================="