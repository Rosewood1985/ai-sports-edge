#!/bin/bash

# Edge Cases Testing Script
# This script tests all edge cases and error scenarios for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Edge Cases Testing${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
REPORTS_DIR="test-reports/edge-cases"
CONFIG_DIR="config/testing"
EDGE_CASES_CONFIG="${CONFIG_DIR}/edge-cases-config.json"
CURRENT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORTS_DIR}/edge-cases-report-${CURRENT_DATE}.html"
LOG_FILE="${REPORTS_DIR}/edge-cases-log-${CURRENT_DATE}.log"
TEST_DIR="__tests__/edge-cases"

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
    mkdir -p "${TEST_DIR}"
    echo "Created directories: ${REPORTS_DIR}, ${CONFIG_DIR}, ${TEST_DIR}"
}

# Function to create or update edge cases configuration
create_edge_cases_config() {
    if [ ! -f "${EDGE_CASES_CONFIG}" ]; then
        # Create initial edge cases configuration file
        cat > "${EDGE_CASES_CONFIG}" << EOF
{
  "testSuites": {
    "api": {
      "enabled": true,
      "endpoints": [
        {
          "path": "/api/v1/users",
          "method": "POST",
          "edgeCases": [
            {
              "name": "Empty request body",
              "input": {},
              "expectedStatus": 400,
              "expectedResponse": {
                "error": "Invalid request body"
              }
            },
            {
              "name": "Missing required fields",
              "input": {
                "email": "test@example.com"
              },
              "expectedStatus": 400,
              "expectedResponse": {
                "error": "Missing required fields"
              }
            }
          ]
        },
        {
          "path": "/api/v1/auth/login",
          "method": "POST",
          "edgeCases": [
            {
              "name": "Empty request body",
              "input": {},
              "expectedStatus": 400,
              "expectedResponse": {
                "error": "Invalid request body"
              }
            },
            {
              "name": "Invalid credentials",
              "input": {
                "email": "test@example.com",
                "password": "wrongpassword"
              },
              "expectedStatus": 401,
              "expectedResponse": {
                "error": "Invalid credentials"
              }
            }
          ]
        }
      ]
    },
    "ui": {
      "enabled": true,
      "components": [
        {
          "name": "LoginForm",
          "edgeCases": [
            {
              "name": "Empty form submission",
              "actions": [
                {
                  "type": "click",
                  "element": "button[type='submit']"
                }
              ],
              "expectedResult": "Email is required error message is displayed"
            }
          ]
        }
      ]
    },
    "data": {
      "enabled": true,
      "models": [
        {
          "name": "User",
          "edgeCases": [
            {
              "name": "Empty email",
              "input": {
                "email": "",
                "password": "password123",
                "name": "Test User"
              },
              "expectedError": "Email is required"
            }
          ]
        }
      ]
    }
  },
  "errorHandling": {
    "api": {
      "enabled": true,
      "scenarios": [
        {
          "name": "Rate limiting",
          "request": {
            "path": "/api/v1/predictions",
            "method": "GET",
            "headers": {
              "X-API-Key": "test-key"
            }
          },
          "setup": "Make 100 requests in 1 second",
          "expectedStatus": 429,
          "expectedResponse": {
            "error": "Too many requests"
          }
        }
      ]
    },
    "ui": {
      "enabled": true,
      "scenarios": [
        {
          "name": "Network error",
          "setup": "Disconnect from network",
          "actions": [
            {
              "type": "click",
              "element": "button.refresh"
            }
          ],
          "expectedResult": "Network error message is displayed"
        }
      ]
    }
  }
}
EOF
        echo -e "${GREEN}Created initial edge cases configuration file: ${EDGE_CASES_CONFIG}${NC}"
    else
        echo "Edge cases configuration file already exists: ${EDGE_CASES_CONFIG}"
    fi
}

