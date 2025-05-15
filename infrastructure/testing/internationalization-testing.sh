#!/bin/bash

# Internationalization Testing Script
# This script tests all supported languages for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Internationalization Testing${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
REPORTS_DIR="test-reports/internationalization"
CONFIG_DIR="config/testing"
I18N_CONFIG="${CONFIG_DIR}/i18n-config.json"
CURRENT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORTS_DIR}/i18n-report-${CURRENT_DATE}.html"
LOG_FILE="${REPORTS_DIR}/i18n-log-${CURRENT_DATE}.log"
SCREENSHOTS_DIR="${REPORTS_DIR}/screenshots"
TRANSLATIONS_DIR="translations"

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

# Function to create or update internationalization configuration
create_i18n_config() {
    if [ ! -f "${I18N_CONFIG}" ]; then
        # Create initial internationalization configuration file
        cat > "${I18N_CONFIG}" << EOF
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "isDefault": true,
      "direction": "ltr"
    },
    {
      "code": "es",
      "name": "Spanish",
      "isDefault": false,
      "direction": "ltr"
    },
    {
      "code": "fr",
      "name": "French",
      "isDefault": false,
      "direction": "ltr"
    },
    {
      "code": "de",
      "name": "German",
      "isDefault": false,
      "direction": "ltr"
    },
    {
      "code": "ar",
      "name": "Arabic",
      "isDefault": false,
      "direction": "rtl"
    }
  ],
  "urls": [
    {
      "name": "Home Page",
      "path": "/",
      "description": "Main landing page"
    },
    {
      "name": "Login Page",
      "path": "/login",
      "description": "User login page"
    },
    {
      "name": "Registration Page",
      "path": "/register",
      "description": "User registration page"
    },
    {
      "name": "Dashboard",
      "path": "/dashboard",
      "description": "User dashboard",
      "requiresAuth": true
    },
    {
      "name": "Predictions Page",
      "path": "/predictions",
      "description": "Sports predictions page",
      "requiresAuth": true
    },
    {
      "name": "Settings Page",
      "path": "/settings",
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
      "name": "Footer",
      "selector": "footer",
      "description": "Page footer"
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
    }
  ],
  "testCases": [
    {
      "name": "Language Switching",
      "description": "Test language switching functionality",
      "steps": [
        {
          "action": "navigate",
          "url": "/"
        },
        {
          "action": "click",
          "selector": ".language-selector"
        },
        {
          "action": "click",
          "selector": ".language-option[data-lang='es']"
        },
        {
          "action": "verify",
          "selector": "h1",
          "expectedText": {
            "es": "Predicciones deportivas con IA"
          }
        }
      ]
    },
    {
      "name": "RTL Support",
      "description": "Test right-to-left language support",
      "steps": [
        {
          "action": "navigate",
          "url": "/"
        },
        {
          "action": "click",
          "selector": ".language-selector"
        },
        {
          "action": "click",
          "selector": ".language-option[data-lang='ar']"
        },
        {
          "action": "verify",
          "attribute": "dir",
          "selector": "html",
          "expectedValue": "rtl"
        }
      ]
    },
    {
      "name": "Date Formatting",
      "description": "Test date formatting in different languages",
      "steps": [
        {
          "action": "navigate",
          "url": "/predictions"
        },
        {
          "action": "verify",
          "selector": ".date-display",
          "regex": true,
          "expectedText": {
            "en": "\\d{1,2}/\\d{1,2}/\\d{4}",
            "fr": "\\d{1,2}/\\d{1,2}/\\d{4}",
            "de": "\\d{1,2}\\.\\d{1,2}\\.\\d{4}"
          }
        }
      ]
    }
  ],
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
  "baseUrl": "http://localhost:3000"
}
EOF
        echo -e "${GREEN}Created initial internationalization configuration file: ${I18N_CONFIG}${NC}"
    else
        echo "Internationalization configuration file already exists: ${I18N_CONFIG}"
    fi
}

