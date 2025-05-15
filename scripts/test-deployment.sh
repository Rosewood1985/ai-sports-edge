#!/bin/bash
#
# AI Sports Edge - Test Deployment Script
# This script deploys the project to a Firebase preview channel for testing.

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

# Exit on error
set -e

# Configuration
SITE_NAME="aisportsedge-app"
PROJECT_ID="ai-sports-edge-final"
DIST_DIR="dist"
TEMP_DIR="temp-deploy"
CHANNEL_ID="preview-$(date +%Y%m%d-%H%M%S)"
EXPIRATION="7d"

# Parse command line arguments
PREVIEW_MODE=false
CHANNEL_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --preview)
      PREVIEW_MODE=true
      shift
      ;;
    --channel)
      CHANNEL_NAME="$2"
      shift 2
      ;;
    --expiration)
      EXPIRATION="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --preview              Deploy to a preview channel (default: false)"
      echo "  --channel CHANNEL_NAME Use a specific channel name instead of auto-generated"
      echo "  --expiration DURATION  Set expiration time (default: 7d)"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# If channel name is provided, use it
if [ -n "$CHANNEL_NAME" ]; then
  CHANNEL_ID="$CHANNEL_NAME"
fi

# Print header
echo "=========================================="
echo "  AI Sports Edge - Test Deployment"
echo "=========================================="
echo "Site: $SITE_NAME"
echo "Project: $PROJECT_ID"
if [ "$PREVIEW_MODE" = true ]; then
  echo "Mode: Preview Channel ($CHANNEL_ID)"
  echo "Expiration: $EXPIRATION"
else
  echo "Mode: Live Channel"
fi
echo "Started at: $(date)"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
echo "Checking Firebase login status..."
firebase login:list &> /dev/null || {
    echo "You are not logged in to Firebase. Please log in."
    firebase login
}

# Clean up old deployment files
echo "Cleaning up old deployment files..."
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Run integration script
echo "Running integration script to consolidate design files..."
node scripts/integrate_existing_design.js

# Update Firebase configuration
echo "Updating Firebase configuration..."
node scripts/update_firebase_config.js

# Verify Firebase project
echo "Verifying Firebase project..."
firebase use $PROJECT_ID || {
    echo "Setting up Firebase project..."
    firebase use --add $PROJECT_ID
}

# Set up hosting target
echo "Setting up hosting target..."
firebase target:apply hosting $SITE_NAME $SITE_NAME || {
    echo "Warning: Could not set hosting target. This may be normal if it's already set."
}

# Deploy to Firebase
if [ "$PREVIEW_MODE" = true ]; then
    echo "Deploying to Firebase Preview Channel: $CHANNEL_ID..."
    firebase hosting:channel:deploy $CHANNEL_ID --expires $EXPIRATION
else
    echo "Deploying to Firebase Live Channel..."
    firebase deploy --only hosting:$SITE_NAME
fi

# Verify deployment
echo "Verifying deployment..."
echo "Waiting for deployment to propagate..."
sleep 10

# Get the deployed URL
if [ "$PREVIEW_MODE" = true ]; then
    # Extract the preview URL from Firebase output
    PREVIEW_URL=$(firebase hosting:channel:list | grep "$CHANNEL_ID" | grep -o 'https://[^ ]*')
    
    if [ -n "$PREVIEW_URL" ]; then
        echo "Preview URL: $PREVIEW_URL"
        
        # Try to open the URL in a browser
        if command -v open &> /dev/null; then
            open "$PREVIEW_URL"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$PREVIEW_URL"
        elif command -v start &> /dev/null; then
            start "$PREVIEW_URL"
        else
            echo "Could not open URL automatically. Please visit: $PREVIEW_URL"
        fi
    else
        echo "Could not determine preview URL. Check Firebase console."
    fi
else
    echo "Deployment URL: https://$SITE_NAME.web.app"
    
    # Try to access the site
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$SITE_NAME.web.app || echo "Failed")
        echo "HTTP Status: $HTTP_STATUS"
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "Deployment successful! Site is accessible."
        else
            echo "Warning: Site returned status $HTTP_STATUS. It may still be propagating."
        fi
    else
        echo "curl not found. Skipping site accessibility check."
    fi
fi

# Clean up
echo "Cleaning up temporary files..."
rm -rf $TEMP_DIR

# Print completion message
echo "=========================================="
echo "  Test Deployment completed!"
echo "=========================================="
if [ "$PREVIEW_MODE" = true ]; then
    echo "Preview URL: $PREVIEW_URL"
    echo "Channel ID: $CHANNEL_ID"
    echo "Expiration: $EXPIRATION"
else
    echo "Site URL: https://$SITE_NAME.web.app"
    echo "Custom Domain: https://aisportsedge.app"
fi
echo "Completed at: $(date)"
echo "=========================================="

# Provide next steps
echo "Next steps:"
if [ "$PREVIEW_MODE" = true ]; then
    echo "1. Test your site at $PREVIEW_URL"
    echo "2. Share the preview URL with your team for testing"
    echo "3. When ready, deploy to production with: ./scripts/deploy-to-firebase.sh"
else
    echo "1. Verify your site at https://$SITE_NAME.web.app"
    echo "2. Check your custom domain at https://aisportsedge.app"
fi
echo "=========================================="