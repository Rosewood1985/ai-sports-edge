#!/bin/bash

# Accessibility Audit Script
# This script conducts a final accessibility audit for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Accessibility Audit${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
REPORTS_DIR="test-reports/accessibility"
CONFIG_DIR="config/testing"
ACCESSIBILITY_CONFIG="${CONFIG_DIR}/accessibility-config.json"
CURRENT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORTS_DIR}/accessibility-report-${CURRENT_DATE}.html"
LOG_FILE="${REPORTS_DIR}/accessibility-log-${CURRENT_DATE}.log"
SCREENSHOTS_DIR="${REPORTS_DIR}/screenshots"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "jq" || exit 1

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to create directories
create_directories() {
    mkdir -p "${REPORTS_DIR}"
    mkdir -p "${CONFIG_DIR}"
    mkdir -p "${SCREENSHOTS_DIR}"
    echo "Created directories: ${REPORTS_DIR}, ${CONFIG_DIR}, ${SCREENSHOTS_DIR}"
}

# Function to create or update accessibility configuration
create_accessibility_config() {
    if [ ! -f "${ACCESSIBILITY_CONFIG}" ]; then
        # Create initial accessibility configuration file
        cat > "${ACCESSIBILITY_CONFIG}" << EOF
{
  "urls": [
    {
      "name": "Home Page",
      "url": "http://localhost:3000/",
      "description": "Main landing page"
    },
    {
      "name": "Login Page",
      "url": "http://localhost:3000/login",
      "description": "User login page"
    },
    {
      "name": "Registration Page",
      "url": "http://localhost:3000/register",
      "description": "User registration page"
    },
    {
      "name": "Dashboard",
      "url": "http://localhost:3000/dashboard",
      "description": "User dashboard",
      "requiresAuth": true
    },
    {
      "name": "Predictions Page",
      "url": "http://localhost:3000/predictions",
      "description": "Sports predictions page",
      "requiresAuth": true
    },
    {
      "name": "Settings Page",
      "url": "http://localhost:3000/settings",
      "description": "User settings page",
      "requiresAuth": true
    }
  ],
  "components": [
    {
      "name": "Navigation Menu",
      "selector": "nav",
      "description": "Main navigation menu"
    },
    {
      "name": "Login Form",
      "selector": "form[action='/login']",
      "description": "User login form"
    },
    {
      "name": "Registration Form",
      "selector": "form[action='/register']",
      "description": "User registration form"
    },
    {
      "name": "Prediction Card",
      "selector": ".prediction-card",
      "description": "Card displaying prediction information"
    },
    {
      "name": "Settings Form",
      "selector": "form[action='/settings']",
      "description": "User settings form"
    }
  ],
  "standards": {
    "wcag2a": true,
    "wcag2aa": true,
    "wcag2aaa": false,
    "section508": true
  },
  "browser": {
    "width": 1280,
    "height": 800,
    "deviceScaleFactor": 1,
    "mobile": false
  },
  "auth": {
    "username": "test@example.com",
    "password": "password123"
  },
  "thresholds": {
    "error": 0,
    "warning": 5,
    "notice": 10
  }
}
EOF
        echo -e "${GREEN}Created initial accessibility configuration file: ${ACCESSIBILITY_CONFIG}${NC}"
    else
        echo "Accessibility configuration file already exists: ${ACCESSIBILITY_CONFIG}"
    fi
}

# Function to install accessibility testing tools
install_accessibility_tools() {
    section_header "Installing Accessibility Testing Tools"
    
    echo "Checking for required npm packages..."
    
    # Check if pa11y is installed
    if ! npm list -g pa11y &> /dev/null; then
        echo "Installing pa11y globally..."
        npm install -g pa11y
    else
        echo "pa11y is already installed."
    fi
    
    # Check if pa11y-ci is installed
    if ! npm list -g pa11y-ci &> /dev/null; then
        echo "Installing pa11y-ci globally..."
        npm install -g pa11y-ci
    else
        echo "pa11y-ci is already installed."
    fi
    
    # Check if axe-core is installed
    if ! npm list axe-core &> /dev/null; then
        echo "Installing axe-core locally..."
        npm install --save-dev axe-core
    else
        echo "axe-core is already installed."
    fi
    
    # Check if puppeteer is installed
    if ! npm list puppeteer &> /dev/null; then
        echo "Installing puppeteer locally..."
        npm install --save-dev puppeteer
    else
        echo "puppeteer is already installed."
    fi
    
    echo -e "${GREEN}Accessibility testing tools installed.${NC}"
}

