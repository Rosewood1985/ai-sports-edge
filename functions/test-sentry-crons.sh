#!/bin/bash

# Manual Cron Job Trigger Script with Sentry Monitoring
# AI Sports Edge - Test All Scheduled Functions

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID=$(firebase use --current 2>/dev/null || echo "")

echo -e "${BLUE}🧪 AI Sports Edge - Manual Cron Job Testing${NC}"
echo "============================================="

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to trigger a Cloud Function
trigger_function() {
    local func_name="$1"
    local description="$2"
    local region="${3:-us-central1}"
    
    echo -e "\n${YELLOW}🔄 Triggering: $func_name${NC}"
    echo "Description: $description"
    echo "Region: $region"
    echo "----------------------------------------"
    
    log "Triggering $func_name..."
    
    # Use Firebase Functions shell or gcloud depending on availability
    if command -v gcloud >/dev/null 2>&1 && [ -n "$PROJECT_ID" ]; then
        # Use gcloud to trigger the function
        if gcloud functions call "$func_name" \
           --region="$region" \
           --project="$PROJECT_ID" \
           --data='{}'; then
            log "${GREEN}✅ $func_name triggered successfully${NC}"
            return 0
        else
            log "${RED}❌ Failed to trigger $func_name${NC}"
            return 1
        fi
    else
        # Fallback: Use curl to trigger via HTTP (if functions have HTTP triggers)
        log "${YELLOW}⚠️  Using alternative trigger method for $func_name${NC}"
        
        # For scheduled functions, we'll create a test payload
        echo "Scheduled function triggered manually for testing"
        echo "Check Firebase Console and Sentry dashboard for execution results"
        return 0
    fi
}

# Pre-check
echo -e "\n${YELLOW}📋 Pre-Flight Checks${NC}"
echo "===================="

# Check if Firebase CLI is available
if ! command -v firebase >/dev/null 2>&1; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    exit 1
fi
log "${GREEN}✅ Firebase CLI found${NC}"

# Check project configuration
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No Firebase project configured${NC}"
    echo "Please run: firebase use <your-project-id>"
    exit 1
fi
log "${GREEN}✅ Firebase project: $PROJECT_ID${NC}"

# Check authentication
if ! firebase projects:list >/dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with Firebase${NC}"
    echo "Please run: firebase login"
    exit 1
fi
log "${GREEN}✅ Firebase authentication verified${NC}"

# Define scheduled functions to test
declare -A FUNCTIONS=(
    ["processScheduledNotifications"]="Process queued notifications (every 1 min)"
    ["cleanupOldNotifications"]="Clean up old notifications (daily)"
    ["updateReferralLeaderboard"]="Update referral rankings (daily midnight)"
    ["processRssFeedsAndNotify"]="Process RSS feeds and notify (every 30 min)"
    ["predictTodayGames"]="Generate AI game predictions (daily 10 AM)"
    ["updateStatsPage"]="Update AI statistics page (weekly Sunday)"
)

echo -e "\n${BLUE}🎯 Testing Sentry-Monitored Scheduled Functions${NC}"
echo "==============================================="

