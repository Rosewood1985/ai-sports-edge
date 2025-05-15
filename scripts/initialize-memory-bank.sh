#!/bin/bash

# initialize-memory-bank.sh
#
# This script initializes the memory bank for the Firebase atomic architecture migration.
# It creates the necessary directory structure, initializes the memory bank files,
# and runs the first update to populate the memory bank with the current project state.
#
# Usage:
#   ./scripts/initialize-memory-bank.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a message with a colored prefix
print_message() {
  local prefix=$1
  local message=$2
  local color=$3
  
  echo -e "${color}[$prefix]${NC} $message"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
CHECKPOINTS_DIR="$MEMORY_BANK_DIR/checkpoints"

# Create memory bank directory structure
print_message "INFO" "Creating memory bank directory structure..." "$BLUE"

mkdir -p "$MEMORY_BANK_DIR"
mkdir -p "$CHECKPOINTS_DIR"

print_message "SUCCESS" "Memory bank directory structure created" "$GREEN"

# Check if memory bank files already exist
if [ -f "$MEMORY_BANK_DIR/activeContext.md" ] && \
   [ -f "$MEMORY_BANK_DIR/systemPatterns.md" ] && \
   [ -f "$MEMORY_BANK_DIR/progress.md" ] && \
   [ -f "$MEMORY_BANK_DIR/decisionLog.md" ] && \
   [ -f "$MEMORY_BANK_DIR/productContext.md" ]; then
  print_message "INFO" "Memory bank files already exist" "$YELLOW"
  
  # Ask for confirmation to overwrite
  read -p "Do you want to overwrite existing memory bank files? (y/n) " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "INFO" "Skipping file creation" "$BLUE"
  else
    print_message "INFO" "Overwriting existing memory bank files..." "$BLUE"
    # Continue with file creation
  fi
else
  print_message "INFO" "Creating memory bank files..." "$BLUE"
fi

# Make the maintain-context.sh script executable
chmod +x "$SCRIPT_DIR/maintain-context.sh"

# Run the first update
print_message "INFO" "Running first memory bank update..." "$BLUE"

"$SCRIPT_DIR/maintain-context.sh" update --force

if [ $? -eq 0 ]; then
  print_message "SUCCESS" "Memory bank initialized successfully" "$GREEN"
else
  print_message "ERROR" "Failed to initialize memory bank" "$RED"
  exit 1
fi

# Create the first checkpoint
print_message "INFO" "Creating initial checkpoint..." "$BLUE"

"$SCRIPT_DIR/maintain-context.sh" checkpoint

if [ $? -eq 0 ]; then
  print_message "SUCCESS" "Initial checkpoint created successfully" "$GREEN"
else
  print_message "ERROR" "Failed to create initial checkpoint" "$RED"
  exit 1
fi

# Show memory bank status
print_message "INFO" "Memory bank status:" "$BLUE"

"$SCRIPT_DIR/maintain-context.sh" status

# Show next steps
print_message "NEXT STEPS" "To maintain context awareness during the migration:" "$GREEN"
echo
echo "1. Run the following command before starting each development session:"
echo "   ./scripts/maintain-context.sh update"
echo
echo "2. Set up automatic updates (runs every 30 minutes in the background):"
echo "   ./scripts/maintain-context.sh auto"
echo
echo "3. Create checkpoints before major changes:"
echo "   ./scripts/maintain-context.sh checkpoint"
echo
echo "4. If you experience context loss, recover using:"
echo "   ./scripts/maintain-context.sh recover"
echo
echo "5. Check the current migration status:"
echo "   ./scripts/maintain-context.sh status"
echo
echo "For more information, see memory-bank/README.md"