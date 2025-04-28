#!/bin/bash

# Configure Webhooks for Production Environment
# This script sets up webhooks for Firebase and other services

set -e

# Configuration
PROJECT_ID="ai-sports-edge"
CONFIG_DIR="./config"
WEBHOOKS_CONFIG="${CONFIG_DIR}/webhooks.json"
FIREBASE_FUNCTIONS_DIR="./functions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}Error: firebase-tools is not installed. Run 'npm install -g firebase-tools'${NC}" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is not installed. Install it using your package manager.${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is not installed. Install it using your package manager.${NC}" >&2; exit 1; }

# Check if user is logged in to Firebase
firebase projects:list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"; firebase login; }

echo -e "${BLUE}=== Configuring Webhooks for Production Environment ===${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"

# Create webhooks configuration file if it doesn't exist
if [ ! -f "$WEBHOOKS_CONFIG" ]; then
  echo -e "${YELLOW}Webhooks configuration file not found. Creating template...${NC}"
  mkdir -p $(dirname "$WEBHOOKS_CONFIG")
  cat > "$WEBHOOKS_CONFIG" << EOF
{
  "stripe": {
    "enabled": true,
    "events": [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed"
    ],
    "endpoint": "https://us-central1-ai-sports-edge.cloudfunctions.net/stripeWebhook",
    "secret": "whsec_your_stripe_webhook_secret_here"
  },
  "github": {
    "enabled": false,
    "events": [
      "push",
      "pull_request"
    ],
    "endpoint": "https://us-central1-ai-sports-edge.cloudfunctions.net/githubWebhook",
    "secret": "your_github_webhook_secret_here"
  },
  "firebase": {
    "auth": {
      "enabled": true,
      "events": [
        "user.create",
        "user.delete"
      ],
      "endpoint": "https://us-central1-ai-sports-edge.cloudfunctions.net/authWebhook"
    },
    "firestore": {
      "enabled": true,
      "collections": [
        {
          "name": "users",
          "events": [
            "create",
            "update",
            "delete"
          ]
        },
        {
          "name": "payments",
          "events": [
            "create"
          ]
        }
      ]
    }
  },
  "custom": [
    {
      "name": "data-export",
      "enabled": true,
      "endpoint": "https://us-central1-ai-sports-edge.cloudfunctions.net/dataExport",
      "schedule": "0 0 * * 0",
      "description": "Weekly data export"
    },
    {
      "name": "backup",
      "enabled": true,
      "endpoint": "https://us-central1-ai-sports-edge.cloudfunctions.net/backup",
      "schedule": "0 0 * * *",
      "description": "Daily backup"
    }
  ]
}
EOF
  echo -e "${GREEN}Webhooks configuration template created at ${WEBHOOKS_CONFIG}${NC}"
  echo -e "${YELLOW}Please update the template with your actual webhook configuration${NC}"
fi

# Ensure we're using the correct project
echo -e "${BLUE}Setting Firebase project to ${PROJECT_ID}...${NC}"
firebase use "$PROJECT_ID"

# Load webhooks configuration
if [ -f "$WEBHOOKS_CONFIG" ]; then
  echo -e "${BLUE}Loading webhooks configuration from ${WEBHOOKS_CONFIG}...${NC}"
else
  echo -e "${RED}Error: Webhooks configuration file not found at ${WEBHOOKS_CONFIG}${NC}"
  exit 1
fi

# Configure Stripe webhooks
if [ "$(jq -r '.stripe.enabled' "$WEBHOOKS_CONFIG")" == "true" ]; then
  echo -e "${BLUE}Configuring Stripe webhooks...${NC}"
  
  # Check if Stripe CLI is installed
  if command -v stripe >/dev/null 2>&1; then
    echo -e "${GREEN}Stripe CLI is installed${NC}"
    
    # Get Stripe webhook endpoint and events
    STRIPE_ENDPOINT=$(jq -r '.stripe.endpoint' "$WEBHOOKS_CONFIG")
    STRIPE_EVENTS=$(jq -r '.stripe.events | join(",")' "$WEBHOOKS_CONFIG")
    
    echo -e "${YELLOW}To create a Stripe webhook, run the following command:${NC}"
    echo -e "${YELLOW}stripe webhook create --connect --api-key=\$STRIPE_API_KEY --url=\"${STRIPE_ENDPOINT}\" --events=\"${STRIPE_EVENTS}\"${NC}"
    
    # Ask if user wants to create the webhook now
    echo -e "${YELLOW}Do you want to create the Stripe webhook now? (y/n)${NC}"
    read -r create_webhook
    
    if [[ "$create_webhook" == "y" || "$create_webhook" == "Y" ]]; then
      # Check if STRIPE_API_KEY is set
      if [ -z "$STRIPE_API_KEY" ]; then
        echo -e "${RED}Error: STRIPE_API_KEY environment variable is not set${NC}"
        echo -e "${YELLOW}Please set the STRIPE_API_KEY environment variable and try again${NC}"
      else
        # Create webhook
        echo -e "${BLUE}Creating Stripe webhook...${NC}"
        stripe webhook create --connect --api-key="$STRIPE_API_KEY" --url="$STRIPE_ENDPOINT" --events="$STRIPE_EVENTS"
        
        # Get webhook secret
        echo -e "${YELLOW}Please enter the webhook signing secret:${NC}"
        read -r webhook_secret
        
        # Update webhook secret in configuration
        jq --arg secret "$webhook_secret" '.stripe.secret = $secret' "$WEBHOOKS_CONFIG" > "${WEBHOOKS_CONFIG}.tmp" && mv "${WEBHOOKS_CONFIG}.tmp" "$WEBHOOKS_CONFIG"
        
        echo -e "${GREEN}Stripe webhook configured successfully${NC}"
      fi
    else
      echo -e "${YELLOW}Skipping Stripe webhook creation${NC}"
    fi
  else
    echo -e "${YELLOW}Stripe CLI is not installed. Please install it to create webhooks:${NC}"
    echo -e "${YELLOW}https://stripe.com/docs/stripe-cli${NC}"
  fi
else
  echo -e "${YELLOW}Stripe webhooks are disabled in configuration${NC}"
fi

# Configure GitHub webhooks
if [ "$(jq -r '.github.enabled' "$WEBHOOKS_CONFIG")" == "true" ]; then
  echo -e "${BLUE}Configuring GitHub webhooks...${NC}"
  
  # Get GitHub webhook endpoint and events
  GITHUB_ENDPOINT=$(jq -r '.github.endpoint' "$WEBHOOKS_CONFIG")
  GITHUB_EVENTS=$(jq -r '.github.events | join(",")' "$WEBHOOKS_CONFIG")
  
  echo -e "${YELLOW}To create a GitHub webhook, go to your repository settings and add a webhook with:${NC}"
  echo -e "${YELLOW}Payload URL: ${GITHUB_ENDPOINT}${NC}"
  echo -e "${YELLOW}Content type: application/json${NC}"
  echo -e "${YELLOW}Events: ${GITHUB_EVENTS}${NC}"
  
  echo -e "${YELLOW}Have you configured the GitHub webhook? (y/n)${NC}"
  read -r github_configured
  
  if [[ "$github_configured" == "y" || "$github_configured" == "Y" ]]; then
    echo -e "${GREEN}GitHub webhook configured successfully${NC}"
  else
    echo -e "${YELLOW}Please configure the GitHub webhook manually${NC}"
  fi
else
  echo -e "${YELLOW}GitHub webhooks are disabled in configuration${NC}"
fi

# Configure Firebase Auth webhooks
if [ "$(jq -r '.firebase.auth.enabled' "$WEBHOOKS_CONFIG")" == "true" ]; then
  echo -e "${BLUE}Configuring Firebase Auth webhooks...${NC}"
  
  # Check if functions directory exists
  if [ -d "$FIREBASE_FUNCTIONS_DIR" ]; then
    # Get Auth events
    AUTH_EVENTS=$(jq -r '.firebase.auth.events | join(", ")' "$WEBHOOKS_CONFIG")
    
    echo -e "${YELLOW}Firebase Auth webhooks are configured through Cloud Functions.${NC}"
    echo -e "${YELLOW}Make sure your functions/index.js includes handlers for these events: ${AUTH_EVENTS}${NC}"
    
    # Check if auth webhook function exists
    if grep -q "exports.authWebhook" "${FIREBASE_FUNCTIONS_DIR}/index.js" 2>/dev/null; then
      echo -e "${GREEN}Auth webhook function found in functions/index.js${NC}"
    else
      echo -e "${YELLOW}Auth webhook function not found in functions/index.js${NC}"
      echo -e "${YELLOW}Would you like to add a template auth webhook function? (y/n)${NC}"
      read -r add_auth_function
      
      if [[ "$add_auth_function" == "y" || "$add_auth_function" == "Y" ]]; then
        # Add auth webhook function template
        cat >> "${FIREBASE_FUNCTIONS_DIR}/index.js" << EOF

// Auth webhook function
exports.authWebhook = functions.auth.user().onCreate((user) => {
  console.log('User created:', user.uid);
  // Add your auth webhook logic here
  return null;
});
EOF
        echo -e "${GREEN}Auth webhook function template added to functions/index.js${NC}"
      fi
    fi
  else
    echo -e "${YELLOW}Firebase Functions directory not found at ${FIREBASE_FUNCTIONS_DIR}${NC}"
    echo -e "${YELLOW}Please create the functions directory and implement the auth webhook function${NC}"
  fi
else
  echo -e "${YELLOW}Firebase Auth webhooks are disabled in configuration${NC}"
fi

# Configure Firebase Firestore webhooks
if [ "$(jq -r '.firebase.firestore.enabled' "$WEBHOOKS_CONFIG")" == "true" ]; then
  echo -e "${BLUE}Configuring Firebase Firestore webhooks...${NC}"
  
  # Check if functions directory exists
  if [ -d "$FIREBASE_FUNCTIONS_DIR" ]; then
    # Get Firestore collections
    COLLECTIONS=$(jq -r '.firebase.firestore.collections | length' "$WEBHOOKS_CONFIG")
    
    echo -e "${YELLOW}Firebase Firestore webhooks are configured through Cloud Functions.${NC}"
    echo -e "${YELLOW}Configuring ${COLLECTIONS} collection webhooks...${NC}"
    
    # Loop through collections
    for i in $(seq 0 $((COLLECTIONS - 1))); do
      COLLECTION=$(jq -r ".firebase.firestore.collections[$i].name" "$WEBHOOKS_CONFIG")
      EVENTS=$(jq -r ".firebase.firestore.collections[$i].events | join(\", \")" "$WEBHOOKS_CONFIG")
      
      echo -e "${YELLOW}Collection: ${COLLECTION}, Events: ${EVENTS}${NC}"
      
      # Check if collection webhook functions exist
      FUNCTION_EXISTS=false
      if grep -q "exports.${COLLECTION}" "${FIREBASE_FUNCTIONS_DIR}/index.js" 2>/dev/null; then
        FUNCTION_EXISTS=true
        echo -e "${GREEN}${COLLECTION} webhook function found in functions/index.js${NC}"
      fi
      
      if [ "$FUNCTION_EXISTS" == "false" ]; then
        echo -e "${YELLOW}${COLLECTION} webhook function not found in functions/index.js${NC}"
        echo -e "${YELLOW}Would you like to add a template ${COLLECTION} webhook function? (y/n)${NC}"
        read -r add_collection_function
        
        if [[ "$add_collection_function" == "y" || "$add_collection_function" == "Y" ]]; then
          # Add collection webhook function template
          cat >> "${FIREBASE_FUNCTIONS_DIR}/index.js" << EOF

// ${COLLECTION} webhook function
exports.${COLLECTION}Webhook = functions.firestore
  .document('${COLLECTION}/{docId}')
  .onCreate((snap, context) => {
    const data = snap.data();
    console.log('${COLLECTION} created:', context.params.docId, data);
    // Add your ${COLLECTION} webhook logic here
    return null;
  });
EOF
          echo -e "${GREEN}${COLLECTION} webhook function template added to functions/index.js${NC}"
        fi
      fi
    done
  else
    echo -e "${YELLOW}Firebase Functions directory not found at ${FIREBASE_FUNCTIONS_DIR}${NC}"
    echo -e "${YELLOW}Please create the functions directory and implement the Firestore webhook functions${NC}"
  fi
else
  echo -e "${YELLOW}Firebase Firestore webhooks are disabled in configuration${NC}"
fi

# Configure custom webhooks
CUSTOM_WEBHOOKS=$(jq -r '.custom | length' "$WEBHOOKS_CONFIG")
if [ "$CUSTOM_WEBHOOKS" -gt 0 ]; then
  echo -e "${BLUE}Configuring custom webhooks...${NC}"
  
  # Loop through custom webhooks
  for i in $(seq 0 $((CUSTOM_WEBHOOKS - 1))); do
    WEBHOOK_NAME=$(jq -r ".custom[$i].name" "$WEBHOOKS_CONFIG")
    WEBHOOK_ENABLED=$(jq -r ".custom[$i].enabled" "$WEBHOOKS_CONFIG")
    WEBHOOK_ENDPOINT=$(jq -r ".custom[$i].endpoint" "$WEBHOOKS_CONFIG")
    WEBHOOK_SCHEDULE=$(jq -r ".custom[$i].schedule" "$WEBHOOKS_CONFIG")
    WEBHOOK_DESCRIPTION=$(jq -r ".custom[$i].description" "$WEBHOOKS_CONFIG")
    
    if [ "$WEBHOOK_ENABLED" == "true" ]; then
      echo -e "${YELLOW}Configuring custom webhook: ${WEBHOOK_NAME}${NC}"
      echo -e "${YELLOW}Endpoint: ${WEBHOOK_ENDPOINT}${NC}"
      echo -e "${YELLOW}Schedule: ${WEBHOOK_SCHEDULE}${NC}"
      echo -e "${YELLOW}Description: ${WEBHOOK_DESCRIPTION}${NC}"
      
      # Check if this is a scheduled webhook
      if [ -n "$WEBHOOK_SCHEDULE" ]; then
        echo -e "${YELLOW}This is a scheduled webhook. Setting up Cloud Scheduler...${NC}"
        
        # Check if gcloud is installed
        if command -v gcloud >/dev/null 2>&1; then
          echo -e "${GREEN}gcloud is installed${NC}"
          
          echo -e "${YELLOW}To create a Cloud Scheduler job, run:${NC}"
          echo -e "${YELLOW}gcloud scheduler jobs create http ${WEBHOOK_NAME} --schedule=\"${WEBHOOK_SCHEDULE}\" --uri=\"${WEBHOOK_ENDPOINT}\" --http-method=POST --project=${PROJECT_ID}${NC}"
          
          # Ask if user wants to create the job now
          echo -e "${YELLOW}Do you want to create the Cloud Scheduler job now? (y/n)${NC}"
          read -r create_job
          
          if [[ "$create_job" == "y" || "$create_job" == "Y" ]]; then
            # Create job
            echo -e "${BLUE}Creating Cloud Scheduler job...${NC}"
            gcloud scheduler jobs create http "$WEBHOOK_NAME" --schedule="$WEBHOOK_SCHEDULE" --uri="$WEBHOOK_ENDPOINT" --http-method=POST --project="$PROJECT_ID"
            
            echo -e "${GREEN}Cloud Scheduler job created successfully${NC}"
          else
            echo -e "${YELLOW}Skipping Cloud Scheduler job creation${NC}"
          fi
        else
          echo -e "${YELLOW}gcloud is not installed. Please install it to create Cloud Scheduler jobs:${NC}"
          echo -e "${YELLOW}https://cloud.google.com/sdk/docs/install${NC}"
        fi
      else
        echo -e "${YELLOW}This is a manual webhook. No additional configuration needed.${NC}"
      fi
    else
      echo -e "${YELLOW}Custom webhook ${WEBHOOK_NAME} is disabled in configuration${NC}"
    fi
  done
else
  echo -e "${YELLOW}No custom webhooks configured${NC}"
fi

echo -e "${GREEN}=== Webhooks Configuration Completed ===${NC}"
echo -e "${YELLOW}Note: Some webhooks may require additional configuration in their respective services${NC}"