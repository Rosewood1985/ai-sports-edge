#!/bin/bash

# Canary Deployments Script
# This script implements canary deployment strategy for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Canary Deployment Strategy${NC}"
echo "=================================================="

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "aws" || exit 1
check_command "jq" || exit 1

# Configuration variables
APP_NAME="ai-sports-edge"
ECR_REPOSITORY="${APP_NAME}"
CANARY_CONFIG_FILE="canary-config.json"
CANARY_CONFIG_DIR="config"
LOGS_DIR="canary-logs"
CLOUDWATCH_NAMESPACE="${APP_NAME}-canary"
ALARM_PREFIX="${APP_NAME}-canary"

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "$LOGS_DIR" ]; then
        mkdir -p "$LOGS_DIR"
        echo "Created logs directory: $LOGS_DIR"
    fi
}

# Function to log canary event
log_canary_event() {
    local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    local log_file="${LOGS_DIR}/canary_${timestamp}.log"
    
    {
        echo "Canary Deployment Event: $timestamp"
        echo "Version: $1"
        echo "Traffic Percentage: $2%"
        echo "Performed by: $(whoami)"
        echo "Actions taken:"
        echo "$3"
        echo ""
    } > "$log_file"
    
    echo -e "${GREEN}Canary event logged to $log_file${NC}"
}

# Function to create canary configuration directory
create_canary_config_dir() {
    if [ ! -d "$CANARY_CONFIG_DIR" ]; then
        mkdir -p "$CANARY_CONFIG_DIR"
        echo "Created canary configuration directory: $CANARY_CONFIG_DIR"
    fi
}

