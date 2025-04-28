#!/bin/bash

# Check API Keys Script
# This script checks if all necessary API keys are available in the environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
ENV_TEMPLATE=".env.template"
API_KEYS_FILE="./config/api-keys.json"

echo -e "${BLUE}=== Checking API Keys for Production Environment ===${NC}"

# Create API keys file if it doesn't exist
if [ ! -f "$API_KEYS_FILE" ]; then
  echo -e "${YELLOW}API keys configuration file not found. Creating template...${NC}"
  mkdir -p $(dirname "$API_KEYS_FILE")
  cat > "$API_KEYS_FILE" << EOF
{
  "required": [
    {
      "name": "FIREBASE_API_KEY",
      "description": "Firebase API key for authentication and other Firebase services",
      "link": "https://console.firebase.google.com/project/ai-sports-edge/settings/general/"
    },
    {
      "name": "STRIPE_API_KEY",
      "description": "Stripe API key for payment processing",
      "link": "https://dashboard.stripe.com/apikeys"
    },
    {
      "name": "STRIPE_WEBHOOK_SECRET",
      "description": "Stripe webhook secret for verifying webhook events",
      "link": "https://dashboard.stripe.com/webhooks"
    },
    {
      "name": "GOOGLE_MAPS_API_KEY",
      "description": "Google Maps API key for location services",
      "link": "https://console.cloud.google.com/apis/credentials"
    },
    {
      "name": "OPENWEATHER_API_KEY",
      "description": "OpenWeather API key for weather data",
      "link": "https://home.openweathermap.org/api_keys"
    }
  ],
  "optional": [
    {
      "name": "GOOGLE_ANALYTICS_ID",
      "description": "Google Analytics ID for tracking user behavior",
      "link": "https://analytics.google.com/analytics/web/"
    },
    {
      "name": "SENTRY_DSN",
      "description": "Sentry DSN for error tracking",
      "link": "https://sentry.io/settings/projects/"
    },
    {
      "name": "ALGOLIA_APP_ID",
      "description": "Algolia App ID for search functionality",
      "link": "https://www.algolia.com/apps/"
    },
    {
      "name": "ALGOLIA_API_KEY",
      "description": "Algolia API key for search functionality",
      "link": "https://www.algolia.com/apps/"
    }
  ]
}
EOF
  echo -e "${GREEN}API keys configuration template created at ${API_KEYS_FILE}${NC}"
  echo -e "${YELLOW}Please update the template with your actual API key requirements${NC}"
fi

# Load API keys configuration
if [ -f "$API_KEYS_FILE" ]; then
  REQUIRED_KEYS=$(jq -r '.required[].name' "$API_KEYS_FILE")
  OPTIONAL_KEYS=$(jq -r '.optional[].name' "$API_KEYS_FILE")
else
  echo -e "${RED}Error: API keys configuration file not found at ${API_KEYS_FILE}${NC}"
  exit 1
fi

# Check if .env file exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${BLUE}Found environment file: ${ENV_FILE}${NC}"
  # Load environment variables from .env file
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo -e "${YELLOW}Environment file ${ENV_FILE} not found. Checking environment variables directly.${NC}"
fi

