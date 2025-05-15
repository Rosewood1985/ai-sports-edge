#!/bin/bash
# start-session.sh - Generate beginning-of-day session template for Roo

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

# Create directory for session logs if it doesn't exist
mkdir -p .roocode/sessions

# Get current date
CURRENT_DATE=$(date +"%Y-%m-%d")
YESTERDAY_DATE=$(date -d "yesterday" +"%Y-%m-%d" 2>/dev/null || date -v-1d +"%Y-%m-%d")

# Check if yesterday's close session exists
YESTERDAY_CLOSE=".roocode/sessions/close_${YESTERDAY_DATE}.md"
if [ -f "$YESTERDAY_CLOSE" ]; then
  # Extract information from yesterday's close
  YESTERDAY_TASKS=$(grep -A 10 "Open tasks:" "$YESTERDAY_CLOSE" | grep -v "Open tasks:" | grep -v "^$" | grep -v "Tomorrow" | head -5)
  YESTERDAY_FOCUS=$(grep "Tomorrow I plan to focus on" "$YESTERDAY_CLOSE" | sed 's/Tomorrow I plan to focus on //')
  YESTERDAY_FILES=$(grep -A 5 "I left off working on" "$YESTERDAY_CLOSE" | grep -v "I left off working on" | grep -v "^$" | grep -v "Open tasks:" | head -3)
else
  YESTERDAY_TASKS="No record of yesterday's tasks"
  YESTERDAY_FOCUS="continuing development"
  YESTERDAY_FILES="No record of yesterday's files"
fi

# Run status scripts to get latest information
./scripts/generate-implementation-status.js > /tmp/implementation_status.txt 2>&1
./scripts/find-recent-files.sh --days 1 > /tmp/recent_files.txt 2>&1
./scripts/dashboard-status-check.sh > /dev/null 2>&1
./scripts/onboarding-status-check.sh > /dev/null 2>&1

# Extract dashboard and onboarding recommendations
DASHBOARD_RECS=$(grep -A 3 "## Recommendations" reports/dashboard_status_*.md 2>/dev/null | grep -v "## Recommendations" | head -3)
if [ -z "$DASHBOARD_RECS" ]; then
  DASHBOARD_RECS="1. Implement core dashboard functionality\n2. Add user profile section\n3. Integrate with Firebase"
fi

ONBOARDING_RECS=$(grep -A 3 "## Recommendations" reports/onboarding_status_*.md 2>/dev/null | grep -v "## Recommendations" | head -3)
if [ -z "$ONBOARDING_RECS" ]; then
  ONBOARDING_RECS="1. Create onboarding flow structure\n2. Implement user registration\n3. Add tutorial screens"
fi

# Find new files since yesterday
NEW_FILES=$(cat /tmp/recent_files.txt | head -5)
if [ -z "$NEW_FILES" ]; then
  NEW_FILES="No new files in the last day"
fi

# Generate session start template
cat > .roocode/sessions/start_${CURRENT_DATE}.md << EOF
**Session Start: ${CURRENT_DATE}**

Good morning Roo. I'm continuing work on AI Sports Edge.

Yesterday we worked on ${YESTERDAY_FOCUS} and left off with these files:
${YESTERDAY_FILES}

Files changed in the last day:
${NEW_FILES}

Today I want to focus on:
1. ${YESTERDAY_FOCUS}
2. Addressing dashboard improvements:
${DASHBOARD_RECS}
3. Enhancing onboarding:
${ONBOARDING_RECS}

Please:
1. Update me on Firebase migration status with './scripts/firebase-migration-tracker.sh status'
2. Suggest specific next steps for implementing the dashboard based on current status
3. Help me organize any new files found into the proper project structure
EOF

# Display template
echo "Session start template generated. Copy the text below to send to Roo:"
echo "========================================================"
cat .roocode/sessions/start_${CURRENT_DATE}.md
echo "========================================================"
echo "Template saved to .roocode/sessions/start_${CURRENT_DATE}.md"