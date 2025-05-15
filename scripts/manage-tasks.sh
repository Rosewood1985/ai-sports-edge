#!/bin/bash
#
# manage-tasks.sh
#
# This script manages tasks in memory-bank/todo.json, providing functions to
# add, update, complete, list, and search tasks with fuzzy matching for deduplication.
#
# Usage:
#   ./scripts/manage-tasks.sh [command] [arguments...]
#
# Commands:
#   add <task> [source] [priority]      Add a new task
#   update <id> <field> <value>         Update a task field
#   complete <id> [message]             Mark a task as completed
#   list [status]                       List all tasks, optionally filtered by status
#   search <query>                      Search for tasks using fuzzy matching
#   help                                Show this help message
#

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
TODO_FILE="$MEMORY_BANK_DIR/todo.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure memory bank directory exists
ensure_memory_bank() {
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    mkdir -p "$MEMORY_BANK_DIR"
    echo -e "${GREEN}Created memory bank directory: $MEMORY_BANK_DIR${NC}"
  fi
}

# Ensure todo.json exists
ensure_todo_file() {
  if [ ! -f "$TODO_FILE" ]; then
    echo -e "${BLUE}Creating todo.json file...${NC}"
    echo '[]' > "$TODO_FILE"
    echo -e "${GREEN}Created todo.json file${NC}"
  fi
}

