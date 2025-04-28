#!/bin/bash

# Stripe Integration Test Runner
# This script runs all the Stripe integration tests

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Stripe Integration Tests...${NC}"
echo "==============================================="

# Create a temporary directory for test results
mkdir -p test-results/stripe

# Run the tests
echo -e "\n${YELLOW}1. Testing Stripe Configuration${NC}"
npx jest --testMatch="**/__tests__/stripe/config.test.ts" --verbose

echo -e "\n${YELLOW}2. Testing Individual Subscriptions${NC}"
npx jest --testMatch="**/__tests__/stripe/subscription.test.ts" --verbose

echo -e "\n${YELLOW}3. Testing Group Subscriptions${NC}"
npx jest --testMatch="**/__tests__/stripe/group-subscription.test.ts" --verbose

echo -e "\n${YELLOW}4. Testing One-Time Purchases and Microtransactions${NC}"
npx jest --testMatch="**/__tests__/stripe/one-time-purchases.test.ts" --verbose

echo -e "\n${YELLOW}5. Testing Webhook Handling${NC}"
npx jest --testMatch="**/__tests__/stripe/webhooks.test.ts" --verbose

echo -e "\n${YELLOW}6. Testing Security${NC}"
npx jest --testMatch="**/__tests__/stripe/security.test.ts" --verbose

# Run all tests together and generate a coverage report
echo -e "\n${YELLOW}Running all tests with coverage report${NC}"
npx jest --testMatch="**/__tests__/stripe/*.test.ts" --coverage --coverageDirectory=test-results/stripe/coverage

# Check if any tests failed
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}All Stripe integration tests passed!${NC}"
else
  echo -e "\n${RED}Some Stripe integration tests failed. Check the output above for details.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Test coverage report saved to test-results/stripe/coverage${NC}"
echo -e "${YELLOW}Open test-results/stripe/coverage/lcov-report/index.html in a browser to view the report${NC}"