# Function to check translation files
check_translation_files() {
    section_header "Checking Translation Files"
    
    if [ ! -f "${I18N_CONFIG}" ]; then
        echo -e "${RED}Error: Internationalization configuration file not found: ${I18N_CONFIG}${NC}"
        return 1
    fi
    
    if [ ! -d "${TRANSLATIONS_DIR}" ]; then
        echo -e "${RED}Error: Translations directory not found: ${TRANSLATIONS_DIR}${NC}"
        return 1
    fi
    
    echo "Checking translation files..."
    
    # Get languages from config
    local languages=$(jq -r '.languages[].code' "${I18N_CONFIG}")
    
    # Check if translation files exist for each language
    for lang in $languages; do
        local translation_file="${TRANSLATIONS_DIR}/${lang}.json"
        
        if [ -f "${translation_file}" ]; then
            echo "Translation file for ${lang} exists: ${translation_file}"
            
            # Check if file is valid JSON
            if jq empty "${translation_file}" 2>/dev/null; then
                echo "  - Valid JSON format"
                
                # Count translation keys
                local key_count=$(jq 'length' "${translation_file}")
                echo "  - Contains ${key_count} translation keys"
            else
                echo -e "${RED}  - Invalid JSON format${NC}"
            fi
        else
            echo -e "${RED}Translation file for ${lang} not found: ${translation_file}${NC}"
        fi
    done
    
    # Compare translation files to check for missing keys
    local default_lang=$(jq -r '.languages[] | select(.isDefault == true) | .code' "${I18N_CONFIG}")
    local default_file="${TRANSLATIONS_DIR}/${default_lang}.json"
    
    if [ -f "${default_file}" ]; then
        echo ""
        echo "Comparing translation files with default language (${default_lang})..."
        
        # Get all keys from default language
        local default_keys=$(jq -r 'keys[]' "${default_file}")
        
        for lang in $languages; do
            if [ "${lang}" != "${default_lang}" ]; then
                local translation_file="${TRANSLATIONS_DIR}/${lang}.json"
                
                if [ -f "${translation_file}" ]; then
                    local missing_keys=0
                    
                    for key in $default_keys; do
                        if ! jq -e ".[\"${key}\"]" "${translation_file}" >/dev/null 2>&1; then
                            if [ $missing_keys -eq 0 ]; then
                                echo -e "${YELLOW}Missing keys in ${lang}:${NC}"
                            fi
                            
                            echo "  - ${key}"
                            missing_keys=$((missing_keys + 1))
                        fi
                    done
                    
                    if [ $missing_keys -eq 0 ]; then
                        echo -e "${GREEN}${lang}: No missing keys${NC}"
                    else
                        echo -e "${YELLOW}${lang}: ${missing_keys} missing keys${NC}"
                    fi
                fi
            fi
        done
    fi
    
    echo -e "${GREEN}Translation files check completed.${NC}"
}

