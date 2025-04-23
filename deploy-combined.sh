#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Comprehensive Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-combined_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Run the Firebase fix deployment
log "\n${YELLOW}Step 1: Running Firebase fix deployment...${NC}"
chmod +x deploy-firebase-fix.sh
./deploy-firebase-fix.sh
check_status "Firebase fix deployment"

# Step 2: Verify signup works
log "\n${YELLOW}Step 2: Verifying signup works...${NC}"
log "${YELLOW}Please manually verify that signup works and press Enter to continue...${NC}"
read -p "Press Enter to continue after verifying signup works..."

# Step 3: Run the Spanish localization deployment
log "\n${YELLOW}Step 3: Running Spanish localization deployment...${NC}"
chmod +x deploy-spanish-localization.sh
./deploy-spanish-localization.sh
check_status "Spanish localization deployment"

# Step 4: Run the web app cleanup
log "\n${YELLOW}Step 4: Running web app cleanup...${NC}"
node debug-app-detailed.js
check_status "Web app cleanup"

# Step 5: Run the performance optimization
log "\n${YELLOW}Step 5: Running performance optimization...${NC}"
node debug-services.js
check_status "Performance optimization"

# Step 6: Final verification
log "\n${YELLOW}Step 6: Final verification...${NC}"
log "${YELLOW}Please manually verify all functionality and press Enter to continue...${NC}"
read -p "Press Enter to continue after final verification..."

# Step 7: Create a summary report
log "\n${YELLOW}Step 7: Creating summary report...${NC}"
cat > "comprehensive-deployment-summary.md" << EOL
# AI Sports Edge Comprehensive Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Firebase fix deployment
2. ✓ Signup verification
3. ✓ Spanish localization deployment
4. ✓ Web app cleanup
5. ✓ Performance optimization
6. ✓ Final verification

## Next Steps
1. Monitor application performance
2. Gather user feedback on Spanish localization
3. Continue improving documentation
4. Implement additional performance optimizations

## Documentation
- Comprehensive Deployment Plan: memory-bank/comprehensive-deployment-plan.md
- Firebase Auth Fix Summary: firebase-auth-fix-summary.md
- Spanish Localization Summary: spanish-localization-summary.md
- Debugging Summary: debugging-summary.md
- Services Debug Report: services-debug-report.md
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Comprehensive Deployment Completed Successfully${NC}"
log "${GREEN}See comprehensive-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"