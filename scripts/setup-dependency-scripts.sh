#!/bin/bash
# Setup Dependency Management Scripts
#
# This script makes the dependency management scripts executable
# and installs any required dependencies.

# Set error handling
set -e

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up dependency management scripts...${NC}"

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/dependency-audit.js
chmod +x scripts/fix-react-test-renderer.js

# Create symbolic links in node_modules/.bin for easier access
echo -e "${YELLOW}Creating symbolic links...${NC}"
mkdir -p node_modules/.bin
ln -sf ../../scripts/dependency-audit.js node_modules/.bin/dependency-audit
ln -sf ../../scripts/fix-react-test-renderer.js node_modules/.bin/fix-react-test-renderer

# Install missing dependencies if needed
echo -e "${YELLOW}Checking for missing dependencies...${NC}"
if ! npm list @sentry/browser &>/dev/null; then
  echo -e "${YELLOW}Installing @sentry/browser with legacy peer deps...${NC}"
  npm install @sentry/browser --save-dev --legacy-peer-deps
fi

if ! npm list @sentry/types &>/dev/null; then
  echo -e "${YELLOW}Installing @sentry/types with legacy peer deps...${NC}"
  npm install @sentry/types --save-dev --legacy-peer-deps
fi

# Create backup directory
echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p backups/dependency-management

# Add npm scripts to package.json if they don't exist
echo -e "${YELLOW}Updating package.json scripts...${NC}"
if ! grep -q "\"dependency:audit\"" package.json; then
  # Use temporary file to avoid issues with in-place editing
  jq '.scripts += {"dependency:audit": "node scripts/dependency-audit.js", "dependency:fix": "node scripts/fix-react-test-renderer.js"}' package.json > package.json.tmp
  mv package.json.tmp package.json
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}You can now run:${NC}"
echo -e "  ${YELLOW}npm run dependency:audit${NC} - To audit dependencies"
echo -e "  ${YELLOW}npm run dependency:fix${NC} - To fix React/react-test-renderer version mismatch"
echo -e "  ${YELLOW}node scripts/dependency-audit.js --fix${NC} - To audit and fix dependencies"
echo -e "  ${YELLOW}node scripts/fix-react-test-renderer.js${NC} - To fix React/react-test-renderer version mismatch"