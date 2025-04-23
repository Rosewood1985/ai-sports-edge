#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking deployment status for aisportsedge.app...${NC}"

# Define the base URL
BASE_URL="https://aisportsedge.app"

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Checking $description...${NC}"
    
    # Use curl to check if the URL is accessible
    if curl -s --head --request GET "$url" | grep "200 OK" > /dev/null; then
        echo -e "${GREEN}✅ $description is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ $description is not accessible${NC}"
        return 1
    fi
}

# Check main page
check_url "$BASE_URL" "Main page"
main_status=$?

# Check key files
check_url "$BASE_URL/bundle.js" "JavaScript bundle"
js_status=$?

check_url "$BASE_URL/styles.css" "CSS styles"
css_status=$?

check_url "$BASE_URL/login.html" "Login page"
login_status=$?

check_url "$BASE_URL/signup.html" "Signup page"
signup_status=$?

# Check if .htaccess is working by checking if a non-existent page returns 404
echo -e "${YELLOW}Checking .htaccess configuration...${NC}"
if curl -s --head --request GET "$BASE_URL/nonexistent-page" | grep "404 Not Found" > /dev/null; then
    echo -e "${GREEN}✅ .htaccess is properly configured (404 for non-existent pages)${NC}"
    htaccess_status=0
else
    echo -e "${RED}❌ .htaccess may not be properly configured${NC}"
    htaccess_status=1
fi

# Summary
echo -e "\n${YELLOW}Deployment Status Summary:${NC}"

if [ $main_status -eq 0 ] && [ $js_status -eq 0 ] && [ $css_status -eq 0 ]; then
    echo -e "${GREEN}✅ Core website files are accessible${NC}"
    
    if [ $login_status -eq 0 ] && [ $signup_status -eq 0 ]; then
        echo -e "${GREEN}✅ Authentication pages are accessible${NC}"
    else
        echo -e "${RED}❌ Some authentication pages are not accessible${NC}"
    fi
    
    if [ $htaccess_status -eq 0 ]; then
        echo -e "${GREEN}✅ Server configuration appears correct${NC}"
    else
        echo -e "${RED}❌ Server configuration may have issues${NC}"
    fi
    
    echo -e "\n${GREEN}Deployment appears to be successful!${NC}"
    echo -e "${YELLOW}Visit ${BASE_URL} in your browser to verify functionality.${NC}"
else
    echo -e "\n${RED}Deployment appears to have issues.${NC}"
    echo -e "${YELLOW}Please check the server logs and try again.${NC}"
fi