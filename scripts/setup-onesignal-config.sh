#!/bin/bash
# Script to set up OneSignal configuration in Firebase Functions

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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Please install it with 'npm install -g firebase-tools'.${NC}"
    exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    section "Logging in to Firebase"
    firebase login
fi

# Get OneSignal configuration
section "OneSignal Configuration"
echo -e "Please enter your OneSignal configuration details:"

read -p "OneSignal API Key: " ONESIGNAL_API_KEY
read -p "OneSignal Web App ID: " ONESIGNAL_WEB_APP_ID
read -p "OneSignal Mobile App ID: " ONESIGNAL_MOBILE_APP_ID

# Confirm configuration
section "Confirm Configuration"
echo -e "OneSignal API Key: ${YELLOW}$ONESIGNAL_API_KEY${NC}"
echo -e "OneSignal Web App ID: ${YELLOW}$ONESIGNAL_WEB_APP_ID${NC}"
echo -e "OneSignal Mobile App ID: ${YELLOW}$ONESIGNAL_MOBILE_APP_ID${NC}"

read -p "Is this configuration correct? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo -e "${RED}Configuration not confirmed. Exiting.${NC}"
    exit 1
fi

# Set Firebase Functions configuration
section "Setting Firebase Functions Configuration"
firebase functions:config:set onesignal.api_key="$ONESIGNAL_API_KEY" onesignal.web_app_id="$ONESIGNAL_WEB_APP_ID" onesignal.mobile_app_id="$ONESIGNAL_MOBILE_APP_ID"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}OneSignal configuration set successfully.${NC}"
else
    echo -e "${RED}Failed to set OneSignal configuration.${NC}"
    exit 1
fi

# Update OneSignal App IDs in files
section "Updating OneSignal App IDs in Files"

# Update public/index.html
echo -e "Updating ${YELLOW}public/index.html${NC}..."
sed -i '' "s/YOUR_ONESIGNAL_WEB_APP_ID/$ONESIGNAL_WEB_APP_ID/g" public/index.html

# Update components/OneSignalProvider.tsx
echo -e "Updating ${YELLOW}components/OneSignalProvider.tsx${NC}..."
sed -i '' "s/YOUR_ONESIGNAL_MOBILE_APP_ID/$ONESIGNAL_MOBILE_APP_ID/g" components/OneSignalProvider.tsx

echo -e "${GREEN}OneSignal App IDs updated in files.${NC}"

section "OneSignal Setup Complete"
echo -e "${GREEN}OneSignal has been successfully configured for AI Sports Edge.${NC}"
echo -e "You can now use OneSignal to send push notifications to your users."