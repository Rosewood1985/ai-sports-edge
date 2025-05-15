#!/bin/bash

# Enhanced roo command that ensures context is up to date
# Usage: Just run 'roo' at the beginning of a new Roo Code session
# Options:
#   -a, --auto-update: Automatically run update-context.sh when changes are detected
#   -h, --help: Show this help message
#   help: Show available commands

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current date and time
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Function to display help
show_help() {
  echo -e "${BLUE}=========================================================="
  echo -e "AI SPORTS EDGE - AVAILABLE COMMANDS"
  echo -e "==========================================================${NC}"
  echo -e "${GREEN}Core Commands:${NC}"
  echo -e "  ${YELLOW}roo${NC}                   - Initialize the system and load context"
  echo -e "  ${YELLOW}roo help${NC}              - Show this help message"
  echo -e "  ${YELLOW}save \"message\"${NC}        - Save current context with optional message"
  echo -e ""
  echo -e "${GREEN}Migration Commands:${NC}"
  echo -e "  ${YELLOW}migrate${NC}               - Run migration and update context"
  echo -e "  ${YELLOW}migrate --file=path${NC}   - Migrate specific file"
  echo -e "  ${YELLOW}update${NC}                - Update context with current state"
  echo -e ""
  echo -e "${GREEN}Analysis Commands:${NC}"
  echo -e "  ${YELLOW}find-candidates${NC}       - Find consolidation candidates"
  echo -e "  ${YELLOW}find-candidates category \"pattern\"${NC} - Find files matching pattern"
  echo -e ""
  echo -e "${GREEN}Examples:${NC}"
  echo -e "  ${BLUE}roo${NC}                     - Load context at start of session"
  echo -e "  ${BLUE}save \"fixed auth flow\"${NC}  - Save checkpoint with message"
  echo -e "  ${BLUE}migrate --file=services/authService.ts${NC} - Migrate specific file"
  echo -e "  ${BLUE}update${NC}                  - Update context after changes"
  echo -e "  ${BLUE}find-candidates auth \"login|signup|user\"${NC} - Find auth-related files"
  echo -e "${BLUE}==========================================================${NC}"
}

# Parse command line arguments
AUTO_UPDATE=false

if [[ $1 == "help" ]]; then
  show_help
  exit 0
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--auto-update)
      AUTO_UPDATE=true
      shift
      ;;
    -h|--help)
      echo "Usage: roo [options]"
      echo "Options:"
      echo "  -a, --auto-update: Automatically run update-context.sh when changes are detected"
      echo "  -h, --help: Show this help message"
      echo "  help: Show available commands"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${BLUE}=========================================================="
echo -e "LOADING AI SPORTS EDGE PROJECT CONTEXT - ${TIMESTAMP}"
echo -e "==========================================================${NC}"

# Check if there are any recent changes in git
echo -e "${BLUE}Checking for recent changes...${NC}"
GIT_STATUS=$(git -C /workspaces/ai-sports-edge status --porcelain)
GIT_CHANGES=$(echo "$GIT_STATUS" | wc -l)

if [ $GIT_CHANGES -gt 0 ]; then
  echo -e "${YELLOW}⚠️ There are uncommitted changes in the project.${NC}"
  
  # Count files added, modified, and deleted
  ADDED=$(echo "$GIT_STATUS" | grep -c "^??")
  MODIFIED=$(echo "$GIT_STATUS" | grep -c "^ M\|^M")
  DELETED=$(echo "$GIT_STATUS" | grep -c "^ D\|^D")
  
  echo -e "${BLUE}Changes summary:${NC}"
  echo -e "  ${GREEN}Added:    ${ADDED}${NC}"
  echo -e "  ${YELLOW}Modified: ${MODIFIED}${NC}"
  echo -e "  ${RED}Deleted:  ${DELETED}${NC}"
  
  # Show some of the changed files (limit to 5)
  echo -e "${BLUE}Changed files (showing up to 5):${NC}"
  echo "$GIT_STATUS" | head -n 5 | sed 's/^??/  Added:   /g' | sed 's/^ M\|^M/  Modified:/g' | sed 's/^ D\|^D/  Deleted: /g'
  
  if [ $GIT_CHANGES -gt 5 ]; then
    echo -e "  ${YELLOW}... and $(($GIT_CHANGES - 5)) more files${NC}"
  fi
  
  echo -e "${YELLOW}These may represent progress that hasn't been recorded in the context.${NC}"
  
  if [ "$AUTO_UPDATE" = true ]; then
    echo -e "${BLUE}Auto-update enabled. Running update-context.sh...${NC}"
    /workspaces/ai-sports-edge/update-context.sh
  else
    echo -e "${YELLOW}Consider running: /workspaces/ai-sports-edge/scripts/update-context.sh${NC}"
  fi
fi

# Load the context
/workspaces/ai-sports-edge/load-context.sh

echo -e "${GREEN}=========================================================="
echo -e "CONTEXT LOADED SUCCESSFULLY - ${TIMESTAMP}"
echo -e "==========================================================${NC}"
echo -e "${BLUE}TIP: Use 'save \"message\"' to create a checkpoint of the current context${NC}"
echo -e "${BLUE}TIP: Use 'roo help' to see all available commands${NC}"