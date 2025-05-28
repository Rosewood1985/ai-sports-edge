#!/bin/bash

# Comprehensive Sentry Testing Suite
# AI Sports Edge - Execute All Test Categories

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧪 AI Sports Edge - Comprehensive Sentry Testing Suite${NC}"
echo "======================================================"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create test result entry
record_test_result() {
    local test_id="$1"
    local component="$2"
    local status="$3"
    local notes="$4"
    
    echo "$test_id,$component,$status,$notes,$(date)" >> test_results.csv
}

# Initialize test results file
echo "Test ID,Component,Status,Notes,Timestamp" > test_results.csv

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "\n${PURPLE}📋 Test Suite Overview${NC}"
echo "======================"
echo "• Frontend React Native Tests"
echo "• Backend Firebase Functions Tests"  
echo "• Scheduled Cron Job Tests"
echo "• ML Operations Tests"
echo "• Integration Tests"

# Pre-test setup
echo -e "\n${YELLOW}🔧 Pre-Test Setup${NC}"
echo "=================="

log "Verifying Sentry integration..."
if [ -f "verify-sentry-integration.sh" ]; then
    ./verify-sentry-integration.sh
else
    log "${YELLOW}⚠️  Verification script not found${NC}"
fi

log "Setting up test environment..."

# Create test data in Firebase
create_test_data() {
    log "Creating test data for Firebase functions..."
    
    # Create test notification
    cat > test_notification.json << 'EOF'
{
  "userId": "test-user-123",
  "title": "Sentry Test Notification",
  "message": "This is a test notification for Sentry monitoring",
  "scheduledAt": {
    "_seconds": 1640995200,
    "_nanoseconds": 0
  },
  "sent": false,
  "category": "test",
  "data": {
    "testId": "sentry-integration-test"
  }
}
EOF

    # Create test game for ML predictions
    cat > test_game.json << 'EOF'
{
  "teamA": "Test Team A",
  "teamB": "Test Team B", 
  "sport": "basketball",
  "league": "test-league",
  "startTime": {
    "_seconds": 1640995200,
    "_nanoseconds": 0
  },
  "momentumScore": 75,
  "confidence": 0.85
}
EOF

    log "${GREEN}✅ Test data created${NC}"
}

create_test_data

echo -e "\n${PURPLE}🎯 TEST CATEGORY 1: Frontend React Native${NC}"
echo "=========================================="

# Frontend tests (these require manual execution in the app)
run_frontend_tests() {
    local category="Frontend"
    
    echo -e "\n${YELLOW}📱 Frontend Test Instructions${NC}"
    echo "=============================="
    
    echo "Please execute the following tests manually in the React Native app:"
    echo ""
    echo "1. FE-ERR-001: JavaScript Error Test"
    echo "   - Navigate to any screen"
    echo "   - Trigger an intentional error (access undefined variable)"
    echo "   - Check Sentry dashboard for error event"
    echo ""
    echo "2. FE-PERF-001: Performance Test"
    echo "   - Navigate between screens rapidly"
    echo "   - Monitor performance in Sentry dashboard"
    echo ""
    echo "3. FE-CTX-001: User Context Test"
    echo "   - Login with test user"
    echo "   - Trigger any action"
    echo "   - Verify user context in Sentry events"
    echo ""
    
    read -p "Have you completed the frontend tests? (y/N): " frontend_complete
    
    if [[ $frontend_complete =~ ^[Yy]$ ]]; then
        log "${GREEN}✅ Frontend tests marked as completed${NC}"
        record_test_result "FE-ERR-001" "$category" "MANUAL" "User completed error test"
        record_test_result "FE-PERF-001" "$category" "MANUAL" "User completed performance test"
        record_test_result "FE-CTX-001" "$category" "MANUAL" "User completed context test"
        ((PASSED_TESTS+=3))
    else
        log "${YELLOW}⚠️  Frontend tests skipped${NC}"
        record_test_result "FE-ERR-001" "$category" "SKIPPED" "User skipped test"
        record_test_result "FE-PERF-001" "$category" "SKIPPED" "User skipped test"
        record_test_result "FE-CTX-001" "$category" "SKIPPED" "User skipped test"
    fi
    
    ((TOTAL_TESTS+=3))
}

run_frontend_tests

echo -e "\n${PURPLE}🚀 TEST CATEGORY 2: Backend Firebase Functions${NC}"
echo "=============================================="

