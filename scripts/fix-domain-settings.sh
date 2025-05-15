#!/bin/bash

# Fix Domain Settings Script
# This script fixes domain settings for aisportsedge.app

set -e

# Configuration
DOMAIN="aisportsedge.app"
DEFAULT_PROJECT_ID="ai-sports-edge"
DNS_ZONE_NAME="aisportsedge-app-zone"

# Ask for project ID
echo -e "${BLUE}Checking Firebase projects...${NC}"
firebase projects:list

echo -e "${YELLOW}Enter the Firebase project ID (default: ${DEFAULT_PROJECT_ID}):${NC}"
read -r input_project_id
PROJECT_ID=${input_project_id:-$DEFAULT_PROJECT_ID}

echo -e "${GREEN}Using project ID: ${PROJECT_ID}${NC}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}Error: firebase-tools is not installed. Run 'npm install -g firebase-tools'${NC}" >&2; exit 1; }
command -v dig >/dev/null 2>&1 || { echo -e "${RED}Error: dig is not installed. Install it using your package manager.${NC}" >&2; exit 1; }

# Check if gcloud is installed (optional)
GCLOUD_INSTALLED=true
command -v gcloud >/dev/null 2>&1 || {
  echo -e "${YELLOW}Warning: gcloud is not installed. Some features will be limited.${NC}" >&2
  echo -e "${YELLOW}You can install it from https://cloud.google.com/sdk/docs/install${NC}" >&2
  GCLOUD_INSTALLED=false
}

# Check if user is logged in to Firebase
firebase projects:list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"; firebase login; }

# Check if user is logged in to Google Cloud (if gcloud is installed)
if [ "$GCLOUD_INSTALLED" = true ]; then
  gcloud auth list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Google Cloud. Please log in:${NC}"; gcloud auth login; }
fi

echo -e "${BLUE}=== Fixing Domain Settings for ${DOMAIN} ===${NC}"

# Step 1: Check current DNS settings
echo -e "${BLUE}Step 1: Checking current DNS settings for ${DOMAIN}...${NC}"
echo -e "${YELLOW}Current DNS settings:${NC}"
dig +short ${DOMAIN} A
dig +short ${DOMAIN} CNAME
dig +short www.${DOMAIN} A
dig +short www.${DOMAIN} CNAME

# Step 2: Check if domain is connected to Firebase Hosting
echo -e "${BLUE}Step 2: Checking if domain is connected to Firebase Hosting...${NC}"
firebase hosting:sites:list --project ${PROJECT_ID} | grep -q ${DOMAIN}
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Domain ${DOMAIN} is connected to Firebase Hosting.${NC}"
else
  echo -e "${YELLOW}Domain ${DOMAIN} is not connected to Firebase Hosting. Connecting...${NC}"
  
  # Create a new site for the domain
  firebase hosting:sites:create ${DOMAIN} --project ${PROJECT_ID}
  
  echo -e "${GREEN}Site created for ${DOMAIN}.${NC}"
fi

# Step 3: Check if domain has SSL certificate
echo -e "${BLUE}Step 3: Checking if domain has SSL certificate...${NC}"
firebase hosting:sites:list --project ${PROJECT_ID} | grep -q "${DOMAIN}.*SSL: yes"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Domain ${DOMAIN} has SSL certificate.${NC}"
else
  echo -e "${YELLOW}Domain ${DOMAIN} does not have SSL certificate. Setting up...${NC}"
  
  # Set up SSL certificate
  firebase hosting:sites:update ${DOMAIN} --ssl auto --project ${PROJECT_ID}
  
  echo -e "${GREEN}SSL certificate set up for ${DOMAIN}.${NC}"
fi

# Step 4: Check if domain is set up in Google Cloud DNS (if gcloud is installed)
echo -e "${BLUE}Step 4: Checking if domain is set up in Google Cloud DNS...${NC}"
if [ "$GCLOUD_INSTALLED" = true ]; then
  gcloud dns managed-zones list --project ${PROJECT_ID} | grep -q ${DNS_ZONE_NAME}
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}DNS zone ${DNS_ZONE_NAME} exists.${NC}"
  else
    echo -e "${YELLOW}DNS zone ${DNS_ZONE_NAME} does not exist. Creating...${NC}"
    
    # Create DNS zone
    gcloud dns managed-zones create ${DNS_ZONE_NAME} \
      --dns-name=${DOMAIN}. \
      --description="DNS zone for ${DOMAIN}" \
      --project=${PROJECT_ID}
    
    echo -e "${GREEN}DNS zone ${DNS_ZONE_NAME} created.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping Google Cloud DNS setup as gcloud is not installed.${NC}"
  echo -e "${YELLOW}You will need to set up DNS manually.${NC}"
