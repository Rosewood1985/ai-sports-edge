#!/bin/bash

# Script to switch from test to production payment API keys
# This script updates API keys in environment files and configuration

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
CONFIG_FILE="config/payment.json"
BACKUP_SUFFIX=".test-backup"

# Display script header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   Switch to Production Payment API Keys  ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Check if files exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found. Please run this script from the project root.${NC}"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: $CONFIG_FILE not found. Please check the file path.${NC}"
    exit 1
fi

# Create backups
echo -e "${YELLOW}Creating backups of configuration files...${NC}"
cp "$ENV_FILE" "$ENV_FILE$BACKUP_SUFFIX"
cp "$CONFIG_FILE" "$CONFIG_FILE$BACKUP_SUFFIX"

# Update .env file
echo -e "${YELLOW}Updating environment variables...${NC}"
# Replace test keys with production keys
sed -i.bak 's/STRIPE_TEST_PUBLISHABLE_KEY/STRIPE_PUBLISHABLE_KEY/g' "$ENV_FILE"
sed -i.bak 's/STRIPE_TEST_SECRET_KEY/STRIPE_SECRET_KEY/g' "$ENV_FILE"
sed -i.bak 's/PAYPAL_SANDBOX_CLIENT_ID/PAYPAL_CLIENT_ID/g' "$ENV_FILE"
sed -i.bak 's/PAYPAL_SANDBOX_SECRET/PAYPAL_SECRET/g' "$ENV_FILE"
sed -i.bak 's/PAYMENT_MODE=test/PAYMENT_MODE=production/g' "$ENV_FILE"

# Update config file
echo -e "${YELLOW}Updating payment configuration...${NC}"
# Use jq to update the JSON configuration if available
if command -v jq &> /dev/null; then
    jq '.paymentMode = "production" | 
        .stripe.useTestMode = false | 
        .paypal.useSandbox = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
else
    # Fallback to sed if jq is not available
    sed -i.bak 's/"paymentMode": "test"/"paymentMode": "production"/g' "$CONFIG_FILE"
    sed -i.bak 's/"useTestMode": true/"useTestMode": false/g' "$CONFIG_FILE"
    sed -i.bak 's/"useSandbox": true/"useSandbox": false/g' "$CONFIG_FILE"
fi

# Clean up backup files created by sed
rm -f "$ENV_FILE.bak"
rm -f "$CONFIG_FILE.bak"

# Verify changes
echo -e "${YELLOW}Verifying changes...${NC}"
if grep -q "PAYMENT_MODE=production" "$ENV_FILE" && grep -q '"paymentMode": "production"' "$CONFIG_FILE"; then
    echo -e "${GREEN}Configuration successfully updated to production mode!${NC}"
else
    echo -e "${RED}Verification failed. Please check the configuration files manually.${NC}"
    echo -e "${YELLOW}Restoring backups...${NC}"
    mv "$ENV_FILE$BACKUP_SUFFIX" "$ENV_FILE"
    mv "$CONFIG_FILE$BACKUP_SUFFIX" "$CONFIG_FILE"
    exit 1
fi

# Display warning about API keys
echo
echo -e "${RED}WARNING: The application is now configured to use PRODUCTION API keys.${NC}"
echo -e "${RED}Real transactions will be processed and real money will be charged.${NC}"
echo -e "${YELLOW}Make sure you have properly set up the following environment variables:${NC}"
echo -e "  - STRIPE_PUBLISHABLE_KEY"
echo -e "  - STRIPE_SECRET_KEY"
echo -e "  - PAYPAL_CLIENT_ID"
echo -e "  - PAYPAL_SECRET"
echo
echo -e "${YELLOW}To revert to test mode, run:${NC}"
echo -e "  mv $ENV_FILE$BACKUP_SUFFIX $ENV_FILE"
echo -e "  mv $CONFIG_FILE$BACKUP_SUFFIX $CONFIG_FILE"
echo

echo -e "${GREEN}Operation completed successfully!${NC}"