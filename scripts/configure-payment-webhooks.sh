#!/bin/bash

# Script to configure production webhooks for payment events
# This script sets up webhooks for Stripe and PayPal payment events

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="config/webhooks.json"
STRIPE_CLI="stripe"
PRODUCTION_URL="https://api.aisportsedge.app"
WEBHOOK_SECRET_FILE=".webhook-secrets"

# Display script header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   Configure Production Payment Webhooks  ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Configuration file not found. Creating a new one...${NC}"
    mkdir -p $(dirname "$CONFIG_FILE")
    echo '{
  "stripe": {
    "enabled": false,
    "endpoint": "",
    "secret": "",
    "events": []
  },
  "paypal": {
    "enabled": false,
    "endpoint": "",
    "clientId": "",
    "secret": "",
    "events": []
  }
}' > "$CONFIG_FILE"
fi

# Check for required tools
echo -e "${YELLOW}Checking for required tools...${NC}"

# Check for curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed. Please install curl and try again.${NC}"
    exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq and try again.${NC}"
    exit 1
fi

# Check for Stripe CLI (optional)
STRIPE_CLI_AVAILABLE=false
if command -v "$STRIPE_CLI" &> /dev/null; then
    STRIPE_CLI_AVAILABLE=true
    echo -e "${GREEN}Stripe CLI found. Will use it for webhook configuration.${NC}"
else
    echo -e "${YELLOW}Stripe CLI not found. Will use manual configuration steps.${NC}"
fi

# Function to configure Stripe webhooks
configure_stripe_webhooks() {
    echo -e "${YELLOW}Configuring Stripe webhooks...${NC}"
    
    # Get Stripe API key
    read -p "Enter your Stripe Secret Key: " STRIPE_SECRET_KEY
    
    # Define webhook endpoint
    STRIPE_WEBHOOK_ENDPOINT="$PRODUCTION_URL/api/webhooks/stripe"
    
    # Define events to listen for
    STRIPE_EVENTS=(
        "payment_intent.succeeded"
        "payment_intent.payment_failed"
        "checkout.session.completed"
        "customer.subscription.created"
        "customer.subscription.updated"
        "customer.subscription.deleted"
        "invoice.payment_succeeded"
        "invoice.payment_failed"
        "charge.refunded"
    )
    
    # Create webhook using Stripe CLI if available
    if [ "$STRIPE_CLI_AVAILABLE" = true ]; then
        echo -e "${YELLOW}Creating webhook using Stripe CLI...${NC}"
        
        # Build events string for CLI
        EVENTS_STRING=""
        for event in "${STRIPE_EVENTS[@]}"; do
            EVENTS_STRING="$EVENTS_STRING --events $event"
        done
        
        # Create webhook
        WEBHOOK_RESULT=$($STRIPE_CLI webhook create --api-key "$STRIPE_SECRET_KEY" \
            --url "$STRIPE_WEBHOOK_ENDPOINT" \
            $EVENTS_STRING \
            --format json)
        
        # Extract webhook secret
        WEBHOOK_SECRET=$(echo "$WEBHOOK_RESULT" | jq -r '.secret')
        
        if [ -n "$WEBHOOK_SECRET" ] && [ "$WEBHOOK_SECRET" != "null" ]; then
            echo -e "${GREEN}Webhook created successfully!${NC}"
        else
            echo -e "${RED}Failed to create webhook. Please check the Stripe CLI output.${NC}"
            echo "$WEBHOOK_RESULT"
            return 1
        fi
    else
        # Manual configuration steps
        echo -e "${YELLOW}Please follow these steps to configure Stripe webhooks manually:${NC}"
        echo -e "1. Go to https://dashboard.stripe.com/webhooks"
        echo -e "2. Click 'Add endpoint'"
        echo -e "3. Enter the following URL: ${GREEN}$STRIPE_WEBHOOK_ENDPOINT${NC}"
        echo -e "4. Select the following events:"
        for event in "${STRIPE_EVENTS[@]}"; do
            echo -e "   - $event"
        done
        echo -e "5. Click 'Add endpoint'"
        echo -e "6. Copy the 'Signing secret' from the webhook details page"
        
        # Get webhook secret from user
        read -p "Enter the Webhook Signing Secret: " WEBHOOK_SECRET
    fi
    
    # Update configuration file
    echo -e "${YELLOW}Updating webhook configuration...${NC}"
    EVENTS_JSON=$(printf '%s\n' "${STRIPE_EVENTS[@]}" | jq -R . | jq -s .)
    jq ".stripe.enabled = true | 
        .stripe.endpoint = \"$STRIPE_WEBHOOK_ENDPOINT\" | 
        .stripe.secret = \"$WEBHOOK_SECRET\" | 
        .stripe.events = $EVENTS_JSON" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    
    # Save webhook secret to a separate file for security
    echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" > "$WEBHOOK_SECRET_FILE"
    chmod 600 "$WEBHOOK_SECRET_FILE"
    
    echo -e "${GREEN}Stripe webhook configuration completed!${NC}"
}

