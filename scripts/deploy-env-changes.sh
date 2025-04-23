#!/bin/bash

# Deploy Environment Variable Changes
# This script deploys the environment variable changes to production

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    exit 1
  fi
}

# Function to print section header
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to show help
show_help() {
  echo -e "Usage: $0 [options]"
  echo -e ""
  echo -e "This script deploys environment variable changes to production."
  echo -e ""
  echo -e "Options:"
  echo -e "  -h, --help     Show this help message and exit"
  echo -e "  -f, --firebase Deploy to Firebase"
  echo -e "  -g, --godaddy  Deploy to GoDaddy"
  echo -e ""
  echo -e "Examples:"
  echo -e "  $0             Interactive mode (will prompt for deployment target)"
  echo -e "  $0 --firebase  Deploy directly to Firebase"
  echo -e "  $0 --godaddy   Deploy directly to GoDaddy"
  echo -e ""
  exit 0
}

# Parse command line arguments
DEPLOY_TARGET=""
for arg in "$@"; do
  case $arg in
    -h|--help)
      show_help
      ;;
    -f|--firebase)
      DEPLOY_TARGET="f"
      ;;
    -g|--godaddy)
      DEPLOY_TARGET="g"
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      show_help
      ;;
  esac
done

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found.${NC}"
  echo -e "Please create a .env file by running: npm run setup-env"
  exit 1
fi

# Validate environment variables
print_header "Validating Environment Variables"
node scripts/check-env.js
check_status "Environment variables validation"

# Skip the build step for now
print_header "Skipping Build Step"
echo "Skipping build step for environment variable deployment."
check_status "Build step skipped"

# Deploy to production
print_header "Deploying to Production"

# If DEPLOY_TARGET is not set, prompt the user
if [ -z "$DEPLOY_TARGET" ]; then
  read -p "Deploy to Firebase or GoDaddy? (f/g): " DEPLOY_TARGET
fi

if [ "$DEPLOY_TARGET" = "f" ] || [ "$DEPLOY_TARGET" = "F" ]; then
  # Deploy to Firebase
  echo "Deploying to Firebase..."
  
  # Check if Firebase CLI is installed
  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not found.${NC}"
    echo "Please install Firebase CLI by running: npm install -g firebase-tools"
    exit 1
  fi
  
  # Deploy to Firebase
  firebase deploy
  check_status "Firebase deployment"
  
elif [ "$DEPLOY_TARGET" = "g" ] || [ "$DEPLOY_TARGET" = "G" ]; then
  # Deploy to GoDaddy
  echo "Deploying to GoDaddy..."
  
  # Check if the deployment script exists
  if [ -f deploy-to-godaddy.sh ]; then
    bash deploy-to-godaddy.sh
    check_status "GoDaddy deployment"
  elif [ -f deploy-vscode-sftp.sh ]; then
    bash deploy-vscode-sftp.sh
    check_status "GoDaddy deployment via SFTP"
  else
    echo -e "${RED}Error: GoDaddy deployment script not found.${NC}"
    echo "Please create a deployment script for GoDaddy."
    exit 1
  fi
  
else
  echo -e "${RED}Error: Invalid deployment target: $DEPLOY_TARGET${NC}"
  echo "Please enter 'f' for Firebase or 'g' for GoDaddy."
  exit 1
fi

print_header "Deployment Complete"
echo -e "${GREEN}Environment variable changes have been successfully deployed!${NC}"
echo -e "Don't forget to update the environment variables on your CI/CD platform if applicable."