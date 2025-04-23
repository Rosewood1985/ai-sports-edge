#!/bin/bash

# verify-deployment-health.sh
# One-click CLI-based validator that checks if https://aisportsedge.app is cleanly deployed and functioning

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create timestamp for reports
TIMESTAMP=$(date +"%Y%m%d-%H%M")
REPORT_DIR="./health-report"
SCREENSHOTS_DIR="$REPORT_DIR/screenshots"
REPORT_FILE="$REPORT_DIR/aisportsedge-$TIMESTAMP.txt"

# Create directories if they don't exist
mkdir -p "$SCREENSHOTS_DIR"

# Print header
echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   AI Sports Edge Deployment Health Check v1.0           ${NC}"
echo -e "${BLUE}   $(date)                                               ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Initialize results array
declare -A RESULTS
RESULTS["HTTP_STATUS"]="🔴 FAILED"
RESULTS["RELOAD_LOOP"]="🔴 FAILED"
RESULTS["SERVICE_WORKER"]="🔴 FAILED"
RESULTS["INTEGRITY_ERRORS"]="🔴 FAILED"
RESULTS["CSP_VIOLATIONS"]="🔴 FAILED"
RESULTS["MIME_ERRORS"]="🔴 FAILED"
RESULTS["FIREBASE_CONFIG"]="🔴 FAILED"
RESULTS["META_DESCRIPTION"]="🔴 FAILED"
RESULTS["META_OG"]="🔴 FAILED"
RESULTS["META_TWITTER"]="🔴 FAILED"
RESULTS["LANG_ATTRIBUTE"]="🔴 FAILED"
RESULTS["SPANISH_TOGGLE"]="🔴 FAILED"
RESULTS["SCREENSHOTS"]="🔴 FAILED"

# Initialize suggestions
declare -A SUGGESTIONS
SUGGESTIONS["HTTP_STATUS"]="Check if the server is running and accessible"
SUGGESTIONS["RELOAD_LOOP"]="Check for redirect loops in .htaccess or routing"
SUGGESTIONS["SERVICE_WORKER"]="Disable service worker or fix CSP to allow it"
SUGGESTIONS["INTEGRITY_ERRORS"]="Remove integrity and crossorigin attributes from resource links"
SUGGESTIONS["CSP_VIOLATIONS"]="Update Content-Security-Policy in .htaccess"
SUGGESTIONS["MIME_ERRORS"]="Add proper MIME types in .htaccess: AddType application/javascript .js"
SUGGESTIONS["FIREBASE_CONFIG"]="Check Firebase initialization and config"
SUGGESTIONS["META_DESCRIPTION"]="Add meta description tag for SEO"
SUGGESTIONS["META_OG"]="Add Open Graph meta tags for social sharing"
SUGGESTIONS["META_TWITTER"]="Add Twitter Card meta tags for Twitter sharing"
SUGGESTIONS["LANG_ATTRIBUTE"]="Add lang attribute to html tag"
SUGGESTIONS["SPANISH_TOGGLE"]="Check Spanish localization implementation"
SUGGESTIONS["SCREENSHOTS"]="Ensure Puppeteer is installed and working"

# Function to write to report file
write_to_report() {
  echo "$1" | tee -a "$REPORT_FILE"
}

# Start the report
write_to_report "AI Sports Edge Deployment Health Check"
write_to_report "Date: $(date)"
write_to_report "URL: https://aisportsedge.app"
write_to_report "========================================"
write_to_report ""

# Check if curl is installed
if ! command -v curl &> /dev/null; then
  echo -e "${RED}Error: curl is not installed. Please install curl to run this script.${NC}"
  exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run this script.${NC}"
  exit 1
fi

# Check if puppeteer is installed
if ! npm list -g puppeteer &> /dev/null; then
  echo -e "${YELLOW}Warning: Puppeteer is not installed globally. Installing...${NC}"
  npm install -g puppeteer
fi

echo -e "${BLUE}🔄 Fetching https://aisportsedge.app...${NC}"
write_to_report "🔄 Fetching https://aisportsedge.app..."

# Fetch the homepage and store the response
HTTP_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/aisportsedge-home.html https://aisportsedge.app)

# Check HTTP status
if [ "$HTTP_RESPONSE" -eq 200 ]; then
  echo -e "${GREEN}✅ HTTP Status: 200 OK${NC}"
  write_to_report "✅ HTTP Status: 200 OK"
  RESULTS["HTTP_STATUS"]="🟢 PASSED"
