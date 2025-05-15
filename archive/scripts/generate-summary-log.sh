#!/bin/bash

# generate-summary-log.sh
#
# This script generates a summary log of recent activities in the project.
# It collects information from various sources such as git commits, memory bank updates,
# and task tracking systems to provide a comprehensive overview of recent project activities.
#
# Usage:
#   ./scripts/generate-summary-log.sh
#
# Runs every 30 minutes via .cronrc

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
LOGS_DIR="$PROJECT_ROOT/logs"
STATUS_DIR="$PROJECT_ROOT/status"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$STATUS_DIR/activity-summary-$TIMESTAMP.md"

# Ensure log directory exists
mkdir -p "$LOGS_DIR"
mkdir -p "$STATUS_DIR"

# Log function
log() {
  local message=$1
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $message" >> "$LOGS_DIR/summary-generator.log"
}

# Check if memory bank exists
check_memory_bank() {
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    print_message "ERROR" "Memory bank directory not found: $MEMORY_BANK_DIR" "$RED"
    log "ERROR: Memory bank directory not found: $MEMORY_BANK_DIR"
    exit 1
  fi
}

# Get recent git commits
get_recent_commits() {
  print_message "INFO" "Collecting recent git commits..." "$BLUE"
  log "Collecting recent git commits..."
  
  # Check if git is available and the project is a git repository
  if command -v git >/dev/null 2>&1 && git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    # Get commits from the last 24 hours
    git -C "$PROJECT_ROOT" log --since="24 hours ago" --pretty=format:"- %h: %s (%an, %ar)" --no-merges
  else
    echo "No git repository found or git not available"
    log "No git repository found or git not available"
  fi
}

# Get memory bank updates
get_memory_bank_updates() {
  print_message "INFO" "Collecting memory bank updates..." "$BLUE"
  log "Collecting memory bank updates..."
  
  # Check if memory bank exists
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    echo "Memory bank directory not found"
    log "Memory bank directory not found"
    return
  fi
  
  # Get the last update time from .migration-status.json if it exists
  if [ -f "$MEMORY_BANK_DIR/.migration-status.json" ]; then
    local last_update=$(grep -o '"lastUpdate":[0-9]*' "$MEMORY_BANK_DIR/.migration-status.json" | cut -d':' -f2)
    if [ -n "$last_update" ]; then
      local last_update_date=$(date -d @$((last_update/1000)) 2>/dev/null || date -r $((last_update/1000)) 2>/dev/null)
      echo "- Last memory bank update: $last_update_date"
    fi
    
    # Get the last checkpoint time
    local last_checkpoint=$(grep -o '"lastCheckpoint":[0-9]*' "$MEMORY_BANK_DIR/.migration-status.json" | cut -d':' -f2)
    if [ -n "$last_checkpoint" ] && [ "$last_checkpoint" != "null" ]; then
      local last_checkpoint_date=$(date -d @$((last_checkpoint/1000)) 2>/dev/null || date -r $((last_checkpoint/1000)) 2>/dev/null)
      echo "- Last checkpoint: $last_checkpoint_date"
    fi
  else
    echo "- No memory bank status information available"
  fi
  
  # Count the number of tasks in the memory bank
  local task_count=$(grep -r "- \[ \]" "$MEMORY_BANK_DIR" | wc -l)
  echo "- Total tasks in memory bank: $task_count"
  
  # Count the number of completed tasks
  local completed_task_count=$(grep -r "- \[x\]" "$MEMORY_BANK_DIR" | wc -l)
  echo "- Completed tasks in memory bank: $completed_task_count"
}

# Get recent file changes
get_recent_file_changes() {
  print_message "INFO" "Collecting recent file changes..." "$BLUE"
  log "Collecting recent file changes..."
  
  # Find files modified in the last 24 hours
  find "$PROJECT_ROOT" -type f -mtime -1 -not -path "*/\.*" -not -path "*/node_modules/*" | sort | while read -r file; do
    # Get relative path
    local rel_path="${file#$PROJECT_ROOT/}"
    echo "- $rel_path ($(date -r "$file" '+%Y-%m-%d %H:%M:%S'))"
  done
}

# Generate summary log
generate_summary() {
  print_message "INFO" "Generating summary log..." "$BLUE"
  log "Generating summary log..."
  
  # Create summary log file
  cat > "$LOG_FILE" << EOF
# Activity Summary - $(date +"%Y-%m-%d %H:%M:%S")

This summary log provides an overview of recent activities in the AI Sports Edge project.

## Recent Git Commits

$(get_recent_commits)

## Memory Bank Status

$(get_memory_bank_updates)

## Recent File Changes (Last 24 Hours)

$(get_recent_file_changes)

## System Status

- Log generated: $(date +"%Y-%m-%d %H:%M:%S")
- System uptime: $(uptime)
- Disk usage: $(df -h / | awk 'NR==2 {print $5 " used"}')

## Next Steps

1. Review recent commits and file changes
2. Check memory bank status and update if necessary
3. Address any pending tasks or issues

EOF
  
  # Create a symlink to the latest summary
  ln -sf "$LOG_FILE" "$STATUS_DIR/latest-activity-summary.md"
  
  print_message "SUCCESS" "Summary log generated: $LOG_FILE" "$GREEN"
  log "Summary log generated: $LOG_FILE"
}

# Main function
main() {
  print_message "INFO" "Starting summary log generation..." "$BLUE"
  log "Starting summary log generation..."
  
  # Check if memory bank exists
  check_memory_bank
  
  # Generate summary
  generate_summary
  
  print_message "SUCCESS" "Summary log generation completed" "$GREEN"
  log "Summary log generation completed"
}

# Run the script
main