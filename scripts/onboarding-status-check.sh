#!/bin/bash
# onboarding-status-check.sh - Analyzes the user onboarding implementation status

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

echo "🔍 Analyzing User Onboarding Implementation Status..."
echo "========================================================"

# Create output directory
mkdir -p reports
REPORT_FILE="reports/onboarding_status_$(date +%Y%m%d).md"

# Start fresh report
cat > $REPORT_FILE << EOF
# User Onboarding Status Report
Generated on $(date)

## Overview

EOF

# Find onboarding components
echo "Searching for onboarding components..."
ONBOARDING_FILES=$(find ./src -type f \( -name "*onboard*" -o -name "*Onboard*" -o -name "*signup*" -o -name "*SignUp*" -o -name "*sign-up*" -o -name "*welcome*" -o -name "*Welcome*" \) -not -path "*/node_modules/*" | sort)

# Count files
ONBOARDING_COUNT=$(echo "$ONBOARDING_FILES" | wc -l)

# Add to report
cat >> $REPORT_FILE << EOF
- **Onboarding Components Found**: $ONBOARDING_COUNT

## Onboarding Files

EOF

# Add files to report
if [ $ONBOARDING_COUNT -gt 0 ]; then
  echo "$ONBOARDING_FILES" | while read file; do
    echo "- \`$file\`" >> $REPORT_FILE
  done
else
  echo "No specific onboarding files found." >> $REPORT_FILE
fi

# Check for implementation completeness
echo -e "\n## Implementation Analysis\n" >> $REPORT_FILE

# Define key onboarding features to check for
FEATURES=(
  "registration"
  "sign up"
  "signup"
  "welcome"
  "tutorial"
  "guide"
  "walkthrough"
  "step"
  "progress"
  "preferences"
  "profile setup"
  "re-entry"
)

echo "Analyzing implementation completeness..."
for feature in "${FEATURES[@]}"; do
  if [ $ONBOARDING_COUNT -gt 0 ]; then
    MATCHES=$(grep -l -i "$feature" $ONBOARDING_FILES 2>/dev/null | wc -l)
    
    if [ $MATCHES -gt 0 ]; then
      echo "- ✅ **$feature**: Found in $MATCHES file(s)" >> $REPORT_FILE
    else
      echo "- ❌ **$feature**: Not found" >> $REPORT_FILE
    fi
  else
    echo "- ❌ **$feature**: Not found (no onboarding files)" >> $REPORT_FILE
  fi
done

# Check for authentication integration
echo -e "\n## Authentication Integration\n" >> $REPORT_FILE

AUTH_INTEGRATION=0
if [ $ONBOARDING_COUNT -gt 0 ]; then
  AUTH_INTEGRATION=$(grep -l -i "auth\|login\|authenticate\|createUser\|signUp" $ONBOARDING_FILES 2>/dev/null | wc -l)
fi

if [ $AUTH_INTEGRATION -gt 0 ]; then
  echo "- ✅ **Authentication Integration**: Found in $AUTH_INTEGRATION file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Authentication Integration**: Not found" >> $REPORT_FILE
fi

# Check for Firebase integration
echo -e "\n## Firebase Integration\n" >> $REPORT_FILE

FIREBASE_INTEGRATION=0
if [ $ONBOARDING_COUNT -gt 0 ]; then
  FIREBASE_INTEGRATION=$(grep -l -i "firebase\|firebaseService" $ONBOARDING_FILES 2>/dev/null | wc -l)
fi

if [ $FIREBASE_INTEGRATION -gt 0 ]; then
  echo "- ✅ **Firebase Integration**: Found in $FIREBASE_INTEGRATION file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Firebase Integration**: Not found" >> $REPORT_FILE
fi

# Check for multi-step flow
echo -e "\n## Onboarding Flow Structure\n" >> $REPORT_FILE

MULTI_STEP=0
if [ $ONBOARDING_COUNT -gt 0 ]; then
  MULTI_STEP=$(grep -l -i "step\|next\|previous\|progress\|wizard" $ONBOARDING_FILES 2>/dev/null | wc -l)
fi