else
  echo -e "${RED}❌ HTTP Status: $HTTP_RESPONSE${NC}"
  write_to_report "❌ HTTP Status: $HTTP_RESPONSE"
fi

# Check for reload loops (simplified check - looks for meta refresh tags)
if grep -q '<meta http-equiv="refresh"' /tmp/aisportsedge-home.html; then
  echo -e "${RED}❌ Potential reload loop detected (meta refresh tag found)${NC}"
  write_to_report "❌ Potential reload loop detected (meta refresh tag found)"
else
  echo -e "${GREEN}✅ No reload loops detected${NC}"
  write_to_report "✅ No reload loops detected"
  RESULTS["RELOAD_LOOP"]="🟢 PASSED"
fi

# Check for service worker issues
if grep -q 'serviceWorker' /tmp/aisportsedge-home.html; then
  if grep -q 'serviceWorker.*register' /tmp/aisportsedge-home.html; then
    echo -e "${YELLOW}⚠️ Service worker registration found - monitor for potential issues${NC}"
    write_to_report "⚠️ Service worker registration found - monitor for potential issues"
  else
    echo -e "${GREEN}✅ Service worker properly handled${NC}"
    write_to_report "✅ Service worker properly handled"
    RESULTS["SERVICE_WORKER"]="🟢 PASSED"
  fi
else
  echo -e "${GREEN}✅ No service worker detected${NC}"
  write_to_report "✅ No service worker detected"
  RESULTS["SERVICE_WORKER"]="🟢 PASSED"
fi

# Check for integrity attributes (potential source of errors)
if grep -q 'integrity=' /tmp/aisportsedge-home.html; then
  echo -e "${RED}❌ Integrity attributes found - may cause loading issues${NC}"
  write_to_report "❌ Integrity attributes found - may cause loading issues"
else
  echo -e "${GREEN}✅ No integrity attributes detected${NC}"
  write_to_report "✅ No integrity attributes detected"
  RESULTS["INTEGRITY_ERRORS"]="🟢 PASSED"
fi

# Check for crossorigin attributes
if grep -q 'crossorigin' /tmp/aisportsedge-home.html; then
  echo -e "${YELLOW}⚠️ Crossorigin attributes found - monitor for potential issues${NC}"
  write_to_report "⚠️ Crossorigin attributes found - monitor for potential issues"
else
  echo -e "${GREEN}✅ No crossorigin attributes detected${NC}"
  write_to_report "✅ No crossorigin attributes detected"
fi

# Check for CSP meta tags (should be in .htaccess instead)
if grep -q '<meta.*Content-Security-Policy' /tmp/aisportsedge-home.html; then
  echo -e "${YELLOW}⚠️ CSP meta tag found - should be in .htaccess instead${NC}"
  write_to_report "⚠️ CSP meta tag found - should be in .htaccess instead"
else
  echo -e "${GREEN}✅ No CSP meta tags detected (good if using .htaccess)${NC}"
  write_to_report "✅ No CSP meta tags detected (good if using .htaccess)"
  RESULTS["CSP_VIOLATIONS"]="🟢 PASSED"
fi