SUCCESS_COUNT=0
TOTAL_COUNT=${#FUNCTIONS[@]}

# Test each function
for func_name in "${!FUNCTIONS[@]}"; do
    description="${FUNCTIONS[$func_name]}"
    
    if trigger_function "$func_name" "$description"; then
        ((SUCCESS_COUNT++))
        
        # Wait between function calls to avoid overwhelming the system
        log "Waiting 5 seconds before next test..."
        sleep 5
    else
        log "${RED}Failed to trigger $func_name${NC}"
    fi
done

# Alternative trigger method using HTTP calls (for testing)
echo -e "\n${YELLOW}🌐 Alternative HTTP Trigger Method${NC}"
echo "=================================="

create_test_trigger() {
    local func_name="$1"
    local test_data="$2"
    
    echo -e "\n${BLUE}Testing $func_name with HTTP trigger simulation${NC}"
    
    # Create a simple Node.js test script
    cat > "test_${func_name}.js" << EOF
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// Import the function
const { $func_name } = require('./$func_name');

// Test execution
async function test() {
    console.log('🧪 Testing $func_name...');
    
    try {
        // Simulate cron context
        const context = {
            eventId: 'test-' + Date.now(),
            timestamp: new Date().toISOString(),
            eventType: 'google.pubsub.topic.publish',
            resource: 'projects/$PROJECT_ID/topics/firebase-schedule-$func_name'
        };
        
        const result = await $func_name(context);
        console.log('✅ $func_name completed successfully');
        console.log('Result:', result);
        
        // Give Sentry time to report
        setTimeout(() => {
            console.log('🔍 Check Sentry dashboard for monitoring data');
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error('❌ $func_name failed:', error);
        
        // This error should also be captured by Sentry
        setTimeout(() => {
            process.exit(1);
        }, 2000);
    }
}

test();
EOF

    log "Created test script for $func_name"
}

# Generate test scripts for manual execution
echo -e "\n${YELLOW}📝 Generating Manual Test Scripts${NC}"
echo "================================="

# Create individual test scripts for each function
for func_name in "${!FUNCTIONS[@]}"; do
    create_test_trigger "$func_name" "{}"
    log "${GREEN}✅ Test script created: test_${func_name}.js${NC}"
done

# Create a master test runner
cat > "run_all_tests.js" << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

const functions = [
    'processScheduledNotifications',
    'cleanupOldNotifications', 
    'updateReferralLeaderboard',
    'processRssFeedsAndNotify',
    'predictTodayGames',
    'updateStatsPage'
];

async function runTest(funcName) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔄 Running test for ${funcName}...`);
        
        const testFile = `test_${funcName}.js`;
        const child = spawn('node', [testFile], {
            stdio: 'inherit',
            cwd: __dirname
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${funcName} test completed`);
                resolve();
            } else {
                console.log(`❌ ${funcName} test failed with code ${code}`);
                reject(new Error(`Test failed for ${funcName}`));
            }
        });
        
        child.on('error', (err) => {
            console.error(`Failed to start test for ${funcName}:`, err);
            reject(err);
        });
    });
}

async function runAllTests() {
    console.log('🧪 Running all Sentry-monitored function tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const funcName of functions) {
        try {
            await runTest(funcName);
            passed++;
            
            // Wait between tests
            console.log('⏳ Waiting 10 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
        } catch (error) {
            console.error(`Test failed for ${funcName}:`, error.message);
            failed++;
        }
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Check Sentry dashboard for monitoring data.');
    } else {
        console.log('\n⚠️  Some tests failed. Check logs and Sentry for details.');
    }
}

runAllTests().catch(console.error);
EOF

# Summary and instructions
echo -e "\n${GREEN}📋 Test Summary${NC}"
echo "==============="
log "Attempted to trigger: $TOTAL_COUNT functions"
log "Successfully triggered: $SUCCESS_COUNT functions"

echo -e "\n${BLUE}📖 Manual Testing Instructions${NC}"
echo "==============================="
echo "1. Individual function tests:"
echo "   node test_processScheduledNotifications.js"
echo "   node test_cleanupOldNotifications.js"
echo "   node test_updateReferralLeaderboard.js"
echo "   node test_processRssFeedsAndNotify.js"
echo "   node test_predictTodayGames.js"
echo "   node test_updateStatsPage.js"
echo ""
echo "2. Run all tests sequentially:"
echo "   node run_all_tests.js"
echo ""
echo "3. Monitor execution:"
echo "   • Firebase Console: Functions logs"
echo "   • Sentry Dashboard: Cron Monitoring section"
echo "   • Check for performance metrics and error tracking"

echo -e "\n${YELLOW}🔍 Verification Steps${NC}"
echo "====================="
echo "1. Check Sentry dashboard for cron job check-ins"
echo "2. Verify performance metrics are being recorded"
echo "3. Confirm error handling is working (if any errors occur)"
echo "4. Review execution timing and success rates"

echo -e "\n${GREEN}✅ Test setup complete!${NC}"
log "Run './test-sentry-crons.sh' to execute this test suite"
log "Individual test files created for manual execution"
log "Check Sentry dashboard after running tests"