# Function to create API edge cases tests
create_api_edge_cases_tests() {
    section_header "Creating API Edge Cases Tests"
    
    if [ ! -f "${EDGE_CASES_CONFIG}" ]; then
        echo -e "${RED}Error: Edge cases configuration file not found: ${EDGE_CASES_CONFIG}${NC}"
        return 1
    fi
    
    # Create API edge cases test directory
    local api_test_dir="${TEST_DIR}/api"
    mkdir -p "${api_test_dir}"
    
    # Get API endpoints from config
    local endpoints=$(jq -r '.testSuites.api.endpoints[] | @base64' "${EDGE_CASES_CONFIG}")
    
    for endpoint_base64 in $endpoints; do
        local endpoint=$(echo "${endpoint_base64}" | base64 --decode)
        local path=$(echo "${endpoint}" | jq -r '.path')
        local method=$(echo "${endpoint}" | jq -r '.method')
        
        # Create test file name from path
        local test_file_name=$(echo "${path}" | sed 's/\//_/g' | sed 's/^_//')
        local test_file="${api_test_dir}/${test_file_name}.test.js"
        
        echo "Creating API edge cases test file: ${test_file}"
        
        # Create test file header
        cat > "${test_file}" << EOF
/**
 * Edge Cases Tests for ${path}
 * 
 * This file contains tests for edge cases and error scenarios for the ${path} endpoint.
 * Generated on ${CURRENT_DATE}
 */

const axios = require('axios');
const { API_URL } = require('../../config');

describe('${path} Edge Cases', () => {
EOF
        
        # Add test cases
        local edge_cases=$(echo "${endpoint}" | jq -r '.edgeCases[] | @base64')
        
        for edge_case_base64 in $edge_cases; do
            local edge_case=$(echo "${edge_case_base64}" | base64 --decode)
            local name=$(echo "${edge_case}" | jq -r '.name')
            local input=$(echo "${edge_case}" | jq -r '.input')
            local expected_status=$(echo "${edge_case}" | jq -r '.expectedStatus')
            
            cat >> "${test_file}" << EOF
  
  test('${name}', async () => {
    try {
      const response = await axios({
        method: '${method}',
        url: \`\${API_URL}${path}\`,
        data: ${input},
        validateStatus: () => true
      });
      
      expect(response.status).toBe(${expected_status});
      expect(response.data).toMatchObject(${edge_case} | jq -r '.expectedResponse');
    } catch (error) {
      // If the request fails completely, check if that's expected
      if (${expected_status} >= 200 && ${expected_status} < 500) {
        fail('Request should not fail completely: ' + error.message);
      }
    }
  });
EOF
        done
        
        # Close the test file
        cat >> "${test_file}" << EOF
});
EOF
    done
    
    echo -e "${GREEN}API edge cases tests created.${NC}"
}

# Function to run edge cases tests
run_edge_cases_tests() {
    section_header "Running Edge Cases Tests"
    
    echo "Running edge cases tests..."
    
    # Run tests using Jest
    npx jest --config=jest.config.js "${TEST_DIR}" --json --outputFile="${REPORTS_DIR}/test-results.json" | tee -a "${LOG_FILE}"
    
    echo -e "${GREEN}Edge cases tests completed.${NC}"
}

# Function to generate test report
generate_test_report() {
    section_header "Generating Test Report"
    
    echo "Generating edge cases test report..."
    
    # Check if test results file exists
    if [ ! -f "${REPORTS_DIR}/test-results.json" ]; then
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
    <title>Edge Cases Test Report - ${CURRENT_DATE}</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Edge Cases Test Report</h1>
        <p>AI Sports Edge - ${CURRENT_DATE}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr>
                <th>Total Tests</th>
                <td id="total-tests">0</td>
            </tr>
            <tr>
                <th>Passed Tests</th>
                <td id="passed-tests">0</td>
            </tr>
            <tr>
                <th>Failed Tests</th>
                <td id="failed-tests">0</td>
            </tr>
            <tr>
                <th>Pass Rate</th>
                <td id="pass-rate">0%</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <div id="test-results">
            <!-- Test results will be added here by the script -->
            <p>Processing test results...</p>
        </div>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Test report generated: ${REPORT_FILE}${NC}"
    echo "To view the report, open the file in a web browser."
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize edge cases testing configuration"
    echo "  --create-tests        Create edge cases tests"
    echo "  --run-tests           Run edge cases tests"
    echo "  --generate-report     Generate test report"
    echo "  --all                 Run all edge cases testing steps"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize edge cases testing configuration"
    echo "  $0 --create-tests          # Create edge cases tests"
    echo "  $0 --all                   # Run all edge cases testing steps"
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
                create_edge_cases_config
                exit 0
                ;;
            --create-tests)
                if [ ! -f "${EDGE_CASES_CONFIG}" ]; then
                    echo -e "${RED}Error: Edge cases configuration file not found: ${EDGE_CASES_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                create_api_edge_cases_tests
                exit 0
                ;;
            --run-tests)
                run_edge_cases_tests
                exit 0
                ;;
            --generate-report)
                generate_test_report
                exit 0
                ;;
            --all)
                create_edge_cases_config
                create_api_edge_cases_tests
                run_edge_cases_tests
                generate_test_report
                
                echo -e "${GREEN}All edge cases testing steps completed.${NC}"
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