if [ $MULTI_STEP -gt 0 ]; then
  echo "- ✅ **Multi-step Flow**: Found in $MULTI_STEP file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Multi-step Flow**: Not found" >> $REPORT_FILE
fi

# Check for re-entry functionality
REENTRY=0
if [ $ONBOARDING_COUNT -gt 0 ]; then
  REENTRY=$(grep -l -i "re-entry\|reentry\|resume\|continue\|incomplete" $ONBOARDING_FILES 2>/dev/null | wc -l)
fi

if [ $REENTRY -gt 0 ]; then
  echo "- ✅ **Re-entry Functionality**: Found in $REENTRY file(s)" >> $REPORT_FILE
else
  echo "- ❌ **Re-entry Functionality**: Not found" >> $REPORT_FILE
fi

# Add summary and recommendations
echo -e "\n## Summary\n" >> $REPORT_FILE

if [ $ONBOARDING_COUNT -eq 0 ]; then
  echo "No onboarding implementation found. User onboarding needs to be implemented from scratch." >> $REPORT_FILE
  
  echo -e "\n## Recommendations\n" >> $REPORT_FILE
  echo "1. Create a multi-step onboarding flow" >> $REPORT_FILE
  echo "2. Implement user registration and authentication" >> $REPORT_FILE
  echo "3. Add welcome screens and introductory tutorials" >> $REPORT_FILE
  echo "4. Implement profile and preferences setup" >> $REPORT_FILE
  echo "5. Add re-entry functionality for interrupted onboarding" >> $REPORT_FILE
else
  # Calculate completeness score
  FEATURES_FOUND=0
  for feature in "${FEATURES[@]}"; do
    MATCHES=$(grep -l -i "$feature" $ONBOARDING_FILES 2>/dev/null | wc -l)
    
    if [ $MATCHES -gt 0 ]; then
      FEATURES_FOUND=$((FEATURES_FOUND + 1))
    fi
  done
  
  COMPLETENESS=$((FEATURES_FOUND * 100 / ${#FEATURES[@]}))
  
  echo "User onboarding implementation is approximately $COMPLETENESS% complete based on key features." >> $REPORT_FILE
  
  echo -e "\n## Recommendations\n" >> $REPORT_FILE
  
  if [ $COMPLETENESS -lt 30 ]; then
    echo "1. Implementation is in early stages - focus on core functionality first" >> $REPORT_FILE
    echo "2. Add missing key features: " >> $REPORT_FILE
    for feature in "${FEATURES[@]}"; do
      MATCHES=$(grep -l -i "$feature" $ONBOARDING_FILES 2>/dev/null | wc -l)
      
      if [ $MATCHES -eq 0 ]; then
        echo "   - $feature" >> $REPORT_FILE
      fi
    done
  elif [ $COMPLETENESS -lt 70 ]; then
    echo "1. Implementation is partially complete - continue adding remaining features" >> $REPORT_FILE
    echo "2. Add missing features: " >> $REPORT_FILE
    for feature in "${FEATURES[@]}"; do
      MATCHES=$(grep -l -i "$feature" $ONBOARDING_FILES 2>/dev/null | wc -l)
      
      if [ $MATCHES -eq 0 ]; then
        echo "   - $feature" >> $REPORT_FILE
      fi
    done
  else
    echo "1. Implementation is mostly complete - focus on polish and optimization" >> $REPORT_FILE
    echo "2. Consider adding personalization based on user type" >> $REPORT_FILE
  fi
  
  if [ $AUTH_INTEGRATION -eq 0 ]; then
    echo "3. Add authentication integration" >> $REPORT_FILE
  fi
  
  if [ $FIREBASE_INTEGRATION -eq 0 ]; then
    echo "4. Add Firebase integration for data persistence" >> $REPORT_FILE
  fi
  
  if [ $MULTI_STEP -eq 0 ]; then
    echo "5. Implement a multi-step flow for better user experience" >> $REPORT_FILE
  fi
  
  if [ $REENTRY -eq 0 ]; then
    echo "6. Add re-entry functionality for users who don't complete onboarding in one session" >> $REPORT_FILE
  fi
fi

echo "User onboarding analysis complete. Report generated at $REPORT_FILE"