# Function to create or update canary configuration file
create_canary_config() {
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        # Create initial canary configuration file
        cat > "$config_path" << EOF
{
  "canary": {
    "enabled": false,
    "currentVersion": "1.0.0",
    "canaryVersion": "",
    "trafficPercentage": 0,
    "metrics": [
      {
        "name": "ErrorRate",
        "threshold": 1.0,
        "evaluationPeriods": 5,
        "datapointsToAlarm": 3
      },
      {
        "name": "Latency",
        "threshold": 500,
        "evaluationPeriods": 5,
        "datapointsToAlarm": 3
      },
      {
        "name": "CPUUtilization",
        "threshold": 80.0,
        "evaluationPeriods": 5,
        "datapointsToAlarm": 3
      }
    ],
    "autoPromote": false,
    "autoRollback": true,
    "evaluationTime": 30,
    "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
        echo -e "${GREEN}Created initial canary configuration file: $config_path${NC}"
    else
        echo "Canary configuration file already exists: $config_path"
    fi
}

# Function to create CloudWatch alarms for canary deployment
create_cloudwatch_alarms() {
    section_header "Setting up CloudWatch Alarms for Canary Deployment"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Read metrics from configuration
    local metrics=$(jq -r '.canary.metrics' "$config_path")
    local metric_count=$(echo "$metrics" | jq 'length')
    
    echo "Setting up $metric_count CloudWatch alarms..."
    
    for (( i=0; i<$metric_count; i++ )); do
        local metric_name=$(echo "$metrics" | jq -r ".[$i].name")
        local threshold=$(echo "$metrics" | jq -r ".[$i].threshold")
        local evaluation_periods=$(echo "$metrics" | jq -r ".[$i].evaluationPeriods")
        local datapoints_to_alarm=$(echo "$metrics" | jq -r ".[$i].datapointsToAlarm")
        
        local alarm_name="${ALARM_PREFIX}-${metric_name}"
        
        echo "Creating alarm: $alarm_name"
        
        # Create CloudWatch alarm
        aws cloudwatch put-metric-alarm \
            --alarm-name "$alarm_name" \
            --alarm-description "Canary deployment alarm for $metric_name" \
            --metric-name "$metric_name" \
            --namespace "$CLOUDWATCH_NAMESPACE" \
            --statistic Average \
            --period 60 \
            --evaluation-periods $evaluation_periods \
            --datapoints-to-alarm $datapoints_to_alarm \
            --threshold $threshold \
            --comparison-operator GreaterThanThreshold \
            --treat-missing-data notBreaching \
            --tags Key=Application,Value=$APP_NAME Key=Environment,Value=canary
    done
    
    echo -e "${GREEN}CloudWatch alarms setup complete.${NC}"
}

# Function to create SNS topic for canary alarms
create_sns_topic() {
    section_header "Setting up SNS Topic for Canary Alarms"
    
    local topic_name="${APP_NAME}-canary-alarms"
    
    # Check if topic exists
    if aws sns list-topics | grep -q "$topic_name"; then
        echo "SNS topic $topic_name already exists."
        local topic_arn=$(aws sns list-topics | jq -r ".Topics[] | select(.TopicArn | contains(\"$topic_name\")) | .TopicArn")
    else
        echo "Creating SNS topic $topic_name..."
        local topic_arn=$(aws sns create-topic --name "$topic_name" | jq -r '.TopicArn')
    fi
    
    echo "Topic ARN: $topic_arn"
    
    # Subscribe to the topic
    read -p "Enter email address for alarm notifications: " email
    
    if [ -n "$email" ]; then
        aws sns subscribe \
            --topic-arn "$topic_arn" \
            --protocol email \
            --notification-endpoint "$email"
        
        echo "Subscription confirmation email sent to $email. Please confirm the subscription."
    fi
    
    # Update CloudWatch alarms to use the SNS topic
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    local metrics=$(jq -r '.canary.metrics[].name' "$config_path")
    
    for metric_name in $metrics; do
        local alarm_name="${ALARM_PREFIX}-${metric_name}"
        
        aws cloudwatch put-metric-alarm \
            --alarm-name "$alarm_name" \
            --alarm-actions "$topic_arn"
    done
    
    echo -e "${GREEN}SNS topic setup complete.${NC}"
}

# Function to start canary deployment
start_canary() {
    local canary_version=$1
    local traffic_percentage=$2
    
    section_header "Starting Canary Deployment"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Validate traffic percentage
    if ! [[ "$traffic_percentage" =~ ^[0-9]+$ ]] || [ "$traffic_percentage" -lt 0 ] || [ "$traffic_percentage" -gt 100 ]; then
        echo -e "${RED}Error: Traffic percentage must be between 0 and 100.${NC}"
        return 1
    fi
    
    # Get current version
    local current_version=$(jq -r '.canary.currentVersion' "$config_path")
    
    echo "Starting canary deployment:"
    echo "  Current version: $current_version"
    echo "  Canary version: $canary_version"
    echo "  Traffic percentage: $traffic_percentage%"
    
    # Update canary configuration
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg version "$canary_version" \
       --argjson traffic "$traffic_percentage" \
       --arg time "$timestamp" \
       '.canary.enabled = true | .canary.canaryVersion = $version | .canary.trafficPercentage = $traffic | .canary.lastUpdated = $time' \
       "$config_path" > "${config_path}.tmp"
    
    mv "${config_path}.tmp" "$config_path"
    
    # Deploy canary version
    echo "Deploying canary version $canary_version with $traffic_percentage% traffic..."
    
    # This is where you would integrate with your specific deployment platform
    # For example, with AWS App Mesh, AWS Lambda, or Kubernetes
    
    # For demonstration purposes, we'll just simulate the deployment
    sleep 2
    
    # Log the canary event
    local actions="- Updated canary configuration
- Deployed canary version $canary_version with $traffic_percentage% traffic"
    log_canary_event "$canary_version" "$traffic_percentage" "$actions"
    
    echo -e "${GREEN}Canary deployment started successfully.${NC}"
    echo "Monitor the canary deployment using the following command:"
    echo "  $0 --status"
    
    # If auto-promote is enabled, schedule the promotion
    local auto_promote=$(jq -r '.canary.autoPromote' "$config_path")
    local evaluation_time=$(jq -r '.canary.evaluationTime' "$config_path")
    
    if [ "$auto_promote" = "true" ]; then
        echo "Auto-promotion is enabled. The canary version will be automatically promoted after $evaluation_time minutes if no alarms are triggered."
        
        # In a real implementation, you would set up a scheduled task or use a service like AWS Step Functions
        # For demonstration purposes, we'll just provide instructions
        echo "To manually promote the canary version, run:"
        echo "  $0 --promote"
    fi
}

# Function to update canary traffic
update_canary_traffic() {
    local traffic_percentage=$1
    
    section_header "Updating Canary Traffic"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Check if canary is enabled
    local enabled=$(jq -r '.canary.enabled' "$config_path")
    if [ "$enabled" != "true" ]; then
        echo -e "${RED}Error: No active canary deployment.${NC}"
        return 1
    fi
    
    # Validate traffic percentage
    if ! [[ "$traffic_percentage" =~ ^[0-9]+$ ]] || [ "$traffic_percentage" -lt 0 ] || [ "$traffic_percentage" -gt 100 ]; then
        echo -e "${RED}Error: Traffic percentage must be between 0 and 100.${NC}"
        return 1
    fi
    
    # Get current configuration
    local current_version=$(jq -r '.canary.currentVersion' "$config_path")
    local canary_version=$(jq -r '.canary.canaryVersion' "$config_path")
    local current_traffic=$(jq -r '.canary.trafficPercentage' "$config_path")
    
    echo "Updating canary traffic:"
    echo "  Current version: $current_version"
    echo "  Canary version: $canary_version"
    echo "  Current traffic: $current_traffic%"
    echo "  New traffic: $traffic_percentage%"
    
    # Update canary configuration
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --argjson traffic "$traffic_percentage" \
       --arg time "$timestamp" \
       '.canary.trafficPercentage = $traffic | .canary.lastUpdated = $time' \
       "$config_path" > "${config_path}.tmp"
    
    mv "${config_path}.tmp" "$config_path"
    
    # Update traffic routing
    echo "Updating traffic routing to $traffic_percentage% for canary version..."
    
    # This is where you would integrate with your specific deployment platform
    # For example, with AWS App Mesh, AWS Lambda, or Kubernetes
    
    # For demonstration purposes, we'll just simulate the update
    sleep 2
    
    # Log the canary event
    local actions="- Updated canary traffic to $traffic_percentage%"
    log_canary_event "$canary_version" "$traffic_percentage" "$actions"
    
    echo -e "${GREEN}Canary traffic updated successfully.${NC}"
}

# Function to promote canary to production
promote_canary() {
    section_header "Promoting Canary to Production"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Check if canary is enabled
    local enabled=$(jq -r '.canary.enabled' "$config_path")
    if [ "$enabled" != "true" ]; then
        echo -e "${RED}Error: No active canary deployment.${NC}"
        return 1
    fi
    
    # Get current configuration
    local current_version=$(jq -r '.canary.currentVersion' "$config_path")
    local canary_version=$(jq -r '.canary.canaryVersion' "$config_path")
    
    echo "Promoting canary to production:"
    echo "  Current version: $current_version"
    echo "  Canary version: $canary_version"
    
    # Check for active alarms
    echo "Checking for active alarms..."
    local alarms=$(aws cloudwatch describe-alarms --alarm-name-prefix "$ALARM_PREFIX" --state-value ALARM)
    local alarm_count=$(echo "$alarms" | jq -r '.MetricAlarms | length')
    
    if [ "$alarm_count" -gt 0 ]; then
        echo -e "${RED}Error: There are $alarm_count active alarms. Cannot promote canary to production.${NC}"
        echo "Active alarms:"
        echo "$alarms" | jq -r '.MetricAlarms[].AlarmName'
        
        read -p "Do you want to force promotion despite active alarms? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
        
        echo -e "${YELLOW}Warning: Forcing promotion despite active alarms.${NC}"
    fi
    
    # Update canary configuration
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg version "$canary_version" \
       --arg time "$timestamp" \
       '.canary.enabled = false | .canary.currentVersion = $version | .canary.canaryVersion = "" | .canary.trafficPercentage = 0 | .canary.lastUpdated = $time' \
       "$config_path" > "${config_path}.tmp"
    
    mv "${config_path}.tmp" "$config_path"
    
    # Promote canary to production
    echo "Promoting canary version $canary_version to production..."
    
    # This is where you would integrate with your specific deployment platform
    # For example, with AWS App Mesh, AWS Lambda, or Kubernetes
    
    # For demonstration purposes, we'll just simulate the promotion
    sleep 2
    
    # Log the canary event
    local actions="- Promoted canary version $canary_version to production
- Updated current version to $canary_version
- Disabled canary deployment"
    log_canary_event "$canary_version" "100" "$actions"
    
    echo -e "${GREEN}Canary promoted to production successfully.${NC}"
}

# Function to rollback canary deployment
rollback_canary() {
    section_header "Rolling Back Canary Deployment"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Check if canary is enabled
    local enabled=$(jq -r '.canary.enabled' "$config_path")
    if [ "$enabled" != "true" ]; then
        echo -e "${RED}Error: No active canary deployment.${NC}"
        return 1
    fi
    
    # Get current configuration
    local current_version=$(jq -r '.canary.currentVersion' "$config_path")
    local canary_version=$(jq -r '.canary.canaryVersion' "$config_path")
    
    echo "Rolling back canary deployment:"
    echo "  Current version: $current_version"
    echo "  Canary version: $canary_version"
    
    # Update canary configuration
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg time "$timestamp" \
       '.canary.enabled = false | .canary.canaryVersion = "" | .canary.trafficPercentage = 0 | .canary.lastUpdated = $time' \
       "$config_path" > "${config_path}.tmp"
    
    mv "${config_path}.tmp" "$config_path"
    
    # Rollback canary deployment
    echo "Rolling back canary deployment..."
    
    # This is where you would integrate with your specific deployment platform
    # For example, with AWS App Mesh, AWS Lambda, or Kubernetes
    
    # For demonstration purposes, we'll just simulate the rollback
    sleep 2
    
    # Log the canary event
    local actions="- Rolled back canary deployment
- Disabled canary deployment
- Restored 100% traffic to version $current_version"
    log_canary_event "$canary_version" "0" "$actions"
    
    echo -e "${GREEN}Canary deployment rolled back successfully.${NC}"
}

# Function to check canary status
check_canary_status() {
    section_header "Canary Deployment Status"
    
    local config_path="${CANARY_CONFIG_DIR}/${CANARY_CONFIG_FILE}"
    
    if [ ! -f "$config_path" ]; then
        echo -e "${RED}Error: Canary configuration file not found: $config_path${NC}"
        return 1
    fi
    
    # Check if canary is enabled
    local enabled=$(jq -r '.canary.enabled' "$config_path")
    if [ "$enabled" != "true" ]; then
        echo -e "${YELLOW}No active canary deployment.${NC}"
        return 0
    fi
    
    # Get current configuration
    local current_version=$(jq -r '.canary.currentVersion' "$config_path")
    local canary_version=$(jq -r '.canary.canaryVersion' "$config_path")
    local traffic_percentage=$(jq -r '.canary.trafficPercentage' "$config_path")
    local last_updated=$(jq -r '.canary.lastUpdated' "$config_path")
    
    echo "Canary Deployment Status:"
    echo "  Current version: $current_version"
    echo "  Canary version: $canary_version"
    echo "  Traffic percentage: $traffic_percentage%"
    echo "  Last updated: $last_updated"
    
    # Check for active alarms
    echo ""
    echo "Checking for active alarms..."
    local alarms=$(aws cloudwatch describe-alarms --alarm-name-prefix "$ALARM_PREFIX")
    local alarm_count=$(echo "$alarms" | jq -r '.MetricAlarms | length')
    
    if [ "$alarm_count" -gt 0 ]; then
        echo "Alarm Status:"
        echo "$alarms" | jq -r '.MetricAlarms[] | "  " + .AlarmName + ": " + .StateValue'
    else
        echo "No alarms found."
    fi
    
    # Check metrics
    echo ""
    echo "Recent Metrics:"
    local metrics=$(jq -r '.canary.metrics[].name' "$config_path")
    
    for metric_name in $metrics; do
        echo "  $metric_name:"
        
        # Get recent metric data
        aws cloudwatch get-metric-statistics \
            --namespace "$CLOUDWATCH_NAMESPACE" \
            --metric-name "$metric_name" \
            --start-time "$(date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%SZ")" \
            --end-time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            --period 300 \
            --statistics Average \
            --query "Datapoints[*].[Timestamp,Average]" \
            --output text | sort
    done
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize canary deployment system"
    echo "  --start <version> <pct> Start canary deployment with specified version and traffic percentage"
    echo "  --update-traffic <pct> Update canary traffic percentage"
    echo "  --promote             Promote canary to production"
    echo "  --rollback            Rollback canary deployment"
    echo "  --status              Check canary deployment status"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize canary deployment system"
    echo "  $0 --start v1.2.3 10       # Start canary deployment with 10% traffic"
    echo "  $0 --update-traffic 25     # Update canary traffic to 25%"
    echo "  $0 --promote               # Promote canary to production"
    echo "  $0 --status                # Check canary deployment status"
}

# Main function
main() {
    # Create logs directory
    create_logs_dir
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --init)
                section_header "Initializing Canary Deployment System"
                create_canary_config_dir
                create_canary_config
                create_cloudwatch_alarms
                create_sns_topic
                echo -e "${GREEN}Canary deployment system initialized successfully.${NC}"
                exit 0
                ;;
            --start)
                if [ -z "$2" ] || [ -z "$3" ]; then
                    echo -e "${RED}Error: Missing version or traffic percentage.${NC}"
                    exit 1
                fi
                
                start_canary "$2" "$3"
                exit 0
                
                shift 2
                ;;
            --update-traffic)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing traffic percentage.${NC}"
                    exit 1
                fi
                
                update_canary_traffic "$2"
                exit 0
                
                shift
                ;;
            --promote)
                promote_canary
                exit 0
                ;;
            --rollback)
                rollback_canary
                exit 0
                ;;
            --status)
                check_canary_status
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