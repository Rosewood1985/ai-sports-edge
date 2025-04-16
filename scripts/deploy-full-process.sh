#!/bin/bash

# Full Deployment Process Script
# This script implements the complete deployment process for AI Sports Edge

set -e

# Configuration
DEFAULT_PROJECT_ID="ai-sports-edge"
DEFAULT_STAGING_PROJECT_ID="ai-sports-edge-staging"
DOMAIN="aisportsedge.app"
ENV_FILE=".env"

# Ask for project IDs
echo -e "${BLUE}Checking Firebase projects...${NC}"
firebase projects:list

echo -e "${YELLOW}Enter the Firebase production project ID (default: ${DEFAULT_PROJECT_ID}):${NC}"
read -r input_project_id
PROJECT_ID=${input_project_id:-$DEFAULT_PROJECT_ID}

echo -e "${YELLOW}Enter the Firebase staging project ID (default: ${DEFAULT_STAGING_PROJECT_ID}):${NC}"
read -r input_staging_project_id
STAGING_PROJECT_ID=${input_staging_project_id:-$DEFAULT_STAGING_PROJECT_ID}

echo -e "${GREEN}Using production project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Using staging project ID: ${STAGING_PROJECT_ID}${NC}"

# Load environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${BLUE}Loading environment variables from ${ENV_FILE}...${NC}"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo -e "${GREEN}Environment variables loaded successfully.${NC}"
else
  echo -e "${YELLOW}Environment file ${ENV_FILE} not found. Using existing environment variables.${NC}"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}Error: firebase-tools is not installed. Run 'npm install -g firebase-tools'${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: node is not installed. Install it from https://nodejs.org/${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is not installed. Install it from https://nodejs.org/${NC}" >&2; exit 1; }

# Check if gcloud is installed (optional)
GCLOUD_INSTALLED=true
command -v gcloud >/dev/null 2>&1 || {
  echo -e "${YELLOW}Warning: gcloud is not installed. Some features will be limited.${NC}" >&2
  echo -e "${YELLOW}You can install it from https://cloud.google.com/sdk/docs/install${NC}" >&2
  GCLOUD_INSTALLED=false
}

echo -e "${BLUE}=== Full Deployment Process for AI Sports Edge ===${NC}"

# Check if user is logged in to Firebase
firebase projects:list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"; firebase login; }

# Check if user is logged in to Google Cloud (if gcloud is installed)
if [ "$GCLOUD_INSTALLED" = true ]; then
  gcloud auth list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Google Cloud. Please log in:${NC}"; gcloud auth login; }
fi

# Step 1: Make all scripts executable
echo -e "${BLUE}Step 1: Making all scripts executable...${NC}"
chmod +x scripts/*.sh
echo -e "${GREEN}All scripts are now executable.${NC}"

# Step 2: Check API keys
echo -e "${BLUE}Step 2: Checking API keys...${NC}"
if [ -f "./scripts/check-api-keys.sh" ]; then
  ./scripts/check-api-keys.sh
  if [ $? -ne 0 ]; then
    echo -e "${RED}API keys check failed. Please fix the issues and try again.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}API keys check script not found. Skipping API keys check.${NC}"
fi

# Step 3: Build the application
echo -e "${BLUE}Step 3: Building the application...${NC}"
echo -e "${YELLOW}Do you want to build the application? (y/n)${NC}"
read -r build_app

if [[ "$build_app" == "y" || "$build_app" == "Y" ]]; then
  # Install dependencies
  echo -e "${BLUE}Installing dependencies...${NC}"
  npm ci
  
  # Check if build script exists
  if grep -q "\"build\":" package.json; then
    # Build the application
    echo -e "${BLUE}Building the application...${NC}"
    npm run build
    echo -e "${GREEN}Application built successfully.${NC}"
  else
    echo -e "${YELLOW}No build script found in package.json. Creating a default build directory...${NC}"
    mkdir -p build
    echo -e "${YELLOW}You may need to manually build your application.${NC}"
    echo -e "${YELLOW}Do you want to continue with the deployment process? (y/n)${NC}"
    read -r continue_deployment
    
    if [[ "$continue_deployment" != "y" && "$continue_deployment" != "Y" ]]; then
      echo -e "${YELLOW}Deployment process aborted.${NC}"
      exit 0
    fi
  fi
else
  echo -e "${YELLOW}Skipping application build.${NC}"
fi

# Step 4: Test in staging environment
echo -e "${BLUE}Step 4: Testing in staging environment...${NC}"
echo -e "${YELLOW}Do you want to test in staging environment? (y/n)${NC}"
read -r test_staging

if [[ "$test_staging" == "y" || "$test_staging" == "Y" ]]; then
  if [ -f "./scripts/test-staging-deployment.sh" ]; then
    ./scripts/test-staging-deployment.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Staging tests failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Staging test script not found. Skipping staging tests.${NC}"
    
    # Deploy to staging manually
    echo -e "${BLUE}Deploying to staging environment...${NC}"
    firebase use ${STAGING_PROJECT_ID}
    firebase deploy --project ${STAGING_PROJECT_ID}
    
    echo -e "${GREEN}Deployed to staging environment.${NC}"
    echo -e "${YELLOW}Please test the staging environment manually at https://${STAGING_PROJECT_ID}.web.app${NC}"
    echo -e "${YELLOW}Do you want to continue with the deployment process? (y/n)${NC}"
    read -r continue_deployment
    
    if [[ "$continue_deployment" != "y" && "$continue_deployment" != "Y" ]]; then
      echo -e "${YELLOW}Deployment process aborted.${NC}"
      exit 0
    fi
  fi
else
  echo -e "${YELLOW}Skipping staging tests.${NC}"
fi

# Step 5: Deploy to production
echo -e "${BLUE}Step 5: Deploying to production...${NC}"
echo -e "${YELLOW}Do you want to deploy to production? (y/n)${NC}"
read -r deploy_production

if [[ "$deploy_production" == "y" || "$deploy_production" == "Y" ]]; then
  if [ -f "./scripts/deploy-firebase-production.sh" ]; then
    ./scripts/deploy-firebase-production.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Production deployment failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Production deployment script not found. Deploying manually...${NC}"
    
    # Deploy to production manually
    echo -e "${BLUE}Deploying to production environment...${NC}"
    firebase use ${PROJECT_ID}
    firebase deploy --project ${PROJECT_ID}
    
    echo -e "${GREEN}Deployed to production environment.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping production deployment.${NC}"
fi

# Step 6: Set up custom domains and SSL
echo -e "${BLUE}Step 6: Setting up custom domains and SSL...${NC}"
echo -e "${YELLOW}Do you want to set up custom domains and SSL? (y/n)${NC}"
read -r setup_domains

if [[ "$setup_domains" == "y" || "$setup_domains" == "Y" ]]; then
  if [ -f "./scripts/setup-firebase-domains.sh" ]; then
    ./scripts/setup-firebase-domains.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Custom domains setup failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Custom domains setup script not found. Skipping custom domains setup.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping custom domains setup.${NC}"
fi

# Step 7: Fix domain settings for aisportsedge.app
echo -e "${BLUE}Step 7: Fixing domain settings for ${DOMAIN}...${NC}"
echo -e "${YELLOW}Do you want to fix domain settings for ${DOMAIN}? (y/n)${NC}"
read -r fix_domain

if [[ "$fix_domain" == "y" || "$fix_domain" == "Y" ]]; then
  if [ -f "./scripts/fix-domain-settings.sh" ]; then
    ./scripts/fix-domain-settings.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Domain settings fix failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Domain settings fix script not found. Skipping domain settings fix.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping domain settings fix.${NC}"
fi

# Step 8: Configure webhooks
echo -e "${BLUE}Step 8: Configuring webhooks...${NC}"
echo -e "${YELLOW}Do you want to configure webhooks? (y/n)${NC}"
read -r configure_webhooks

if [[ "$configure_webhooks" == "y" || "$configure_webhooks" == "Y" ]]; then
  if [ -f "./scripts/configure-webhooks.sh" ]; then
    ./scripts/configure-webhooks.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Webhooks configuration failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Webhooks configuration script not found. Skipping webhooks configuration.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping webhooks configuration.${NC}"
fi

# Step 9: Test web app functionality
echo -e "${BLUE}Step 9: Testing web app functionality...${NC}"
echo -e "${YELLOW}Do you want to test web app functionality? (y/n)${NC}"
read -r test_webapp

if [[ "$test_webapp" == "y" || "$test_webapp" == "Y" ]]; then
  if [ -f "./scripts/test-webapp-functionality.sh" ]; then
    ./scripts/test-webapp-functionality.sh
    if [ $? -ne 0 ]; then
      echo -e "${YELLOW}Web app functionality tests found issues. Please review the test report.${NC}"
    else
      echo -e "${GREEN}Web app functionality tests passed.${NC}"
    fi
  else
    echo -e "${YELLOW}Web app functionality test script not found. Skipping web app testing.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping web app functionality tests.${NC}"
fi

# Step 10: Set up CI/CD pipeline
echo -e "${BLUE}Step 10: Setting up CI/CD pipeline...${NC}"
echo -e "${YELLOW}Do you want to set up the CI/CD pipeline? (y/n)${NC}"
read -r setup_cicd

if [[ "$setup_cicd" == "y" || "$setup_cicd" == "Y" ]]; then
  if [ -f "./scripts/setup-cicd-pipeline.sh" ]; then
    ./scripts/setup-cicd-pipeline.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}CI/CD pipeline setup failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}CI/CD pipeline setup script not found. Skipping CI/CD pipeline setup.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping CI/CD pipeline setup.${NC}"
fi

echo -e "${GREEN}=== Full Deployment Process Completed ===${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Verify that all features are working correctly in the production environment${NC}"
echo -e "${BLUE}2. Check the Firebase console for performance metrics and errors${NC}"
echo -e "${BLUE}3. Configure alerts for critical metrics${NC}"
echo -e "${BLUE}4. Schedule regular backups${NC}"
echo -e "${BLUE}5. Keep documentation up to date${NC}"
echo -e "${BLUE}6. Train team members on the deployment process${NC}"
echo -e "${BLUE}7. Perform security audit${NC}"
echo -e "${BLUE}8. Monitor CI/CD pipeline${NC}"
echo -e "${BLUE}9. Optimize costs${NC}"

echo -e "${YELLOW}Production URL: https://${PROJECT_ID}.web.app${NC}"
echo -e "${YELLOW}Custom Domain: https://${DOMAIN}${NC}"