#!/bin/bash
# Script to update the mobile app with the latest changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install Node.js and npm to run this script.${NC}"
    exit 1
fi

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    section "Installing EAS CLI"
    npm install -g eas-cli
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install EAS CLI.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}EAS CLI installed successfully.${NC}"
fi

# Check if user is logged in to EAS
eas whoami &> /dev/null
if [ $? -ne 0 ]; then
    section "Logging in to EAS"
    eas login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to log in to EAS.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Logged in to EAS successfully.${NC}"
fi

# Update dependencies
section "Updating Dependencies"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update dependencies.${NC}"
    exit 1
fi

echo -e "${GREEN}Dependencies updated successfully.${NC}"

# Build for iOS
section "Building for iOS"
echo -e "Building iOS app with OneSignal integration..."

eas build --platform ios --profile ios-beta

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build iOS app.${NC}"
    exit 1
fi

echo -e "${GREEN}iOS app built successfully.${NC}"

# Build for Android
section "Building for Android"
echo -e "Building Android app with OneSignal integration..."

eas build --platform android --profile android-beta

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build Android app.${NC}"
    exit 1
fi

echo -e "${GREEN}Android app built successfully.${NC}"

# Update OTA
section "Updating OTA"
echo -e "Updating app with Over-the-Air updates..."

eas update

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update OTA.${NC}"
    exit 1
fi

echo -e "${GREEN}OTA update successful.${NC}"

section "Update Complete"
echo -e "${GREEN}The mobile app has been updated successfully.${NC}"
echo -e "You can view the build status in the EAS dashboard."
echo -e "Once the builds are complete, you can download the apps from the EAS dashboard."