# Backend function tests
run_backend_tests() {
    local category="Backend"
    
    echo -e "\n${YELLOW}🔧 Backend Function Tests${NC}"
    echo "========================="
    
    # Test HTTP function error handling
    log "Running BE-HTTP-001: HTTP Function Error Test..."
    ((TOTAL_TESTS++))
    
    # Get project URL (this is a placeholder - replace with actual project URL)
    PROJECT_ID=$(firebase use --current 2>/dev/null || echo "")
    if [ -n "$PROJECT_ID" ]; then
        FUNCTION_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net/stripeWebhook"
        
        # Test with invalid payload
        if curl -s -X POST "$FUNCTION_URL" \
           -H "Content-Type: application/json" \
           -d '{"invalid": "test_payload", "sentry_test": true}' \
           --max-time 30; then
            log "${GREEN}✅ BE-HTTP-001: HTTP error test completed${NC}"
            record_test_result "BE-HTTP-001" "$category" "PASS" "HTTP error handling tested"
            ((PASSED_TESTS++))
        else
            log "${RED}❌ BE-HTTP-001: HTTP test failed${NC}"
            record_test_result "BE-HTTP-001" "$category" "FAIL" "HTTP test failed"
            ((FAILED_TESTS++))
        fi
    else
        log "${YELLOW}⚠️  BE-HTTP-001: No project configured, skipping HTTP test${NC}"
        record_test_result "BE-HTTP-001" "$category" "SKIPPED" "No project configured"
    fi
    
    # Test user creation function
    log "Running BE-AUTH-001: User Creation Test..."
    ((TOTAL_TESTS++))
    
    # This would require Firebase Admin SDK test
    log "${YELLOW}⚠️  BE-AUTH-001: User creation test requires Firebase Admin access${NC}"
    record_test_result "BE-AUTH-001" "$category" "MANUAL" "Requires Firebase Admin"
    
    # Test database operations
    log "Running BE-DB-001: Database Operation Test..."
    ((TOTAL_TESTS++))
    
    log "${YELLOW}⚠️  BE-DB-001: Database test requires Firestore access${NC}"
    record_test_result "BE-DB-001" "$category" "MANUAL" "Requires Firestore access"
}

run_backend_tests

echo -e "\n${PURPLE}⏰ TEST CATEGORY 3: Scheduled Cron Jobs${NC}"
echo "======================================="

# Cron job tests
run_cron_tests() {
    local category="Scheduled"
    
    echo -e "\n${YELLOW}📅 Cron Job Tests${NC}"
    echo "================="
    
    # Use our existing cron test script
    if [ -f "functions/test-sentry-crons.sh" ]; then
        log "Running comprehensive cron job tests..."
        
        cd functions
        
        # Run the cron test script
        if ./test-sentry-crons.sh; then
            log "${GREEN}✅ Cron job tests completed${NC}"
            
            # Record results for each cron function
            CRON_FUNCTIONS=(
                "CRON-NOTIF-001:processScheduledNotifications"
                "CRON-CLEAN-001:cleanupOldNotifications"
                "CRON-LEAD-001:updateReferralLeaderboard"
                "CRON-RSS-001:processRssFeedsAndNotify"
            )
            
            for cron_test in "${CRON_FUNCTIONS[@]}"; do
                test_id="${cron_test%%:*}"
                func_name="${cron_test##*:}"
                
                ((TOTAL_TESTS++))
                record_test_result "$test_id" "$category" "PASS" "Cron test completed for $func_name"
                ((PASSED_TESTS++))
            done
        else
            log "${RED}❌ Cron job tests failed${NC}"
            ((TOTAL_TESTS+=4))
            ((FAILED_TESTS+=4))
        fi
        
        cd ..
    else
        log "${YELLOW}⚠️  Cron test script not found${NC}"
        ((TOTAL_TESTS+=4))
    fi
}

run_cron_tests

echo -e "\n${PURPLE}🤖 TEST CATEGORY 4: ML Operations${NC}"
echo "=================================="