# Function to create internationalization test script
create_i18n_test_script() {
    section_header "Creating Internationalization Test Script"
    
    if [ ! -f "${I18N_CONFIG}" ]; then
        echo -e "${RED}Error: Internationalization configuration file not found: ${I18N_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating internationalization test script..."
    
    # Create test script
    local test_script="${CONFIG_DIR}/run-i18n-tests.js"
    
    cat > "${test_script}" << EOF
/**
 * Internationalization Test Script
 * 
 * This script tests internationalization support in AI Sports Edge.
 * Generated on ${CURRENT_DATE}
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = require('./i18n-config.json');
const reportsDir = path.resolve(__dirname, '../../test-reports/internationalization');
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
    passed: 0,
    failed: 0,
    skipped: 0
  },
  languages: {},
  testCases: []
};

// Function to take a screenshot
async function takeScreenshot(page, name, lang) {
  const screenshotPath = path.join(
    screenshotsDir, 
    \`\${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_\${lang}.png\`
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return path.relative(reportsDir, screenshotPath);
}

// Function to login
async function login(page) {
  try {
    await page.goto(\`\${config.baseUrl}/login\`);
    
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

// Function to run a test case
async function runTestCase(page, testCase, lang) {
  console.log(\`Running test case: \${testCase.name} (Language: \${lang})\`);
  
  const result = {
    name: testCase.name,
    description: testCase.description,
    language: lang,
    steps: [],
    passed: true,
    screenshot: null
  };
  
  try {
    for (const step of testCase.steps) {
      const stepResult = {
        action: step.action,
        passed: true,
        error: null
      };
      
      try {
        switch (step.action) {
          case 'navigate':
            await page.goto(\`\${config.baseUrl}\${step.url}\`);
            break;
            
          case 'click':
            await page.waitForSelector(step.selector);
            await page.click(step.selector);
            break;
            
          case 'verify':
            await page.waitForSelector(step.selector);
            
            if (step.attribute) {
              // Verify attribute value
              const attributeValue = await page.$eval(
                step.selector, 
                (el, attr) => el.getAttribute(attr), 
                step.attribute
              );
              
              if (attributeValue !== step.expectedValue) {
                throw new Error(
                  \`Expected attribute \${step.attribute} to be "\${step.expectedValue}" but got "\${attributeValue}"\`
                );
              }
            } else {
              // Verify text content
              const text = await page.$eval(step.selector, el => el.textContent.trim());
              
              if (step.regex) {
                const regex = new RegExp(step.expectedText[lang]);
                if (!regex.test(text)) {
                  throw new Error(
                    \`Text "\${text}" does not match regex "\${step.expectedText[lang]}"\`
                  );
                }
              } else {
                const expectedText = step.expectedText[lang];
                if (text !== expectedText) {
                  throw new Error(
                    \`Expected text to be "\${expectedText}" but got "\${text}"\`
                  );
                }
              }
            }
            break;
        }
        
        stepResult.passed = true;
      } catch (error) {
        stepResult.passed = false;
        stepResult.error = error.message;
        result.passed = false;
      }
      
      result.steps.push(stepResult);
    }
  } catch (error) {
    result.passed = false;
    result.error = error.message;
  }
  
  // Take a screenshot
  result.screenshot = await takeScreenshot(page, testCase.name, lang);
  
  return result;
}

// Main function
async function runInternationalizationTests() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: config.browser.width,
      height: config.browser.height,
      deviceScaleFactor: config.browser.deviceScaleFactor,
      isMobile: config.browser.mobile
    }
  });
  
  // Initialize results for each language
  for (const language of config.languages) {
    results.languages[language.code] = {
      name: language.name,
      passed: 0,
      failed: 0,
      skipped: 0,
      total: config.testCases.length
    };
  }
  
  // Login if required for any test cases
  let loggedIn = false;
  if (config.urls.some(url => url.requiresAuth)) {
    const page = await browser.newPage();
    loggedIn = await login(page);
    await page.close();
    
    if (!loggedIn) {
      console.error('Could not log in. Skipping authenticated pages.');
    }
  }
  
  // Run tests for each language
  for (const language of config.languages) {
    console.log(\`Testing language: \${language.name} (\${language.code})\`);
    
    const page = await browser.newPage();
    
    // Set language
    await page.setExtraHTTPHeaders({
      'Accept-Language': \`\${language.code},en-US;q=0.9,en;q=0.8\`
    });
    
    // Run each test case
    for (const testCase of config.testCases) {
      const result = await runTestCase(page, testCase, language.code);
      
      // Update summary
      results.summary.total++;
      if (result.passed) {
        results.summary.passed++;
        results.languages[language.code].passed++;
      } else {
        results.summary.failed++;
        results.languages[language.code].failed++;
      }
      
      results.testCases.push(result);
    }
    
    await page.close();
  }
  
  // Save results to file
  const resultsPath = path.join(reportsDir, 'i18n-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(\`Results saved to \${resultsPath}\`);
  
  await browser.close();
}

// Run the tests
runInternationalizationTests().catch(console.error);
EOF
    
    echo -e "${GREEN}Internationalization test script created: ${test_script}${NC}"
}

# Function to run internationalization tests
run_i18n_tests() {
    section_header "Running Internationalization Tests"
    
    echo "Running internationalization tests..."
    
    # Run test script
    local test_script="${CONFIG_DIR}/run-i18n-tests.js"
    if [ -f "${test_script}" ]; then
        echo "Running internationalization test script..."
        node "${test_script}" 2>> "${LOG_FILE}" || true
    else
        echo -e "${RED}Error: Internationalization test script not found: ${test_script}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Internationalization tests completed.${NC}"
}

# Function to generate internationalization report
generate_i18n_report() {
    section_header "Generating Internationalization Report"
    
    echo "Generating internationalization report..."
    
    # Check if test results file exists
    local results_file="${REPORTS_DIR}/i18n-results.json"
    if [ ! -f "${results_file}" ]; then
        echo -e "${YELLOW}Warning: Test results file not found. Run tests first.${NC}"
        return
    fi
    
    # Create HTML report
    cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Internationalization Test Report - ${CURRENT_DATE}</title>
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
        .test-case {
            margin-bottom: 15px;
            padding: 15px;
            border-left: 4px solid;
        }
        .passed {
            border-left-color: #5cb85c;
            background-color: #eaf6ea;
        }
        .failed {
            border-left-color: #d9534f;
            background-color: #f9eaea;
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
        .step {
            margin-left: 20px;
            margin-bottom: 10px;
        }
        .step.failed {
            border-left-color: #d9534f;
            background-color: #f9eaea;
        }
        .step.passed {
            border-left-color: #5cb85c;
            background-color: #eaf6ea;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Internationalization Test Report</h1>
        <p>AI Sports Edge - ${CURRENT_DATE}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr>
                <th>Total Tests</th>
                <td id="total-tests">$(jq '.summary.total' "${results_file}")</td>
            </tr>
            <tr>
                <th>Passed Tests</th>
                <td id="passed-tests">$(jq '.summary.passed' "${results_file}")</td>
            </tr>
            <tr>
                <th>Failed Tests</th>
                <td id="failed-tests">$(jq '.summary.failed' "${results_file}")</td>
            </tr>
            <tr>
                <th>Skipped Tests</th>
                <td id="skipped-tests">$(jq '.summary.skipped' "${results_file}")</td>
            </tr>
            <tr>
                <th>Pass Rate</th>
                <td id="pass-rate">$(jq -r '.summary.passed / .summary.total * 100' "${results_file}")%</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Results by Language</h2>
        <table>
            <tr>
                <th>Language</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Skipped</th>
                <th>Pass Rate</th>
            </tr>
EOF
    
    # Add language results
    jq -r '.languages | to_entries[] | "            <tr><td>\(.value.name) (\(.key))</td><td>\(.value.passed)</td><td>\(.value.failed)</td><td>\(.value.skipped)</td><td>\(.value.passed / .value.total * 100)%</td></tr>"' "${results_file}" >> "${REPORT_FILE}"
    
    cat >> "${REPORT_FILE}" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Test Cases</h2>
EOF
    
    # Add test case results
    jq -r '.testCases[] | "        <div class=\"test-case \(if .passed then "passed" else "failed" end)\">\n            <h3>\(.name) (\(.language))</h3>\n            <p>\(.description)</p>\n            <p>Status: \(if .passed then "Passed" else "Failed" end)</p>\n            <h4>Steps:</h4>\n            <div class=\"steps\">\((.steps[] | "                <div class=\"step \(if .passed then "passed" else "failed" end)\">\n                    <p><strong>\(.action)</strong>\(if .error then ": \(.error)" else "" end)</p>\n                </div>") | join("\n"))\n            </div>\n            <img class=\"screenshot\" src=\"\(.screenshot)\" alt=\"Screenshot\">\n        </div>"' "${results_file}" >> "${REPORT_FILE}"
    
    cat >> "${REPORT_FILE}" << EOF
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Fix all failed tests to ensure proper internationalization support</li>
            <li>Add support for additional languages</li>
            <li>Ensure all text is properly translated</li>
            <li>Test with native speakers of each language</li>
            <li>Verify date, time, and number formatting in each language</li>
            <li>Ensure proper RTL support for languages like Arabic and Hebrew</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Internationalization report generated: ${REPORT_FILE}${NC}"
    echo "To view the report, open the file in a web browser."
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize internationalization testing configuration"
    echo "  --check-translations  Check translation files"
    echo "  --create-tests        Create internationalization tests"
    echo "  --run-tests           Run internationalization tests"
    echo "  --generate-report     Generate internationalization report"
    echo "  --all                 Run all internationalization testing steps"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize internationalization testing configuration"
    echo "  $0 --check-translations    # Check translation files"
    echo "  $0 --all                   # Run all internationalization testing steps"
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
                create_i18n_config
                exit 0
                ;;
            --check-translations)
                check_translation_files
                exit 0
                ;;
            --create-tests)
                if [ ! -f "${I18N_CONFIG}" ]; then
                    echo -e "${RED}Error: Internationalization configuration file not found: ${I18N_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                create_i18n_test_script
                exit 0
                ;;
            --run-tests)
                run_i18n_tests
                exit 0
                ;;
            --generate-report)
                generate_i18n_report
                exit 0
                ;;
            --all)
                create_i18n_config
                check_translation_files
                create_i18n_test_script
                run_i18n_tests
                generate_i18n_report
                
                echo -e "${GREEN}All internationalization testing steps completed.${NC}"
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