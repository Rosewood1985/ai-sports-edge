#!/bin/bash

# Test Firebase Deployment in Staging Environment
# This script tests the Firebase deployment in a staging environment before production

set -e

# Configuration
STAGING_PROJECT_ID="ai-sports-edge-staging"
PRODUCTION_PROJECT_ID="ai-sports-edge"
CONFIG_DIR="./config"
FIREBASE_CONFIG="./firebase.json"
TEST_RESULTS_DIR="./test-results"
TEST_REPORT="${TEST_RESULTS_DIR}/staging-test-report.txt"

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

echo -e "${BLUE}=== Testing Firebase Deployment in Staging Environment ===${NC}"
echo -e "${BLUE}Staging Project: ${STAGING_PROJECT_ID}${NC}"

# Create test results directory if it doesn't exist
mkdir -p "$TEST_RESULTS_DIR"

# Initialize test report
echo "Firebase Staging Deployment Test Report" > "$TEST_REPORT"
echo "Date: $(date)" >> "$TEST_REPORT"
echo "Staging Project: ${STAGING_PROJECT_ID}" >> "$TEST_REPORT"
echo "Production Project: ${PRODUCTION_PROJECT_ID}" >> "$TEST_REPORT"
echo "----------------------------------------" >> "$TEST_REPORT"

# Ensure we're using the staging project
echo -e "${BLUE}Setting Firebase project to ${STAGING_PROJECT_ID}...${NC}"
firebase use "$STAGING_PROJECT_ID"

# Check for necessary API keys in environment
echo -e "${BLUE}Checking for necessary API keys in environment...${NC}"
echo "Checking API Keys:" >> "$TEST_REPORT"

# List of required API keys
REQUIRED_KEYS=(
  "FIREBASE_API_KEY"
  "STRIPE_API_KEY"
  "GOOGLE_MAPS_API_KEY"
  "OPENWEATHER_API_KEY"
)

MISSING_KEYS=0
for key in "${REQUIRED_KEYS[@]}"; do
  if [ -z "${!key}" ]; then
    echo -e "${YELLOW}Warning: ${key} is not set in the environment${NC}"
    echo "✗ ${key}: Not found" >> "$TEST_REPORT"
    MISSING_KEYS=$((MISSING_KEYS + 1))
  else
    echo -e "${GREEN}${key} is set in the environment${NC}"
    echo "✓ ${key}: Found" >> "$TEST_REPORT"
  fi
done

if [ $MISSING_KEYS -gt 0 ]; then
  echo -e "${YELLOW}Warning: ${MISSING_KEYS} required API keys are missing. Some functionality may not work correctly.${NC}"
  echo "Warning: ${MISSING_KEYS} required API keys are missing." >> "$TEST_REPORT"
else
  echo -e "${GREEN}All required API keys are set in the environment.${NC}"
  echo "All required API keys are set in the environment." >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Deploy to staging environment
echo -e "${BLUE}Deploying to staging environment...${NC}"
echo "Deployment to Staging:" >> "$TEST_REPORT"

DEPLOY_START_TIME=$(date +%s)
if firebase deploy --project "$STAGING_PROJECT_ID" --non-interactive; then
  DEPLOY_END_TIME=$(date +%s)
  DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))
  echo -e "${GREEN}Deployment to staging successful (${DEPLOY_DURATION} seconds)${NC}"
  echo "✓ Deployment successful (${DEPLOY_DURATION} seconds)" >> "$TEST_REPORT"
else
  DEPLOY_END_TIME=$(date +%s)
  DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))
  echo -e "${RED}Deployment to staging failed (${DEPLOY_DURATION} seconds)${NC}"
  echo "✗ Deployment failed (${DEPLOY_DURATION} seconds)" >> "$TEST_REPORT"
  echo "See Firebase deployment logs for details." >> "$TEST_REPORT"
  echo "----------------------------------------" >> "$TEST_REPORT"
  echo -e "${RED}Deployment to staging failed. Please check the logs for details.${NC}"
  exit 1
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Get the staging site URL
STAGING_URL=$(firebase hosting:channel:list --project "$STAGING_PROJECT_ID" | grep -o 'https://[^ ]*' | head -1)
if [ -z "$STAGING_URL" ]; then
  STAGING_URL="https://${STAGING_PROJECT_ID}.web.app"
