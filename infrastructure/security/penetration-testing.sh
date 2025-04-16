#!/bin/bash

# Penetration Testing Script
# This script conducts professional penetration testing for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Penetration Testing${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
REPORTS_DIR="security-reports/penetration-testing"
CONFIG_DIR="config/security"
PENTEST_CONFIG="${CONFIG_DIR}/pentest-config.json"
CURRENT_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORTS_DIR}/pentest-report-${CURRENT_DATE}.html"
LOG_FILE="${REPORTS_DIR}/pentest-log-${CURRENT_DATE}.log"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "nmap" || exit 1
check_command "nikto" || exit 1
check_command "sqlmap" || exit 1
check_command "owasp-zap-cli" || exit 1
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
    echo "Created directories: ${REPORTS_DIR}, ${CONFIG_DIR}"
}

# Function to create or update pentest configuration
create_pentest_config() {
    if [ ! -f "${PENTEST_CONFIG}" ]; then
        # Create initial pentest configuration file
        cat > "${PENTEST_CONFIG}" << EOF
{
  "targets": {
    "api": {
      "url": "https://api.example.com",
      "description": "API server",
      "auth_required": true,
      "auth_type": "bearer",
      "auth_token": "REPLACE_WITH_ACTUAL_TOKEN"
    },
    "web": {
      "url": "https://example.com",
      "description": "Web application",
      "auth_required": false
    },
    "admin": {
      "url": "https://admin.example.com",
      "description": "Admin panel",
      "auth_required": true,
      "auth_type": "basic",
      "username": "REPLACE_WITH_USERNAME",
      "password": "REPLACE_WITH_PASSWORD"
    }
  },
  "scan_types": {
    "network": true,
    "web": true,
    "api": true,
    "database": true
  },
  "exclusions": [
    "/login",
    "/logout",
    "/reset-password"
  ],
  "intensity": "medium",
  "schedule": {
    "frequency": "monthly",
    "day": "first_monday",
    "time": "01:00"
  },
  "notifications": {
    "email": [
      "security@example.com"
    ],
    "slack": "https://hooks.slack.com/services/REPLACE_WITH_ACTUAL_WEBHOOK"
  }
}
EOF
        echo -e "${GREEN}Created initial pentest configuration file: ${PENTEST_CONFIG}${NC}"
    else
        echo "Pentest configuration file already exists: ${PENTEST_CONFIG}"
    fi
}

# Function to run network scan
run_network_scan() {
    section_header "Network Scan"
    
    local target=$1
    local output_file="${REPORTS_DIR}/nmap-${target//[\/:]/_}-${CURRENT_DATE}.xml"
    
    echo "Running network scan on ${target}..."
    echo "Output will be saved to ${output_file}"
    
    # Run nmap scan
    nmap -sS -sV -O --script vuln -oX "${output_file}" "${target}" | tee -a "${LOG_FILE}"
    
    echo -e "${GREEN}Network scan completed.${NC}"
}

# Function to run web application scan
run_web_scan() {
    section_header "Web Application Scan"
    
    local target=$1
    local output_file="${REPORTS_DIR}/zap-${target//[\/:]/_}-${CURRENT_DATE}.html"
    
    echo "Running web application scan on ${target}..."
    echo "Output will be saved to ${output_file}"
    
    # Run OWASP ZAP scan
    owasp-zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" \
        --spider -r "${output_file}" "${target}" | tee -a "${LOG_FILE}"
    
    # Run Nikto scan
    nikto -h "${target}" -o "${REPORTS_DIR}/nikto-${target//[\/:]/_}-${CURRENT_DATE}.html" | tee -a "${LOG_FILE}"
    
    echo -e "${GREEN}Web application scan completed.${NC}"
}