# Function to configure PayPal webhooks
configure_paypal_webhooks() {
    echo -e "${YELLOW}Configuring PayPal webhooks...${NC}"
    
    # Get PayPal credentials
    read -p "Enter your PayPal Client ID: " PAYPAL_CLIENT_ID
    read -p "Enter your PayPal Secret: " PAYPAL_SECRET
    
    # Define webhook endpoint
    PAYPAL_WEBHOOK_ENDPOINT="$PRODUCTION_URL/api/webhooks/paypal"
    
    # Define events to listen for
    PAYPAL_EVENTS=(
        "PAYMENT.CAPTURE.COMPLETED"
        "PAYMENT.CAPTURE.DENIED"
        "PAYMENT.CAPTURE.REFUNDED"
        "BILLING.SUBSCRIPTION.CREATED"
        "BILLING.SUBSCRIPTION.UPDATED"
        "BILLING.SUBSCRIPTION.CANCELLED"
        "BILLING.SUBSCRIPTION.SUSPENDED"
        "PAYMENT.SALE.COMPLETED"
        "PAYMENT.SALE.REFUNDED"
    )
    
    # Get OAuth token
    echo -e "${YELLOW}Getting PayPal OAuth token...${NC}"
    TOKEN_RESPONSE=$(curl -s -X POST \
        "https://api-m.paypal.com/v1/oauth2/token" \
        -H "Accept: application/json" \
        -H "Accept-Language: en_US" \
        -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
        -d "grant_type=client_credentials")
    
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
    
    if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
        echo -e "${RED}Failed to get PayPal OAuth token. Please check your credentials.${NC}"
        echo "$TOKEN_RESPONSE"
        return 1
    fi
    
    # Create webhook
    echo -e "${YELLOW}Creating PayPal webhook...${NC}"
    
    # Build events array for API request
    EVENTS_JSON="["
    for i in "${!PAYPAL_EVENTS[@]}"; do
        EVENTS_JSON+="{ \"name\": \"${PAYPAL_EVENTS[$i]}\" }"
        if [ $i -lt $((${#PAYPAL_EVENTS[@]} - 1)) ]; then
            EVENTS_JSON+=", "
        fi
    done
    EVENTS_JSON+="]"
    
    # Create webhook
    WEBHOOK_RESPONSE=$(curl -s -X POST \
        "https://api-m.paypal.com/v1/notifications/webhooks" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "{
            \"url\": \"$PAYPAL_WEBHOOK_ENDPOINT\",
            \"event_types\": $EVENTS_JSON
        }")
    
    WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id')
    
    if [ -z "$WEBHOOK_ID" ] || [ "$WEBHOOK_ID" = "null" ]; then
        echo -e "${RED}Failed to create PayPal webhook. Please check the API response.${NC}"
        echo "$WEBHOOK_RESPONSE"
        return 1
    fi
    
    # Update configuration file
    echo -e "${YELLOW}Updating webhook configuration...${NC}"
    EVENTS_JSON=$(printf '%s\n' "${PAYPAL_EVENTS[@]}" | jq -R . | jq -s .)
    jq ".paypal.enabled = true | 
        .paypal.endpoint = \"$PAYPAL_WEBHOOK_ENDPOINT\" | 
        .paypal.clientId = \"$PAYPAL_CLIENT_ID\" | 
        .paypal.secret = \"$PAYPAL_SECRET\" | 
        .paypal.webhookId = \"$WEBHOOK_ID\" | 
        .paypal.events = $EVENTS_JSON" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    
    # Save webhook ID to a separate file for security
    echo "PAYPAL_WEBHOOK_ID=$WEBHOOK_ID" >> "$WEBHOOK_SECRET_FILE"
    
    echo -e "${GREEN}PayPal webhook configuration completed!${NC}"
}

# Main menu
while true; do
    echo
    echo -e "${YELLOW}Payment Webhook Configuration Menu:${NC}"
    echo -e "1. Configure Stripe webhooks"
    echo -e "2. Configure PayPal webhooks"
    echo -e "3. Configure both"
    echo -e "4. Exit"
    echo
    read -p "Select an option (1-4): " OPTION
    
    case $OPTION in
        1)
            configure_stripe_webhooks
            ;;
        2)
            configure_paypal_webhooks
            ;;
        3)
            configure_stripe_webhooks
            configure_paypal_webhooks
            ;;
        4)
            echo -e "${GREEN}Webhook configuration completed!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
done