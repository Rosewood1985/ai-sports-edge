#!/bin/bash

# Test Web App Functionality Script
# This script tests the functionality of the web app after deployment

set -e

# Configuration
PROJECT_ID="ai-sports-edge"
TEST_RESULTS_DIR="./test-results"
TEST_REPORT="${TEST_RESULTS_DIR}/webapp-functionality-test-report.txt"
SCREENSHOTS_DIR="${TEST_RESULTS_DIR}/screenshots"
BASE_URL="https://ai-sports-edge.com"
TIMEOUT=10 # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is not installed. Install it using your package manager.${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is not installed. Install it using your package manager.${NC}" >&2; exit 1; }

echo -e "${BLUE}=== Testing Web App Functionality ===${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"

# Create test results directory if it doesn't exist
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$SCREENSHOTS_DIR"

# Initialize test report
echo "Web App Functionality Test Report" > "$TEST_REPORT"
echo "Date: $(date)" >> "$TEST_REPORT"
echo "Base URL: ${BASE_URL}" >> "$TEST_REPORT"
echo "----------------------------------------" >> "$TEST_REPORT"

# Function to test a URL and check for expected content
function test_url() {
  local url=$1
  local expected_content=$2
  local description=$3
  local status_code
  local content
  
  echo -e "${BLUE}Testing: ${description} (${url})${NC}"
  echo "Test: ${description}" >> "$TEST_REPORT"
  echo "URL: ${url}" >> "$TEST_REPORT"
  
  # Get status code and content
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${BASE_URL}${url}")
  content=$(curl -s --max-time "$TIMEOUT" "${BASE_URL}${url}")
  
  # Check status code
  if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Status code: ${status_code}${NC}"
    echo "✓ Status code: ${status_code}" >> "$TEST_REPORT"
  else
    echo -e "${RED}✗ Status code: ${status_code}${NC}"
    echo "✗ Status code: ${status_code}" >> "$TEST_REPORT"
  fi
  
  # Check content
  if [[ "$content" == *"$expected_content"* ]]; then
    echo -e "${GREEN}✓ Content check passed${NC}"
    echo "✓ Content check passed" >> "$TEST_REPORT"
  else
    echo -e "${RED}✗ Content check failed${NC}"
    echo "✗ Content check failed" >> "$TEST_REPORT"
    echo "Expected to find: ${expected_content}" >> "$TEST_REPORT"
  fi
  
  echo "----------------------------------------" >> "$TEST_REPORT"
}

# Function to test an API endpoint
function test_api() {
  local endpoint=$1
  local method=$2
  local data=$3
  local expected_status=$4
  local expected_content=$5
  local description=$6
  local status_code
  local response
  
  echo -e "${BLUE}Testing API: ${description} (${endpoint})${NC}"
  echo "Test API: ${description}" >> "$TEST_REPORT"
  echo "Endpoint: ${endpoint}" >> "$TEST_REPORT"
  echo "Method: ${method}" >> "$TEST_REPORT"
  
  # Make API request
  if [ "$method" == "GET" ]; then
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -X "$method" "${BASE_URL}${endpoint}")
    response=$(curl -s --max-time "$TIMEOUT" -X "$method" "${BASE_URL}${endpoint}")
  else
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -X "$method" -H "Content-Type: application/json" -d "$data" "${BASE_URL}${endpoint}")
    response=$(curl -s --max-time "$TIMEOUT" -X "$method" -H "Content-Type: application/json" -d "$data" "${BASE_URL}${endpoint}")
  fi
  
  # Check status code
  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Status code: ${status_code}${NC}"
    echo "✓ Status code: ${status_code}" >> "$TEST_REPORT"
  else
    echo -e "${RED}✗ Status code: ${status_code} (expected ${expected_status})${NC}"
    echo "✗ Status code: ${status_code} (expected ${expected_status})" >> "$TEST_REPORT"
  fi
  
  # Check content
  if [[ "$response" == *"$expected_content"* ]]; then
    echo -e "${GREEN}✓ Content check passed${NC}"
    echo "✓ Content check passed" >> "$TEST_REPORT"
  else
    echo -e "${RED}✗ Content check failed${NC}"
    echo "✗ Content check failed" >> "$TEST_REPORT"
    echo "Expected to find: ${expected_content}" >> "$TEST_REPORT"
    echo "Response: ${response}" >> "$TEST_REPORT"
  fi
  
  echo "----------------------------------------" >> "$TEST_REPORT"
}

