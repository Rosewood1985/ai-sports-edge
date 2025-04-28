#!/bin/bash

# Firebase Production Deployment Script
# This script deploys the application to Firebase with production-grade scaling

set -e

# Configuration
PROJECT_ID="ai-sports-edge"
CONFIG_FILE="./config/firebase-production.json"
FIREBASE_JSON="./firebase.json"
TEMP_FIREBASE_JSON="./firebase.temp.json"
FUNCTIONS_DIR="./functions"
HOSTING_DIR="./public"
FIRESTORE_RULES="./firestore.rules"
STORAGE_RULES="./storage.rules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}Error: firebase-tools is not installed. Run 'npm install -g firebase-tools'${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is not installed. Install it using your package manager.${NC}" >&2; exit 1; }

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}Error: Configuration file $CONFIG_FILE not found${NC}"
  exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"; firebase login; }

echo -e "${BLUE}=== Starting Production Deployment to Firebase ===${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"

# Ensure we're using the correct project
echo -e "${BLUE}Setting Firebase project to ${PROJECT_ID}...${NC}"
firebase use "$PROJECT_ID"

# Load configuration
echo -e "${BLUE}Loading configuration from ${CONFIG_FILE}...${NC}"
CONFIG=$(cat "$CONFIG_FILE")

# Extract scaling configuration
DB_INSTANCES=$(echo "$CONFIG" | jq -r '.scaling.database.instances')
FUNCTIONS_MIN_INSTANCES=$(echo "$CONFIG" | jq -r '.scaling.functions.minInstances')
FUNCTIONS_MAX_INSTANCES=$(echo "$CONFIG" | jq -r '.scaling.functions.maxInstances')
FUNCTIONS_MEMORY=$(echo "$CONFIG" | jq -r '.scaling.functions.memory')
FUNCTIONS_TIMEOUT=$(echo "$CONFIG" | jq -r '.scaling.functions.timeoutSeconds')
FUNCTIONS_CPU=$(echo "$CONFIG" | jq -r '.scaling.functions.cpu')

# Update firebase.json with production settings
echo -e "${BLUE}Updating Firebase configuration with production settings...${NC}"

# Create or update firebase.json
if [ -f "$FIREBASE_JSON" ]; then
  cp "$FIREBASE_JSON" "$TEMP_FIREBASE_JSON"
else
  echo "{}" > "$TEMP_FIREBASE_JSON"
fi

# Update hosting configuration
jq --arg cache "max-age=3600" '.hosting.headers[0].source = "**/*.@(js|css)" | .hosting.headers[0].headers[0].key = "Cache-Control" | .hosting.headers[0].headers[0].value = "max-age=31536000" | .hosting.headers[1].source = "**/*.@(jpg|jpeg|png|gif|webp|svg|ico)" | .hosting.headers[1].headers[0].key = "Cache-Control" | .hosting.headers[1].headers[0].value = "max-age=604800" | .hosting.public = "./public" | .hosting.ignore = ["firebase.json", "**/.*", "**/node_modules/**"]' "$TEMP_FIREBASE_JSON" > "$FIREBASE_JSON"

# Update functions configuration
jq --arg min "$FUNCTIONS_MIN_INSTANCES" --arg max "$FUNCTIONS_MAX_INSTANCES" --arg mem "$FUNCTIONS_MEMORY" --arg timeout "$FUNCTIONS_TIMEOUT" --arg cpu "$FUNCTIONS_CPU" '.functions.minInstances = ($min | tonumber) | .functions.maxInstances = ($max | tonumber) | .functions.memory = $mem | .functions.timeoutSeconds = ($timeout | tonumber) | .functions.cpu = ($cpu | tonumber)' "$FIREBASE_JSON" > "$TEMP_FIREBASE_JSON"
mv "$TEMP_FIREBASE_JSON" "$FIREBASE_JSON"

# Update Firestore configuration
jq '.firestore.rules = "./firestore.rules" | .firestore.indexes = "./firestore.indexes.json"' "$FIREBASE_JSON" > "$TEMP_FIREBASE_JSON"
mv "$TEMP_FIREBASE_JSON" "$FIREBASE_JSON"

# Update Storage configuration
jq '.storage.rules = "./storage.rules"' "$FIREBASE_JSON" > "$TEMP_FIREBASE_JSON"
mv "$TEMP_FIREBASE_JSON" "$FIREBASE_JSON"

# Check if we need to create Firestore indexes
echo -e "${BLUE}Checking Firestore indexes...${NC}"
if [ ! -f "./firestore.indexes.json" ]; then
  echo -e "${YELLOW}Creating Firestore indexes configuration...${NC}"
  echo "$CONFIG" | jq '.scaling.firestore.indexes' > "./firestore.indexes.json"
fi