fi

# Step 5: Get Firebase Hosting IPs
echo -e "${BLUE}Step 5: Getting Firebase Hosting IPs...${NC}"
FIREBASE_IPS=("199.36.158.100")

# Step 6: Update DNS records
echo -e "${BLUE}Step 6: Updating DNS records...${NC}"
echo -e "${YELLOW}To update your DNS records at GoDaddy, follow these steps:${NC}"
echo -e "${YELLOW}1. Log in to your GoDaddy account${NC}"
echo -e "${YELLOW}2. Go to the Domain Manager${NC}"
echo -e "${YELLOW}3. Find ${DOMAIN} and click on 'DNS'${NC}"
echo -e "${YELLOW}4. Remove any existing A or CNAME records for @ and www${NC}"
echo -e "${YELLOW}5. Add the following A records:${NC}"

for ip in "${FIREBASE_IPS[@]}"; do
  echo -e "${YELLOW}   Host: @, Points to: ${ip}, TTL: 1 hour${NC}"
done

echo -e "${YELLOW}6. Add the following CNAME record:${NC}"
echo -e "${YELLOW}   Host: www, Points to: ${DOMAIN}, TTL: 1 hour${NC}"
echo -e "${YELLOW}7. Save changes${NC}"

echo -e "${YELLOW}Have you updated the DNS records at GoDaddy? (y/n)${NC}"
read -r dns_updated

if [[ "$dns_updated" != "y" && "$dns_updated" != "Y" ]]; then
  echo -e "${YELLOW}Please update the DNS records before continuing.${NC}"
  exit 1
fi

# Step 7: Deploy to the new site
echo -e "${BLUE}Step 7: Deploying to ${DOMAIN}...${NC}"
echo -e "${YELLOW}Do you want to deploy the current build to ${DOMAIN}? (y/n)${NC}"
read -r deploy_now

if [[ "$deploy_now" == "y" || "$deploy_now" == "Y" ]]; then
  # Check if build directory exists
  if [ -d "build" ]; then
    # Update firebase.json to include the new site
    echo -e "${BLUE}Updating firebase.json to include ${DOMAIN}...${NC}"
    
    # Check if jq is installed
    if command -v jq >/dev/null 2>&1; then
      # Create a temporary file
      TMP_FILE=$(mktemp)
      
      # Add the new site to firebase.json
      jq --arg domain "${DOMAIN}" '.hosting.customDomains += [{"domain": $domain, "ssl": true}]' firebase.json > ${TMP_FILE}
      mv ${TMP_FILE} firebase.json
      
      echo -e "${GREEN}firebase.json updated.${NC}"
    else
      echo -e "${YELLOW}jq is not installed. Please manually update firebase.json to include ${DOMAIN}.${NC}"
    fi
    
    # Deploy to the new site
    firebase deploy --only hosting:${DOMAIN} --project ${PROJECT_ID}
    
    echo -e "${GREEN}Deployed to ${DOMAIN}.${NC}"
  else
    echo -e "${YELLOW}Build directory not found. Please build the project first.${NC}"
    echo -e "${YELLOW}Run 'npm run build' and try again.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping deployment.${NC}"
fi

# Step 8: Verify domain settings
echo -e "${BLUE}Step 8: Verifying domain settings...${NC}"
echo -e "${YELLOW}It may take some time for DNS changes to propagate.${NC}"
echo -e "${YELLOW}To verify the domain settings, run:${NC}"
echo -e "${YELLOW}dig +short ${DOMAIN} A${NC}"
echo -e "${YELLOW}dig +short www.${DOMAIN} CNAME${NC}"
echo -e "${YELLOW}You should see the Firebase Hosting IPs for the A records and ${DOMAIN} for the CNAME record.${NC}"

echo -e "${GREEN}=== Domain Settings Fixed for ${DOMAIN} ===${NC}"
echo -e "${YELLOW}Note: It may take up to 24-48 hours for DNS changes to fully propagate.${NC}"
echo -e "${YELLOW}You can check the status of your domain at https://dnschecker.org/#A/${DOMAIN}${NC}"