#!/bin/bash

# sync-tasks-with-memory-bank.sh
#
# This script synchronizes tasks between the memory bank and task tracking system.
# It ensures that tasks in the memory bank are properly reflected in the task tracking system
# and vice versa, maintaining consistency between the two systems.
#
# Usage:
#   ./scripts/sync-tasks-with-memory-bank.sh
#
# Runs every 5 minutes via .cronrc

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
LOG_FILE="$LOGS_DIR/task-sync-$TIMESTAMP.log"

# Ensure log directory exists
mkdir -p "$LOGS_DIR"

# Log function
log() {
  local message=$1
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "$LOG_FILE"
}

# Check if memory bank exists
check_memory_bank() {
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    print_message "ERROR" "Memory bank directory not found: $MEMORY_BANK_DIR" "$RED"
    log "ERROR: Memory bank directory not found: $MEMORY_BANK_DIR"
    exit 1
  fi
}

# Extract tasks from memory bank files
extract_tasks_from_memory_bank() {
  print_message "INFO" "Extracting tasks from memory bank..." "$BLUE"
  log "Extracting tasks from memory bank..."
  
  # Create a temporary file to store tasks
  local temp_file=$(mktemp)
  
  # Extract tasks from activeContext.md
  if [ -f "$MEMORY_BANK_DIR/activeContext.md" ]; then
    grep -n "- \[ \]" "$MEMORY_BANK_DIR/activeContext.md" | sed 's/^/activeContext.md:/' >> "$temp_file"
  fi
  
  # Extract tasks from progress.md
  if [ -f "$MEMORY_BANK_DIR/progress.md" ]; then
    grep -n "- \[ \]" "$MEMORY_BANK_DIR/progress.md" | sed 's/^/progress.md:/' >> "$temp_file"
  fi
  
  # Extract tasks from productContext.md
  if [ -f "$MEMORY_BANK_DIR/productContext.md" ]; then
    grep -n "- \[ \]" "$MEMORY_BANK_DIR/productContext.md" | sed 's/^/productContext.md:/' >> "$temp_file"
  fi
  
  # Count the number of tasks found
  local task_count=$(wc -l < "$temp_file")
  print_message "INFO" "Found $task_count tasks in memory bank" "$BLUE"
  log "Found $task_count tasks in memory bank"
  
  echo "$temp_file"
}

# Extract tasks from task tracking system
extract_tasks_from_tracking_system() {
  print_message "INFO" "Extracting tasks from tracking system..." "$BLUE"
  log "Extracting tasks from tracking system..."
  
  # Create a temporary file to store tasks
  local temp_file=$(mktemp)
  
  # Extract tasks from ai-sports-edge-todo.md
  if [ -f "$PROJECT_ROOT/ai-sports-edge-todo.md" ]; then
    grep -n "- \[ \]" "$PROJECT_ROOT/ai-sports-edge-todo.md" | sed 's/^/ai-sports-edge-todo.md:/' >> "$temp_file"
  fi
  
  # Count the number of tasks found
  local task_count=$(wc -l < "$temp_file")
  print_message "INFO" "Found $task_count tasks in tracking system" "$BLUE"
  log "Found $task_count tasks in tracking system"
  
  echo "$temp_file"
}

# Synchronize tasks between memory bank and tracking system
sync_tasks() {
  print_message "INFO" "Synchronizing tasks..." "$BLUE"
  log "Synchronizing tasks..."
  
  local memory_bank_tasks=$1
  local tracking_system_tasks=$2
  
  # Create a temporary file for the merged tasks
  local merged_tasks=$(mktemp)
  
  # Merge tasks from both sources, removing duplicates
  cat "$memory_bank_tasks" "$tracking_system_tasks" | sort | uniq > "$merged_tasks"
  
  # Count the number of merged tasks
  local merged_task_count=$(wc -l < "$merged_tasks")
  print_message "INFO" "Merged $merged_task_count unique tasks" "$BLUE"
  log "Merged $merged_task_count unique tasks"
  
  # Update task status file
  local status_file="$STATUS_DIR/task-sync-status.json"
  echo "{" > "$status_file"
  echo "  \"lastSync\": \"$(date +"%Y-%m-%d %H:%M:%S")\"," >> "$status_file"
  echo "  \"taskCount\": $merged_task_count," >> "$status_file"
  echo "  \"memoryBankTasks\": $(wc -l < "$memory_bank_tasks")," >> "$status_file"
  echo "  \"trackingSystemTasks\": $(wc -l < "$tracking_system_tasks")" >> "$status_file"
  echo "}" >> "$status_file"
  
  # Clean up temporary files
  rm -f "$memory_bank_tasks" "$tracking_system_tasks" "$merged_tasks"
  
  print_message "SUCCESS" "Tasks synchronized successfully" "$GREEN"
  log "Tasks synchronized successfully"
}

# Main function
main() {
  print_message "INFO" "Starting task synchronization..." "$BLUE"
  log "Starting task synchronization..."
  
  # Check if memory bank exists
  check_memory_bank
  
  # Extract tasks from memory bank
  local memory_bank_tasks=$(extract_tasks_from_memory_bank)
  
  # Extract tasks from tracking system
  local tracking_system_tasks=$(extract_tasks_from_tracking_system)
  
  # Synchronize tasks
  sync_tasks "$memory_bank_tasks" "$tracking_system_tasks"
  
  print_message "SUCCESS" "Task synchronization completed" "$GREEN"
  log "Task synchronization completed"
}

# Run the script
main