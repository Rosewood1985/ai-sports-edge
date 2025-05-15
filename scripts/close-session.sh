#!/bin/bash
# close-session.sh - Generate end-of-day session summary for Roo

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

# Create directory for session logs if it doesn't exist
mkdir -p .roocode/sessions

# Get current date
CURRENT_DATE=$(date +"%Y-%m-%d")

# Run implementation status checks
./scripts/dashboard-status-check.sh > /dev/null 2>&1
./scripts/onboarding-status-check.sh > /dev/null 2>&1
./scripts/firebase-migration-tracker.sh status > /tmp/firebase_status.txt 2>&1
./scripts/generate-implementation-status.js > /tmp/implementation_status.txt 2>&1

# Extract status information
DASHBOARD_STATUS=$(grep "User dashboard implementation is approximately" reports/dashboard_status_*.md 2>/dev/null | tail -1 | sed 's/.*approximately //' | sed 's/ complete.*//')
if [ -z "$DASHBOARD_STATUS" ]; then
  DASHBOARD_STATUS="Not started or status unknown"
fi

ONBOARDING_STATUS=$(grep "User onboarding implementation is approximately" reports/onboarding_status_*.md 2>/dev/null | tail -1 | sed 's/.*approximately //' | sed 's/ complete.*//')
if [ -z "$ONBOARDING_STATUS" ]; then
  ONBOARDING_STATUS="Not started or status unknown"
fi

FIREBASE_MIGRATION=$(grep "Migrated:" /tmp/firebase_status.txt | awk '{print $2}' | sed 's/[()%]//g')
if [ -z "$FIREBASE_MIGRATION" ]; then
  FIREBASE_MIGRATION="0%"
fi

# Get recently modified files
RECENT_FILES=$(./scripts/find-recent-files.sh --hours 8 2>/dev/null | head -5)
if [ -z "$RECENT_FILES" ]; then
  RECENT_FILES="No files modified today"
fi

# Find current tasks
OPEN_TASKS=$(grep -B 1 "\[ \]" status/status-log.md 2>/dev/null | sed 's/--//' | sed 's/\[ \]/To do:/' | grep -v "^$" | head -5)
if [ -z "$OPEN_TASKS" ]; then
  # Try to extract tasks from implementation status
  OPEN_TASKS=$(grep "- \[ \]" /tmp/implementation_status.txt 2>/dev/null | head -5)
  if [ -z "$OPEN_TASKS" ]; then
    OPEN_TASKS="1. Continue Firebase migration\n2. Improve dashboard implementation\n3. Enhance onboarding flow"
  fi
fi

# Generate session close template
cat > .roocode/sessions/close_${CURRENT_DATE}.md << EOF
**Session Close: ${CURRENT_DATE}**

Today I worked on the AI Sports Edge project, focusing on infrastructure improvements and implementation analysis.

Current project status:
- Firebase migration is ${FIREBASE_MIGRATION} complete
- User dashboard implementation is ${DASHBOARD_STATUS}
- Onboarding flow is ${ONBOARDING_STATUS}

I left off working on these files:
${RECENT_FILES}

Open tasks:
${OPEN_TASKS}

Tomorrow I plan to focus on continuing the Firebase migration and improving the ${DASHBOARD_STATUS//\%/% complete} user dashboard.

Please save this session state.
EOF

# Display template
echo "Session close template generated. Copy the text below to send to Roo:"
echo "========================================================"
cat .roocode/sessions/close_${CURRENT_DATE}.md
echo "========================================================"
echo "Template saved to .roocode/sessions/close_${CURRENT_DATE}.md"