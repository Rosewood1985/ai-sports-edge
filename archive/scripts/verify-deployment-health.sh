# ARCHIVED: This script has been consolidated into system-health-check.sh
# Archived on: 2025-05-13T20:54:19Z

#!/bin/bash

# Verify Deployment Health Script for AI Sports Edge
# This script checks the health of a deployment by validating files and running tests

# Set default values
SITE_URL="https://aisportsedge.app"
LOCAL_MODE=false
REPORT_DIR="./health-report"
DATE_FORMAT=$(date +"%Y%m%d%H%M%S")
HEALTH_REPORT="${REPORT_DIR}/health-check-${DATE_FORMAT}.md"
CONSOLE_LOG="${REPORT_DIR}/console-${DATE_FORMAT}.txt"
LIGHTHOUSE_REPORT="${REPORT_DIR}/lighthouse-${DATE_FORMAT}.html"
DIST_DIR="./dist"
CRITICAL_FILES=("index.html" "login.html" ".htaccess" "firebase-config.js")
CRITICAL_DIRS=("assets")
PASS=true

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --local) LOCAL_MODE=true; shift ;;
    --url) SITE_URL="$2"; shift 2 ;;
    --dist) DIST_DIR="$2"; shift 2 ;;
    --report) REPORT_DIR="$2"; shift 2 ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Create report directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Start health check report
echo "# AI Sports Edge Deployment Health Check" > "${HEALTH_REPORT}"
echo "" >> "${HEALTH_REPORT}"
echo "**Date:** $(date)" >> "${HEALTH_REPORT}"
echo "**URL:** ${SITE_URL}" >> "${HEALTH_REPORT}"
echo "**Mode:** $(if $LOCAL_MODE; then echo "Local"; else echo "Remote"; fi)" >> "${HEALTH_REPORT}"
echo "" >> "${HEALTH_REPORT}"

echo "🔍 Starting deployment health check..."
echo "📋 Report will be saved to: ${HEALTH_REPORT}"

# Check if critical files exist in dist directory
if $LOCAL_MODE; then
  echo "## File Structure Check" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  # Check critical files
  echo "### Critical Files" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  echo "| File | Status |" >> "${HEALTH_REPORT}"
  echo "|------|--------|" >> "${HEALTH_REPORT}"
  
  for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "${DIST_DIR}/${file}" ]; then
      echo "| ${file} | ✅ Present |" >> "${HEALTH_REPORT}"
      echo "✅ ${file} exists"
    else
      echo "| ${file} | ❌ Missing |" >> "${HEALTH_REPORT}"
      echo "❌ ${file} is missing"
      PASS=false
    fi
  done
  
  # Check critical directories
  echo "" >> "${HEALTH_REPORT}"
  echo "### Critical Directories" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  echo "| Directory | Status |" >> "${HEALTH_REPORT}"
  echo "|-----------|--------|" >> "${HEALTH_REPORT}"
  
  for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "${DIST_DIR}/${dir}" ]; then
      echo "| ${dir} | ✅ Present |" >> "${HEALTH_REPORT}"
      echo "✅ ${dir} exists"
    else
      echo "| ${dir} | ❌ Missing |" >> "${HEALTH_REPORT}"
      echo "❌ ${dir} is missing"
      PASS=false
    fi
  done
  
  # Validate HTML files
  echo "" >> "${HEALTH_REPORT}"
  echo "## HTML Validation" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  if command -v npx &> /dev/null; then
    echo "🔍 Validating HTML files..."
    
    # Install html-validate if not already installed
    if ! npm list -g html-validate &> /dev/null; then
      echo "📦 Installing html-validate..."
      npm install -g html-validate
    fi
    
    HTML_FILES=$(find ${DIST_DIR} -name "*.html")
    HTML_VALIDATION_PASS=true
    
    for file in $HTML_FILES; do
      echo "🔍 Validating ${file}..."
      VALIDATION_RESULT=$(npx html-validate ${file} 2>&1)
      
      if [ $? -eq 0 ]; then
        echo "| $(basename ${file}) | ✅ Valid |" >> "${HEALTH_REPORT}"
        echo "✅ ${file} is valid"
      else
        echo "| $(basename ${file}) | ❌ Invalid |" >> "${HEALTH_REPORT}"
        echo "❌ ${file} has validation errors"
        echo "" >> "${HEALTH_REPORT}"
        echo "```" >> "${HEALTH_REPORT}"
        echo "${VALIDATION_RESULT}" >> "${HEALTH_REPORT}"
        echo "```" >> "${HEALTH_REPORT}"
        HTML_VALIDATION_PASS=false
      fi
    done
    
    if [ "$HTML_VALIDATION_PASS" = false ]; then
      PASS=false
    fi
  else
    echo "⚠️ npx not available. Skipping HTML validation."
    echo "⚠️ npx not available. Skipping HTML validation." >> "${HEALTH_REPORT}"
  fi