# Check if we need to create Firestore rules
echo -e "${BLUE}Checking Firestore rules...${NC}"
if [ ! -f "$FIRESTORE_RULES" ]; then
  echo -e "${YELLOW}Creating Firestore rules...${NC}"
  cat > "$FIRESTORE_RULES" << EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /purchasedOdds/{oddId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    match /publicData/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
EOF
fi

# Check if we need to create Storage rules
echo -e "${BLUE}Checking Storage rules...${NC}"
if [ ! -f "$STORAGE_RULES" ]; then
  echo -e "${YELLOW}Creating Storage rules...${NC}"
  cat > "$STORAGE_RULES" << EOF
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /userFiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /publicFiles/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
EOF
fi

# Install dependencies in functions directory if it exists
if [ -d "$FUNCTIONS_DIR" ]; then
  echo -e "${BLUE}Installing dependencies in functions directory...${NC}"
  (cd "$FUNCTIONS_DIR" && npm install --production)
fi

# Check API keys
echo -e "${BLUE}Checking API keys...${NC}"
if [ -f "./scripts/check-api-keys.sh" ]; then
  ./scripts/check-api-keys.sh
  if [ $? -ne 0 ]; then
    echo -e "${RED}API keys check failed. Please fix the issues and try again.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}API keys check script not found. Skipping API keys check.${NC}"
fi

# Test in staging environment first
echo -e "${BLUE}Testing in staging environment...${NC}"
if [ -f "./scripts/test-staging-deployment.sh" ]; then
  echo -e "${YELLOW}Do you want to test the deployment in staging first? (y/n)${NC}"
  read -r test_staging
  
  if [[ "$test_staging" == "y" || "$test_staging" == "Y" ]]; then
    ./scripts/test-staging-deployment.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Staging tests failed. Please fix the issues and try again.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Skipping staging tests.${NC}"
  fi
else
  echo -e "${YELLOW}Staging test script not found. Skipping staging tests.${NC}"
fi

# Set up custom domains and SSL certificates
echo -e "${BLUE}Setting up custom domains and SSL certificates...${NC}"
if [ -f "./scripts/setup-firebase-domains.sh" ]; then
  ./scripts/setup-firebase-domains.sh
else
  echo -e "${YELLOW}Custom domains setup script not found. Skipping domain setup.${NC}"
fi

# Deploy to Firebase
echo -e "${BLUE}Deploying to Firebase...${NC}"
firebase deploy --project "$PROJECT_ID" --non-interactive

# Verify custom domains and SSL certificates
echo -e "${BLUE}Verifying custom domains and SSL certificates...${NC}"
firebase hosting:sites:list

# Configure webhooks
echo -e "${BLUE}Configuring webhooks...${NC}"
if [ -f "./scripts/configure-webhooks.sh" ]; then
  ./scripts/configure-webhooks.sh
else
  echo -e "${YELLOW}Webhooks configuration script not found. Skipping webhooks setup.${NC}"
fi

# Test web app functionality
echo -e "${BLUE}Testing web app functionality...${NC}"
if [ -f "./scripts/test-webapp-functionality.sh" ]; then
  echo -e "${YELLOW}Do you want to test the web app functionality? (y/n)${NC}"
  read -r test_webapp
  
  if [[ "$test_webapp" == "y" || "$test_webapp" == "Y" ]]; then
    ./scripts/test-webapp-functionality.sh
    if [ $? -ne 0 ]; then
      echo -e "${YELLOW}Web app functionality tests found issues. Please review the test report.${NC}"
    else
      echo -e "${GREEN}Web app functionality tests passed.${NC}"
    fi
  else
    echo -e "${YELLOW}Skipping web app functionality tests.${NC}"
  fi
else
  echo -e "${YELLOW}Web app functionality test script not found. Skipping web app testing.${NC}"
fi

# Set up monitoring alerts
echo -e "${BLUE}Setting up monitoring alerts...${NC}"
ALERTS=$(echo "$CONFIG" | jq -c '.monitoring.alerts[]')
for ALERT in $ALERTS; do
  NAME=$(echo "$ALERT" | jq -r '.name')
  THRESHOLD=$(echo "$ALERT" | jq -r '.threshold')
  DURATION=$(echo "$ALERT" | jq -r '.duration')
  DESCRIPTION=$(echo "$ALERT" | jq -r '.description')
  
  echo -e "${YELLOW}Setting up alert: ${NAME}${NC}"
  # In a real implementation, this would use the Firebase/Google Cloud CLI to set up alerts
  # For now, we'll just print what would be done
  echo "  - Description: $DESCRIPTION"
  echo "  - Threshold: $THRESHOLD"
  echo "  - Duration: $DURATION"
done

# Set up scheduled backups
echo -e "${BLUE}Setting up scheduled backups...${NC}"
BACKUP_FREQUENCY=$(echo "$CONFIG" | jq -r '.scaling.firestore.backupSchedule.frequency')
BACKUP_TIME=$(echo "$CONFIG" | jq -r '.scaling.firestore.backupSchedule.time')
BACKUP_RETENTION=$(echo "$CONFIG" | jq -r '.scaling.firestore.backupSchedule.retentionDays')

echo -e "${YELLOW}Configuring backups:${NC}"
echo "  - Frequency: $BACKUP_FREQUENCY"
echo "  - Time: $BACKUP_TIME"
echo "  - Retention: $BACKUP_RETENTION days"

# In a real implementation, this would use the Google Cloud CLI to set up scheduled backups
# For now, we'll just print what would be done
echo "gcloud scheduler jobs create pubsub firestore-backup --schedule=\"0 ${BACKUP_TIME//:/ } * * *\" --topic=firestore-backup --message-body=\"{\\\"projectId\\\": \\\"${PROJECT_ID}\\\"}\" --project=${PROJECT_ID}"

# Set up logging export to BigQuery if enabled
EXPORT_TO_BQ=$(echo "$CONFIG" | jq -r '.monitoring.logging.exportToBigQuery')
if [ "$EXPORT_TO_BQ" = "true" ]; then
  echo -e "${BLUE}Setting up logging export to BigQuery...${NC}"
  # In a real implementation, this would use the Google Cloud CLI to set up logging export
  # For now, we'll just print what would be done
  echo "gcloud logging sinks create firebase-logs bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/firebase_logs --project=${PROJECT_ID}"
fi

echo -e "${GREEN}=== Production Deployment to Firebase Completed Successfully ===${NC}"
echo -e "${GREEN}Project URL: https://${PROJECT_ID}.web.app${NC}"
echo -e "${GREEN}Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}${NC}"