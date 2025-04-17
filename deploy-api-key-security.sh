#!/bin/bash
# API Key Security Deployment Script
# This script deploys the API key security changes to the production environment

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting API Key Security Deployment...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found!${NC}"
  echo -e "Please create a .env file with your API keys before deploying."
  echo -e "You can use .env.example as a template."
  exit 1
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Aborting deployment.${NC}"
  exit 1
fi

# Run environment validation
echo -e "${YELLOW}Validating environment variables...${NC}"
# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Loaded environment variables from .env file"
fi
node -e "require('./utils/envCheck').validateEnvironment()"

if [ $? -ne 0 ]; then
  echo -e "${RED}Environment validation failed! Aborting deployment.${NC}"
  echo -e "Please check your .env file and ensure all required variables are set."
  exit 1
fi

# Deploy to Firebase Functions only
echo -e "${YELLOW}Deploying to Firebase Functions...${NC}"
firebase deploy --only functions

if [ $? -ne 0 ]; then
  echo -e "${RED}Firebase Functions deployment failed!${NC}"
  exit 1
fi

# Deploy functions
echo -e "${YELLOW}Deploying Firebase Functions...${NC}"
cd functions && npm run build && cd .. && firebase deploy --only functions

if [ $? -ne 0 ]; then
  echo -e "${RED}Firebase Functions deployment failed!${NC}"
  exit 1
fi

echo -e "${GREEN}API Key Security Deployment Completed Successfully!${NC}"
echo -e "The following changes have been deployed:"
echo -e "  - Centralized API Key Management"
echo -e "  - Environment Variable Validation"
echo -e "  - Secure Service Implementations"
echo -e "  - API Key Documentation"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Verify all services are working correctly"
echo -e "2. Monitor logs for any API key related errors"
echo -e "3. Ensure all team members have updated their .env files"

exit 0