# Function to create pa11y configuration
create_pa11y_config() {
    section_header "Creating Pa11y Configuration"
    
    if [ ! -f "${ACCESSIBILITY_CONFIG}" ]; then
        echo -e "${RED}Error: Accessibility configuration file not found: ${ACCESSIBILITY_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating Pa11y configuration file..."
    
    # Get URLs from config
    local urls=$(jq -r '.urls[] | select(.requiresAuth != true) | .url' "${ACCESSIBILITY_CONFIG}")
    
    # Create Pa11y CI configuration
    local pa11y_config="${CONFIG_DIR}/pa11y-ci.json"
    
    cat > "${pa11y_config}" << EOF
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "wait": 1000,
    "viewport": {
      "width": $(jq -r '.browser.width' "${ACCESSIBILITY_CONFIG}"),
      "height": $(jq -r '.browser.height' "${ACCESSIBILITY_CONFIG}")
    },
    "reporters": ["cli", "json"],
    "screenCapture": "${SCREENSHOTS_DIR}/\${PAGE_URL_HASH}.png"
  },
  "urls": [
EOF
    
    # Add URLs to configuration
    local first=true
    for url in $urls; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "${pa11y_config}"
        fi
        
        echo "    \"${url}\"" >> "${pa11y_config}"
    done
    
    # Close the configuration
    cat >> "${pa11y_config}" << EOF
  ]
}
EOF
    
    echo -e "${GREEN}Pa11y configuration created: ${pa11y_config}${NC}"
}

# Function to create axe configuration
create_axe_config() {
    section_header "Creating Axe Configuration"
    
    if [ ! -f "${ACCESSIBILITY_CONFIG}" ]; then
        echo -e "${RED}Error: Accessibility configuration file not found: ${ACCESSIBILITY_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating Axe configuration file..."
    
    # Create Axe configuration
    local axe_config="${CONFIG_DIR}/axe-config.json"
    
    cat > "${axe_config}" << EOF
{
  "reporter": "v2",
  "rules": {
    "color-contrast": { "enabled": true },
    "frame-title": { "enabled": true },
    "image-alt": { "enabled": true },
    "input-button-name": { "enabled": true },
    "input-image-alt": { "enabled": true },
    "label": { "enabled": true },
    "link-name": { "enabled": true },
    "list": { "enabled": true },
    "listitem": { "enabled": true },
    "meta-viewport": { "enabled": true },
    "region": { "enabled": true },
    "skip-link": { "enabled": true },
    "valid-lang": { "enabled": true }
  },
  "disableOtherRules": false,
  "tags": [
    "wcag2a",
    "wcag2aa"
  ]
}
EOF
    
    echo -e "${GREEN}Axe configuration created: ${axe_config}${NC}"
}

