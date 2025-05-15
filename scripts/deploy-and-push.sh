#!/bin/bash
# Combined script to deploy AI Sports Edge to GoDaddy and push to GitHub

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Make sure the deployment scripts are executable
chmod +x scripts/deploy-to-godaddy.sh
chmod +x scripts/push-to-github.sh

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  AI Sports Edge Deployment Pipeline     ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Step 1: Run tests
echo -e "\n${YELLOW}Step 1: Running tests...${NC}"
npm test

if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed. Do you want to continue with deployment? (y/n)${NC}"
  read -r continue_deployment
  
  if [ "$continue_deployment" != "y" ]; then
    echo -e "${RED}Deployment aborted.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Continuing with deployment despite test failures...${NC}"
else
  echo -e "${GREEN}Tests passed successfully.${NC}"
fi

# Step 2: Deploy to GoDaddy
echo -e "\n${YELLOW}Step 2: Deploying to GoDaddy...${NC}"
./scripts/deploy-to-godaddy.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment to GoDaddy failed. Do you want to continue with GitHub push? (y/n)${NC}"
  read -r continue_github
  
  if [ "$continue_github" != "y" ]; then
    echo -e "${RED}GitHub push aborted.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Continuing with GitHub push despite deployment failure...${NC}"
else
  echo -e "${GREEN}Deployment to GoDaddy completed successfully.${NC}"
fi

# Step 3: Push to GitHub
echo -e "\n${YELLOW}Step 3: Pushing to GitHub...${NC}"
./scripts/push-to-github.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}GitHub push failed.${NC}"
  exit 1
else
  echo -e "${GREEN}GitHub push completed successfully.${NC}"
fi

# Step 4: Create deployment tag
echo -e "\n${YELLOW}Step 4: Creating deployment tag...${NC}"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
TAG_NAME="deploy-$TIMESTAMP"

git tag -a "$TAG_NAME" -m "Deployment $TIMESTAMP"
git push origin "$TAG_NAME"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment tag.${NC}"
else
  echo -e "${GREEN}Deployment tag $TAG_NAME created and pushed.${NC}"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Pipeline Completed!         ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployed to: aisportsedge.app${NC}"
echo -e "${GREEN}GitHub repository updated${NC}"
echo -e "${GREEN}Deployment tag: $TAG_NAME${NC}"