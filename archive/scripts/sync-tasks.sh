#!/bin/bash
#
# sync-tasks.sh
#
# Synchronizes tasks between todo.json and task-rolling-log.md
# Runs every 10 minutes via .cronrc
#

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
TODO_FILE="$MEMORY_BANK_DIR/todo.json"
TASK_LOG_FILE="$PROJECT_ROOT/tasks/task-rolling-log.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date +"%Y-%m-%d")
LOG_FILE="$PROJECT_ROOT/logs/task-sync.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log start
echo "🔄 Starting task synchronization at $TIMESTAMP" >> "$LOG_FILE"

# Ensure task log directory exists
mkdir -p "$(dirname "$TASK_LOG_FILE")"

# Ensure todo.json exists
if [ ! -f "$TODO_FILE" ]; then
  echo -e "${YELLOW}todo.json not found, creating empty file${NC}"
  echo '{"tasks":[]}' > "$TODO_FILE"
  echo "Created empty todo.json" >> "$LOG_FILE"
fi

# Ensure task-rolling-log.md exists
if [ ! -f "$TASK_LOG_FILE" ]; then
  echo -e "${YELLOW}task-rolling-log.md not found, creating file${NC}"
  cat > "$TASK_LOG_FILE" << EOF
# Task Rolling Log

## $DATE

### Added

### Updated

EOF
  echo "Created task-rolling-log.md" >> "$LOG_FILE"
fi

# Function to add today's section to task log if it doesn't exist
ensure_today_section() {
  if ! grep -q "## $DATE" "$TASK_LOG_FILE"; then
    echo -e "${BLUE}Adding today's section to task log${NC}"
    # Insert after the first line
    sed -i "1a\\
\\
## $DATE\\
\\
### Added\\
\\
### Updated\\
" "$TASK_LOG_FILE"
    echo "Added today's section to task log" >> "$LOG_FILE"
  fi
}

# Sync tasks from todo.json to task-rolling-log.md
sync_todo_to_log() {
  echo -e "${BLUE}Syncing tasks from todo.json to task-rolling-log.md${NC}"
  
  # Get today's tasks from todo.json
  local today_created=$(jq -r '.tasks[] | select(.created | startswith("'"$DATE"'")) | "\(.priority)|\(.id)|\(.title)|\(.status)|\(.created)"' "$TODO_FILE")
  local today_updated=$(jq -r '.tasks[] | select(.updated | startswith("'"$DATE"'") and (.created | startswith("'"$DATE"'") | not)) | "\(.priority)|\(.id)|\(.title)|\(.status)|\(.updated)"' "$TODO_FILE")
  
  # Add created tasks to the Added section
  if [ -n "$today_created" ]; then
    echo -e "${GREEN}Found $(echo "$today_created" | wc -l) tasks created today${NC}"
    echo "Found $(echo "$today_created" | wc -l) tasks created today" >> "$LOG_FILE"
    
    # Find the Added section
    local added_line=$(grep -n "### Added" "$TASK_LOG_FILE" | grep -A1 "$DATE" | head -1 | cut -d: -f1)
    
    # Add each task
    echo "$today_created" | while IFS='|' read -r priority id title status timestamp; do
      # Convert priority to uppercase
      priority_upper=$(echo "$priority" | tr '[:lower:]' '[:upper:]')
      
      # Check if task already exists in the Added section
      if ! grep -q "$id:" "$TASK_LOG_FILE"; then
        # Add task to the Added section
        sed -i "$((added_line + 1))i\\- [$priority_upper] $id: $title (status: $status, created: $timestamp)" "$TASK_LOG_FILE"
        echo "Added task $id to task log" >> "$LOG_FILE"
      fi
    done
  else
    echo -e "${YELLOW}No tasks created today${NC}"
    echo "No tasks created today" >> "$LOG_FILE"
  fi
  
  # Add updated tasks to the Updated section
  if [ -n "$today_updated" ]; then
    echo -e "${GREEN}Found $(echo "$today_updated" | wc -l) tasks updated today${NC}"
    echo "Found $(echo "$today_updated" | wc -l) tasks updated today" >> "$LOG_FILE"
    
    # Find the Updated section
    local updated_line=$(grep -n "### Updated" "$TASK_LOG_FILE" | grep -A1 "$DATE" | head -1 | cut -d: -f1)
    
    # Add each task
    echo "$today_updated" | while IFS='|' read -r priority id title status timestamp; do
      # Convert priority to uppercase
      priority_upper=$(echo "$priority" | tr '[:lower:]' '[:upper:]')
      
      # Check if task already exists in the Updated section
      if ! grep -q "$id:" "$TASK_LOG_FILE" | grep -A10 "### Updated" | grep -A10 "$DATE" | grep -q "$id:"; then
        # Add task to the Updated section
        sed -i "$((updated_line + 1))i\\- [$priority_upper] $id: $title (status: $status, updated: $timestamp)" "$TASK_LOG_FILE"
        echo "Added updated task $id to task log" >> "$LOG_FILE"
      fi
    done
  else
    echo -e "${YELLOW}No tasks updated today${NC}"
    echo "No tasks updated today" >> "$LOG_FILE"
  fi
}

