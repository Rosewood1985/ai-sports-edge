#!/bin/bash

# Run Load Tests Script
# This script runs load tests for AI Sports Edge using k6

set -e

# Configuration
TEST_SCRIPT="load-test.js"
BASE_URL=${BASE_URL:-"https://api.aisportsedge.com"}
OUTPUT_DIR="./results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Sports Edge - Load Testing${NC}"
echo "=================================================="

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed. Please install it first.${NC}"
    echo "Visit https://k6.io/docs/getting-started/installation/ for installation instructions."
    exit 1
fi

# Check if test script exists
if [ ! -f "$TEST_SCRIPT" ]; then
    echo -e "${RED}Error: Test script $TEST_SCRIPT not found.${NC}"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to run a test scenario
run_test() {
    local scenario=$1
    local description=$2
    local output_file="${OUTPUT_DIR}/${scenario}_${TIMESTAMP}"
    
    echo -e "${YELLOW}Running $description...${NC}"
    
    # Run the test
    k6 run --env SCENARIO=$scenario --env BASE_URL=$BASE_URL \
        --out json="${output_file}.json" \
        --summary-export="${output_file}_summary.json" \
        "$TEST_SCRIPT"
    
    # Copy the HTML report
    cp summary.html "${output_file}.html"
    
    echo -e "${GREEN}$description completed. Results saved to ${output_file}.*${NC}"
    echo ""
}

# Display test configuration
echo -e "${YELLOW}Test Configuration:${NC}"
echo "Base URL: $BASE_URL"
echo "Output Directory: $OUTPUT_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Ask which test to run
echo -e "${YELLOW}Select a test to run:${NC}"
echo "1. Smoke Test (5 VUs, 1 minute)"
echo "2. Load Test (up to 100 VUs, 9 minutes)"
echo "3. Stress Test (up to 1000 VUs, 32 minutes)"
echo "4. Soak Test (100 VUs, 1 hour 10 minutes)"
echo "5. Run All Tests"
echo "6. Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        run_test "smoke" "Smoke Test"
        ;;
    2)
        run_test "load" "Load Test"
        ;;
    3)
        run_test "stress" "Stress Test"
        ;;
    4)
        run_test "soak" "Soak Test"
        ;;
    5)
        echo -e "${YELLOW}Running all tests. This will take approximately 2 hours.${NC}"
        run_test "smoke" "Smoke Test"
        run_test "load" "Load Test"
        run_test "stress" "Stress Test"
        run_test "soak" "Soak Test"
        ;;
    6)
        echo -e "${YELLOW}Exiting.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}All tests completed successfully!${NC}"
echo "=================================================="
echo -e "${YELLOW}Test Results Summary:${NC}"
echo "Results are saved in the $OUTPUT_DIR directory."
echo "You can view the HTML reports for detailed results."
echo ""
echo "Key metrics to look for:"
echo "1. Response time (http_req_duration): Should be < 500ms for 95% of requests"
echo "2. Error rate (http_req_failed): Should be < 1%"
echo "3. Success rate (success_rate): Should be > 95%"
echo ""
echo "If any thresholds were exceeded, review the system performance and make necessary adjustments."
echo "=================================================="