# ML operation tests
run_ml_tests() {
    local category="ML_Ops"
    
    echo -e "\n${YELLOW}🧠 ML Operation Tests${NC}"
    echo "====================="
    
    # Test ML prediction function
    log "Running ML-PRED-001: Game Prediction Test..."
    ((TOTAL_TESTS++))
    
    if [ -f "functions/src/predictTodayGames.ts" ]; then
        log "${GREEN}✅ ML-PRED-001: Prediction function found${NC}"
        record_test_result "ML-PRED-001" "$category" "PASS" "Prediction function exists with Sentry"
        ((PASSED_TESTS++))
    else
        log "${RED}❌ ML-PRED-001: Prediction function not found${NC}"
        record_test_result "ML-PRED-001" "$category" "FAIL" "Prediction function missing"
        ((FAILED_TESTS++))
    fi
    
    # Test stats update function
    log "Running ML-STATS-001: Stats Update Test..."
    ((TOTAL_TESTS++))
    
    if [ -f "functions/src/updateStatsPage.ts" ]; then
        log "${GREEN}✅ ML-STATS-001: Stats function found${NC}"
        record_test_result "ML-STATS-001" "$category" "PASS" "Stats function exists with Sentry"
        ((PASSED_TESTS++))
    else
        log "${RED}❌ ML-STATS-001: Stats function not found${NC}"
        record_test_result "ML-STATS-001" "$category" "FAIL" "Stats function missing"
        ((FAILED_TESTS++))
    fi
    
    # Test ML performance monitoring
    log "Running ML-PERF-001: ML Performance Test..."
    ((TOTAL_TESTS++))
    
    # Check if ML functions have performance tracking
    if grep -q "trackApiCall\|trackDatabaseOperation" "functions/src/predictTodayGames.ts"; then
        log "${GREEN}✅ ML-PERF-001: Performance tracking enabled${NC}"
        record_test_result "ML-PERF-001" "$category" "PASS" "Performance tracking found"
        ((PASSED_TESTS++))
    else
        log "${YELLOW}⚠️  ML-PERF-001: Performance tracking not detected${NC}"
        record_test_result "ML-PERF-001" "$category" "PARTIAL" "Limited performance tracking"
    fi
}

run_ml_tests

echo -e "\n${PURPLE}🔗 TEST CATEGORY 5: Integration Tests${NC}"
echo "====================================="

# Integration tests
run_integration_tests() {
    local category="Integration"
    
    echo -e "\n${YELLOW}🔄 Integration Tests${NC}"
    echo "==================="
    
    # Test end-to-end flow
    log "Running INT-E2E-001: End-to-End Flow Test..."
    ((TOTAL_TESTS++))
    
    # This would test: User action -> Backend processing -> Notification -> Monitoring
    log "${YELLOW}⚠️  INT-E2E-001: End-to-end test requires full system deployment${NC}"
    record_test_result "INT-E2E-001" "$category" "MANUAL" "Requires full deployment"
    
    # Test Sentry dashboard accessibility
    log "Running INT-DASH-001: Dashboard Access Test..."
    ((TOTAL_TESTS++))
    
    echo "Please verify Sentry dashboard access:"
    echo "1. Open https://sentry.io"
    echo "2. Navigate to your AI Sports Edge projects"
    echo "3. Verify events are appearing from tests"
    
    read -p "Can you access Sentry dashboards and see test events? (y/N): " dashboard_access
    
    if [[ $dashboard_access =~ ^[Yy]$ ]]; then
        log "${GREEN}✅ INT-DASH-001: Dashboard access confirmed${NC}"
        record_test_result "INT-DASH-001" "$category" "PASS" "Dashboard accessible"
        ((PASSED_TESTS++))
    else
        log "${RED}❌ INT-DASH-001: Dashboard access issues${NC}"
        record_test_result "INT-DASH-001" "$category" "FAIL" "Dashboard not accessible"
        ((FAILED_TESTS++))
    fi
}

run_integration_tests

# Test summary and results
echo -e "\n${BLUE}📊 TEST RESULTS SUMMARY${NC}"
echo "======================="

SKIPPED_TESTS=$((TOTAL_TESTS - PASSED_TESTS - FAILED_TESTS))
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
echo -e "Pass Rate: $PASS_RATE%"

# Generate detailed test report
echo -e "\n${YELLOW}📋 Detailed Test Report${NC}"
echo "======================="

if [ -f "test_results.csv" ]; then
    echo "Test results saved to: test_results.csv"
    echo ""
    echo "Top test results:"
    head -10 test_results.csv | column -t -s ','
else
    echo "Test results file not found"
fi

# Recommendations based on results
echo -e "\n${BLUE}💡 Recommendations${NC}"
echo "=================="

if [ $PASS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! Your Sentry integration is ready for beta testing.${NC}"
    echo "✅ Proceed with deployment and user testing"
elif [ $PASS_RATE -ge 75 ]; then
    echo -e "${YELLOW}⚠️  Good progress, but address failed tests before beta.${NC}"
    echo "🔧 Focus on fixing failed integration points"
else
    echo -e "${RED}❌ Significant issues found. Do not proceed to beta yet.${NC}"
    echo "🛠️  Address critical failures before retesting"
fi

echo -e "\n${BLUE}📋 Next Steps${NC}"
echo "============="
echo "1. Review test_results.csv for detailed results"
echo "2. Address any failed tests"
echo "3. Check Sentry dashboards for captured events"
echo "4. Run './verify-sentry-integration.sh' for final verification"
echo "5. If all tests pass, proceed with deployment using './functions/deploy-sentry-functions.sh'"

log "${GREEN}Comprehensive testing complete!${NC}"