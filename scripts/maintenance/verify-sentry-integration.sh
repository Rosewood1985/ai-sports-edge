#!/bin/bash

# Complete Sentry Integration Verification Script
# AI Sports Edge - Full Stack Monitoring Verification

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🔍 AI Sports Edge - Complete Sentry Integration Verification${NC}"
echo "==========================================================="

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check file exists and contains pattern
check_file_pattern() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        if grep -q "$pattern" "$file"; then
            log "${GREEN}✅ $description${NC}"
            return 0
        else
            log "${RED}❌ $description - Pattern not found${NC}"
            return 1
        fi
    else
        log "${RED}❌ $description - File not found: $file${NC}"
        return 1
    fi
}

# Function to verify environment variable
check_env_var() {
    local var_name="$1"
    local description="$2"
    
    if [ -n "${!var_name}" ]; then
        log "${GREEN}✅ $description: ${!var_name:0:50}...${NC}"
        return 0
    else
        log "${YELLOW}⚠️  $description not set${NC}"
        return 1
    fi
}

echo -e "\n${PURPLE}🎯 COMPONENT 1: Frontend React Native App${NC}"
echo "=========================================="

# Check React Native Sentry configuration
RN_SENTRY_DSN="https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336"

# Check package.json for Sentry dependencies
if [ -f "package.json" ]; then
    if grep -q "@sentry/react-native" "package.json"; then
        log "${GREEN}✅ React Native Sentry dependency found${NC}"
    else
        log "${RED}❌ React Native Sentry dependency missing${NC}"
    fi
else
    log "${YELLOW}⚠️  package.json not found in root${NC}"
fi

# Check App.tsx for Sentry initialization
check_file_pattern "App.tsx" "sentryService\|@sentry/react-native\|sentry.*initialize\|createSentryConfig" "Frontend Sentry initialization"

# Check for Sentry configuration in React Native components
FRONTEND_FILES=(
    "components/ErrorBoundary.tsx"
    "hooks/useAuth.ts"
    "contexts/ThemeContext.tsx"
)

echo -e "\n${YELLOW}📱 Frontend Component Verification${NC}"
for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "Sentry\|captureException\|captureMessage" "$file"; then
            log "${GREEN}✅ $file - Sentry integration found${NC}"
        else
            log "${YELLOW}⚠️  $file - No Sentry integration detected${NC}"
        fi
    else
        log "${YELLOW}⚠️  $file - File not found${NC}"
    fi
done

echo -e "\n${PURPLE}🚀 COMPONENT 2: Firebase Cloud Functions${NC}"
echo "========================================="

cd functions 2>/dev/null || { log "${RED}❌ Functions directory not found${NC}"; exit 1; }

# Verify Firebase Functions Sentry DSN
FB_SENTRY_DSN="https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336"

# Check Sentry configuration files
SENTRY_FILES=(
    "sentryConfig.js"
    "sentryCronConfig.js"
    "sentryTest.js"
)

echo -e "\n${YELLOW}🔧 Sentry Configuration Files${NC}"
for file in "${SENTRY_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "${GREEN}✅ $file exists${NC}"
        
        # Check for DSN configuration
        if grep -q "95b0deae4cc462e0d6f16c40a7417255" "$file"; then
            log "${GREEN}  └─ DSN configured correctly${NC}"
        else
            log "${YELLOW}  └─ DSN configuration not found${NC}"
        fi
    else
        log "${RED}❌ $file missing${NC}"
    fi
done

# Check main index.js for Sentry initialization
check_file_pattern "index.js" "initSentry\|sentryConfig" "Main functions Sentry initialization"

# Verify HTTP functions have Sentry wrappers
check_file_pattern "index.js" "wrapHttpFunction\|wrapEventFunction" "HTTP functions Sentry wrapping"

echo -e "\n${PURPLE}⏰ COMPONENT 3: Scheduled Cron Jobs${NC}"
echo "==================================="

# Check scheduled functions for Sentry integration
SCHEDULED_FUNCTIONS=(
    "processScheduledNotifications.js"
    "leaderboardUpdates.js"
    "rssFeedNotifications.js"
    "src/predictTodayGames.ts"
    "src/updateStatsPage.ts"
)

echo -e "\n${YELLOW}📅 Scheduled Function Verification${NC}"
for func in "${SCHEDULED_FUNCTIONS[@]}"; do
    if [ -f "$func" ]; then
        if grep -q "wrapScheduledFunction\|sentryCronConfig" "$func"; then
            log "${GREEN}✅ $func - Sentry cron monitoring enabled${NC}"
            
            # Check for specific monitoring features
            if grep -q "trackDatabaseOperation" "$func"; then
                log "${GREEN}  └─ Database operation tracking enabled${NC}"
            fi
            
            if grep -q "trackApiCall" "$func"; then
                log "${GREEN}  └─ API call tracking enabled${NC}"
            fi
        else
            log "${RED}❌ $func - No Sentry monitoring detected${NC}"
        fi
    else
        log "${RED}❌ $func - File not found${NC}"
    fi
done

