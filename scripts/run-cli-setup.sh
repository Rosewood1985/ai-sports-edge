#!/bin/bash

# Script to run the comprehensive script consolidation and publish the CLI package
# Usage: ./scripts/run-cli-setup.sh [--no-publish]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
NO_PUBLISH=false

for arg in "$@"; do
  case $arg in
    --no-publish)
      NO_PUBLISH=true
      ;;
    --help)
      echo "Usage: $0 [--no-publish]"
      echo ""
      echo "Options:"
      echo "  --no-publish    Run script consolidation but don't publish the CLI"
      echo "  --help          Show this help message"
      exit 0
      ;;
  esac
done

# Log function
log_message() {
  local message="$1"
  local color="${2:-$BLUE}"
  echo -e "${color}${message}${NC}"
}

# Error handling
set -e
trap 'log_message "An error occurred. Exiting..." "$RED"' ERR

# Check if we're in the right directory
if [ ! -d "scripts" ] || [ ! -d "tools" ]; then
  log_message "This script must be run from the project root directory" "$RED"
  exit 1
fi

# Step 1: Run the comprehensive script consolidation
log_message "Step 1: Running comprehensive script consolidation..." "$BLUE"
npm run scripts:consolidate:comprehensive
log_message "Comprehensive script consolidation completed successfully!" "$GREEN"

# Step 2: Publish the CLI package (if not disabled)
if [ "$NO_PUBLISH" = false ]; then
  log_message "Step 2: Publishing the CLI package..." "$BLUE"
  npm run publish:cli
  log_message "CLI package published successfully!" "$GREEN"
else
  log_message "Skipping CLI package publishing as requested" "$YELLOW"
fi

log_message "All tasks completed successfully!" "$GREEN"
log_message "To use the CLI tools with make, make sure to rebuild your dev container:" "$BLUE"
log_message "See docs/dev-container-rebuild-instructions.md for details" "$BLUE"