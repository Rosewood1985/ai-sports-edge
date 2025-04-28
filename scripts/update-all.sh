#!/bin/bash
# Master script to update everything: push to GitHub, update web app, and update mobile app

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Push documentation to GitHub
section "Pushing documentation to GitHub"
./scripts/push-docs-to-github.sh

# Update web app
section "Updating web app"
./scripts/update-web-app.sh

# Update mobile app
section "Updating mobile app"
./scripts/update-mobile-app.sh

# Final message
section "Update process completed"
echo -e "${GREEN}All updates have been completed successfully!${NC}"
echo "- Documentation has been pushed to GitHub"
echo "- Web app has been built and deployed"
echo "- Mobile app updates have been submitted"
echo ""
echo "Note: Mobile app builds will continue on EAS servers."
echo "You can check their status with 'eas build:list'"