fi

echo -e "${BLUE}Staging site URL: ${STAGING_URL}${NC}"
echo "Staging site URL: ${STAGING_URL}" >> "$TEST_REPORT"
echo "----------------------------------------" >> "$TEST_REPORT"

# Run tests on the staging deployment
echo -e "${BLUE}Running tests on the staging deployment...${NC}"
echo "Tests:" >> "$TEST_REPORT"

# Test 1: Check if the site is accessible
echo -e "${BLUE}Test 1: Checking if the site is accessible...${NC}"
echo "Test 1: Site Accessibility" >> "$TEST_REPORT"
if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" | grep -q "200"; then
  echo -e "${GREEN}Test 1 passed: Site is accessible${NC}"
  echo "✓ Site is accessible" >> "$TEST_REPORT"
else
  echo -e "${RED}Test 1 failed: Site is not accessible${NC}"
  echo "✗ Site is not accessible" >> "$TEST_REPORT"
fi

# Test 2: Check security headers
echo -e "${BLUE}Test 2: Checking security headers...${NC}"
echo "Test 2: Security Headers" >> "$TEST_REPORT"
HEADERS=$(curl -s -I "$STAGING_URL")
SECURITY_HEADERS_COUNT=0

# Check for Content-Security-Policy
if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
  SECURITY_HEADERS_COUNT=$((SECURITY_HEADERS_COUNT + 1))
  echo -e "${GREEN}Content-Security-Policy header found${NC}"
  echo "✓ Content-Security-Policy header found" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}Content-Security-Policy header not found${NC}"
  echo "✗ Content-Security-Policy header not found" >> "$TEST_REPORT"
fi

# Check for Strict-Transport-Security
if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
  SECURITY_HEADERS_COUNT=$((SECURITY_HEADERS_COUNT + 1))
  echo -e "${GREEN}Strict-Transport-Security header found${NC}"
  echo "✓ Strict-Transport-Security header found" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}Strict-Transport-Security header not found${NC}"
  echo "✗ Strict-Transport-Security header not found" >> "$TEST_REPORT"
fi

# Check for X-Content-Type-Options
if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  SECURITY_HEADERS_COUNT=$((SECURITY_HEADERS_COUNT + 1))
  echo -e "${GREEN}X-Content-Type-Options header found${NC}"
  echo "✓ X-Content-Type-Options header found" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}X-Content-Type-Options header not found${NC}"
  echo "✗ X-Content-Type-Options header not found" >> "$TEST_REPORT"
fi

# Check for X-Frame-Options
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  SECURITY_HEADERS_COUNT=$((SECURITY_HEADERS_COUNT + 1))
  echo -e "${GREEN}X-Frame-Options header found${NC}"
  echo "✓ X-Frame-Options header found" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}X-Frame-Options header not found${NC}"
  echo "✗ X-Frame-Options header not found" >> "$TEST_REPORT"
fi

# Check for X-XSS-Protection
if echo "$HEADERS" | grep -q "X-XSS-Protection"; then
  SECURITY_HEADERS_COUNT=$((SECURITY_HEADERS_COUNT + 1))
  echo -e "${GREEN}X-XSS-Protection header found${NC}"
  echo "✓ X-XSS-Protection header found" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}X-XSS-Protection header not found${NC}"
  echo "✗ X-XSS-Protection header not found" >> "$TEST_REPORT"
fi

if [ $SECURITY_HEADERS_COUNT -eq 5 ]; then
  echo -e "${GREEN}Test 2 passed: All security headers are present${NC}"
  echo "✓ All security headers are present" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}Test 2 warning: Some security headers are missing (${SECURITY_HEADERS_COUNT}/5)${NC}"
  echo "⚠ Some security headers are missing (${SECURITY_HEADERS_COUNT}/5)" >> "$TEST_REPORT"