# Calculate similarity between two strings (0-100)
# Uses Levenshtein distance algorithm
calculate_similarity() {
  local str1="$1"
  local str2="$2"
  
  # Convert to lowercase for case-insensitive comparison
  str1=$(echo "$str1" | tr '[:upper:]' '[:lower:]')
  str2=$(echo "$str2" | tr '[:upper:]' '[:lower:]')
  
  # Get lengths
  local len1=${#str1}
  local len2=${#str2}
  
  # If either string is empty, similarity is 0
  if [ $len1 -eq 0 ] || [ $len2 -eq 0 ]; then
    echo 0
    return
  fi
  
  # Use Python to calculate Levenshtein distance and similarity percentage
  local similarity=$(python3 -c "
import sys
def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

s1 = '$str1'
s2 = '$str2'
distance = levenshtein(s1, s2)
max_len = max(len(s1), len(s2))
if max_len == 0:
    similarity = 100
else:
    similarity = (1 - distance / max_len) * 100
print(int(similarity))
")
  
  echo $similarity
}

# Check if a similar task already exists
# Returns the ID of the similar task if found, empty string otherwise
find_similar_task() {
  local task="$1"
  local similarity_threshold=70
  
  # Read the current todo.json
  local todos=$(cat "$TODO_FILE")
  
  # Get the number of tasks
  local task_count=$(echo "$todos" | jq '. | length')
  
  # Loop through each task and check similarity
  for (( i=0; i<$task_count; i++ )); do
    local existing_task=$(echo "$todos" | jq -r ".[$i].task")
    local similarity=$(calculate_similarity "$task" "$existing_task")
    
    if [ $similarity -ge $similarity_threshold ]; then
      echo $i
      return
    fi
  done
  
  # No similar task found
  echo ""
}

# Add a new task
add_task() {
  local task="$1"
  local source="${2:-unknown}"
  local priority="${3:-medium}"
  
  echo -e "${BLUE}Adding task: $task${NC}"
  
  ensure_memory_bank
  ensure_todo_file
  
  # Check if a similar task already exists
  local similar_task_id=$(find_similar_task "$task")
  
  if [ -n "$similar_task_id" ]; then
    # Get the similar task
    local todos=$(cat "$TODO_FILE")
    local similar_task=$(echo "$todos" | jq -r ".[$similar_task_id]")
    local similar_task_desc=$(echo "$similar_task" | jq -r ".task")
    
    echo -e "${YELLOW}Similar task already exists (ID: $similar_task_id): $similar_task_desc${NC}"
    echo -e "${BLUE}Updating existing task...${NC}"
    
    # Update the existing task
    local temp_file=$(mktemp)
    cat "$TODO_FILE" | jq ".[$similar_task_id].timestamp = \"$TIMESTAMP\" | .[$similar_task_id].source = \"$source\"" > "$temp_file"
    mv "$temp_file" "$TODO_FILE"
    
    echo -e "${GREEN}Updated existing task (ID: $similar_task_id)${NC}"
    return
  fi
  
  # Create a new task entry
  local new_task='{
    "task": "'"$task"'",
    "status": "pending",
    "timestamp": "'"$TIMESTAMP"'",
    "source": "'"$source"'",
    "priority": "'"$priority"'"
  }'
  
  # Add the new task to the todo.json file
  local temp_file=$(mktemp)
  cat "$TODO_FILE" | jq ". += [$new_task]" > "$temp_file"
  mv "$temp_file" "$TODO_FILE"
  
  # Get the ID of the new task
  local new_task_id=$(cat "$TODO_FILE" | jq '. | length - 1')
  
  echo -e "${GREEN}Added new task (ID: $new_task_id): $task${NC}"
}

# Update a task field
update_task() {
  local id="$1"
  local field="$2"
  local value="$3"
  
  echo -e "${BLUE}Updating task $id, setting $field to: $value${NC}"
  
  ensure_todo_file
  
  # Check if the task exists
  local todos=$(cat "$TODO_FILE")
  local task_count=$(echo "$todos" | jq '. | length')
  
  if [ $id -ge $task_count ]; then
    echo -e "${RED}Error: Task ID $id does not exist${NC}"
    return 1
  fi
  
  # Update the task field
  local temp_file=$(mktemp)
  cat "$TODO_FILE" | jq ".[$id].$field = \"$value\" | .[$id].timestamp = \"$TIMESTAMP\"" > "$temp_file"
  mv "$temp_file" "$TODO_FILE"
  
  echo -e "${GREEN}Updated task $id${NC}"
}

# Mark a task as completed
complete_task() {
  local id="$1"
  local message="${2:-Task completed}"
  
  echo -e "${BLUE}Marking task $id as completed: $message${NC}"
  
  ensure_todo_file
  
  # Check if the task exists
  local todos=$(cat "$TODO_FILE")
  local task_count=$(echo "$todos" | jq '. | length')
  
  if [ $id -ge $task_count ]; then
    echo -e "${RED}Error: Task ID $id does not exist${NC}"
    return 1
  fi
  
  # Update the task status and add completion message
  local temp_file=$(mktemp)
  cat "$TODO_FILE" | jq ".[$id].status = \"completed\" | .[$id].timestamp = \"$TIMESTAMP\" | .[$id].completion_message = \"$message\"" > "$temp_file"
  mv "$temp_file" "$TODO_FILE"
  
  echo -e "${GREEN}Marked task $id as completed${NC}"
}

# List all tasks, optionally filtered by status
list_tasks() {
  local status="$1"
  
  ensure_todo_file
  
  # Read the current todo.json
  local todos=$(cat "$TODO_FILE")
  
  # Get the number of tasks
  local task_count=$(echo "$todos" | jq '. | length')
  
  if [ $task_count -eq 0 ]; then
    echo -e "${YELLOW}No tasks found${NC}"
    return
  fi
  
  echo -e "${BLUE}Tasks:${NC}"
  echo -e "${CYAN}ID | Status | Priority | Task | Source${NC}"
  echo -e "${CYAN}---|--------|----------|------|-------${NC}"
  
  # Loop through each task and display it
  for (( i=0; i<$task_count; i++ )); do
    local task=$(echo "$todos" | jq -r ".[$i]")
    local task_status=$(echo "$task" | jq -r ".status")
    
    # Filter by status if provided
    if [ -n "$status" ] && [ "$task_status" != "$status" ]; then
      continue
    fi
    
    local task_desc=$(echo "$task" | jq -r ".task")
    local task_priority=$(echo "$task" | jq -r ".priority")
    local task_source=$(echo "$task" | jq -r ".source")
    
    # Truncate long task descriptions
    if [ ${#task_desc} -gt 50 ]; then
      task_desc="${task_desc:0:47}..."
    fi
    
    # Color based on status
    if [ "$task_status" == "completed" ]; then
      echo -e "${GREEN}$i | $task_status | $task_priority | $task_desc | $task_source${NC}"
    elif [ "$task_status" == "in-progress" ]; then
      echo -e "${YELLOW}$i | $task_status | $task_priority | $task_desc | $task_source${NC}"
    else
      echo -e "$i | $task_status | $task_priority | $task_desc | $task_source"
    fi
  done
}

# Search for tasks using fuzzy matching
search_tasks() {
  local query="$1"
  local similarity_threshold=50
  
  ensure_todo_file
  
  # Read the current todo.json
  local todos=$(cat "$TODO_FILE")
  
  # Get the number of tasks
  local task_count=$(echo "$todos" | jq '. | length')
  
  if [ $task_count -eq 0 ]; then
    echo -e "${YELLOW}No tasks found${NC}"
    return
  fi
  
  echo -e "${BLUE}Search results for: $query${NC}"
  echo -e "${CYAN}ID | Status | Similarity | Task | Source${NC}"
  echo -e "${CYAN}---|--------|------------|------|-------${NC}"
  
  # Loop through each task and check similarity
  for (( i=0; i<$task_count; i++ )); do
    local task=$(echo "$todos" | jq -r ".[$i]")
    local task_desc=$(echo "$task" | jq -r ".task")
    local similarity=$(calculate_similarity "$query" "$task_desc")
    
    # Only show tasks with similarity above threshold
    if [ $similarity -ge $similarity_threshold ]; then
      local task_status=$(echo "$task" | jq -r ".status")
      local task_source=$(echo "$task" | jq -r ".source")
      
      # Truncate long task descriptions
      if [ ${#task_desc} -gt 40 ]; then
        task_desc="${task_desc:0:37}..."
      fi
      
      # Color based on similarity
      if [ $similarity -ge 80 ]; then
        echo -e "${GREEN}$i | $task_status | $similarity% | $task_desc | $task_source${NC}"
      elif [ $similarity -ge 60 ]; then
        echo -e "${YELLOW}$i | $task_status | $similarity% | $task_desc | $task_source${NC}"
      else
        echo -e "$i | $task_status | $similarity% | $task_desc | $task_source"
      fi
    fi
  done
}

# Show help message
show_help() {
  cat << EOF
manage-tasks.sh - Task Management System

This script manages tasks in memory-bank/todo.json, providing functions to
add, update, complete, list, and search tasks with fuzzy matching for deduplication.

Usage:
  ./scripts/manage-tasks.sh [command] [arguments...]

Commands:
  add <task> [source] [priority]      Add a new task
  update <id> <field> <value>         Update a task field
  complete <id> [message]             Mark a task as completed
  list [status]                       List all tasks, optionally filtered by status
  search <query>                      Search for tasks using fuzzy matching
  help                                Show this help message

Examples:
  ./scripts/manage-tasks.sh add "Implement error handling" "src/services/authService.ts" "high"
  ./scripts/manage-tasks.sh update 1 status "in-progress"
  ./scripts/manage-tasks.sh complete 2 "Fixed in PR #123"
  ./scripts/manage-tasks.sh list pending
  ./scripts/manage-tasks.sh search "error handling"
EOF
}

# Main function
main() {
  local command="$1"
  shift
  
  case "$command" in
    add)
      add_task "$@"
      ;;
    update)
      update_task "$@"
      ;;
    complete)
      complete_task "$@"
      ;;
    list)
      list_tasks "$@"
      ;;
    search)
      search_tasks "$@"
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo -e "${RED}Error: Unknown command: $command${NC}"
      show_help
      exit 1
      ;;
  esac
}

# Run the script
if [ $# -eq 0 ]; then
  show_help
else
  main "$@"
fi