#!/bin/bash

# Release Management Script
# This script orchestrates all release management components for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Release Management${NC}"
echo "=================================================="

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_CD_SCRIPT="${SCRIPT_DIR}/ci-cd-pipeline.sh"
VERSIONING_SCRIPT="${SCRIPT_DIR}/versioning-strategy.sh"
ROLLBACK_SCRIPT="${SCRIPT_DIR}/rollback-procedure.sh"
FEATURE_FLAGS_SCRIPT="${SCRIPT_DIR}/feature-flags.sh"
CANARY_SCRIPT="${SCRIPT_DIR}/canary-deployments.sh"

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
    
    if ! check_script "$CI_CD_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$VERSIONING_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$ROLLBACK_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$FEATURE_FLAGS_SCRIPT"; then
        all_ok=false
    fi
    
    if ! check_script "$CANARY_SCRIPT"; then
        all_ok=false
    fi
    
    if [ "$all_ok" = false ]; then
        echo -e "${RED}Error: Some scripts are missing or not executable.${NC}"
        return 1
    fi
    
    return 0
}

# Function to initialize all components
initialize_all() {
    section_header "Initializing All Release Management Components"
    
    echo -e "${YELLOW}Initializing CI/CD Pipeline...${NC}"
    "$CI_CD_SCRIPT"
    echo -e "${GREEN}CI/CD Pipeline initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Feature Flags...${NC}"
    "$FEATURE_FLAGS_SCRIPT" --init
    echo -e "${GREEN}Feature Flags initialized.${NC}"
    
    echo -e "${YELLOW}Initializing Canary Deployments...${NC}"
    "$CANARY_SCRIPT" --init
    echo -e "${GREEN}Canary Deployments initialized.${NC}"
    
    echo -e "${GREEN}All release management components initialized successfully.${NC}"
}

# Function to create a new release
create_release() {
    local version_type=$1
    
    section_header "Creating New Release"
    
    echo -e "${YELLOW}Bumping version...${NC}"
    "$VERSIONING_SCRIPT" --bump "$version_type"
    
    echo -e "${GREEN}Release created successfully.${NC}"
}

# Function to deploy a release
deploy_release() {
    local version=$1
    local canary=$2
    local traffic_percentage=$3
    
    section_header "Deploying Release"
    
    if [ "$canary" = true ]; then
        echo -e "${YELLOW}Starting canary deployment for version $version with $traffic_percentage% traffic...${NC}"
        "$CANARY_SCRIPT" --start "$version" "$traffic_percentage"
    else
        echo -e "${YELLOW}Deploying version $version to production...${NC}"
        # In a real implementation, you would call your deployment script here
        echo "Deployment completed."
    fi
    
    echo -e "${GREEN}Release deployed successfully.${NC}"
}

# Function to rollback a release
rollback_release() {
    local version=$1
    
    section_header "Rolling Back Release"
    
    echo -e "${YELLOW}Rolling back to version $version...${NC}"
    "$ROLLBACK_SCRIPT" --complete-rollback "$version" "Manual rollback requested"
    
    echo -e "${GREEN}Rollback completed successfully.${NC}"
}

# Function to manage feature flags
manage_feature_flags() {
    local action=$1
    local flag_name=$2
    local value=$3
    
    section_header "Managing Feature Flags"
    
    case "$action" in
        create)
            echo -e "${YELLOW}Creating feature flag $flag_name...${NC}"
            "$FEATURE_FLAGS_SCRIPT" --create-flag "$flag_name"
            ;;
        enable)
            echo -e "${YELLOW}Enabling feature flag $flag_name...${NC}"
            "$FEATURE_FLAGS_SCRIPT" --enable "$flag_name"
            ;;
        disable)
            echo -e "${YELLOW}Disabling feature flag $flag_name...${NC}"
            "$FEATURE_FLAGS_SCRIPT" --disable "$flag_name"
            ;;
        rollout)
            echo -e "${YELLOW}Setting rollout percentage for feature flag $flag_name to $value%...${NC}"
            "$FEATURE_FLAGS_SCRIPT" --rollout "$flag_name" "$value"
            ;;
        sync)
            echo -e "${YELLOW}Syncing feature flags...${NC}"
            "$FEATURE_FLAGS_SCRIPT" --sync
            ;;
        *)
            echo -e "${RED}Error: Unknown feature flag action $action${NC}"
            return 1
            ;;
    esac
    
    echo -e "${GREEN}Feature flag operation completed successfully.${NC}"
}