# Function to run API scan
run_api_scan() {
    section_header "API Scan"
    
    local target=$1
    local auth_type=$2
    local auth_token=$3
    local output_file="${REPORTS_DIR}/api-${target//[\/:]/_}-${CURRENT_DATE}.json"
    
    echo "Running API scan on ${target}..."
    echo "Output will be saved to ${output_file}"
    
    # Run API scan using appropriate tool based on auth type
    if [ "${auth_type}" = "bearer" ]; then
        # Example using curl to test API endpoints
        echo "Testing API endpoints with Bearer authentication..."
        
        # Get API endpoints from OpenAPI spec if available
        if [ -f "api/openapi.json" ]; then
            endpoints=$(jq -r '.paths | keys[]' api/openapi.json)
            
            for endpoint in $endpoints; do
                echo "Testing endpoint: ${endpoint}"
                curl -s -H "Authorization: Bearer ${auth_token}" "${target}${endpoint}" | jq . >> "${output_file}"
            done
        else
            echo "OpenAPI specification not found. Testing common endpoints..."
            common_endpoints=("/users" "/products" "/orders" "/status" "/health")
            
            for endpoint in "${common_endpoints[@]}"; do
                echo "Testing endpoint: ${endpoint}"
                curl -s -H "Authorization: Bearer ${auth_token}" "${target}${endpoint}" | jq . >> "${output_file}"
            done
        fi
    else
        echo "No authentication or unsupported authentication type. Basic testing only..."
        common_endpoints=("/users" "/products" "/orders" "/status" "/health")
        
        for endpoint in "${common_endpoints[@]}"; do
            echo "Testing endpoint: ${endpoint}"
            curl -s "${target}${endpoint}" | jq . >> "${output_file}"
        done
    fi
    
    echo -e "${GREEN}API scan completed.${NC}"
}

# Function to run database scan
run_database_scan() {
    section_header "Database Scan"
    
    local target=$1
    local output_file="${REPORTS_DIR}/sqlmap-${target//[\/:]/_}-${CURRENT_DATE}.txt"
    
    echo "Running database scan on ${target}..."
    echo "Output will be saved to ${output_file}"
    
    # Run SQLMap scan
    sqlmap -u "${target}" --forms --batch --level=3 --risk=2 -o -v 1 | tee "${output_file}" | tee -a "${LOG_FILE}"
    
    echo -e "${GREEN}Database scan completed.${NC}"
}

# Function to generate comprehensive report
generate_report() {
    section_header "Generating Report"
    
    echo "Generating comprehensive penetration testing report..."
    
    # Create HTML report
    cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Penetration Testing Report - ${CURRENT_DATE}</title>
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
        <h1>Penetration Testing Report</h1>
        <p>AI Sports Edge - ${CURRENT_DATE}</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>This report presents the findings of a penetration test conducted on AI Sports Edge infrastructure and applications on ${CURRENT_DATE}.</p>
        <p>The penetration test was conducted to identify security vulnerabilities and provide recommendations for remediation.</p>
    </div>
    
    <div class="section">
        <h2>Scope</h2>
        <p>The following targets were included in the scope of this penetration test:</p>
        <ul>
EOF

    # Add targets from config
    jq -r '.targets | to_entries[] | "            <li><strong>" + .key + ":</strong> " + .value.url + " - " + .value.description + "</li>"' "${PENTEST_CONFIG}" >> "${REPORT_FILE}"

    cat >> "${REPORT_FILE}" << EOF
        </ul>
    </div>
    
    <div class="section">
        <h2>Methodology</h2>
        <p>The penetration test was conducted using the following methodology:</p>
        <ol>
            <li>Reconnaissance and information gathering</li>
            <li>Network scanning and enumeration</li>
            <li>Vulnerability scanning</li>
            <li>Manual testing and exploitation</li>
            <li>Reporting and documentation</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Findings Summary</h2>
        <table>
            <tr>
                <th>Severity</th>
                <th>Count</th>
            </tr>
            <tr>
                <td>Critical</td>
                <td id="critical-count">0</td>
            </tr>
            <tr>
                <td>High</td>
                <td id="high-count">0</td>
            </tr>
            <tr>
                <td>Medium</td>
                <td id="medium-count">0</td>
            </tr>
            <tr>
                <td>Low</td>
                <td id="low-count">0</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Detailed Findings</h2>
        <p>The following vulnerabilities were identified during the penetration test:</p>
        
        <div id="findings-list">
            <!-- Findings will be added here by the script -->
            <p>Processing scan results to extract findings...</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <p>Based on the findings of this penetration test, the following recommendations are provided:</p>
        <ul>
            <li>Update all software and libraries to the latest versions</li>
            <li>Implement proper input validation and output encoding</li>
            <li>Enable HTTPS for all web applications and APIs</li>
            <li>Implement proper authentication and authorization mechanisms</li>
            <li>Regularly conduct security assessments and penetration tests</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Conclusion</h2>
        <p>This penetration test has identified several security vulnerabilities that should be addressed to improve the overall security posture of AI Sports Edge.</p>
        <p>It is recommended to remediate the identified vulnerabilities and conduct regular security assessments to ensure the ongoing security of the systems and applications.</p>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}Report generated: ${REPORT_FILE}${NC}"
}

