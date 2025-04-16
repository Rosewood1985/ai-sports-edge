#!/bin/bash

# Testing Management Script
# This script orchestrates all testing components for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Testing Management${NC}"
echo "=================================================="

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EDGE_CASES_SCRIPT="${SCRIPT_DIR}/edge-cases-testing.sh"
ACCESSIBILITY_SCRIPT="${SCRIPT_DIR}/accessibility-audit.sh"
I18N_SCRIPT="${SCRIPT_DIR}/internationalization-testing.sh"
REGRESSION_SCRIPT="${SCRIPT_DIR}/regression-testing.sh"
REPORTS_DIR="test-reports"
CONFIG_DIR="config/testing"

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to check if a script exists and is executable
check_script() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}Error: Script $1 not found.${NC}"
        return 1
    fi
    
    if [ ! -x "$1" ]; then
        echo -e "${YELLOW}Warning: Script $1 is not executable. Making it executable...${NC}"
        chmod +x "$1"
    fi
    
    return 0
}

# Function to check all scripts
check_all_scripts() {
    local all_ok=true
    
    if ! check_script "$EDGE_CASES_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$ACCESSIBILITY_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$I18N_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$REGRESSION_SCRIPT"; then
        all_ok=false
    fi
    
    if [ "$all_ok" = false ]; then
        echo -e "${RED}Error: Some scripts are missing or not executable.${NC}"
        return 1
    fi
    
    return 0
}

# Function to create directories
create_directories() {
    mkdir -p "${REPORTS_DIR}"
    mkdir -p "${CONFIG_DIR}"
    echo "Created directories: ${REPORTS_DIR}, ${CONFIG_DIR}"
}

# Function to initialize all testing components
initialize_all() {
    section_header "Initializing All Testing Components"
    
    echo -e "${YELLOW}Initializing Edge Cases Testing...${NC}"
    "$EDGE_CASES_SCRIPT" --init
    echo -e "${GREEN}Edge Cases Testing initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Accessibility Audit...${NC}"
    "$ACCESSIBILITY_SCRIPT" --init
    echo -e "${GREEN}Accessibility Audit initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Internationalization Testing...${NC}"
    "$I18N_SCRIPT" --init
    echo -e "${GREEN}Internationalization Testing initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Regression Testing...${NC}"
    "$REGRESSION_SCRIPT" --init
    echo -e "${GREEN}Regression Testing initialized.${NC}"
    
    echo -e "${GREEN}All testing components initialized successfully.${NC}"
}

# Function to run edge cases tests
run_edge_cases_tests() {
    section_header "Running Edge Cases Tests"
    
    echo -e "${YELLOW}Running edge cases tests...${NC}"
    "$EDGE_CASES_SCRIPT" --all
    
    echo -e "${GREEN}Edge cases tests completed.${NC}"
}

# Function to run accessibility audit
run_accessibility_audit() {
    section_header "Running Accessibility Audit"
    
    echo -e "${YELLOW}Running accessibility audit...${NC}"
    "$ACCESSIBILITY_SCRIPT" --all
    
    echo -e "${GREEN}Accessibility audit completed.${NC}"
}

# Function to run internationalization tests
run_internationalization_tests() {
    section_header "Running Internationalization Tests"
    
    echo -e "${YELLOW}Running internationalization tests...${NC}"
    "$I18N_SCRIPT" --all
    
    echo -e "${GREEN}Internationalization tests completed.${NC}"
}

# Function to run regression tests
run_regression_tests() {
    section_header "Running Regression Tests"
    
    echo -e "${YELLOW}Running regression tests...${NC}"
    "$REGRESSION_SCRIPT" --all
    
    echo -e "${GREEN}Regression tests completed.${NC}"
}