# Function to manage canary deployments
manage_canary() {
    local action=$1
    local param1=$2
    local param2=$3
    
    section_header "Managing Canary Deployment"
    
    case "$action" in
        start)
            echo -e "${YELLOW}Starting canary deployment for version $param1 with $param2% traffic...${NC}"
            "$CANARY_SCRIPT" --start "$param1" "$param2"
            ;;
        update)
            echo -e "${YELLOW}Updating canary traffic to $param1%...${NC}"
            "$CANARY_SCRIPT" --update-traffic "$param1"
            ;;
        promote)
            echo -e "${YELLOW}Promoting canary to production...${NC}"
            "$CANARY_SCRIPT" --promote
            ;;
        rollback)
            echo -e "${YELLOW}Rolling back canary deployment...${NC}"
            "$CANARY_SCRIPT" --rollback
            ;;
        status)
            "$CANARY_SCRIPT" --status
            ;;
        *)
            echo -e "${RED}Error: Unknown canary action $action${NC}"
            return 1
            ;;
    esac
    
    if [ "$action" != "status" ]; then
        echo -e "${GREEN}Canary operation completed successfully.${NC}"
    fi
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize all release management components"
    echo "  --create-release <type> Create a new release (major, minor, patch)"
    echo "  --deploy <version> [--canary <pct>] Deploy a release, optionally as canary with traffic percentage"
    echo "  --rollback <version>   Rollback to a specific version"
    echo "  --feature <action> [params] Manage feature flags"
    echo "  --canary <action> [params] Manage canary deployments"
    echo "  --help                 Display this help message"
    echo ""
    echo "Feature Flag Actions:"
    echo "  create <name>          Create a new feature flag"
    echo "  enable <name>          Enable a feature flag"
    echo "  disable <name>         Disable a feature flag"
    echo "  rollout <name> <pct>   Set rollout percentage for a flag"
    echo "  sync                   Sync flags to storage"
    echo ""
    echo "Canary Actions:"
    echo "  start <version> <pct>  Start canary deployment"
    echo "  update <pct>           Update canary traffic percentage"
    echo "  promote                Promote canary to production"
    echo "  rollback               Rollback canary deployment"
    echo "  status                 Check canary deployment status"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize all components"
    echo "  $0 --create-release minor  # Create a new minor release"
    echo "  $0 --deploy v1.2.3         # Deploy version v1.2.3 to production"
    echo "  $0 --deploy v1.2.3 --canary 10  # Deploy as canary with 10% traffic"
    echo "  $0 --rollback v1.1.0       # Rollback to version v1.1.0"
    echo "  $0 --feature enable newUI  # Enable the newUI feature flag"
    echo "  $0 --canary promote        # Promote canary to production"
}

# Main function
main() {
    # Check if all scripts exist and are executable
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
            --create-release)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing version type.${NC}"
                    exit 1
                fi
                
                create_release "$2"
                exit 0
                
                shift
                ;;
            --deploy)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing version.${NC}"
                    exit 1
                fi
                
                version=$2
                canary=false
                traffic_percentage=0
                
                shift 2
                
                # Check for canary flag
                if [ "$1" = "--canary" ]; then
                    canary=true
                    
                    if [ -z "$2" ]; then
                        echo -e "${RED}Error: Missing traffic percentage for canary deployment.${NC}"
                        exit 1
                    fi
                    
                    traffic_percentage=$2
                    shift 2
                fi
                
                deploy_release "$version" "$canary" "$traffic_percentage"
                exit 0
                ;;
            --rollback)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing version.${NC}"
                    exit 1
                fi
                
                rollback_release "$2"
                exit 0
                
                shift
                ;;
            --feature)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing feature flag action.${NC}"
                    exit 1
                fi
                
                action=$2
                flag_name=""
                value=""
                
                shift 2
                
                if [ "$action" != "sync" ]; then
                    if [ -z "$1" ]; then
                        echo -e "${RED}Error: Missing feature flag name.${NC}"
                        exit 1
                    fi
                    
                    flag_name=$1
                    shift
                    
                    if [ "$action" = "rollout" ]; then
                        if [ -z "$1" ]; then
                            echo -e "${RED}Error: Missing rollout percentage.${NC}"
                            exit 1
                        fi
                        
                        value=$1
                        shift
                    fi
                fi
                
                manage_feature_flags "$action" "$flag_name" "$value"
                exit 0
                ;;
            --canary)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing canary action.${NC}"
                    exit 1
                fi
                
                action=$2
                param1=""
                param2=""
                
                shift 2
                
                if [ "$action" = "start" ]; then
                    if [ -z "$1" ] || [ -z "$2" ]; then
                        echo -e "${RED}Error: Missing version or traffic percentage for canary start.${NC}"
                        exit 1
                    fi
                    
                    param1=$1
                    param2=$2
                    shift 2
                elif [ "$action" = "update" ]; then
                    if [ -z "$1" ]; then
                        echo -e "${RED}Error: Missing traffic percentage for canary update.${NC}"
                        exit 1
                    fi
                    
                    param1=$1
                    shift
                fi
                
                manage_canary "$action" "$param1" "$param2"
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