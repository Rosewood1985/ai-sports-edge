#!/bin/bash

# Setup CI/CD Pipeline Script
# This script sets up the CI/CD pipeline for Firebase deployment

set -e

# Configuration
GITHUB_REPO="ai-sports-edge"
GITHUB_OWNER=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')
WORKFLOWS_DIR=".github/workflows"
FIREBASE_DEPLOYMENT_WORKFLOW="${WORKFLOWS_DIR}/firebase-deployment.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v git >/dev/null 2>&1 || { echo -e "${RED}Error: git is not installed. Install it using your package manager.${NC}" >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo -e "${YELLOW}Warning: GitHub CLI is not installed. Some features will be limited.${NC}" >&2; }

echo -e "${BLUE}=== Setting up CI/CD Pipeline for Firebase Deployment ===${NC}"

# Create workflows directory if it doesn't exist
mkdir -p "$WORKFLOWS_DIR"

# Check if workflow file exists
if [ -f "$FIREBASE_DEPLOYMENT_WORKFLOW" ]; then
  echo -e "${GREEN}Firebase deployment workflow file already exists at ${FIREBASE_DEPLOYMENT_WORKFLOW}${NC}"
else
  echo -e "${YELLOW}Firebase deployment workflow file not found. Please create it first.${NC}"
  echo -e "${YELLOW}You can create it by running:${NC}"
  echo -e "${YELLOW}mkdir -p ${WORKFLOWS_DIR} && touch ${FIREBASE_DEPLOYMENT_WORKFLOW}${NC}"
  exit 1
fi

# Check if GitHub CLI is installed
if command -v gh >/dev/null 2>&1; then
  # Check if logged in to GitHub
  gh auth status >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to GitHub CLI. Please log in:${NC}"; gh auth login; }
  
  # Set up GitHub repository secrets
  echo -e "${BLUE}Setting up GitHub repository secrets...${NC}"
  
  # Function to set a secret
  function set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value
    
    echo -e "${YELLOW}${secret_description} (${secret_name})${NC}"
    read -r -s -p "Enter value (input will be hidden): " secret_value
    echo
    
    if [ -z "$secret_value" ]; then
      echo -e "${YELLOW}No value provided for ${secret_name}. Skipping.${NC}"
    else
      echo -e "${BLUE}Setting ${secret_name} secret...${NC}"
      echo "$secret_value" | gh secret set "$secret_name" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
      echo -e "${GREEN}Secret ${secret_name} set successfully.${NC}"
    fi
  }
  
  # Set up required secrets
  set_secret "FIREBASE_API_KEY" "Firebase API key"
  set_secret "FIREBASE_TOKEN" "Firebase CLI token (run 'firebase login:ci' to get it)"
  set_secret "STRIPE_API_KEY" "Stripe API key"
  set_secret "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret"
  set_secret "GOOGLE_MAPS_API_KEY" "Google Maps API key"
  set_secret "OPENWEATHER_API_KEY" "OpenWeather API key"
  set_secret "SLACK_WEBHOOK_URL" "Slack webhook URL for notifications"
  
  # Set up GitHub Actions environments
  echo -e "${BLUE}Setting up GitHub Actions environments...${NC}"
  
  # Check if environments exist
  if gh api repos/${GITHUB_OWNER}/${GITHUB_REPO}/environments/staging >/dev/null 2>&1; then
    echo -e "${GREEN}Staging environment already exists.${NC}"
  else
    echo -e "${BLUE}Creating staging environment...${NC}"
    gh api --method PUT repos/${GITHUB_OWNER}/${GITHUB_REPO}/environments/staging -f wait_timer=0 -f reviewers=[]
    echo -e "${GREEN}Staging environment created successfully.${NC}"
  fi
  
  if gh api repos/${GITHUB_OWNER}/${GITHUB_REPO}/environments/production >/dev/null 2>&1; then
    echo -e "${GREEN}Production environment already exists.${NC}"
  else
    echo -e "${BLUE}Creating production environment...${NC}"
    gh api --method PUT repos/${GITHUB_OWNER}/${GITHUB_REPO}/environments/production -f wait_timer=3600 -f reviewers=[]
    echo -e "${GREEN}Production environment created successfully.${NC}"
  fi
  
  # Enable GitHub Actions
  echo -e "${BLUE}Enabling GitHub Actions...${NC}"
  gh api --method PUT repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/permissions -f enabled=true
  echo -e "${GREEN}GitHub Actions enabled successfully.${NC}"
else
  echo -e "${YELLOW}GitHub CLI is not installed. Please set up the following secrets manually in your GitHub repository:${NC}"
  echo -e "${YELLOW}- FIREBASE_API_KEY: Firebase API key${NC}"
  echo -e "${YELLOW}- FIREBASE_TOKEN: Firebase CLI token (run 'firebase login:ci' to get it)${NC}"
  echo -e "${YELLOW}- STRIPE_API_KEY: Stripe API key${NC}"
  echo -e "${YELLOW}- STRIPE_WEBHOOK_SECRET: Stripe webhook secret${NC}"
  echo -e "${YELLOW}- GOOGLE_MAPS_API_KEY: Google Maps API key${NC}"
  echo -e "${YELLOW}- OPENWEATHER_API_KEY: OpenWeather API key${NC}"
  echo -e "${YELLOW}- SLACK_WEBHOOK_URL: Slack webhook URL for notifications${NC}"
  
  echo -e "${YELLOW}Also, please set up the following environments in your GitHub repository:${NC}"
  echo -e "${YELLOW}- staging: For staging deployments${NC}"
  echo -e "${YELLOW}- production: For production deployments${NC}"
fi

# Commit and push workflow file
echo -e "${BLUE}Committing and pushing workflow file...${NC}"
git add "$FIREBASE_DEPLOYMENT_WORKFLOW"
git commit -m "Add Firebase deployment workflow" || echo -e "${YELLOW}No changes to commit.${NC}"
git push || echo -e "${YELLOW}Failed to push changes. Please push manually.${NC}"

echo -e "${GREEN}=== CI/CD Pipeline Setup Completed ===${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Make sure all required secrets are set in your GitHub repository${NC}"
echo -e "${BLUE}2. Make sure all required environments are set up in your GitHub repository${NC}"
echo -e "${BLUE}3. Push a commit to the main branch to trigger the pipeline${NC}"
echo -e "${BLUE}4. Monitor the pipeline execution in the GitHub Actions tab${NC}"