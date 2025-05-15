#!/bin/bash
#
# ensure-node.sh
#
# This script checks if Node.js is installed and installs it if necessary.
# It uses nvm (Node Version Manager) to install and manage Node.js versions.
#

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if nvm is installed
if [ -z "$(command -v nvm)" ]; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # NVM is installed but not in PATH, source it
    echo -e "${YELLOW}nvm found but not in PATH, sourcing it...${NC}"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  else
    # NVM is not installed, install it
    echo -e "${YELLOW}nvm not found, installing it...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Source nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    
    # Verify installation
    if [ -z "$(command -v nvm)" ]; then
      echo -e "${RED}Failed to install nvm. Please install it manually.${NC}"
      echo "Visit https://github.com/nvm-sh/nvm#installing-and-updating for instructions."
      exit 1
    fi
  fi
fi

# Check if Node.js is installed
if [ -z "$(command -v node)" ]; then
  echo -e "${YELLOW}Node.js not found, installing it...${NC}"
  
  # Check if .nvmrc exists
  if [ -f ".nvmrc" ]; then
    # Use the version specified in .nvmrc
    echo -e "${BLUE}Using Node.js version specified in .nvmrc${NC}"
    nvm install
    nvm use
  else
    # Default to Node.js v18
    echo -e "${BLUE}No .nvmrc found, defaulting to Node.js v18${NC}"
    nvm install 18
    nvm use 18
    nvm alias default 18
  fi
  
  # Verify installation
  if [ -z "$(command -v node)" ]; then
    echo -e "${RED}Failed to install Node.js. Please install it manually.${NC}"
    exit 1
  fi
  
  # Enable corepack
  echo -e "${BLUE}Enabling corepack...${NC}"
  corepack enable
fi

# Print Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js ${NODE_VERSION} is installed and active.${NC}"

# Check npm version
NPM_VERSION=$(npm -v)
echo -e "${GREEN}npm ${NPM_VERSION} is installed and active.${NC}"

# Check if package.json exists and install dependencies if needed
if [ -f "package.json" ]; then
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
  fi
fi

echo -e "${GREEN}Node.js environment is ready.${NC}"