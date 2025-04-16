#!/bin/bash

# Security Management Script
# This script orchestrates all security components for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Security Management${NC}"
echo "=================================================="

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PENTEST_SCRIPT="${SCRIPT_DIR}/penetration-testing.sh"
VULN_SCAN_SCRIPT="${SCRIPT_DIR}/vulnerability-scanning.sh"
RATE_LIMIT_SCRIPT="${SCRIPT_DIR}/api-rate-limiting.sh"
REPORTS_DIR="security-reports"
CONFIG_DIR="config/security"

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
    
    if ! check_script "$PENTEST_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$VULN_SCAN_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$RATE_LIMIT_SCRIPT"; then
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

# Function to initialize all security components
initialize_all() {
    section_header "Initializing All Security Components"
    
    echo -e "${YELLOW}Initializing Penetration Testing...${NC}"
    "$PENTEST_SCRIPT" --init
    echo -e "${GREEN}Penetration Testing initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Vulnerability Scanning...${NC}"
    "$VULN_SCAN_SCRIPT" --init
    echo -e "${GREEN}Vulnerability Scanning initialized.${NC}"
    
    echo -e "${YELLOW}Initializing API Rate Limiting...${NC}"
    "$RATE_LIMIT_SCRIPT" --init
    echo -e "${GREEN}API Rate Limiting initialized.${NC}"
    
    echo -e "${GREEN}All security components initialized successfully.${NC}"
}

# Function to run penetration testing
run_penetration_testing() {
    section_header "Running Penetration Testing"
    
    echo -e "${YELLOW}Running penetration tests...${NC}"
    "$PENTEST_SCRIPT" --run-all
    
    echo -e "${GREEN}Penetration testing completed.${NC}"
}

# Function to run vulnerability scanning
run_vulnerability_scanning() {
    section_header "Running Vulnerability Scanning"
    
    echo -e "${YELLOW}Running vulnerability scans...${NC}"
    "$VULN_SCAN_SCRIPT" --run-all
    
    echo -e "${GREEN}Vulnerability scanning completed.${NC}"
}

# Function to configure rate limiting
configure_rate_limiting() {
    section_header "Configuring API Rate Limiting"
    
    echo -e "${YELLOW}Configuring API rate limiting...${NC}"
    "$RATE_LIMIT_SCRIPT" --all
    
    echo -e "${GREEN}API rate limiting configured.${NC}"
}

# Function to generate security report
generate_security_report() {
    section_header "Generating Security Report"
    
    local current_date=$(date +"%Y-%m-%d")
    local report_file="${REPORTS_DIR}/security-report-${current_date}.html"
    
    echo "Generating comprehensive security report..."
    
    # Create HTML report
    cat > "${report_file}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - ${current_date}</title>
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
        .vulnerability {
            margin-bottom: 15px;
            padding: 15px;
            border-left: 4px solid;
        }
        .critical {
            border-left-color: #d9534f;
            background-color: #f9eaea;
        }
        .high {
            border-left-color: #f0ad4e;
            background-color: #fdf8e9;
        }
        .medium {
            border-left-color: #5bc0de;
            background-color: #eaf6fa;
        }
        .low {
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Report</h1>
        <p>AI Sports Edge - ${current_date}</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>This report presents the findings of security assessments conducted on AI Sports Edge infrastructure and applications on ${current_date}.</p>
        <p>The security assessment included penetration testing, vulnerability scanning, and API rate limiting configuration.</p>
    </div>
    
    <div class="section">
        <h2>Penetration Testing</h2>
        <p>Penetration testing was conducted to identify security vulnerabilities that could be exploited by attackers.</p>
        <p>For detailed findings, refer to the penetration testing report.</p>
    </div>
    
    <div class="section">
        <h2>Vulnerability Scanning</h2>
        <p>Vulnerability scanning was conducted to identify known vulnerabilities in the application code, dependencies, and infrastructure.</p>
        <p>For detailed findings, refer to the vulnerability scanning report.</p>
    </div>
    
    <div class="section">
        <h2>API Rate Limiting</h2>
        <p>API rate limiting has been configured to protect the API from abuse and ensure fair usage.</p>
        <p>The rate limiting configuration includes:</p>
        <ul>
            <li>Global rate limits</li>
            <li>Endpoint-specific rate limits</li>
            <li>User tier-based rate limits</li>
            <li>IP whitelisting</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <p>Based on the findings of this security assessment, the following recommendations are provided:</p>
        <ul>
            <li>Address all critical and high-severity vulnerabilities immediately</li>
            <li>Implement a regular security assessment schedule</li>
            <li>Conduct security training for development team</li>
            <li>Implement a security incident response plan</li>
            <li>Regularly update dependencies and apply security patches</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Conclusion</h2>
        <p>This security assessment has identified several security vulnerabilities and configuration improvements that should be addressed to improve the overall security posture of AI Sports Edge.</p>
        <p>It is recommended to remediate the identified vulnerabilities and conduct regular security assessments to ensure the ongoing security of the systems and applications.</p>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Security report generated: ${report_file}${NC}"
}

# Function to schedule regular security assessments
schedule_security_assessments() {
    section_header "Scheduling Regular Security Assessments"
    
    echo "Setting up scheduled security assessments..."
    
    # Schedule penetration testing (monthly)
    echo "Scheduling monthly penetration testing..."
    (crontab -l 2>/dev/null | grep -v "penetration-testing.sh"; echo "0 1 1 * * $(realpath "$PENTEST_SCRIPT") --run-all > ${REPORTS_DIR}/pentest-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule vulnerability scanning (weekly)
    echo "Scheduling weekly vulnerability scanning..."
    (crontab -l 2>/dev/null | grep -v "vulnerability-scanning.sh"; echo "0 2 * * 1 $(realpath "$VULN_SCAN_SCRIPT") --run-all > ${REPORTS_DIR}/vulnscan-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    # Schedule security report generation (monthly)
    echo "Scheduling monthly security report generation..."
    (crontab -l 2>/dev/null | grep -v "security-management.sh"; echo "0 3 1 * * $(realpath "$0") --generate-report > ${REPORTS_DIR}/security-report-scheduled-\$(date +\%Y-\%m-\%d).log 2>&1") | crontab -
    
    echo -e "${GREEN}Regular security assessments scheduled.${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize all security components"
    echo "  --pentest             Run penetration testing"
    echo "  --vulnscan            Run vulnerability scanning"
    echo "  --ratelimit           Configure API rate limiting"
    echo "  --all                 Run all security assessments"
    echo "  --generate-report     Generate comprehensive security report"
    echo "  --schedule            Schedule regular security assessments"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize all security components"
    echo "  $0 --all                   # Run all security assessments"
    echo "  $0 --pentest               # Run only penetration testing"
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
            --pentest)
                run_penetration_testing
                exit 0
                ;;
            --vulnscan)
                run_vulnerability_scanning
                exit 0
                ;;
            --ratelimit)
                configure_rate_limiting
                exit 0
                ;;
            --all)
                run_penetration_testing
                run_vulnerability_scanning
                configure_rate_limiting
                generate_security_report
                
                echo -e "${GREEN}All security assessments completed.${NC}"
                exit 0
                ;;
            --generate-report)
                generate_security_report
                exit 0
                ;;
            --schedule)
                schedule_security_assessments
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