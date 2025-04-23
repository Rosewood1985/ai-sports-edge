#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running detailed deployment check for aisportsedge.app...${NC}"

# Define the base URL
BASE_URL="https://aisportsedge.app"

# Extract SFTP credentials from configuration
echo -e "${YELLOW}Extracting SFTP credentials from configuration...${NC}"
SFTP_HOST=$(grep -o '"host": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
SFTP_USER=$(grep -o '"username": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
SFTP_PORT=$(grep -o '"port": *[0-9]*' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"port": *\([0-9]*\)/\1/')

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Checking $description...${NC}"
    
    # Use curl with verbose output to check if the URL is accessible
    if curl -s -v --head --request GET "$url" 2>&1 | tee /tmp/curl_output.txt | grep "200 OK" > /dev/null; then
        echo -e "${GREEN}✅ $description is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ $description is not accessible${NC}"
        echo -e "${YELLOW}Response details:${NC}"
        grep -E "< HTTP|< Content-Type|< Server" /tmp/curl_output.txt
        return 1
    fi
}

# Check server connectivity
echo -e "${YELLOW}Checking server connectivity...${NC}"
if ping -c 1 $SFTP_HOST > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is reachable${NC}"
else
    echo -e "${RED}❌ Server is not reachable${NC}"
fi

# Check if we can SSH into the server
echo -e "${YELLOW}Checking SSH connectivity...${NC}"
if sshpass -p "$SFTP_PASSWORD" ssh -o ConnectTimeout=5 -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
    
    # Check if files exist on the server
    echo -e "${YELLOW}Checking files on server...${NC}"
    server_files=$(sshpass -p "$SFTP_PASSWORD" ssh -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "ls -la $SFTP_REMOTE_PATH | grep -E 'index.html|\.htaccess|bundle\.js|styles\.css'")
    
    if [ -n "$server_files" ]; then
        echo -e "${GREEN}✅ Files found on server:${NC}"
        echo "$server_files"
        
        # Check if build directory exists
        echo -e "${YELLOW}Checking if build directory exists on server...${NC}"
        if sshpass -p "$SFTP_PASSWORD" ssh -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "[ -d '$SFTP_REMOTE_PATH/build' ] && echo 'exists' || echo 'not exists'" | grep "exists" > /dev/null; then
            echo -e "${RED}❌ Build directory still exists on server${NC}"
            echo -e "${YELLOW}This suggests the fix-build-location.sh script hasn't run or completed successfully${NC}"
            
            # Check if fix script exists
            echo -e "${YELLOW}Checking if fix-build-location.sh exists on server...${NC}"
            if sshpass -p "$SFTP_PASSWORD" ssh -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "[ -f '$SFTP_REMOTE_PATH/fix-build-location.sh' ] && echo 'exists' || echo 'not exists'" | grep "exists" > /dev/null; then
                echo -e "${GREEN}✅ fix-build-location.sh exists on server${NC}"
                echo -e "${YELLOW}Running fix script on server...${NC}"
                sshpass -p "$SFTP_PASSWORD" ssh -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "cd $SFTP_REMOTE_PATH && chmod +x fix-build-location.sh && ./fix-build-location.sh"
            else
                echo -e "${RED}❌ fix-build-location.sh does not exist on server${NC}"
            fi
        else
            echo -e "${GREEN}✅ Build directory does not exist on server${NC}"
        fi
    else
        echo -e "${RED}❌ No key files found on server${NC}"
    fi
else
    echo -e "${RED}❌ SSH connection failed${NC}"
fi

# Check website accessibility
check_url "$BASE_URL" "Main page"
check_url "$BASE_URL/bundle.js" "JavaScript bundle"
check_url "$BASE_URL/styles.css" "CSS styles"
check_url "$BASE_URL/login.html" "Login page"
check_url "$BASE_URL/signup.html" "Signup page"

# Check DNS resolution
echo -e "${YELLOW}Checking DNS resolution...${NC}"
host_result=$(host aisportsedge.app)
if echo "$host_result" | grep "has address" > /dev/null; then
    echo -e "${GREEN}✅ DNS resolution successful:${NC}"
    echo "$host_result"
else
    echo -e "${RED}❌ DNS resolution failed:${NC}"
    echo "$host_result"
fi

echo -e "\n${YELLOW}Deployment Check Complete${NC}"
echo -e "${YELLOW}If issues persist, consider:${NC}"
echo -e "1. Checking server logs"
echo -e "2. Verifying file permissions on the server"
echo -e "3. Confirming .htaccess configuration"
echo -e "4. Checking for any firewall or CDN issues"