# Sync tasks from task-rolling-log.md to todo.json
sync_log_to_todo() {
  echo -e "${BLUE}Syncing tasks from task-rolling-log.md to todo.json${NC}"
  
  # Get today's tasks from task-rolling-log.md
  local today_tasks=$(grep -A50 "## $DATE" "$TASK_LOG_FILE" | grep -E "^\- \[(HIGH|MEDIUM|LOW)\]" | sed 's/^- //')
  
  if [ -n "$today_tasks" ]; then
    echo -e "${GREEN}Found $(echo "$today_tasks" | wc -l) tasks in today's log${NC}"
    echo "Found $(echo "$today_tasks" | wc -l) tasks in today's log" >> "$LOG_FILE"
    
    # Process each task
    echo "$today_tasks" | while read -r task_line; do
      # Extract task details
      local priority=$(echo "$task_line" | grep -o "\[.*\]" | tr -d '[]' | tr '[:upper:]' '[:lower:]')
      local id=$(echo "$task_line" | grep -o "TASK-[0-9]*" | head -1)
      local title=$(echo "$task_line" | sed -E 's/\[.*\] TASK-[0-9]*: (.*) \(status:.*/\1/')
      local status=$(echo "$task_line" | grep -o "status: [a-z-]*" | sed 's/status: //')
      
      # Check if task exists in todo.json
      if ! jq -e '.tasks[] | select(.id == "'"$id"'")' "$TODO_FILE" > /dev/null; then
        echo -e "${YELLOW}Task $id not found in todo.json, adding${NC}"
        echo "Task $id not found in todo.json, adding" >> "$LOG_FILE"
        
        # Create timestamp
        local timestamp=""
        if echo "$task_line" | grep -q "created:"; then
          timestamp=$(echo "$task_line" | grep -o "created: [0-9T:Z-]*" | sed 's/created: //')
        elif echo "$task_line" | grep -q "updated:"; then
          timestamp=$(echo "$task_line" | grep -o "updated: [0-9T:Z-]*" | sed 's/updated: //')
        else
          timestamp="$TIMESTAMP"
        fi
        
        # Add task to todo.json
        local temp_file=$(mktemp)
        jq '.tasks += [{"id": "'"$id"'", "title": "'"$title"'", "description": "Added from task-rolling-log.md", "status": "'"$status"'", "priority": "'"$priority"'", "created": "'"$timestamp"'", "updated": "'"$timestamp"'", "assignee": "auto-sync", "tags": ["auto-sync"]}]' "$TODO_FILE" > "$temp_file"
        mv "$temp_file" "$TODO_FILE"
        echo "Added task $id to todo.json" >> "$LOG_FILE"
      fi
    done
  else
    echo -e "${YELLOW}No tasks found in today's log${NC}"
    echo "No tasks found in today's log" >> "$LOG_FILE"
  fi
}

# Main function
main() {
  ensure_today_section
  sync_todo_to_log
  sync_log_to_todo
  
  echo -e "${GREEN}Task synchronization completed${NC}"
  echo "✅ Task synchronization completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG_FILE"
  echo "-------------------------------------------" >> "$LOG_FILE"
  
  # Log to roo-observations.md if the helper script exists
  if [ -f "$SCRIPT_DIR/log-cron-observation.sh" ]; then
    # Count tasks
    local created_count=$(jq -r '.tasks[] | select(.created | startswith("'"$DATE"'"))' "$TODO_FILE" | jq -s 'length')
    local updated_count=$(jq -r '.tasks[] | select(.updated | startswith("'"$DATE"'") and (.created | startswith("'"$DATE"'") | not))' "$TODO_FILE" | jq -s 'length')
    
    if [ "$created_count" -gt 0 ] || [ "$updated_count" -gt 0 ]; then
      "$SCRIPT_DIR/log-cron-observation.sh" --label "sync-tasks" --status "success" --message "Synchronized $created_count new tasks and $updated_count updated tasks between todo.json and task-rolling-log.md"
    else
      "$SCRIPT_DIR/log-cron-observation.sh" --label "sync-tasks" --message "No new tasks to synchronize today."
    fi
  fi
}

# Run the script
main