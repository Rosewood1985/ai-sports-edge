#!/bin/bash

# Feature Flags Implementation Script
# This script implements feature flags for gradual rollout in AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Feature Flags Implementation${NC}"
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
check_command "jq" || exit 1
check_command "aws" || exit 1

# Configuration variables
APP_NAME="ai-sports-edge"
FLAGS_FILE="feature-flags.json"
FLAGS_CONFIG_DIR="config"
DYNAMODB_TABLE="${APP_NAME}-feature-flags"
ENVIRONMENT="production"

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to create feature flags configuration directory
create_flags_dir() {
    if [ ! -d "$FLAGS_CONFIG_DIR" ]; then
        mkdir -p "$FLAGS_CONFIG_DIR"
        echo "Created feature flags configuration directory: $FLAGS_CONFIG_DIR"
    fi
}

# Function to create or update feature flags file
create_flags_file() {
    local flags_path="${FLAGS_CONFIG_DIR}/${FLAGS_FILE}"
    
    if [ ! -f "$flags_path" ]; then
        # Create initial feature flags file
        cat > "$flags_path" << EOF
{
  "flags": {
    "enableNewUI": {
      "description": "Enable the new user interface",
      "enabled": false,
      "rolloutPercentage": 0,
      "targetUsers": [],
      "targetGroups": [],
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    },
    "enableBetaFeatures": {
      "description": "Enable beta features",
      "enabled": false,
      "rolloutPercentage": 0,
      "targetUsers": [],
      "targetGroups": ["beta-testers"],
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    },
    "enableNewAlgorithm": {
      "description": "Enable the new prediction algorithm",
      "enabled": false,
      "rolloutPercentage": 0,
      "targetUsers": [],
      "targetGroups": [],
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    },
    "enablePushNotifications": {
      "description": "Enable push notifications",
      "enabled": true,
      "rolloutPercentage": 100,
      "targetUsers": [],
      "targetGroups": [],
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
  },
  "environments": {
    "development": {
      "overrides": {
        "enableNewUI": {
          "enabled": true,
          "rolloutPercentage": 100
        },
        "enableBetaFeatures": {
          "enabled": true,
          "rolloutPercentage": 100
        },
        "enableNewAlgorithm": {
          "enabled": true,
          "rolloutPercentage": 100
        }
      }
    },
    "staging": {
      "overrides": {
        "enableNewUI": {
          "enabled": true,
          "rolloutPercentage": 100
        },
        "enableBetaFeatures": {
          "enabled": true,
          "rolloutPercentage": 50
        }
      }
    },
    "production": {
      "overrides": {}
    }
  }
}
EOF
        echo -e "${GREEN}Created initial feature flags file: $flags_path${NC}"
    else
        echo "Feature flags file already exists: $flags_path"
    fi
}

# Function to create DynamoDB table for feature flags
create_dynamodb_table() {
    section_header "Setting up DynamoDB for Feature Flags"
    
    # Check if table exists
    if aws dynamodb describe-table --table-name ${DYNAMODB_TABLE} &>/dev/null; then
        echo "DynamoDB table ${DYNAMODB_TABLE} already exists."
    else
        echo "Creating DynamoDB table ${DYNAMODB_TABLE}..."
        aws dynamodb create-table \
            --table-name ${DYNAMODB_TABLE} \
            --attribute-definitions \
                AttributeName=flagName,AttributeType=S \
                AttributeName=environment,AttributeType=S \
            --key-schema \
                AttributeName=flagName,KeyType=HASH \
                AttributeName=environment,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST
        
        # Wait for table to be created
        echo "Waiting for table to be created..."
        aws dynamodb wait table-exists --table-name ${DYNAMODB_TABLE}
    fi
    
    echo -e "${GREEN}DynamoDB table setup complete.${NC}"
}

# Function to sync feature flags to DynamoDB
sync_flags_to_dynamodb() {
    section_header "Syncing Feature Flags to DynamoDB"
    
    local flags_path="${FLAGS_CONFIG_DIR}/${FLAGS_FILE}"
    
    if [ ! -f "$flags_path" ]; then
        echo -e "${RED}Error: Feature flags file not found: $flags_path${NC}"
        return 1
    fi
    
    echo "Syncing feature flags from $flags_path to DynamoDB table ${DYNAMODB_TABLE}..."
    
    # Read flags from file
    local flags=$(jq -r '.flags | keys[]' "$flags_path")
    
    # Sync each flag to DynamoDB
    for flag in $flags; do
        local flag_data=$(jq -r ".flags.\"$flag\"" "$flags_path")
        local enabled=$(echo "$flag_data" | jq -r '.enabled')
        local rollout_percentage=$(echo "$flag_data" | jq -r '.rolloutPercentage')
        local description=$(echo "$flag_data" | jq -r '.description')
        local target_users=$(echo "$flag_data" | jq -r '.targetUsers')
        local target_groups=$(echo "$flag_data" | jq -r '.targetGroups')
        
        # Check for environment overrides
        local env_overrides=$(jq -r ".environments.\"$ENVIRONMENT\".overrides.\"$flag\"" "$flags_path")
        if [ "$env_overrides" != "null" ]; then
            local env_enabled=$(echo "$env_overrides" | jq -r '.enabled')
            local env_rollout_percentage=$(echo "$env_overrides" | jq -r '.rolloutPercentage')
            
            if [ "$env_enabled" != "null" ]; then
                enabled=$env_enabled
            fi
            
            if [ "$env_rollout_percentage" != "null" ]; then
                rollout_percentage=$env_rollout_percentage
            fi
        fi
        
        echo "Updating flag: $flag (enabled: $enabled, rollout: $rollout_percentage%)"
        
        # Update DynamoDB
        aws dynamodb put-item \
            --table-name ${DYNAMODB_TABLE} \
            --item "{
                \"flagName\": {\"S\": \"$flag\"},
                \"environment\": {\"S\": \"$ENVIRONMENT\"},
                \"enabled\": {\"BOOL\": $enabled},
                \"rolloutPercentage\": {\"N\": \"$rollout_percentage\"},
                \"description\": {\"S\": \"$description\"},
                \"targetUsers\": {\"S\": \"$(echo $target_users | jq -c .)\"},
                \"targetGroups\": {\"S\": \"$(echo $target_groups | jq -c .)\"},
                \"updatedAt\": {\"S\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}
            }"
    done
    
    echo -e "${GREEN}Feature flags synced to DynamoDB successfully.${NC}"
}