# Function to take a screenshot using Chrome headless
function take_screenshot() {
  local url=$1
  local filename=$2
  local description=$3
  
  echo -e "${BLUE}Taking screenshot: ${description} (${url})${NC}"
  echo "Screenshot: ${description}" >> "$TEST_REPORT"
  echo "URL: ${url}" >> "$TEST_REPORT"
  
  # Check if Chrome is installed
  if command -v google-chrome >/dev/null 2>&1 || command -v google-chrome-stable >/dev/null 2>&1; then
    # Take screenshot
    if command -v google-chrome >/dev/null 2>&1; then
      google-chrome --headless --disable-gpu --screenshot="${SCREENSHOTS_DIR}/${filename}" "${BASE_URL}${url}" >/dev/null 2>&1
    else
      google-chrome-stable --headless --disable-gpu --screenshot="${SCREENSHOTS_DIR}/${filename}" "${BASE_URL}${url}" >/dev/null 2>&1
    fi
    
    # Check if screenshot was taken
    if [ -f "${SCREENSHOTS_DIR}/${filename}" ]; then
      echo -e "${GREEN}✓ Screenshot taken: ${SCREENSHOTS_DIR}/${filename}${NC}"
      echo "✓ Screenshot taken: ${SCREENSHOTS_DIR}/${filename}" >> "$TEST_REPORT"
    else
      echo -e "${RED}✗ Failed to take screenshot${NC}"
      echo "✗ Failed to take screenshot" >> "$TEST_REPORT"
    fi
  else
    echo -e "${YELLOW}⚠ Chrome is not installed. Skipping screenshot.${NC}"
    echo "⚠ Chrome is not installed. Skipping screenshot." >> "$TEST_REPORT"
  fi
  
  echo "----------------------------------------" >> "$TEST_REPORT"
}

# Test 1: Homepage
echo -e "${BLUE}Test 1: Homepage${NC}"
test_url "/" "AI Sports Edge" "Homepage"
take_screenshot "/" "homepage.png" "Homepage"

# Test 2: About page
echo -e "${BLUE}Test 2: About page${NC}"
test_url "/about" "About" "About page"
take_screenshot "/about" "about.png" "About page"

# Test 3: Sports page
echo -e "${BLUE}Test 3: Sports page${NC}"
test_url "/sports" "Sports" "Sports page"
take_screenshot "/sports" "sports.png" "Sports page"

# Test 4: Login page
echo -e "${BLUE}Test 4: Login page${NC}"
test_url "/auth/login" "Login" "Login page"
take_screenshot "/auth/login" "login.png" "Login page"

# Test 5: Register page
echo -e "${BLUE}Test 5: Register page${NC}"
test_url "/auth/register" "Register" "Register page"
take_screenshot "/auth/register" "register.png" "Register page"

# Test 6: API - Get sports
echo -e "${BLUE}Test 6: API - Get sports${NC}"
test_api "/api/sports" "GET" "" 200 "success" "Get sports API"

# Test 7: API - Get predictions
echo -e "${BLUE}Test 7: API - Get predictions${NC}"
test_api "/api/predictions" "GET" "" 200 "predictions" "Get predictions API"

# Test 8: API - Create payment (should fail without auth)
echo -e "${BLUE}Test 8: API - Create payment (should fail without auth)${NC}"
test_api "/api/create-payment" "POST" '{"userId":"test","productId":"test","price":10,"productName":"Test"}' 401 "Unauthorized" "Create payment API (unauthorized)"

# Test 9: Check for 404 page
echo -e "${BLUE}Test 9: Check for 404 page${NC}"
test_url "/non-existent-page" "404" "404 page"
take_screenshot "/non-existent-page" "404.png" "404 page"

# Test 10: Check for proper redirects
echo -e "${BLUE}Test 10: Check for proper redirects${NC}"
redirect_url=$(curl -s -o /dev/null -w "%{redirect_url}" "${BASE_URL}/home")
if [[ "$redirect_url" == *"/"* ]]; then
  echo -e "${GREEN}✓ Redirect works: /home -> /${NC}"
  echo "✓ Redirect works: /home -> /" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Redirect failed: /home -> ${redirect_url}${NC}"
  echo "✗ Redirect failed: /home -> ${redirect_url}" >> "$TEST_REPORT"
fi
echo "----------------------------------------" >> "$TEST_REPORT"

# Test 11: Check for proper caching headers
echo -e "${BLUE}Test 11: Check for proper caching headers${NC}"
echo "Test: Check for proper caching headers" >> "$TEST_REPORT"

# Check JS file caching
js_cache=$(curl -s -I "${BASE_URL}/static/js/main.js" | grep -i "cache-control")
if [[ "$js_cache" == *"max-age=31536000"* ]]; then
  echo -e "${GREEN}✓ JS file caching is correct${NC}"
  echo "✓ JS file caching is correct: ${js_cache}" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ JS file caching is incorrect: ${js_cache}${NC}"
  echo "✗ JS file caching is incorrect: ${js_cache}" >> "$TEST_REPORT"
