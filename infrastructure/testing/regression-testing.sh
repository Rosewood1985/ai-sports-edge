#!/bin/bash

# Regression Testing Script
# This script performs complete regression testing for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Regression Testing${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
REPORTS_DIR="test-reports/regression"
CONFIG_DIR="config/testing"
REGRESSION_CONFIG="${CONFIG_DIR}/regression-config.json"
CURRENT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORTS_DIR}/regression-report-${CURRENT_DATE}.html"
LOG_FILE="${REPORTS_DIR}/regression-log-${CURRENT_DATE}.log"
TEST_DIR="__tests__/regression"

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

# Function to create or update regression configuration
create_regression_config() {
    if [ ! -f "${REGRESSION_CONFIG}" ]; then
        # Create initial regression configuration file
        cat > "${REGRESSION_CONFIG}" << EOF
{
  "testSuites": [
    {
      "name": "Unit Tests",
      "description": "Unit tests for individual components and functions",
      "command": "npm run test:unit",
      "directory": "__tests__/unit",
      "priority": "high",
      "threshold": 90
    },
    {
      "name": "Integration Tests",
      "description": "Integration tests for API and service interactions",
      "command": "npm run test:integration",
      "directory": "__tests__/integration",
      "priority": "high",
      "threshold": 85
    },
    {
      "name": "End-to-End Tests",
      "description": "End-to-end tests for user flows",
      "command": "npm run test:e2e",
      "directory": "__tests__/e2e",
      "priority": "medium",
      "threshold": 80
    }
  ],
  "criticalPaths": [
    {
      "name": "User Authentication",
      "description": "User login and registration flows",
      "testFiles": [
        "__tests__/e2e/auth/login.test.js",
        "__tests__/e2e/auth/registration.test.js",
        "__tests__/api/auth.test.js"
      ],
      "priority": "critical"
    },
    {
      "name": "Predictions",
      "description": "Sports predictions functionality",
      "testFiles": [
        "__tests__/e2e/predictions/view-predictions.test.js",
        "__tests__/api/predictions.test.js",
        "__tests__/unit/services/prediction-service.test.js"
      ],
      "priority": "critical"
    }
  ],
  "regressionSuites": [
    {
      "name": "Smoke Tests",
      "description": "Quick tests to verify basic functionality",
      "testFiles": [
        "__tests__/smoke/auth.test.js",
        "__tests__/smoke/predictions.test.js",
        "__tests__/smoke/navigation.test.js"
      ],
      "priority": "critical",
      "runFirst": true
    },
    {
      "name": "Full Regression",
      "description": "Complete regression test suite",
      "testSuites": ["Unit Tests", "Integration Tests", "End-to-End Tests"],
      "priority": "high"
    },
    {
      "name": "Critical Path Regression",
      "description": "Tests for critical user paths",
      "criticalPaths": ["User Authentication", "Predictions"],
      "priority": "critical"
    }
  ],
  "baseUrl": "http://localhost:3000",
  "apiBaseUrl": "http://localhost:3001/api",
  "browsers": ["chrome", "firefox"],
  "environments": ["development", "staging", "production"],
  "parallelization": {
    "enabled": true,
    "maxWorkers": 4
  }
}
EOF
        echo -e "${GREEN}Created initial regression configuration file: ${REGRESSION_CONFIG}${NC}"
    else
        echo "Regression configuration file already exists: ${REGRESSION_CONFIG}"
    fi
}