fi

# Check remote site if not in local mode
if ! $LOCAL_MODE; then
  echo "## Remote Site Check" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  # Check if site is accessible
  echo "### Site Accessibility" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL})
  
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "| Status | ✅ Accessible (HTTP 200) |" >> "${HEALTH_REPORT}"
    echo "✅ Site is accessible (HTTP 200)"
  else
    echo "| Status | ❌ Not accessible (HTTP ${HTTP_STATUS}) |" >> "${HEALTH_REPORT}"
    echo "❌ Site is not accessible (HTTP ${HTTP_STATUS})"
    PASS=false
  fi
  
  # Check for critical resources
  echo "" >> "${HEALTH_REPORT}"
  echo "### Critical Resources" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  echo "| Resource | Status |" >> "${HEALTH_REPORT}"
  echo "|----------|--------|" >> "${HEALTH_REPORT}"
  
  # Check index.html
  INDEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL}/index.html)
  if [ "$INDEX_STATUS" -eq 200 ]; then
    echo "| index.html | ✅ Available (HTTP 200) |" >> "${HEALTH_REPORT}"
    echo "✅ index.html is available"
  else
    echo "| index.html | ❌ Not available (HTTP ${INDEX_STATUS}) |" >> "${HEALTH_REPORT}"
    echo "❌ index.html is not available"
    PASS=false
  fi
  
  # Check login.html
  LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL}/login.html)
  if [ "$LOGIN_STATUS" -eq 200 ]; then
    echo "| login.html | ✅ Available (HTTP 200) |" >> "${HEALTH_REPORT}"
    echo "✅ login.html is available"
  else
    echo "| login.html | ❌ Not available (HTTP ${LOGIN_STATUS}) |" >> "${HEALTH_REPORT}"
    echo "❌ login.html is not available"
    PASS=false
  fi
  
  # Check firebase-config.js
  FIREBASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL}/firebase-config.js)
  if [ "$FIREBASE_STATUS" -eq 200 ]; then
    echo "| firebase-config.js | ✅ Available (HTTP 200) |" >> "${HEALTH_REPORT}"
    echo "✅ firebase-config.js is available"
  else
    echo "| firebase-config.js | ❌ Not available (HTTP ${FIREBASE_STATUS}) |" >> "${HEALTH_REPORT}"
    echo "❌ firebase-config.js is not available"
    PASS=false
  fi
  
  # Check assets directory
  ASSETS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL}/assets/)
  if [ "$ASSETS_STATUS" -eq 200 ] || [ "$ASSETS_STATUS" -eq 301 ]; then
    echo "| assets/ | ✅ Available |" >> "${HEALTH_REPORT}"
    echo "✅ assets/ directory is available"
  else
    echo "| assets/ | ❌ Not available (HTTP ${ASSETS_STATUS}) |" >> "${HEALTH_REPORT}"
    echo "❌ assets/ directory is not available"
    PASS=false
  fi
  
  # Run Lighthouse audit if available
  echo "" >> "${HEALTH_REPORT}"
  echo "## Performance Audit" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  if command -v lighthouse &> /dev/null; then
    echo "🔍 Running Lighthouse audit..."
    
    lighthouse ${SITE_URL} --output=html --output-path=${LIGHTHOUSE_REPORT} --chrome-flags="--headless --no-sandbox" --quiet
    
    if [ $? -eq 0 ]; then
      echo "✅ Lighthouse audit completed successfully"
      echo "| Lighthouse Report | ✅ [View Report]($(basename ${LIGHTHOUSE_REPORT})) |" >> "${HEALTH_REPORT}"
      
      # Extract scores from Lighthouse report
      PERFORMANCE=$(grep -o '"performance":[0-9.]*' ${LIGHTHOUSE_REPORT} | cut -d: -f2)
      ACCESSIBILITY=$(grep -o '"accessibility":[0-9.]*' ${LIGHTHOUSE_REPORT} | cut -d: -f2)
      SEO=$(grep -o '"seo":[0-9.]*' ${LIGHTHOUSE_REPORT} | cut -d: -f2)
      
      echo "" >> "${HEALTH_REPORT}"
      echo "### Lighthouse Scores" >> "${HEALTH_REPORT}"
      echo "" >> "${HEALTH_REPORT}"
      echo "| Metric | Score |" >> "${HEALTH_REPORT}"
      echo "|--------|-------|" >> "${HEALTH_REPORT}"
      echo "| Performance | ${PERFORMANCE} |" >> "${HEALTH_REPORT}"
      echo "| Accessibility | ${ACCESSIBILITY} |" >> "${HEALTH_REPORT}"
      echo "| SEO | ${SEO} |" >> "${HEALTH_REPORT}"
      
      # Check if scores are acceptable
      if (( $(echo "${PERFORMANCE} < 0.7" | bc -l) )); then
        echo "⚠️ Performance score is below 0.7: ${PERFORMANCE}"
        PASS=false
      fi
      
      if (( $(echo "${ACCESSIBILITY} < 0.8" | bc -l) )); then
        echo "⚠️ Accessibility score is below 0.8: ${ACCESSIBILITY}"
        PASS=false
      fi
      
      if (( $(echo "${SEO} < 0.8" | bc -l) )); then
        echo "⚠️ SEO score is below 0.8: ${SEO}"
        PASS=false
      fi
    else
      echo "❌ Lighthouse audit failed"
      echo "| Lighthouse Report | ❌ Failed to generate |" >> "${HEALTH_REPORT}"
      PASS=false
    fi
  else
    echo "⚠️ Lighthouse not available. Skipping performance audit."
    echo "⚠️ Lighthouse not available. Skipping performance audit." >> "${HEALTH_REPORT}"
  fi
  
  # Check for console errors using headless Chrome
  echo "" >> "${HEALTH_REPORT}"
  echo "## Console Errors" >> "${HEALTH_REPORT}"
  echo "" >> "${HEALTH_REPORT}"
  
  if command -v node &> /dev/null; then
    echo "🔍 Checking for console errors..."
    
    # Create temporary script to check console errors
    TEMP_SCRIPT=$(mktemp)
    
    cat > $TEMP_SCRIPT << EOL
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      reason: request.failure().errorText
    });
  });
  
  try {
    await page.goto('${SITE_URL}', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a bit for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('CONSOLE_LOGS_START');
    console.log(JSON.stringify(logs, null, 2));
    console.log('CONSOLE_LOGS_END');
    
    console.log('PAGE_ERRORS_START');
    console.log(JSON.stringify(errors, null, 2));
    console.log('PAGE_ERRORS_END');
    
    console.log('FAILED_REQUESTS_START');
    console.log(JSON.stringify(failedRequests, null, 2));
    console.log('FAILED_REQUESTS_END');
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  await browser.close();
})();
EOL
    
    # Run the script if puppeteer is installed
    if npm list -g puppeteer &> /dev/null || npm list puppeteer &> /dev/null; then
      node $TEMP_SCRIPT > ${CONSOLE_LOG}
      
      # Extract logs, errors, and failed requests
      CONSOLE_LOGS=$(sed -n '/CONSOLE_LOGS_START/,/CONSOLE_LOGS_END/p' ${CONSOLE_LOG} | grep -v "CONSOLE_LOGS_")
      PAGE_ERRORS=$(sed -n '/PAGE_ERRORS_START/,/PAGE_ERRORS_END/p' ${CONSOLE_LOG} | grep -v "PAGE_ERRORS_")
      FAILED_REQUESTS=$(sed -n '/FAILED_REQUESTS_START/,/FAILED_REQUESTS_END/p' ${CONSOLE_LOG} | grep -v "FAILED_REQUESTS_")
      
      # Check for errors
      ERROR_COUNT=$(echo "${PAGE_ERRORS}" | grep -v "[][]" | wc -l)
      FAILED_COUNT=$(echo "${FAILED_REQUESTS}" | grep -v "[][]" | wc -l)
      
      echo "" >> "${HEALTH_REPORT}"
      echo "### Console Output" >> "${HEALTH_REPORT}"
      echo "" >> "${HEALTH_REPORT}"
      echo "| Type | Count |" >> "${HEALTH_REPORT}"
      echo "|------|-------|" >> "${HEALTH_REPORT}"
      echo "| Errors | ${ERROR_COUNT} |" >> "${HEALTH_REPORT}"
      echo "| Failed Requests | ${FAILED_COUNT} |" >> "${HEALTH_REPORT}"
      
      if [ "${ERROR_COUNT}" -gt 0 ] || [ "${FAILED_COUNT}" -gt 0 ]; then
        echo "❌ Console errors or failed requests detected"
        echo "" >> "${HEALTH_REPORT}"
        echo "#### Errors" >> "${HEALTH_REPORT}"
        echo "" >> "${HEALTH_REPORT}"
        echo "```json" >> "${HEALTH_REPORT}"
        echo "${PAGE_ERRORS}" >> "${HEALTH_REPORT}"
        echo "```" >> "${HEALTH_REPORT}"
        echo "" >> "${HEALTH_REPORT}"
        echo "#### Failed Requests" >> "${HEALTH_REPORT}"
        echo "" >> "${HEALTH_REPORT}"
        echo "```json" >> "${HEALTH_REPORT}"
        echo "${FAILED_REQUESTS}" >> "${HEALTH_REPORT}"
        echo "```" >> "${HEALTH_REPORT}"
        PASS=false
      else
        echo "✅ No console errors or failed requests detected"
      fi
      
      # Clean up
      rm $TEMP_SCRIPT
    else
      echo "⚠️ Puppeteer not installed. Skipping console error check."
      echo "⚠️ Puppeteer not installed. Skipping console error check." >> "${HEALTH_REPORT}"
    fi
  else
    echo "⚠️ Node.js not available. Skipping console error check."
    echo "⚠️ Node.js not available. Skipping console error check." >> "${HEALTH_REPORT}"
  fi
fi

# Add overall status to report
echo "" >> "${HEALTH_REPORT}"
echo "## Overall Status" >> "${HEALTH_REPORT}"
echo "" >> "${HEALTH_REPORT}"

if [ "$PASS" = true ]; then
  echo "✅ **PASS** - All checks completed successfully" >> "${HEALTH_REPORT}"
  echo "✅ All checks completed successfully"
else
  echo "❌ **FAIL** - Some checks failed" >> "${HEALTH_REPORT}"
  echo "❌ Some checks failed"
fi

echo "" >> "${HEALTH_REPORT}"
echo "Report generated at $(date)" >> "${HEALTH_REPORT}"

echo "📋 Health check report saved to: ${HEALTH_REPORT}"

# Exit with appropriate status code
if [ "$PASS" = true ]; then
  exit 0
else
  exit 1
fi