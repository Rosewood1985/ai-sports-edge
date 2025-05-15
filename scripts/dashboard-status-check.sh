#!/bin/bash
# dashboard-status-check.sh - Analyzes the user dashboard implementation status

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

echo "🔍 Analyzing User Dashboard Implementation Status..."
echo "========================================================"

# Create output directory
mkdir -p reports
REPORT_FILE="reports/dashboard_status_$(date +%Y%m%d).md"

# Start fresh report
cat > $REPORT_FILE << EOF
# User Dashboard Status Report
Generated on $(date)

## Overview

EOF

# Find dashboard components
echo "Searching for dashboard components..."
DASHBOARD_FILES=$(find ./src -type f \( -name "*dashboard*" -o -name "*Dashboard*" \) -not -path "*/node_modules/*" | sort)
USER_DASHBOARD_FILES=$(find ./src -type f \( -name "*user*dashboard*" -o -name "*UserDashboard*" -o -name "*user-dashboard*" \) -not -path "*/node_modules/*" | sort)

# Count files
DASHBOARD_COUNT=$(echo "$DASHBOARD_FILES" | wc -l)
USER_DASHBOARD_COUNT=$(echo "$USER_DASHBOARD_FILES" | wc -l)

# Add to report
cat >> $REPORT_FILE << EOF
- **Dashboard Components Found**: $DASHBOARD_COUNT
- **User Dashboard Components Found**: $USER_DASHBOARD_COUNT

## User Dashboard Files

EOF

# Add files to report
if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
  echo "$USER_DASHBOARD_FILES" | while read file; do
    echo "- \`$file\`" >> $REPORT_FILE
  done
else
  echo "No specific user dashboard files found." >> $REPORT_FILE
fi

# Add general dashboard files if user dashboard not found
if [ $USER_DASHBOARD_COUNT -eq 0 ] && [ $DASHBOARD_COUNT -gt 0 ]; then
  echo -e "\n### Other Dashboard Files (May Include User Dashboard Functionality)\n" >> $REPORT_FILE
  echo "$DASHBOARD_FILES" | while read file; do
    echo "- \`$file\`" >> $REPORT_FILE
  done
fi

# Check for implementation completeness
echo -e "\n## Implementation Analysis\n" >> $REPORT_FILE

# Define key dashboard features to check for
FEATURES=(
  "user profile"
  "settings"
  "preferences"
  "notifications"
  "activity history"
  "stats"
  "analytics"
  "bet history"
  "transactions"
)