# Create .env template if it doesn't exist
if [ ! -f "$ENV_TEMPLATE" ]; then
  echo -e "${YELLOW}Environment template file not found. Creating...${NC}"
  touch "$ENV_TEMPLATE"
  
  echo "# Production Environment Variables" > "$ENV_TEMPLATE"
  echo "# Generated on $(date)" >> "$ENV_TEMPLATE"
  echo "" >> "$ENV_TEMPLATE"
  
  echo "# Required API Keys" >> "$ENV_TEMPLATE"
  for key in $REQUIRED_KEYS; do
    description=$(jq -r ".required[] | select(.name == \"$key\") | .description" "$API_KEYS_FILE")
    link=$(jq -r ".required[] | select(.name == \"$key\") | .link" "$API_KEYS_FILE")
    echo "# $description" >> "$ENV_TEMPLATE"
    echo "# Get it from: $link" >> "$ENV_TEMPLATE"
    echo "$key=your-$key-here" >> "$ENV_TEMPLATE"
    echo "" >> "$ENV_TEMPLATE"
  done
  
  echo "# Optional API Keys" >> "$ENV_TEMPLATE"
  for key in $OPTIONAL_KEYS; do
    description=$(jq -r ".optional[] | select(.name == \"$key\") | .description" "$API_KEYS_FILE")
    link=$(jq -r ".optional[] | select(.name == \"$key\") | .link" "$API_KEYS_FILE")
    echo "# $description" >> "$ENV_TEMPLATE"
    echo "# Get it from: $link" >> "$ENV_TEMPLATE"
    echo "# $key=your-$key-here" >> "$ENV_TEMPLATE"
    echo "" >> "$ENV_TEMPLATE"
  done
  
  echo -e "${GREEN}Environment template file created at ${ENV_TEMPLATE}${NC}"
fi

# Check required API keys
echo -e "${BLUE}Checking required API keys...${NC}"
MISSING_REQUIRED=0
for key in $REQUIRED_KEYS; do
  if [ -z "${!key}" ]; then
    description=$(jq -r ".required[] | select(.name == \"$key\") | .description" "$API_KEYS_FILE")
    link=$(jq -r ".required[] | select(.name == \"$key\") | .link" "$API_KEYS_FILE")
    echo -e "${RED}✗ Missing required API key: ${key}${NC}"
    echo -e "${YELLOW}  Description: ${description}${NC}"
    echo -e "${YELLOW}  Get it from: ${link}${NC}"
    MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
  else
    echo -e "${GREEN}✓ Found required API key: ${key}${NC}"
  fi
done

# Check optional API keys
echo -e "${BLUE}Checking optional API keys...${NC}"
MISSING_OPTIONAL=0
for key in $OPTIONAL_KEYS; do
  if [ -z "${!key}" ]; then
    description=$(jq -r ".optional[] | select(.name == \"$key\") | .description" "$API_KEYS_FILE")
    link=$(jq -r ".optional[] | select(.name == \"$key\") | .link" "$API_KEYS_FILE")
    echo -e "${YELLOW}⚠ Missing optional API key: ${key}${NC}"
    echo -e "${YELLOW}  Description: ${description}${NC}"
    echo -e "${YELLOW}  Get it from: ${link}${NC}"
    MISSING_OPTIONAL=$((MISSING_OPTIONAL + 1))
  else
    echo -e "${GREEN}✓ Found optional API key: ${key}${NC}"
  fi
done

# Summary
echo -e "${BLUE}=== API Keys Summary ===${NC}"
if [ $MISSING_REQUIRED -eq 0 ]; then
  echo -e "${GREEN}✓ All required API keys are available${NC}"
else
  echo -e "${RED}✗ Missing ${MISSING_REQUIRED} required API keys${NC}"
fi

if [ $MISSING_OPTIONAL -eq 0 ]; then
  echo -e "${GREEN}✓ All optional API keys are available${NC}"
else
  echo -e "${YELLOW}⚠ Missing ${MISSING_OPTIONAL} optional API keys${NC}"
fi

# Instructions for missing keys
if [ $MISSING_REQUIRED -gt 0 ] || [ $MISSING_OPTIONAL -gt 0 ]; then
  echo -e "${BLUE}=== Instructions for Missing API Keys ===${NC}"
  echo -e "${YELLOW}1. Obtain the missing API keys from the links provided above${NC}"
  echo -e "${YELLOW}2. Add them to your ${ENV_FILE} file or set them as environment variables${NC}"
  echo -e "${YELLOW}3. Run this script again to verify all keys are available${NC}"
  
  if [ $MISSING_REQUIRED -gt 0 ]; then
    echo -e "${RED}WARNING: Missing required API keys will prevent the application from functioning correctly${NC}"
  fi
fi

# Exit with error if required keys are missing
if [ $MISSING_REQUIRED -gt 0 ]; then
  exit 1
fi

echo -e "${GREEN}=== API Keys Check Completed ===${NC}"