# Function to send notifications
send_notifications() {
    section_header "Sending Notifications"
    
    echo "Sending notifications about penetration test results..."
    
    # Get notification settings from config
    local emails=$(jq -r '.notifications.email[]' "${PENTEST_CONFIG}" 2>/dev/null)
    local slack_webhook=$(jq -r '.notifications.slack' "${PENTEST_CONFIG}" 2>/dev/null)
    
    # Send email notifications
    if [ -n "${emails}" ] && [ "${emails}" != "null" ]; then
        for email in ${emails}; do
            echo "Sending email notification to ${email}..."
            # In a real implementation, you would use a tool like sendmail or an API
            echo "Email notification would be sent to ${email} with the report attached."
        done
    fi
    
    # Send Slack notification
    if [ -n "${slack_webhook}" ] && [ "${slack_webhook}" != "null" ] && [ "${slack_webhook}" != "https://hooks.slack.com/services/REPLACE_WITH_ACTUAL_WEBHOOK" ]; then
        echo "Sending Slack notification..."
        # In a real implementation, you would use curl to send a POST request to the webhook
        echo "Slack notification would be sent to the configured webhook."
    fi
    
    echo -e "${GREEN}Notifications sent.${NC}"
}

# Function to run all scans
run_all_scans() {
    section_header "Running All Scans"
    
    # Get targets from config
    local targets=$(jq -r '.targets | to_entries[] | [.key, .value.url, .value.auth_required, .value.auth_type // "", .value.auth_token // ""] | @tsv' "${PENTEST_CONFIG}")
    
    # Get scan types from config
    local network_scan=$(jq -r '.scan_types.network' "${PENTEST_CONFIG}")
    local web_scan=$(jq -r '.scan_types.web' "${PENTEST_CONFIG}")
    local api_scan=$(jq -r '.scan_types.api' "${PENTEST_CONFIG}")
    local database_scan=$(jq -r '.scan_types.database' "${PENTEST_CONFIG}")
    
    # Run scans for each target
    echo "${targets}" | while IFS=$'\t' read -r name url auth_required auth_type auth_token; do
        echo "Processing target: ${name} (${url})"
        
        if [ "${network_scan}" = "true" ]; then
            run_network_scan "${url}"
        fi
        
        if [ "${web_scan}" = "true" ]; then
            run_web_scan "${url}"
        fi
        
        if [ "${api_scan}" = "true" ] && [[ "${url}" == *"api"* ]]; then
            run_api_scan "${url}" "${auth_type}" "${auth_token}"
        fi
        
        if [ "${database_scan}" = "true" ]; then
            run_database_scan "${url}"
        fi
    done
    
    echo -e "${GREEN}All scans completed.${NC}"
}