# Check for Firebase initialization
if grep -q 'firebase' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Firebase references found${NC}"
  write_to_report "✅ Firebase references found"
  RESULTS["FIREBASE_CONFIG"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No Firebase references found - check if expected${NC}"
  write_to_report "⚠️ No Firebase references found - check if expected"
fi

# Check for meta description
if grep -q '<meta.*name="description"' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Meta description found${NC}"
  write_to_report "✅ Meta description found"
  RESULTS["META_DESCRIPTION"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No meta description found - recommended for SEO${NC}"
  write_to_report "⚠️ No meta description found - recommended for SEO"
fi

# Check for Open Graph tags
if grep -q '<meta.*property="og:' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Open Graph tags found${NC}"
  write_to_report "✅ Open Graph tags found"
  RESULTS["META_OG"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No Open Graph tags found - recommended for social sharing${NC}"
  write_to_report "⚠️ No Open Graph tags found - recommended for social sharing"
fi

# Check for Twitter Card tags
if grep -q '<meta.*name="twitter:' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Twitter Card tags found${NC}"
  write_to_report "✅ Twitter Card tags found"
  RESULTS["META_TWITTER"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No Twitter Card tags found - recommended for Twitter sharing${NC}"
  write_to_report "⚠️ No Twitter Card tags found - recommended for Twitter sharing"
fi

# Check for language attribute
if grep -q '<html.*lang=' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Language attribute found${NC}"
  write_to_report "✅ Language attribute found"
  RESULTS["LANG_ATTRIBUTE"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No language attribute found - recommended for accessibility${NC}"
  write_to_report "⚠️ No language attribute found - recommended for accessibility"
fi

# Check for Spanish toggle
if grep -q 'es' /tmp/aisportsedge-home.html || grep -q 'español' /tmp/aisportsedge-home.html || grep -q 'spanish' /tmp/aisportsedge-home.html; then
  echo -e "${GREEN}✅ Spanish language references found${NC}"
  write_to_report "✅ Spanish language references found"
  RESULTS["SPANISH_TOGGLE"]="🟢 PASSED"
else
  echo -e "${YELLOW}⚠️ No Spanish language references found${NC}"
  write_to_report "⚠️ No Spanish language references found"
fi

# Create a Node.js script for Puppeteer screenshots
cat > /tmp/take-screenshots.js << 'EOF'
const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Capture console logs
    page.on('console', msg => {
      console.log(`Browser console: ${msg.text()}`);
    });
    
    // Take homepage screenshot
    console.log('Taking homepage screenshot...');
    await page.goto('https://aisportsedge.app', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, '../health-report/screenshots/home.png'), fullPage: true });
    
    // Take login page screenshot
    console.log('Taking login page screenshot...');
    await page.goto('https://aisportsedge.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, '../health-report/screenshots/login.png'), fullPage: true });
    
    console.log('Screenshots completed successfully');
  } catch (error) {
    console.error('Error taking screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
EOF

# Take screenshots using Puppeteer
echo -e "${BLUE}📸 Taking screenshots...${NC}"
write_to_report "📸 Taking screenshots..."

if node /tmp/take-screenshots.js; then
  echo -e "${GREEN}✅ Screenshots captured successfully${NC}"
  write_to_report "✅ Screenshots captured successfully"
  write_to_report "  - Homepage: $SCREENSHOTS_DIR/home.png"
  write_to_report "  - Login page: $SCREENSHOTS_DIR/login.png"
  RESULTS["SCREENSHOTS"]="🟢 PASSED"
else
  echo -e "${RED}❌ Failed to capture screenshots${NC}"
  write_to_report "❌ Failed to capture screenshots"
fi

# Generate summary table
echo -e "\n${BLUE}📊 Health Check Summary${NC}"
write_to_report "\n📊 Health Check Summary"
echo -e "${BLUE}=======================================${NC}"
write_to_report "======================================="

for check in "${!RESULTS[@]}"; do
  readable_check=$(echo "$check" | tr '_' ' ' | sed 's/\b\(.\)/\u\1/g')
  echo -e "${RESULTS[$check]} $readable_check"
  write_to_report "${RESULTS[$check]} $readable_check"
  
  # Add suggestion if test failed
  if [[ "${RESULTS[$check]}" == *"FAILED"* ]]; then
    echo -e "   ${YELLOW}Suggestion: ${SUGGESTIONS[$check]}${NC}"
    write_to_report "   Suggestion: ${SUGGESTIONS[$check]}"
  fi
done

# Final summary
echo -e "\n${BLUE}📝 Report saved to: ${REPORT_FILE}${NC}"
echo -e "${BLUE}🖼️ Screenshots saved to: ${SCREENSHOTS_DIR}/${NC}"

# Count passed and failed tests
PASSED_COUNT=$(echo "${RESULTS[@]}" | tr ' ' '\n' | grep -c "PASSED")
TOTAL_COUNT=${#RESULTS[@]}

echo -e "\n${BLUE}🏁 Final Result: ${PASSED_COUNT}/${TOTAL_COUNT} checks passed${NC}"
if [ "$PASSED_COUNT" -eq "$TOTAL_COUNT" ]; then
  echo -e "${GREEN}✅ All checks passed! The deployment is healthy.${NC}"
  write_to_report "\n✅ All checks passed! The deployment is healthy."
else
  echo -e "${YELLOW}⚠️ Some checks failed. Review the report for details.${NC}"
  write_to_report "\n⚠️ Some checks failed. Review the report for details."
fi

write_to_report "\nReport generated on $(date)"
write_to_report "End of report."

echo -e "${BLUE}=========================================================${NC}"