# Function to generate comprehensive test report
generate_comprehensive_report() {
    section_header "Generating Comprehensive Test Report"
    
    local current_date=$(date +"%Y-%m-%d")
    local report_file="${REPORTS_DIR}/comprehensive-test-report-${current_date}.html"
    
    echo "Generating comprehensive test report..."
    
    # Create HTML report
    cat > "${report_file}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report - ${current_date}</title>
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
        .test-component {
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
        .warning {
            border-left-color: #f0ad4e;
            background-color: #fdf8e9;
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
        <h1>Comprehensive Test Report</h1>
        <p>AI Sports Edge - ${current_date}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <p>This report presents the results of comprehensive testing conducted on AI Sports Edge.</p>
        <p>The testing included edge cases testing, accessibility audit, internationalization testing, and regression testing.</p>
        
        <table>
            <tr>
                <th>Test Component</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Edge Cases Testing</td>
                <td id="edge-cases-status">Unknown</td>
                <td><a href="edge-cases/edge-cases-report-${current_date}.html">View Report</a></td>
            </tr>
            <tr>
                <td>Accessibility Audit</td>
                <td id="accessibility-status">Unknown</td>
                <td><a href="accessibility/accessibility-report-${current_date}.html">View Report</a></td>
            </tr>
            <tr>
                <td>Internationalization Testing</td>
                <td id="i18n-status">Unknown</td>
                <td><a href="internationalization/i18n-report-${current_date}.html">View Report</a></td>
            </tr>
            <tr>
                <td>Regression Testing</td>
                <td id="regression-status">Unknown</td>
                <td><a href="regression/regression-report-${current_date}.html">View Report</a></td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Fix all critical issues identified in the tests</li>
            <li>Address accessibility issues to ensure WCAG 2.1 AA compliance</li>
            <li>Improve internationalization support for all supported languages</li>
            <li>Increase test coverage for critical paths</li>
            <li>Automate all tests in the CI/CD pipeline</li>
            <li>Conduct regular testing before each release</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review all test reports in detail</li>
            <li>Prioritize issues based on severity and impact</li>
            <li>Create tickets for all identified issues</li>
            <li>Assign resources to fix the issues</li>
            <li>Re-run tests after fixes to verify resolution</li>
        </ol>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Comprehensive test report generated: ${report_file}${NC}"
    echo "To view the report, open the file in a web browser."
}

# Function to schedule regular testing
schedule_regular_testing() {
    section_header "Scheduling Regular Testing"
    
    echo "Setting up scheduled testing..."
    
    # Schedule regression testing (weekly)
    echo "Scheduling weekly regression testing..."
    (crontab -l 2>/dev/null | grep -v "regression-testing.sh"; echo "0 1 * * 1 $(realpath "$REGRESSION_SCRIPT") --all > ${REPORTS_DIR}/regression-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule accessibility audit (monthly)
    echo "Scheduling monthly accessibility audit..."
    (crontab -l 2>/dev/null | grep -v "accessibility-audit.sh"; echo "0 2 1 * * $(realpath "$ACCESSIBILITY_SCRIPT") --all > ${REPORTS_DIR}/accessibility-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule internationalization testing (monthly)
    echo "Scheduling monthly internationalization testing..."
    (crontab -l 2>/dev/null | grep -v "internationalization-testing.sh"; echo "0 3 1 * * $(realpath "$I18N_SCRIPT") --all > ${REPORTS_DIR}/i18n-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule edge cases testing (bi-weekly)
    echo "Scheduling bi-weekly edge cases testing..."
    (crontab -l 2>/dev/null | grep -v "edge-cases-testing.sh"; echo "0 4 1,15 * * $(realpath "$EDGE_CASES_SCRIPT") --all > ${REPORTS_DIR}/edge-cases-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule comprehensive report generation (monthly)
    echo "Scheduling monthly comprehensive report generation..."
    (crontab -l 2>/dev/null | grep -v "testing-management.sh"; echo "0 5 1 * * $(realpath "$0") --generate-report > ${REPORTS_DIR}/comprehensive-report-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    echo -e "${GREEN}Regular testing scheduled.${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize all testing components"
    echo "  --edge-cases          Run edge cases tests"
    echo "  --accessibility       Run accessibility audit"
    echo "  --i18n                Run internationalization tests"
    echo "  --regression          Run regression tests"
    echo "  --all                 Run all tests"
    echo "  --generate-report     Generate comprehensive test report"
    echo "  --schedule            Schedule regular testing"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize all testing components"
    echo "  $0 --all                   # Run all tests"
    echo "  $0 --edge-cases            # Run only edge cases tests"
}

# Main function
main() {
    # Create directories
    create_directories
    
    # Check all scripts
    if ! check_all_scripts; then
        exit 1
    fi
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --init)
                initialize_all
                exit 0
                ;;
            --edge-cases)
                run_edge_cases_tests
                exit 0
                ;;
            --accessibility)
                run_accessibility_audit
                exit 0
                ;;
            --i18n)
                run_internationalization_tests
                exit 0
                ;;
            --regression)
                run_regression_tests
                exit 0
                ;;
            --all)
                run_edge_cases_tests
                run_accessibility_audit
                run_internationalization_tests
                run_regression_tests
                generate_comprehensive_report
                
                echo -e "${GREEN}All tests completed.${NC}"
                exit 0
                ;;
            --generate-report)
                generate_comprehensive_report
                exit 0
                ;;
            --schedule)
                schedule_regular_testing
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