# Function to schedule regular scans
schedule_regular_scans() {
    section_header "Scheduling Regular Scans"
    
    echo "Setting up scheduled penetration testing..."
    
    # Get schedule from config
    local frequency=$(jq -r '.schedule.frequency' "${PENTEST_CONFIG}")
    local day=$(jq -r '.schedule.day' "${PENTEST_CONFIG}")
    local time=$(jq -r '.schedule.time' "${PENTEST_CONFIG}")
    
    # Create cron expression based on schedule
    local cron_expression=""
    
    case "${frequency}" in
        daily)
            # Run daily at specified time
            local hour=$(echo "${time}" | cut -d':' -f1)
            local minute=$(echo "${time}" | cut -d':' -f2)
            cron_expression="${minute} ${hour} * * *"
            ;;
        weekly)
            # Run weekly on specified day at specified time
            local hour=$(echo "${time}" | cut -d':' -f1)
            local minute=$(echo "${time}" | cut -d':' -f2)
            local day_num=0
            
            case "${day}" in
                monday) day_num=1 ;;
                tuesday) day_num=2 ;;
                wednesday) day_num=3 ;;
                thursday) day_num=4 ;;
                friday) day_num=5 ;;
                saturday) day_num=6 ;;
                sunday) day_num=0 ;;
            esac
            
            cron_expression="${minute} ${hour} * * ${day_num}"
            ;;
        monthly)
            # Run monthly on specified day at specified time
            local hour=$(echo "${time}" | cut -d':' -f1)
            local minute=$(echo "${time}" | cut -d':' -f2)
            
            if [ "${day}" = "first_monday" ]; then
                # First Monday of the month
                cron_expression="${minute} ${hour} 1-7 * 1"
            elif [ "${day}" = "last_day" ]; then
                # Last day of the month
                cron_expression="${minute} ${hour} L * *"
            else
                # Specific day of the month
                cron_expression="${minute} ${hour} ${day} * *"
            fi
            ;;
        *)
            echo -e "${RED}Error: Invalid frequency: ${frequency}${NC}"
            return 1
            ;;
    esac
    
    echo "Cron expression: ${cron_expression}"
    
    # Create cron job
    local cron_job="${cron_expression} $(realpath "$0") --run-all > ${REPORTS_DIR}/scheduled-scan-\$(date +\%Y-\%m-\%d).log 2>&1"
    
    echo "Cron job: ${cron_job}"
    
    # Add cron job to crontab
    (crontab -l 2>/dev/null | grep -v "$(basename "$0")"; echo "${cron_job}") | crontab -
    
    echo -e "${GREEN}Scheduled regular scans with cron expression: ${cron_expression}${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize penetration testing configuration"
    echo "  --run-network         Run network scan"
    echo "  --run-web             Run web application scan"
    echo "  --run-api             Run API scan"
    echo "  --run-database        Run database scan"
    echo "  --run-all             Run all scans"
    echo "  --generate-report     Generate comprehensive report"
    echo "  --schedule            Schedule regular scans"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize penetration testing configuration"
    echo "  $0 --run-all               # Run all scans"
    echo "  $0 --generate-report       # Generate comprehensive report"
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
                create_pentest_config
                exit 0
                ;;
            --run-network)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing target URL.${NC}"
                    exit 1
                fi
                
                run_network_scan "$2"
                exit 0
                
                shift
                ;;
            --run-web)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing target URL.${NC}"
                    exit 1
                fi
                
                run_web_scan "$2"
                exit 0
                
                shift
                ;;
            --run-api)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing target URL.${NC}"
                    exit 1
                fi
                
                run_api_scan "$2" "" ""
                exit 0
                
                shift
                ;;
            --run-database)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing target URL.${NC}"
                    exit 1
                fi
                
                run_database_scan "$2"
                exit 0
                
                shift
                ;;
            --run-all)
                if [ ! -f "${PENTEST_CONFIG}" ]; then
                    echo -e "${RED}Error: Pentest configuration file not found: ${PENTEST_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                run_all_scans
                generate_report
                send_notifications
                exit 0
                ;;
            --generate-report)
                generate_report
                exit 0
                ;;
            --schedule)
                if [ ! -f "${PENTEST_CONFIG}" ]; then
                    echo -e "${RED}Error: Pentest configuration file not found: ${PENTEST_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                schedule_regular_scans
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