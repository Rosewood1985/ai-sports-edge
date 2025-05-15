#!/bin/bash

# setup-command-aliases.sh
# Creates symbolic links for command aliases to improve usability
# Usage: sudo ./scripts/setup-command-aliases.sh

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up AI Sports Edge command aliases...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Base directory
BASE_DIR="/workspaces/ai-sports-edge"

# Create aliases
echo -e "${BLUE}Creating command aliases...${NC}"

# roo command (already exists)
ln -sf "$BASE_DIR/scripts/roo-command.sh" /usr/local/bin/roo
echo -e "${GREEN}Created alias: roo -> $BASE_DIR/scripts/roo-command.sh${NC}"

# save command (already exists)
ln -sf "$BASE_DIR/scripts/save-context.sh" /usr/local/bin/save
echo -e "${GREEN}Created alias: save -> $BASE_DIR/scripts/save-context.sh${NC}"

# migrate command (new)
ln -sf "$BASE_DIR/scripts/migrate-and-update.sh" /usr/local/bin/migrate
echo -e "${GREEN}Created alias: migrate -> $BASE_DIR/scripts/migrate-and-update.sh${NC}"

# update command (new)
ln -sf "$BASE_DIR/update-context.sh" /usr/local/bin/update
echo -e "${GREEN}Created alias: update -> $BASE_DIR/update-context.sh${NC}"

# find command (new)
ln -sf "$BASE_DIR/scripts/find-consolidation-candidates.sh" /usr/local/bin/find-candidates
echo -e "${GREEN}Created alias: find-candidates -> $BASE_DIR/scripts/find-consolidation-candidates.sh${NC}"

echo -e "${BLUE}Making all scripts executable...${NC}"
chmod +x "$BASE_DIR/scripts/roo-command.sh"
chmod +x "$BASE_DIR/scripts/save-context.sh"
chmod +x "$BASE_DIR/scripts/migrate-and-update.sh"
chmod +x "$BASE_DIR/update-context.sh"
chmod +x "$BASE_DIR/scripts/find-consolidation-candidates.sh"

echo -e "${GREEN}Command aliases setup complete!${NC}"
echo -e "${YELLOW}Note: Used 'find-candidates' instead of 'find' to avoid conflict with system command${NC}"
echo -e "${BLUE}Use 'roo help' to see available commands${NC}"