echo "Analyzing implementation completeness..."
for feature in "${FEATURES[@]}"; do
  # First check user dashboard files
  if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
    MATCHES=$(grep -l -i "$feature" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
  # If no user dashboard files, check general dashboard files
  elif [ $DASHBOARD_COUNT -gt 0 ]; then
    MATCHES=$(grep -l -i "$feature" $DASHBOARD_FILES 2>/dev/null | wc -l)
  else
    MATCHES=0
  fi
  
  if [ $MATCHES -gt 0 ]; then
    echo "- ✅ **$feature**: Found in $MATCHES file(s)" >> $REPORT_FILE
  else
    echo "- ❌ **$feature**: Not found" >> $REPORT_FILE
  fi
done

# Check for Firebase integration
echo -e "\n## Firebase Integration\n" >> $REPORT_FILE

FIREBASE_INTEGRATION=0
if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
  FIREBASE_INTEGRATION=$(grep -l -i "firebase\|firebaseService" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
elif [ $DASHBOARD_COUNT -gt 0 ]; then
  FIREBASE_INTEGRATION=$(grep -l -i "firebase\|firebaseService" $DASHBOARD_FILES 2>/dev/null | wc -l)
fi

if [ $FIREBASE_INTEGRATION -gt 0 ]; then
  echo "- ✅ **Firebase Integration**: Found in $FIREBASE_INTEGRATION file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Firebase Integration**: Not found" >> $REPORT_FILE
fi

# Check for responsive design
echo -e "\n## UI/UX Implementation\n" >> $REPORT_FILE

RESPONSIVE_DESIGN=0
if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
  RESPONSIVE_DESIGN=$(grep -l -i "responsive\|media query\|@media\|mobile" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
elif [ $DASHBOARD_COUNT -gt 0 ]; then
  RESPONSIVE_DESIGN=$(grep -l -i "responsive\|media query\|@media\|mobile" $DASHBOARD_FILES 2>/dev/null | wc -l)
fi

if [ $RESPONSIVE_DESIGN -gt 0 ]; then
  echo "- ✅ **Responsive Design**: Found in $RESPONSIVE_DESIGN file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Responsive Design**: Not found or limited" >> $REPORT_FILE
fi

# Check for authentication requirements
AUTH_CHECK=0
if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
  AUTH_CHECK=$(grep -l -i "auth\|login\|authenticate\|isAuthenticated\|requireAuth" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
elif [ $DASHBOARD_COUNT -gt 0 ]; then
  AUTH_CHECK=$(grep -l -i "auth\|login\|authenticate\|isAuthenticated\|requireAuth" $DASHBOARD_FILES 2>/dev/null | wc -l)
fi

if [ $AUTH_CHECK -gt 0 ]; then
  echo "- ✅ **Authentication Check**: Found in $AUTH_CHECK file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Authentication Check**: Not found" >> $REPORT_FILE
fi

# Add summary and recommendations
echo -e "\n## Summary\n" >> $REPORT_FILE

if [ $USER_DASHBOARD_COUNT -eq 0 ] && [ $DASHBOARD_COUNT -eq 0 ]; then
  echo "No dashboard implementation found. User dashboard needs to be implemented from scratch." >> $REPORT_FILE
  
  echo -e "\n## Recommendations\n" >> $REPORT_FILE
  echo "1. Create a user dashboard component structure" >> $REPORT_FILE
  echo "2. Implement key features: profile, settings, activity history, bet history" >> $REPORT_FILE
  echo "3. Integrate with Firebase for data fetching" >> $REPORT_FILE
  echo "4. Implement authentication checks" >> $REPORT_FILE
  echo "5. Add responsive design for mobile users" >> $REPORT_FILE
elif [ $USER_DASHBOARD_COUNT -eq 0 ] && [ $DASHBOARD_COUNT -gt 0 ]; then
  echo "Generic dashboard components found but no specific user dashboard implementation." >> $REPORT_FILE
  
  echo -e "\n## Recommendations\n" >> $REPORT_FILE
  echo "1. Create a specific user dashboard component extending existing dashboard functionality" >> $REPORT_FILE
  echo "2. Add missing features specific to users" >> $REPORT_FILE
  echo "3. Ensure Firebase integration is complete" >> $REPORT_FILE
  echo "4. Verify authentication requirements" >> $REPORT_FILE
else
  # Calculate completeness score
  FEATURES_FOUND=0
  for feature in "${FEATURES[@]}"; do
    if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
      MATCHES=$(grep -l -i "$feature" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
    else
      MATCHES=$(grep -l -i "$feature" $DASHBOARD_FILES 2>/dev/null | wc -l)
    fi
    
    if [ $MATCHES -gt 0 ]; then
      FEATURES_FOUND=$((FEATURES_FOUND + 1))
    fi
  done
  
  COMPLETENESS=$((FEATURES_FOUND * 100 / ${#FEATURES[@]}))
  
  echo "User dashboard implementation is approximately $COMPLETENESS% complete based on key features." >> $REPORT_FILE
  
  echo -e "\n## Recommendations\n" >> $REPORT_FILE
  
  if [ $COMPLETENESS -lt 30 ]; then
    echo "1. Implementation is in early stages - focus on core functionality first" >> $REPORT_FILE
    echo "2. Add missing key features: " >> $REPORT_FILE
    for feature in "${FEATURES[@]}"; do
      if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
        MATCHES=$(grep -l -i "$feature" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
      else
        MATCHES=$(grep -l -i "$feature" $DASHBOARD_FILES 2>/dev/null | wc -l)
      fi
      
      if [ $MATCHES -eq 0 ]; then
        echo "   - $feature" >> $REPORT_FILE
      fi
    done
  elif [ $COMPLETENESS -lt 70 ]; then
    echo "1. Implementation is partially complete - continue adding remaining features" >> $REPORT_FILE
    echo "2. Add missing features: " >> $REPORT_FILE
    for feature in "${FEATURES[@]}"; do
      if [ $USER_DASHBOARD_COUNT -gt 0 ]; then
        MATCHES=$(grep -l -i "$feature" $USER_DASHBOARD_FILES 2>/dev/null | wc -l)
      else
        MATCHES=$(grep -l -i "$feature" $DASHBOARD_FILES 2>/dev/null | wc -l)
      fi
      
      if [ $MATCHES -eq 0 ]; then
        echo "   - $feature" >> $REPORT_FILE
      fi
    done
  else
    echo "1. Implementation is mostly complete - focus on polish and optimization" >> $REPORT_FILE
    echo "2. Consider adding advanced features like customization and personalization" >> $REPORT_FILE
  fi
  
  if [ $FIREBASE_INTEGRATION -eq 0 ]; then
    echo "3. Add Firebase integration for data management" >> $REPORT_FILE
  fi
  
  if [ $AUTH_CHECK -eq 0 ]; then
    echo "4. Add authentication checks to protect dashboard access" >> $REPORT_FILE
  fi
  
  if [ $RESPONSIVE_DESIGN -eq 0 ]; then
    echo "5. Implement responsive design for mobile users" >> $REPORT_FILE
  fi
fi

echo "User dashboard analysis complete. Report generated at $REPORT_FILE"