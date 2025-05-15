#!/bin/bash

# maintain-context.sh
# 
# This script helps maintain context awareness during the Firebase atomic architecture migration.
# It provides commands to update the memory bank, create checkpoints, and recover from context loss.
#
# Usage:
#   ./scripts/maintain-context.sh [command]
#
# Commands:
#   update       Update the memory bank with the latest project state
#   checkpoint   Create a checkpoint of the current memory bank state
#   recover      Recover from context loss using the latest checkpoint
#   auto         Set up automatic updates (runs in background)
#   status       Show the current migration status
#   help         Show this help message

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
NODE_BIN="node"

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

# Check if memory bank exists
check_memory_bank() {
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    print_message "ERROR" "Memory bank directory not found: $MEMORY_BANK_DIR" "$RED"
    print_message "INFO" "Creating memory bank directory..." "$BLUE"
    mkdir -p "$MEMORY_BANK_DIR"
  fi
}

# Update the memory bank
update_memory_bank() {
  print_message "INFO" "Updating memory bank..." "$BLUE"
  $NODE_BIN "$SCRIPT_DIR/update-memory-bank.js" "$@"
  
  if [ $? -eq 0 ]; then
    print_message "SUCCESS" "Memory bank updated successfully" "$GREEN"
  else
    print_message "ERROR" "Failed to update memory bank" "$RED"
    return 1
  fi
}

# Create a checkpoint
create_checkpoint() {
  print_message "INFO" "Creating checkpoint..." "$BLUE"
  $NODE_BIN "$SCRIPT_DIR/update-memory-bank.js" --checkpoint
  
  if [ $? -eq 0 ]; then
    print_message "SUCCESS" "Checkpoint created successfully" "$GREEN"
  else
    print_message "ERROR" "Failed to create checkpoint" "$RED"
    return 1
  fi
}

# Recover from context loss
recover_context() {
  print_message "INFO" "Recovering from context loss..." "$BLUE"
  $NODE_BIN "$SCRIPT_DIR/update-memory-bank.js" --force
  
  if [ $? -eq 0 ]; then
    print_message "SUCCESS" "Context recovered successfully" "$GREEN"
  else
    print_message "ERROR" "Failed to recover context" "$RED"
    return 1
  fi
}

# Set up automatic updates
setup_auto_updates() {
  print_message "INFO" "Setting up automatic updates..." "$BLUE"
  
  # Check if cron is available
  if command -v crontab >/dev/null 2>&1; then
    # Add cron job to run every 30 minutes
    (crontab -l 2>/dev/null; echo "*/30 * * * * cd $PROJECT_ROOT && $SCRIPT_DIR/maintain-context.sh update > /dev/null 2>&1") | crontab -
    print_message "SUCCESS" "Automatic updates set up with cron (every 30 minutes)" "$GREEN"
  else
    # Fall back to a background process
    print_message "INFO" "Cron not available, using background process" "$BLUE"
    
    # Run in background, updating every 30 minutes
    (
      while true; do
        $SCRIPT_DIR/maintain-context.sh update
        sleep 1800 # 30 minutes
      done
    ) &
    
    print_message "SUCCESS" "Background process started (PID: $!)" "$GREEN"
    print_message "INFO" "To stop, run: kill $!" "$BLUE"
    
    # Save PID to file for later reference
    echo $! > "$MEMORY_BANK_DIR/.auto-update-pid"
  fi
}

# Show migration status
show_status() {
  print_message "INFO" "Checking migration status..." "$BLUE"
  
  if [ -f "$MEMORY_BANK_DIR/.migration-status.json" ]; then
    # Parse and display migration status
    migrated_count=$(grep -o '"migratedFiles":\[.*\]' "$MEMORY_BANK_DIR/.migration-status.json" | grep -o ',' | wc -l)
    migrated_count=$((migrated_count + 1))
    
    pending_count=$(grep -o '"pendingFiles":\[.*\]' "$MEMORY_BANK_DIR/.migration-status.json" | grep -o ',' | wc -l)
    pending_count=$((pending_count + 1))
    
    # Handle empty arrays
    if grep -q '"migratedFiles":\[\]' "$MEMORY_BANK_DIR/.migration-status.json"; then
      migrated_count=0
    fi
    
    if grep -q '"pendingFiles":\[\]' "$MEMORY_BANK_DIR/.migration-status.json"; then
      pending_count=0
    fi
    
    total_count=$((migrated_count + pending_count))
    progress=$((migrated_count * 100 / total_count))
    
    print_message "STATUS" "Migration Progress: $progress% ($migrated_count/$total_count files)" "$GREEN"
    print_message "STATUS" "Migrated Files: $migrated_count" "$GREEN"
    print_message "STATUS" "Pending Files: $pending_count" "$YELLOW"
    
    # Show last update time
    last_update=$(grep -o '"lastUpdate":[0-9]*' "$MEMORY_BANK_DIR/.migration-status.json" | cut -d':' -f2)
    if [ -n "$last_update" ]; then
      last_update_date=$(date -d @$((last_update/1000)) 2>/dev/null || date -r $((last_update/1000)) 2>/dev/null)
      print_message "STATUS" "Last Update: $last_update_date" "$BLUE"
    fi
    
    # Show last checkpoint time
    last_checkpoint=$(grep -o '"lastCheckpoint":[0-9]*' "$MEMORY_BANK_DIR/.migration-status.json" | cut -d':' -f2)
    if [ -n "$last_checkpoint" ] && [ "$last_checkpoint" != "null" ]; then
      last_checkpoint_date=$(date -d @$((last_checkpoint/1000)) 2>/dev/null || date -r $((last_checkpoint/1000)) 2>/dev/null)
      print_message "STATUS" "Last Checkpoint: $last_checkpoint_date" "$BLUE"
    else
      print_message "STATUS" "No checkpoints created yet" "$YELLOW"
    fi
  else
    print_message "ERROR" "Migration status file not found" "$RED"
    print_message "INFO" "Run 'update' command to initialize" "$BLUE"
  fi
}

# Show help message
show_help() {
  cat << EOF
$(print_message "HELP" "Firebase Atomic Architecture Migration Context Maintenance" "$BLUE")

Usage:
  ./scripts/maintain-context.sh [command]

Commands:
  update       Update the memory bank with the latest project state
  checkpoint   Create a checkpoint of the current memory bank state
  recover      Recover from context loss using the latest checkpoint
  auto         Set up automatic updates (runs in background)
  status       Show the current migration status
  help         Show this help message

Examples:
  ./scripts/maintain-context.sh update      # Update memory bank
  ./scripts/maintain-context.sh checkpoint  # Create a checkpoint
  ./scripts/maintain-context.sh auto        # Set up automatic updates
EOF
}

# Main function
main() {
  # Check if memory bank exists
  check_memory_bank
  
  # Parse command
  local command=${1:-"help"}
  
  case "$command" in
    update)
      shift
      update_memory_bank "$@"
      ;;
    checkpoint)
      create_checkpoint
      ;;
    recover)
      recover_context
      ;;
    auto)
      setup_auto_updates
      ;;
    status)
      show_status
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      print_message "ERROR" "Unknown command: $command" "$RED"
      show_help
      exit 1
      ;;
  esac
}

# Run the script
main "$@"