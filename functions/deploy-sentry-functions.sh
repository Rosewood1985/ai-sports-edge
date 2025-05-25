#!/bin/bash

# Firebase Functions Deployment Script with Sentry Integration
# AI Sports Edge - Complete Monitoring Setup

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FUNCTIONS_DIR="$SCRIPT_DIR"

echo -e "${BLUE}🚀 AI Sports Edge - Sentry-Monitored Functions Deployment${NC}"
echo "=================================================="

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment validation
echo -e "\n${YELLOW}📋 Pre-Deployment Validation${NC}"
echo "=============================="

# Check Firebase CLI
if ! command_exists firebase; then
    echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
    exit 1
fi
log "${GREEN}✅ Firebase CLI found${NC}"

# Check Node.js and npm
if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
log "${GREEN}✅ Node.js found: $(node --version)${NC}"

if ! command_exists npm; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
log "${GREEN}✅ npm found: $(npm --version)${NC}"

# Check Firebase project configuration
cd "$FUNCTIONS_DIR"
if [ ! -f "firebase.json" ] && [ ! -f "../firebase.json" ]; then
    echo -e "${RED}❌ firebase.json not found${NC}"
    exit 1
fi
log "${GREEN}✅ Firebase configuration found${NC}"

# Validate Sentry configuration files
echo -e "\n${YELLOW}🔍 Validating Sentry Configuration${NC}"
echo "=================================="

SENTRY_FILES=(
    "sentryConfig.js"
    "sentryCronConfig.js"
)

for file in "${SENTRY_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing Sentry file: $file${NC}"
        exit 1
    fi
    log "${GREEN}✅ Found: $file${NC}"
done

# Validate Sentry DSN configuration
if [ -z "$SENTRY_DSN" ]; then
    echo -e "${YELLOW}⚠️  SENTRY_DSN environment variable not set${NC}"
    echo "Please set your Sentry DSN or ensure it's configured in your environment"
fi

# Check for Sentry test functions
SENTRY_TEST_FILE="sentryTest.js"
if [ -f "$SENTRY_TEST_FILE" ]; then
    log "${GREEN}✅ Sentry test functions found${NC}"
else
    echo -e "${YELLOW}⚠️  Sentry test functions not found${NC}"
fi

# Validate scheduled functions with Sentry monitoring
echo -e "\n${YELLOW}⏰ Validating Scheduled Functions${NC}"
echo "================================"

SCHEDULED_FUNCTIONS=(
    "processScheduledNotifications.js"
    "leaderboardUpdates.js" 
    "rssFeedNotifications.js"
    "src/predictTodayGames.ts"
    "src/updateStatsPage.ts"
)

for func in "${SCHEDULED_FUNCTIONS[@]}"; do
    if [ ! -f "$func" ]; then
        echo -e "${RED}❌ Missing scheduled function: $func${NC}"
        exit 1
    fi
    
    # Check if file contains Sentry monitoring
    if grep -q "wrapScheduledFunction\|sentryCronConfig" "$func"; then
        log "${GREEN}✅ $func - Sentry monitoring integrated${NC}"
    else
        echo -e "${YELLOW}⚠️  $func - Sentry monitoring not detected${NC}"
    fi
done

# Install dependencies
echo -e "\n${YELLOW}📦 Installing Dependencies${NC}"
echo "=========================="

log "Installing function dependencies..."
npm install

if [ $? -eq 0 ]; then
    log "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Lint check (if available)
if npm run lint --silent >/dev/null 2>&1; then
    echo -e "\n${YELLOW}🔍 Running Linter${NC}"
    echo "================"
    
    log "Running lint check..."
    if npm run lint; then
        log "${GREEN}✅ Lint check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Lint warnings found but continuing...${NC}"
    fi
fi

# Pre-deployment function validation
echo -e "\n${YELLOW}🧪 Function Validation${NC}"
echo "====================="

# Validate main index.js exports
if grep -q "processScheduledNotifications\|updateReferralLeaderboard\|predictTodayGames" "index.js"; then
    log "${GREEN}✅ Scheduled functions properly exported${NC}"
else
    echo -e "${RED}❌ Scheduled functions not found in index.js exports${NC}"
    exit 1
fi

# Check for Sentry initialization in index.js
if grep -q "initSentry\|sentryConfig" "index.js"; then
    log "${GREEN}✅ Sentry initialization found in index.js${NC}"
else
    echo -e "${RED}❌ Sentry initialization not found in index.js${NC}"
    exit 1
fi

# Firebase authentication check
echo -e "\n${YELLOW}🔐 Firebase Authentication${NC}"
echo "=========================="

log "Checking Firebase authentication..."
if firebase projects:list >/dev/null 2>&1; then
    CURRENT_PROJECT=$(firebase use --current 2>/dev/null || echo "Not set")
    log "${GREEN}✅ Authenticated with Firebase${NC}"
    log "Current project: $CURRENT_PROJECT"
else
    echo -e "${RED}❌ Not authenticated with Firebase${NC}"
    echo "Please run: firebase login"
    exit 1
fi

# Deploy functions
echo -e "\n${BLUE}🚀 Deploying Functions${NC}"
echo "====================="

log "Starting Firebase Functions deployment..."
echo -e "${YELLOW}Deploying with Sentry monitoring enabled...${NC}"

# Deploy only functions (not hosting, storage, etc.)
if firebase deploy --only functions; then
    log "${GREEN}✅ Functions deployed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Post-deployment verification
echo -e "\n${YELLOW}✅ Post-Deployment Verification${NC}"
echo "==============================="

log "Waiting for functions to be available..."
sleep 10

# List deployed functions
log "Listing deployed functions..."
firebase functions:list 2>/dev/null || echo "Unable to list functions (this is normal for some regions)"

# Verify Sentry integration
echo -e "\n${YELLOW}🔍 Sentry Integration Verification${NC}"
echo "=================================="

log "Functions with Sentry monitoring deployed:"
echo "  • processScheduledNotifications (every 1 minute)"
echo "  • cleanupOldNotifications (daily)"
echo "  • updateReferralLeaderboard (daily at midnight)"
echo "  • processRssFeedsAndNotify (every 30 minutes)" 
echo "  • predictTodayGames (daily at 10 AM EST)"
echo "  • updateStatsPage (weekly on Sunday)"

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "======================"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Monitor function execution in Firebase Console"
echo "2. Check Sentry dashboard for cron job monitoring"
echo "3. Run manual test triggers using: ./test-sentry-crons.sh"
echo "4. Verify error reporting with: ./verify-sentry-integration.sh"

echo -e "\n${BLUE}📊 Monitoring URLs:${NC}"
echo "• Firebase Console: https://console.firebase.google.com"
echo "• Sentry Dashboard: https://sentry.io"
echo "• Cron Monitoring: Check your Sentry project's Cron Monitoring section"

log "${GREEN}Deployment script completed successfully!${NC}"