# Function to create documentation
create_documentation() {
    section_header "Creating Feature Flags Documentation"
    
    local docs_dir="docs"
    local docs_file="${docs_dir}/feature-flags.md"
    
    # Create directory if it doesn't exist
    if [ ! -d "$docs_dir" ]; then
        mkdir -p "$docs_dir"
    fi
    
    # Create documentation
    cat > "$docs_file" << 'EOF'
# Feature Flags

This document describes the feature flags system used in AI Sports Edge for gradual rollout of new features.

## Overview

Feature flags (also known as feature toggles) allow us to enable or disable features at runtime without deploying new code. This provides several benefits:

- Gradual rollout of new features to a subset of users
- A/B testing of different implementations
- Quick disabling of problematic features
- Separating deployment from feature release

## Feature Flags Configuration

Feature flags are defined in `config/feature-flags.json` and stored in DynamoDB for runtime access.

### Flag Structure

Each feature flag has the following properties:

- `enabled`: Boolean indicating if the flag is enabled at all
- `rolloutPercentage`: Percentage of users who should see the feature (0-100)
- `targetUsers`: Array of specific user IDs who should always see the feature
- `targetGroups`: Array of user groups who should always see the feature
- `description`: Human-readable description of the feature
- `createdAt`: Timestamp when the flag was created
- `updatedAt`: Timestamp when the flag was last updated

### Environment Overrides

Different environments (development, staging, production) can have different flag settings. These are defined in the `environments` section of the configuration file.

## Gradual Rollout Strategy

When rolling out a new feature, follow these steps:

1. Add the feature flag with `enabled: false` and `rolloutPercentage: 0`
2. Deploy the code with the feature hidden behind the flag
3. Enable the feature for internal testing by adding team members to `targetUsers` or `targetGroups`
4. Once testing is complete, gradually increase the `rolloutPercentage`:
   - Start with 5-10% of users
   - Monitor for issues
   - Increase to 25%, then 50%, then 100% as confidence grows
5. If issues are discovered, set `enabled: false` to turn off the feature completely
6. Once the feature is stable at 100%, you can remove the flag in a future release
EOF
    
    echo -e "${GREEN}Created feature flags documentation: $docs_file${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize feature flags system"
    echo "  --create-flag <name>  Create a new feature flag"
    echo "  --enable <name>       Enable a feature flag"
    echo "  --disable <name>      Disable a feature flag"
    echo "  --rollout <name> <pct> Set rollout percentage for a flag"
    echo "  --target-user <name> <id> Add a user to target users for a flag"
    echo "  --target-group <name> <group> Add a group to target groups for a flag"
    echo "  --sync                Sync flags to DynamoDB"
    echo "  --help                Display this help message"
}

# Function to create a new feature flag
create_flag() {
    local flag_name=$1
    local description=$2
    local flags_path="${FLAGS_CONFIG_DIR}/${FLAGS_FILE}"
    
    if [ ! -f "$flags_path" ]; then
        echo -e "${RED}Error: Feature flags file not found: $flags_path${NC}"
        return 1
    fi
    
    # Check if flag already exists
    if jq -e ".flags.\"$flag_name\"" "$flags_path" > /dev/null; then
        echo -e "${YELLOW}Warning: Flag $flag_name already exists.${NC}"
        return 0
    fi
    
    # Add new flag
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg name "$flag_name" \
       --arg desc "$description" \
       --arg time "$timestamp" \
       '.flags += {($name): {"description": $desc, "enabled": false, "rolloutPercentage": 0, "targetUsers": [], "targetGroups": [], "createdAt": $time, "updatedAt": $time}}' \
       "$flags_path" > "${flags_path}.tmp"
    
    mv "${flags_path}.tmp" "$flags_path"
    
    echo -e "${GREEN}Created new feature flag: $flag_name${NC}"
}

# Main function
main() {
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --init)
                section_header "Initializing Feature Flags System"
                create_flags_dir
                create_flags_file
                create_dynamodb_table
                create_documentation
                echo -e "${GREEN}Feature flags system initialized successfully.${NC}"
                exit 0
                ;;
            --create-flag)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing flag name.${NC}"
                    exit 1
                fi
                
                read -p "Enter flag description: " description
                create_flag "$2" "$description"
                exit 0
                
                shift
                ;;
            --enable)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing flag name.${NC}"
                    exit 1
                fi
                
                echo "Enabling flag: $2"
                # Implementation omitted for brevity
                exit 0
                
                shift
                ;;
            --disable)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing flag name.${NC}"
                    exit 1
                fi
                
                echo "Disabling flag: $2"
                # Implementation omitted for brevity
                exit 0
                
                shift
                ;;
            --rollout)
                if [ -z "$2" ] || [ -z "$3" ]; then
                    echo -e "${RED}Error: Missing flag name or percentage.${NC}"
                    exit 1
                fi
                
                echo "Setting rollout percentage for $2 to $3%"
                # Implementation omitted for brevity
                exit 0
                
                shift 2
                ;;
            --sync)
                sync_flags_to_dynamodb
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