# Function to create accessibility test script
create_accessibility_test_script() {
    section_header "Creating Accessibility Test Script"
    
    if [ ! -f "${ACCESSIBILITY_CONFIG}" ]; then
        echo -e "${RED}Error: Accessibility configuration file not found: ${ACCESSIBILITY_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating accessibility test script..."
    
    # Create test script
    local test_script="${CONFIG_DIR}/run-accessibility-tests.js"
    
    cat > "${test_script}" << EOF
/**
 * Accessibility Test Script
 * 
 * This script runs accessibility tests on AI Sports Edge using axe-core and Puppeteer.
 * Generated on ${CURRENT_DATE}
 */

const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = require('./accessibility-config.json');
const reportsDir = path.resolve(__dirname, '../../test-reports/accessibility');
const screenshotsDir = path.resolve(reportsDir, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Results storage
const results = {
  summary: {
    total: 0,
    violations: 0,
    passes: 0,
    incomplete: 0,
    inapplicable: 0
  },
  pages: []
};

// Function to take a screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(screenshotsDir, \`\${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png\`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Function to login
async function login(page) {
  try {
    await page.goto(\`\${config.urls.find(u => u.name === 'Login Page').url}\`);
    
    // Fill in login form
    await page.type('input[name="email"]', config.auth.username);
    await page.type('input[name="password"]', config.auth.password);
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

// Main function
async function runAccessibilityTests() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: config.browser.width,
      height: config.browser.height,
      deviceScaleFactor: config.browser.deviceScaleFactor,
      isMobile: config.browser.mobile
    }
  });
  
  const page = await browser.newPage();
  
  // Login if required for any URLs
  let loggedIn = false;
  if (config.urls.some(url => url.requiresAuth)) {
    loggedIn = await login(page);
    if (!loggedIn) {
      console.error('Could not log in. Skipping authenticated pages.');
    }
  }
  
  // Test each URL
  for (const urlConfig of config.urls) {
    // Skip authenticated pages if login failed
    if (urlConfig.requiresAuth && !loggedIn) {
      console.log(\`Skipping \${urlConfig.name} (requires authentication)\`);
      continue;
    }
    
    console.log(\`Testing \${urlConfig.name} (\${urlConfig.url})...\`);
    
    try {
      // Navigate to the page
      await page.goto(urlConfig.url, { waitUntil: 'networkidle0' });
      
      // Take a screenshot
      const screenshotPath = await takeScreenshot(page, urlConfig.name);
      
      // Run axe analysis
      const results = await new AxePuppeteer(page)
        .configure({
          reporter: 'v2',
          runOnly: {
            type: 'tag',
            values: Object.entries(config.standards)
              .filter(([_, enabled]) => enabled)
              .map(([standard]) => standard)
          }
        })
        .analyze();
      
      // Add to results
      results.summary = {
        url: urlConfig.url,
        name: urlConfig.name,
        description: urlConfig.description,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        screenshot: path.relative(reportsDir, screenshotPath)
      };
      
      // Update overall summary
      results.summary.total += 1;
      results.summary.violations += results.violations.length;
      results.summary.passes += results.passes.length;
      results.summary.incomplete += results.incomplete.length;
      results.summary.inapplicable += results.inapplicable.length;
      
      // Add page results
      results.pages.push(results);
      
      console.log(\`  Found \${results.violations.length} violations\`);
    } catch (error) {
      console.error(\`Error testing \${urlConfig.name}:\`, error);
    }
  }
  
  // Save results to file
  const resultsPath = path.join(reportsDir, 'axe-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(\`Results saved to \${resultsPath}\`);
  
  await browser.close();
}

// Run the tests
runAccessibilityTests().catch(console.error);
EOF
    
    echo -e "${GREEN}Accessibility test script created: ${test_script}${NC}"
}

# Function to run accessibility tests
run_accessibility_tests() {
    section_header "Running Accessibility Tests"
    
    echo "Running accessibility tests..."
    
    # Run Pa11y CI
    local pa11y_config="${CONFIG_DIR}/pa11y-ci.json"
    if [ -f "${pa11y_config}" ]; then
        echo "Running Pa11y CI tests..."
        pa11y-ci --config "${pa11y_config}" --json > "${REPORTS_DIR}/pa11y-results.json" 2>> "${LOG_FILE}" || true
    else
        echo -e "${YELLOW}Warning: Pa11y configuration not found. Skipping Pa11y tests.${NC}"
    fi
    
    # Run Axe tests
    local test_script="${CONFIG_DIR}/run-accessibility-tests.js"
    if [ -f "${test_script}" ]; then
        echo "Running Axe tests..."
        node "${test_script}" 2>> "${LOG_FILE}" || true
    else
        echo -e "${YELLOW}Warning: Accessibility test script not found. Skipping Axe tests.${NC}"
    fi
    
    echo -e "${GREEN}Accessibility tests completed.${NC}"
}

# Function to generate accessibility report
generate_accessibility_report() {
    section_header "Generating Accessibility Report"
    
    echo "Generating accessibility report..."
    
    # Check if test results files exist
    local pa11y_results="${REPORTS_DIR}/pa11y-results.json"
    local axe_results="${REPORTS_DIR}/axe-results.json"
    
    if [ ! -f "${pa11y_results}" ] && [ ! -f "${axe_results}" ]; then
        echo -e "${YELLOW}Warning: No test results found. Run tests first.${NC}"
        return
    fi
    
    # Create HTML report
    cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report - ${CURRENT_DATE}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #0066cc;
        }
        .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
        }
        .issue {
            margin-bottom: 15px;
            padding: 15px;
            border-left: 4px solid;
        }
        .error {
            border-left-color: #d9534f;
            background-color: #f9eaea;
        }
        .warning {
            border-left-color: #f0ad4e;
            background-color: #fdf8e9;
        }
        .notice {
            border-left-color: #5bc0de;
            background-color: #eaf6fa;
        }
        .pass {
            border-left-color: #5cb85c;
            background-color: #eaf6ea;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .screenshot {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Audit Report</h1>
        <p>AI Sports Edge - ${CURRENT_DATE}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr>
                <th>Total Pages Tested</th>
                <td id="total-pages">0</td>
            </tr>
            <tr>
                <th>Total Issues</th>
                <td id="total-issues">0</td>
            </tr>
            <tr>
                <th>Errors</th>
                <td id="total-errors">0</td>
            </tr>
            <tr>
                <th>Warnings</th>
                <td id="total-warnings">0</td>
            </tr>
            <tr>
                <th>Notices</th>
                <td id="total-notices">0</td>
            </tr>
            <tr>
                <th>Passes</th>
                <td id="total-passes">0</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Issues by Page</h2>
        <div id="issues-by-page">
            <!-- Issues will be added here by the script -->
            <p>Processing test results...</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Fix all errors to ensure WCAG 2.1 AA compliance</li>
            <li>Address warnings to improve accessibility</li>
            <li>Consider notices for further accessibility improvements</li>
            <li>Conduct regular accessibility audits</li>
            <li>Include users with disabilities in testing</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Accessibility report generated: ${REPORT_FILE}${NC}"
    echo "To view the report, open the file in a web browser."
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize accessibility audit configuration"
    echo "  --install-tools       Install accessibility testing tools"
    echo "  --create-config       Create test configurations"
    echo "  --run-tests           Run accessibility tests"
    echo "  --generate-report     Generate accessibility report"
    echo "  --all                 Run all accessibility audit steps"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize accessibility audit configuration"
    echo "  $0 --install-tools         # Install accessibility testing tools"
    echo "  $0 --all                   # Run all accessibility audit steps"
}

# Main function
main() {
    # Create directories
    create_directories
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --init)
                create_accessibility_config
                exit 0
                ;;
            --install-tools)
                install_accessibility_tools
                exit 0
                ;;
            --create-config)
                if [ ! -f "${ACCESSIBILITY_CONFIG}" ]; then
                    echo -e "${RED}Error: Accessibility configuration file not found: ${ACCESSIBILITY_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                create_pa11y_config
                create_axe_config
                create_accessibility_test_script
                exit 0
                ;;
            --run-tests)
                run_accessibility_tests
                exit 0
                ;;
            --generate-report)
                generate_accessibility_report
                exit 0
                ;;
            --all)
                create_accessibility_config
                install_accessibility_tools
                create_pa11y_config
                create_axe_config
                create_accessibility_test_script
                run_accessibility_tests
                generate_accessibility_report
                
                echo -e "${GREEN}All accessibility audit steps completed.${NC}"
                exit 0
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Run the main function
main "$@"