fi

# Check image file caching
img_cache=$(curl -s -I "${BASE_URL}/static/images/logo.png" | grep -i "cache-control")
if [[ "$img_cache" == *"max-age=604800"* ]]; then
  echo -e "${GREEN}✓ Image file caching is correct${NC}"
  echo "✓ Image file caching is correct: ${img_cache}" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Image file caching is incorrect: ${img_cache}${NC}"
  echo "✗ Image file caching is incorrect: ${img_cache}" >> "$TEST_REPORT"
fi

# Check HTML file caching
html_cache=$(curl -s -I "${BASE_URL}" | grep -i "cache-control")
if [[ "$html_cache" == *"max-age=0"* || "$html_cache" == *"no-cache"* ]]; then
  echo -e "${GREEN}✓ HTML file caching is correct${NC}"
  echo "✓ HTML file caching is correct: ${html_cache}" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ HTML file caching is incorrect: ${html_cache}${NC}"
  echo "✗ HTML file caching is incorrect: ${html_cache}" >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Test 12: Check for security headers
echo -e "${BLUE}Test 12: Check for security headers${NC}"
echo "Test: Check for security headers" >> "$TEST_REPORT"
headers=$(curl -s -I "${BASE_URL}")

# Check for Content-Security-Policy
if echo "$headers" | grep -q "Content-Security-Policy"; then
  echo -e "${GREEN}✓ Content-Security-Policy header found${NC}"
  echo "✓ Content-Security-Policy header found" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Content-Security-Policy header not found${NC}"
  echo "✗ Content-Security-Policy header not found" >> "$TEST_REPORT"
fi

# Check for Strict-Transport-Security
if echo "$headers" | grep -q "Strict-Transport-Security"; then
  echo -e "${GREEN}✓ Strict-Transport-Security header found${NC}"
  echo "✓ Strict-Transport-Security header found" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Strict-Transport-Security header not found${NC}"
  echo "✗ Strict-Transport-Security header not found" >> "$TEST_REPORT"
fi

# Check for X-Content-Type-Options
if echo "$headers" | grep -q "X-Content-Type-Options"; then
  echo -e "${GREEN}✓ X-Content-Type-Options header found${NC}"
  echo "✓ X-Content-Type-Options header found" >> "$TEST_REPORT"
else
  echo -e "${RED}✗ X-Content-Type-Options header not found${NC}"
  echo "✗ X-Content-Type-Options header not found" >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

# Summary
echo -e "${BLUE}Test summary:${NC}"
echo "Test Summary:" >> "$TEST_REPORT"

# Count passed and failed tests
passed=$(grep -c "✓" "$TEST_REPORT")
failed=$(grep -c "✗" "$TEST_REPORT")
warnings=$(grep -c "⚠" "$TEST_REPORT")

echo -e "${GREEN}✓ Passed: ${passed}${NC}"
echo -e "${RED}✗ Failed: ${failed}${NC}"
echo -e "${YELLOW}⚠ Warnings: ${warnings}${NC}"

echo "✓ Passed: ${passed}" >> "$TEST_REPORT"
echo "✗ Failed: ${failed}" >> "$TEST_REPORT"
echo "⚠ Warnings: ${warnings}" >> "$TEST_REPORT"

echo "----------------------------------------" >> "$TEST_REPORT"

# Recommendation
echo -e "${BLUE}Recommendation:${NC}"
echo "Recommendation:" >> "$TEST_REPORT"

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed. The web app is functioning correctly.${NC}"
  echo "✓ All tests passed. The web app is functioning correctly." >> "$TEST_REPORT"
elif [ $failed -le 2 ]; then
  echo -e "${YELLOW}⚠ Some tests failed. The web app is mostly functioning, but there are some issues that should be addressed.${NC}"
  echo "⚠ Some tests failed. The web app is mostly functioning, but there are some issues that should be addressed." >> "$TEST_REPORT"
else
  echo -e "${RED}✗ Multiple tests failed. The web app has significant issues that need to be addressed.${NC}"
  echo "✗ Multiple tests failed. The web app has significant issues that need to be addressed." >> "$TEST_REPORT"
fi

echo "----------------------------------------" >> "$TEST_REPORT"

echo -e "${BLUE}Test report saved to ${TEST_REPORT}${NC}"
if [ -d "$SCREENSHOTS_DIR" ]; then
  echo -e "${BLUE}Screenshots saved to ${SCREENSHOTS_DIR}${NC}"
fi

echo -e "${GREEN}=== Web App Functionality Testing Completed ===${NC}"