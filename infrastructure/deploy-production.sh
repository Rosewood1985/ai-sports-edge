#!/bin/bash

# Production Infrastructure Deployment Script
# This script deploys the complete production infrastructure for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Sports Edge - Production Infrastructure Deployment${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}Warning: k6 is not installed. Load testing will be skipped.${NC}"
    echo "Visit https://k6.io/docs/getting-started/installation/ for installation instructions."
    K6_INSTALLED=false
else
    K6_INSTALLED=true
fi

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to prompt for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Function to check if script exists and is executable
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

# Main deployment process
main() {
    section_header "Starting Production Infrastructure Deployment"
    
    # 1. CDN Configuration
    section_header "1. CDN Configuration"
    if check_script "cdn/deploy-cdn.sh"; then
        if confirm "Do you want to deploy the CDN configuration?"; then
            echo -e "${YELLOW}Deploying CDN configuration...${NC}"
            cd cdn && ./deploy-cdn.sh
            cd ..
            echo -e "${GREEN}CDN configuration deployed successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping CDN configuration.${NC}"
        fi
    fi
    
    # 2. Database Scaling
    section_header "2. Database Scaling"
    if check_script "database/deploy-database.sh"; then
        if confirm "Do you want to deploy the database scaling configuration?"; then
            echo -e "${YELLOW}Deploying database scaling configuration...${NC}"
            cd database && ./deploy-database.sh
            cd ..
            echo -e "${GREEN}Database scaling configuration deployed successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping database scaling configuration.${NC}"
        fi
    fi
    
    # 3. Backup Systems
    section_header "3. Backup Systems"
    if check_script "backup/setup-backup-system.sh"; then
        if confirm "Do you want to set up the backup systems?"; then
            echo -e "${YELLOW}Setting up backup systems...${NC}"
            cd backup && ./setup-backup-system.sh
            cd ..
            echo -e "${GREEN}Backup systems set up successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping backup systems setup.${NC}"
        fi
    fi
    
    # 4. Load Testing
    section_header "4. Load Testing"
    if [ "$K6_INSTALLED" = true ] && check_script "load-testing/run-load-tests.sh"; then
        if confirm "Do you want to run load tests?"; then
            echo -e "${YELLOW}Running load tests...${NC}"
            cd load-testing && ./run-load-tests.sh
            cd ..
            echo -e "${GREEN}Load tests completed.${NC}"
        else
            echo -e "${YELLOW}Skipping load tests.${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping load tests due to missing dependencies.${NC}"
    fi
    
    # 5. Release Management
    section_header "5. Release Management"
    if check_script "release-management/release-management.sh"; then
        if confirm "Do you want to set up release management?"; then
            echo -e "${YELLOW}Setting up release management...${NC}"
            cd release-management && ./release-management.sh --init
            cd ..
            echo -e "${GREEN}Release management set up successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping release management setup.${NC}"
        fi
    fi
    
    # 6. Security
    section_header "6. Security"
    if check_script "security/security-management.sh"; then
        if confirm "Do you want to set up security components?"; then
            echo -e "${YELLOW}Setting up security components...${NC}"
            cd security && ./security-management.sh --init
            cd ..
            echo -e "${GREEN}Security components set up successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping security components setup.${NC}"
        fi
    fi
    
    # 7. Testing
    section_header "7. Testing"
    if check_script "testing/testing-management.sh"; then
        if confirm "Do you want to set up testing components?"; then
            echo -e "${YELLOW}Setting up testing components...${NC}"
            cd testing && ./testing-management.sh --init
            cd ..
            echo -e "${GREEN}Testing components set up successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping testing components setup.${NC}"
        fi
    fi
    
    section_header "Production Infrastructure Deployment Complete"
    echo -e "${GREEN}All components have been deployed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Verify that all components are working correctly"
    echo "2. Update your application configuration to use the new infrastructure"
    echo "3. Monitor the infrastructure for any issues"
    echo ""
    echo "For more information, refer to the documentation in the docs/ directory."
    echo "=================================================="
}

# Check if we're in the right directory
if [ ! -d "cdn" ] || [ ! -d "database" ] || [ ! -d "backup" ] || [ ! -d "load-testing" ]; then
    echo -e "${RED}Error: This script must be run from the infrastructure directory.${NC}"
    exit 1
fi

# Run the main function
main