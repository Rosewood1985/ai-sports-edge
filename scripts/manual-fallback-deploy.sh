#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Manual Fallback Deployment...${NC}"

# Validate deployment configuration
echo -e "${YELLOW}Validating deployment configuration...${NC}"
./scripts/validate-deployment-config.sh

# Check if validation was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment configuration validation failed${NC}"
    echo -e "${YELLOW}Please fix the issues and try again${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment configuration validated successfully${NC}"

# Create a zip file of the build directory
echo -e "${YELLOW}Creating zip file of build directory...${NC}"
cd build || {
    echo -e "${RED}❌ Failed to access build directory${NC}"
    exit 1
}

# Create a zip file with all files including hidden files
zip -r ../aisportsedge-deploy.zip . -x "*.DS_Store" "*.git*"

# Check if zip was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create zip file${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}✅ Created zip file: aisportsedge-deploy.zip${NC}"

# Provide instructions for manual deployment
echo -e "\n${YELLOW}Manual Deployment Instructions:${NC}"
echo -e "1. Log in to GoDaddy hosting control panel"
echo -e "2. Navigate to File Manager"
echo -e "3. Go to /home/q15133yvmhnq/public_html/aisportsedge.app"
echo -e "4. Upload aisportsedge-deploy.zip"
echo -e "5. Extract the zip file"
echo -e "6. Run the following commands in the terminal:"
echo -e "   ${GREEN}cd /home/q15133yvmhnq/public_html/aisportsedge.app${NC}"
echo -e "   ${GREEN}chmod -R 755 .${NC}"
echo -e "   ${GREEN}find . -type f -exec chmod 644 {} \\;${NC}"
echo -e "   ${GREEN}find . -name \"*.sh\" -exec chmod +x {} \\;${NC}"
echo -e "7. Verify the deployment at https://aisportsedge.app"

echo -e "\n${GREEN}✅ Manual fallback deployment preparation complete!${NC}"
echo -e "${YELLOW}After manual deployment, run ./scripts/detailed-deployment-check.sh to verify the deployment.${NC}"