fi

# Test 3: Check redirects
echo -e "${BLUE}Test 3: Checking redirects...${NC}"
echo "Test 3: Redirects" >> "$TEST_REPORT"
HTTP_URL="${STAGING_URL/https/http}"
REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "$HTTP_URL")

if [[ "$REDIRECT_URL" == *"https://"* ]]; then
  echo -e "${GREEN}Test 3 passed: HTTP to HTTPS redirect works${NC}"
  echo "✓ HTTP to HTTPS redirect works" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}Test 3 warning: HTTP to HTTPS redirect not working${NC}"
  echo "⚠ HTTP to HTTPS redirect not working" >> "$TEST_REPORT"
fi

# Test 4: Check Firebase configuration
echo -e "${BLUE}Test 4: Checking Firebase configuration...${NC}"
echo "Test 4: Firebase Configuration" >> "$TEST_REPORT"
if firebase apps:list --project "$STAGING_PROJECT_ID" | grep -q "web"; then
  echo -e "${GREEN}Test 4 passed: Firebase web app is configured${NC}"
  echo "✓ Firebase web app is configured" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}Test 4 warning: Firebase web app is not configured${NC}"
  echo "⚠ Firebase web app is not configured" >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Summary
echo -e "${BLUE}Test summary:${NC}"
echo "Test Summary:" >> "$TEST_REPORT"
echo -e "${GREEN}✓ Deployment to staging successful${NC}"
echo "✓ Deployment to staging successful" >> "$TEST_REPORT"

if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" | grep -q "200"; then
  echo -e "${GREEN}✓ Site is accessible${NC}"
  echo "✓ Site is accessible" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Site is not accessible${NC}"
  echo "✗ Site is not accessible" >> "$TEST_REPORT"
fi

if [ $SECURITY_HEADERS_COUNT -eq 5 ]; then
  echo -e "${GREEN}✓ All security headers are present${NC}"
  echo "✓ All security headers are present" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}⚠ Some security headers are missing (${SECURITY_HEADERS_COUNT}/5)${NC}"
  echo "⚠ Some security headers are missing (${SECURITY_HEADERS_COUNT}/5)" >> "$TEST_REPORT"
fi

if [[ "$REDIRECT_URL" == *"https://"* ]]; then
  echo -e "${GREEN}✓ HTTP to HTTPS redirect works${NC}"
  echo "✓ HTTP to HTTPS redirect works" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}⚠ HTTP to HTTPS redirect not working${NC}"
  echo "⚠ HTTP to HTTPS redirect not working" >> "$TEST_REPORT"
fi

if firebase apps:list --project "$STAGING_PROJECT_ID" | grep -q "web"; then
  echo -e "${GREEN}✓ Firebase web app is configured${NC}"
  echo "✓ Firebase web app is configured" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}⚠ Firebase web app is not configured${NC}"
  echo "⚠ Firebase web app is not configured" >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Recommendation
echo -e "${BLUE}Recommendation:${NC}"
echo "Recommendation:" >> "$TEST_REPORT"
if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" | grep -q "200" && [ $SECURITY_HEADERS_COUNT -ge 3 ]; then
  echo -e "${GREEN}✓ The deployment is ready for production${NC}"
  echo "✓ The deployment is ready for production" >> "$TEST_REPORT"
else
  echo -e "${YELLOW}⚠ The deployment has issues that should be fixed before deploying to production${NC}"
  echo "⚠ The deployment has issues that should be fixed before deploying to production" >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

echo -e "${BLUE}Test report saved to ${TEST_REPORT}${NC}"
echo -e "${BLUE}Staging site URL: ${STAGING_URL}${NC}"

echo -e "${GREEN}=== Testing Firebase Deployment in Staging Environment Completed ===${NC}"