# Check for proper exports in index.js
EXPECTED_EXPORTS=(
    "processScheduledNotifications"
    "cleanupOldNotifications"
    "updateReferralLeaderboard"
    "processRssFeedsAndNotify"
    "predictTodayGames"
    "updateStatsPage"
)

echo -e "\n${YELLOW}📤 Function Export Verification${NC}"
for export in "${EXPECTED_EXPORTS[@]}"; do
    if grep -q "exports\.$export\|exports\[\s*['\"]$export['\"]" "index.js"; then
        log "${GREEN}✅ $export exported correctly${NC}"
    else
        log "${RED}❌ $export not found in exports${NC}"
    fi
done

echo -e "\n${PURPLE}🤖 COMPONENT 4: ML Operations${NC}"
echo "=============================="

# Check ML-specific Sentry integration
ML_FILES=(
    "src/predictTodayGames.ts"
    "lib/predictTodayGames.js"
)

echo -e "\n${YELLOW}🧠 ML Function Verification${NC}"
for file in "${ML_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "${GREEN}✅ $file exists${NC}"
        
        # Check for ML-specific monitoring
        if grep -q "trackApiCall.*download\|trackDatabaseOperation.*prediction" "$file"; then
            log "${GREEN}  └─ ML operation tracking enabled${NC}"
        else
            log "${YELLOW}  └─ ML-specific tracking not detected${NC}"
        fi
    else
        log "${YELLOW}⚠️  $file not found${NC}"
    fi
done

# Return to project root
cd ..

echo -e "\n${PURPLE}🌐 COMPONENT 5: Environment Configuration${NC}"
echo "=========================================="

# Check environment variables
echo -e "\n${YELLOW}🔑 Environment Variables${NC}"
check_env_var "SENTRY_DSN" "Sentry DSN"
check_env_var "SENTRY_ENVIRONMENT" "Sentry Environment"
check_env_var "SENTRY_RELEASE" "Sentry Release"

# Check Firebase configuration
echo -e "\n${YELLOW}🔥 Firebase Configuration${NC}"
if [ -f "firebase.json" ]; then
    log "${GREEN}✅ firebase.json found${NC}"
    
    if grep -q "functions" "firebase.json"; then
        log "${GREEN}  └─ Functions configuration present${NC}"
    fi
else
    log "${RED}❌ firebase.json not found${NC}"
fi

# Check for .firebaserc
if [ -f ".firebaserc" ]; then
    log "${GREEN}✅ .firebaserc found${NC}"
    PROJECT_ID=$(grep -o '"[^"]*"' .firebaserc | head -1 | tr -d '"')
    log "${GREEN}  └─ Project ID: $PROJECT_ID${NC}"
else
    log "${YELLOW}⚠️  .firebaserc not found${NC}"
fi

echo -e "\n${PURPLE}📋 VERIFICATION SUMMARY${NC}"
echo "======================="

# Count successful verifications
SUCCESS_COUNT=0
TOTAL_CHECKS=0

# Frontend checks
((TOTAL_CHECKS++))
if [ -f "App.tsx" ] && grep -q "Sentry" "App.tsx"; then
    ((SUCCESS_COUNT++))
fi

# Backend checks
((TOTAL_CHECKS++))
if [ -f "functions/sentryConfig.js" ]; then
    ((SUCCESS_COUNT++))
fi

# Cron monitoring checks
((TOTAL_CHECKS++))
if [ -f "functions/sentryCronConfig.js" ]; then
    ((SUCCESS_COUNT++))
fi

# Scheduled functions checks
for func in "${SCHEDULED_FUNCTIONS[@]}"; do
    ((TOTAL_CHECKS++))
    if [ -f "functions/$func" ] && grep -q "wrapScheduledFunction\|sentryCronConfig" "functions/$func"; then
        ((SUCCESS_COUNT++))
    fi
done

# Calculate percentage
PERCENTAGE=$((SUCCESS_COUNT * 100 / TOTAL_CHECKS))

echo -e "\n${BLUE}📊 Integration Status${NC}"
echo "✅ Successful: $SUCCESS_COUNT/$TOTAL_CHECKS ($PERCENTAGE%)"

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! Sentry integration is comprehensive${NC}"
elif [ $PERCENTAGE -ge 75 ]; then
    echo -e "${YELLOW}⚠️  Good integration, but some components need attention${NC}"
else
    echo -e "${RED}❌ Sentry integration needs significant work${NC}"
fi

echo -e "\n${BLUE}🎯 Next Steps${NC}"
echo "============="
echo "1. Deploy functions: ./functions/deploy-sentry-functions.sh"
echo "2. Test cron jobs: ./functions/test-sentry-crons.sh" 
echo "3. Run comprehensive tests: npm run test:sentry"
echo "4. Monitor dashboards:"
echo "   • Frontend: https://sentry.io (React Native project)"
echo "   • Backend: https://sentry.io (Firebase Functions project)"
echo "   • Cron jobs: Check Cron Monitoring in Sentry dashboard"

log "${GREEN}Verification complete!${NC}"