# Function to create Jest configuration for regression tests
create_jest_config() {
    section_header "Creating Jest Configuration"
    
    if [ ! -f "${REGRESSION_CONFIG}" ]; then
        echo -e "${RED}Error: Regression configuration file not found: ${REGRESSION_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating Jest configuration for regression tests..."
    
    # Create Jest configuration
    local jest_config="${CONFIG_DIR}/jest.regression.config.js"
    
    cat > "${jest_config}" << EOF
/**
 * Jest Configuration for Regression Tests
 * 
 * This configuration is used for running regression tests for AI Sports Edge.
 * Generated on ${CURRENT_DATE}
 */

const { defaults } = require('jest-config');
const config = require('./regression-config.json');

module.exports = {
  ...defaults,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    // Include all test files from regression test suites
    ...config.regressionSuites.flatMap(suite => 
      suite.testFiles || []
    ),
    // Include all test files from critical paths
    ...config.criticalPaths.flatMap(path => 
      path.testFiles || []
    )
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test-reports/regression/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-reports/regression',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporter', {
      pageTitle: 'Regression Test Report',
      outputPath: '<rootDir>/test-reports/regression/html-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  maxWorkers: config.parallelization.enabled ? config.parallelization.maxWorkers : 1,
  testTimeout: 30000,
  verbose: true
};
EOF
    
    echo -e "${GREEN}Jest configuration created: ${jest_config}${NC}"
}

# Function to create smoke test suite
create_smoke_tests() {
    section_header "Creating Smoke Tests"
    
    if [ ! -f "${REGRESSION_CONFIG}" ]; then
        echo -e "${RED}Error: Regression configuration file not found: ${REGRESSION_CONFIG}${NC}"
        return 1
    fi
    
    echo "Creating smoke tests..."
    
    # Create smoke test directory
    local smoke_test_dir="__tests__/smoke"
    mkdir -p "${smoke_test_dir}"
    
    # Create auth smoke test
    local auth_test_file="${smoke_test_dir}/auth.test.js"
    
    cat > "${auth_test_file}" << EOF
/**
 * Smoke Tests for Authentication
 * 
 * This file contains basic smoke tests for authentication functionality.
 * Generated on ${CURRENT_DATE}
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../screens/LoginScreen';
import RegistrationPage from '../../screens/RegistrationScreen';
import { AuthProvider } from '../../contexts/AuthContext';

describe('Authentication Smoke Tests', () => {
  test('Login page renders correctly', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('Registration page renders correctly', () => {
    render(
      <AuthProvider>
        <RegistrationPage />
      </AuthProvider>
    );
    
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
});
EOF
    
    echo -e "${GREEN}Smoke tests created.${NC}"
}

# Function to run regression tests
run_regression_tests() {
    section_header "Running Regression Tests"
    
    if [ ! -f "${REGRESSION_CONFIG}" ]; then
        echo -e "${RED}Error: Regression configuration file not found: ${REGRESSION_CONFIG}${NC}"
        return 1
    fi
    
    echo "Running regression tests..."
    
    # Get regression suites from config
    local regression_suites=$(jq -r '.regressionSuites[] | @base64' "${REGRESSION_CONFIG}")
    
    # Run smoke tests first
    local smoke_suite=$(echo "${regression_suites}" | grep -v grep | grep "Smoke Tests" | head -1)
    if [ -n "${smoke_suite}" ]; then
        local smoke_suite_decoded=$(echo "${smoke_suite}" | base64 --decode)
        local smoke_suite_name=$(echo "${smoke_suite_decoded}" | jq -r '.name')
        
        echo "Running ${smoke_suite_name}..."
        
        # Run smoke tests
        npx jest --testMatch="**/__tests__/smoke/**/*.test.js" --json --outputFile="${REPORTS_DIR}/smoke-results.json" | tee -a "${LOG_FILE}" || true
        
        # Check if smoke tests passed
        local smoke_failures=$(jq '.numFailedTests' "${REPORTS_DIR}/smoke-results.json")
        if [ "${smoke_failures}" -gt 0 ]; then
            echo -e "${RED}Smoke tests failed with ${smoke_failures} failures. Aborting regression tests.${NC}"
            return 1
        else
            echo -e "${GREEN}Smoke tests passed. Continuing with regression tests.${NC}"
        fi
    fi
    
    # Run full regression
    local full_suite=$(echo "${regression_suites}" | grep -v grep | grep "Full Regression" | head -1)
    if [ -n "${full_suite}" ]; then
        local full_suite_decoded=$(echo "${full_suite}" | base64 --decode)
        local full_suite_name=$(echo "${full_suite_decoded}" | jq -r '.name')
        local test_suites=$(echo "${full_suite_decoded}" | jq -r '.testSuites[]')
        
        echo "Running ${full_suite_name}..."
        
        for suite in $test_suites; do
            local suite_command=$(jq -r ".testSuites[] | select(.name == \"${suite}\") | .command" "${REGRESSION_CONFIG}")
            
            if [ -n "${suite_command}" ] && [ "${suite_command}" != "null" ]; then
                echo "Running test suite: ${suite} (${suite_command})"
                eval "${suite_command}" | tee -a "${LOG_FILE}" || true
            fi
        done
    fi
    
    echo -e "${GREEN}Regression tests completed.${NC}"
}

# Function to generate regression report
generate_regression_report() {
    section_header "Generating Regression Report"
    
    echo "Generating regression report..."
    
    # Check if test results files exist
    local smoke_results="${REPORTS_DIR}/smoke-results.json"
    
    if [ ! -f "${smoke_results}" ]; then
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
    <title>Regression Test Report - ${CURRENT_DATE}</title>
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
        .test-suite {
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
        <h1>Regression Test Report</h1>
        <p>AI Sports Edge - ${CURRENT_DATE}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr>
                <th>Test Suite</th>
                <th>Total Tests</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Pass Rate</th>
            </tr>
EOF
    
    # Add smoke test results
    if [ -f "${smoke_results}" ]; then
        local smoke_total=$(jq '.numTotalTests' "${smoke_results}")
        local smoke_passed=$(jq '.numPassedTests' "${smoke_results}")
        local smoke_failed=$(jq '.numFailedTests' "${smoke_results}")
        local smoke_pass_rate=$(echo "scale=2; ${smoke_passed} * 100 / ${smoke_total}" | bc)
        
        cat >> "${REPORT_FILE}" << EOF
            <tr>
                <td>Smoke Tests</td>
                <td>${smoke_total}</td>
                <td>${smoke_passed}</td>
                <td>${smoke_failed}</td>
                <td>${smoke_pass_rate}%</td>
            </tr>
EOF
    fi
    
    cat >> "${REPORT_FILE}" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Fix all failed tests</li>
            <li>Add more test coverage for critical paths</li>
            <li>Automate regression testing in CI/CD pipeline</li>
            <li>Run regression tests before each release</li>
            <li>Monitor test trends over time</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Regression report generated: ${REPORT_FILE}${NC}"
    echo "To view the report, open the file in a web browser."
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize regression testing configuration"
    echo "  --create-config       Create test configurations"
    echo "  --create-tests        Create regression tests"
    echo "  --run-tests           Run regression tests"
    echo "  --generate-report     Generate regression report"
    echo "  --all                 Run all regression testing steps"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize regression testing configuration"
    echo "  $0 --create-tests          # Create regression tests"
    echo "  $0 --all                   # Run all regression testing steps"
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
                create_regression_config
                exit 0
                ;;
            --create-config)
                if [ ! -f "${REGRESSION_CONFIG}" ]; then
                    echo -e "${RED}Error: Regression configuration file not found: ${REGRESSION_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                create_jest_config
                exit 0
                ;;
            --create-tests)
                if [ ! -f "${REGRESSION_CONFIG}" ]; then
                    echo -e "${RED}Error: Regression configuration file not found: ${REGRESSION_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                create_smoke_tests
                exit 0
                ;;
            --run-tests)
                run_regression_tests
                exit 0
                ;;
            --generate-report)
                generate_regression_report
                exit 0
                ;;
            --all)
                create_regression_config
                create_jest_config
                create_smoke_tests
                run_regression_tests
                generate_regression_report
                
                echo -e "${GREEN}All regression testing steps completed.${NC}"
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
