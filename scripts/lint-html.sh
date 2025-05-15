#!/bin/bash

# HTML Linting and Sanitization Script for AI Sports Edge
# This script checks HTML files for errors and sanitizes them

# Set default values
DIST_DIR="./dist"
REPORT_DIR="./health-report"
DATE_FORMAT=$(date +"%Y%m%d%H%M%S")
LINT_REPORT="${REPORT_DIR}/lint-report-${DATE_FORMAT}.md"
FIX_MODE=false
VERBOSE=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --dist) DIST_DIR="$2"; shift 2 ;;
    --report) REPORT_DIR="$2"; shift 2 ;;
    --fix) FIX_MODE=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Create report directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Start lint report
echo "# AI Sports Edge HTML Lint Report" > "${LINT_REPORT}"
echo "" >> "${LINT_REPORT}"
echo "**Date:** $(date)" >> "${LINT_REPORT}"
echo "**Directory:** ${DIST_DIR}" >> "${LINT_REPORT}"
echo "**Fix Mode:** $(if $FIX_MODE; then echo "Enabled"; else echo "Disabled"; fi)" >> "${LINT_REPORT}"
echo "" >> "${LINT_REPORT}"

echo "🔍 Starting HTML linting and sanitization..."
echo "📋 Report will be saved to: ${LINT_REPORT}"

# Check if required tools are installed
if ! command -v npx &> /dev/null; then
  echo "❌ npx is not installed. Please install Node.js and npm."
  echo "❌ npx is not installed. Please install Node.js and npm." >> "${LINT_REPORT}"
  exit 1
fi

# Install html-validate if not already installed
if ! npm list -g html-validate &> /dev/null; then
  echo "📦 Installing html-validate..."
  npm install -g html-validate
fi

# Find all HTML files in the dist directory
HTML_FILES=$(find ${DIST_DIR} -name "*.html")
HTML_COUNT=$(echo "${HTML_FILES}" | wc -l)

echo "📂 Found ${HTML_COUNT} HTML files to lint"
echo "" >> "${LINT_REPORT}"
echo "## Files Processed" >> "${LINT_REPORT}"
echo "" >> "${LINT_REPORT}"
echo "| File | Status | Issues |" >> "${LINT_REPORT}"
echo "|------|--------|--------|" >> "${LINT_REPORT}"

# Initialize counters
PASS_COUNT=0
FAIL_COUNT=0
FIXED_COUNT=0

# Process each HTML file
for file in $HTML_FILES; do
  if $VERBOSE; then
    echo "🔍 Processing ${file}..."
  fi
  
  # Run html-validate
  VALIDATION_RESULT=$(npx html-validate ${file} 2>&1)
  VALIDATION_STATUS=$?
  
  if [ $VALIDATION_STATUS -eq 0 ]; then
    # File passed validation
    echo "| $(basename ${file}) | ✅ Valid | 0 |" >> "${LINT_REPORT}"
    if $VERBOSE; then
      echo "✅ ${file} is valid"
    fi
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    # File failed validation
    ISSUE_COUNT=$(echo "${VALIDATION_RESULT}" | grep -c "error:")
    echo "| $(basename ${file}) | ❌ Invalid | ${ISSUE_COUNT} |" >> "${LINT_REPORT}"
    if $VERBOSE; then
      echo "❌ ${file} has ${ISSUE_COUNT} validation errors"
    fi
    FAIL_COUNT=$((FAIL_COUNT + 1))
    
    # Add detailed errors to report
    echo "" >> "${LINT_REPORT}"
    echo "### Issues in $(basename ${file})" >> "${LINT_REPORT}"
    echo "" >> "${LINT_REPORT}"
    echo "```" >> "${LINT_REPORT}"
    echo "${VALIDATION_RESULT}" >> "${LINT_REPORT}"
    echo "```" >> "${LINT_REPORT}"
    
    # Fix issues if fix mode is enabled
    if $FIX_MODE; then
      if $VERBOSE; then
        echo "🔧 Attempting to fix ${file}..."
      fi
      
      # Create a temporary file
      TEMP_FILE=$(mktemp)
      
      # Fix common HTML issues
      cat ${file} | \
        # Fix unclosed tags
        sed -E 's/<([a-z]+)([^>]*)>([^<]*)/&<\/\1>/g' | \
        # Fix missing alt attributes on images
        sed -E 's/<img([^>]*) src="([^"]*)"([^>]*)>/<img\1 src="\2"\3 alt="Image"\3>/g' | \
        # Fix missing lang attribute on html tag
        sed -E 's/<html([^>]*)>/<html\1 lang="en">/g' | \
        # Fix missing viewport meta tag
        sed -E 's/<head>/<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">/g' | \
        # Fix missing doctype
        sed -E '1s/^/<!DOCTYPE html>\n/' > ${TEMP_FILE}
      
      # Check if fixes resolved the issues
      FIXED_VALIDATION_RESULT=$(npx html-validate ${TEMP_FILE} 2>&1)
      FIXED_VALIDATION_STATUS=$?
      
      if [ $FIXED_VALIDATION_STATUS -eq 0 ]; then
        # Fixes were successful
        mv ${TEMP_FILE} ${file}
        echo "✅ Fixed issues in ${file}"
        echo "" >> "${LINT_REPORT}"
        echo "✅ Issues fixed automatically" >> "${LINT_REPORT}"
        FIXED_COUNT=$((FIXED_COUNT + 1))
      else
        # Fixes were not successful
        rm ${TEMP_FILE}
        echo "⚠️ Could not automatically fix all issues in ${file}"
        echo "" >> "${LINT_REPORT}"
        echo "⚠️ Could not fix all issues automatically" >> "${LINT_REPORT}"
      fi
    fi
  fi
done

# Add summary to report
echo "" >> "${LINT_REPORT}"
echo "## Summary" >> "${LINT_REPORT}"
echo "" >> "${LINT_REPORT}"
echo "| Metric | Count |" >> "${LINT_REPORT}"
echo "|--------|-------|" >> "${LINT_REPORT}"
echo "| Total Files | ${HTML_COUNT} |" >> "${LINT_REPORT}"
echo "| Valid Files | ${PASS_COUNT} |" >> "${LINT_REPORT}"
echo "| Invalid Files | ${FAIL_COUNT} |" >> "${LINT_REPORT}"
if $FIX_MODE; then
  echo "| Fixed Files | ${FIXED_COUNT} |" >> "${LINT_REPORT}"
fi

echo "📊 Linting Summary:"
echo "   Total Files: ${HTML_COUNT}"
echo "   Valid Files: ${PASS_COUNT}"
echo "   Invalid Files: ${FAIL_COUNT}"
if $FIX_MODE; then
  echo "   Fixed Files: ${FIXED_COUNT}"
fi

# Add overall status to report
echo "" >> "${LINT_REPORT}"
echo "## Overall Status" >> "${LINT_REPORT}"
echo "" >> "${LINT_REPORT}"

if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ **PASS** - All HTML files are valid" >> "${LINT_REPORT}"
  echo "✅ All HTML files are valid"
  exit 0
elif [ $FIX_MODE -eq true ] && [ $FIXED_COUNT -eq $FAIL_COUNT ]; then
  echo "✅ **PASS** - All issues were fixed automatically" >> "${LINT_REPORT}"
  echo "✅ All issues were fixed automatically"
  exit 0
else
  echo "❌ **FAIL** - Some HTML files have validation errors" >> "${LINT_REPORT}"
  echo "❌ Some HTML files have validation errors"
  exit 1
fi