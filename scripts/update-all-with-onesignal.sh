#!/bin/bash
# Master script to update all components with OneSignal integration

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

# Function to check if a script exists and is executable
check_script() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}Script $1 not found.${NC}"
        return 1
    fi
    
    if [ ! -x "$1" ]; then
        echo -e "${RED}Script $1 is not executable. Making it executable...${NC}"
        chmod +x "$1"
    fi
    
    return 0
}

# Check if all required scripts exist
section "Checking Scripts"
check_script "./scripts/setup-onesignal-config.sh" || exit 1
check_script "./scripts/update-web-app.sh" || exit 1
check_script "./scripts/update-mobile-app.sh" || exit 1
check_script "./scripts/update-github.sh" || exit 1

echo -e "${GREEN}All scripts found and are executable.${NC}"

# Run OneSignal setup script
section "Setting Up OneSignal"
./scripts/setup-onesignal-config.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to set up OneSignal.${NC}"
    exit 1
fi

echo -e "${GREEN}OneSignal setup completed successfully.${NC}"

# Update GitHub repository
section "Updating GitHub Repository"
./scripts/update-github.sh -m "Add OneSignal integration for push notifications"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update GitHub repository.${NC}"
    exit 1
fi

echo -e "${GREEN}GitHub repository updated successfully.${NC}"

# Update web app
section "Updating Web App"
./scripts/update-web-app.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update web app.${NC}"
    exit 1
fi

echo -e "${GREEN}Web app updated successfully.${NC}"

# Update mobile app
section "Updating Mobile App"
./scripts/update-mobile-app.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update mobile app.${NC}"
    exit 1
fi

echo -e "${GREEN}Mobile app updated successfully.${NC}"

section "Update Complete"
echo -e "${GREEN}All components have been updated with OneSignal integration.${NC}"
echo -e "Web app: ${YELLOW}https://ai-sports-edge.web.app${NC}"
echo -e "Mobile app: Check the EAS dashboard for build status."
echo -e "\nYou can now send push notifications to your users through the OneSignal dashboard."