#!/bin/bash
#
# tag-context.sh
#
# This script implements a context tagging system for source files that helps
# track decisions, tasks, migrations, and cleanup status. It can add tags to
# files and scan for existing tags, updating memory-bank files accordingly.
#
# Usage:
#   ./scripts/tag-context.sh [command] [arguments...]
#
# Commands:
#   add-context <file> <message>    Add a context tag to a file
#   add-task <file> <task>          Add a task tag to a file
#   mark-migrated <file> <message>  Mark a file as migrated
#   mark-cleaned <file> <message>   Mark a file as cleaned
#   scan [directory]                Scan for tags and update memory bank
#   help                            Show this help message
#

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
TODO_FILE="$MEMORY_BANK_DIR/todo.json"
ACTIVE_CONTEXT_FILE="$MEMORY_BANK_DIR/activeContext.md"
PROGRESS_FILE="$MEMORY_BANK_DIR/progress.md"
DECISION_LOG_FILE="$MEMORY_BANK_DIR/decisionLog.md"
DATE=$(date +"%Y-%m-%d")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
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

# Add a context tag to a file
add_context_tag() {
  local file="$1"
  local message="$2"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: File not found: $file${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Adding context tag to $file...${NC}"
  
  # Add the tag at the top of the file, after any existing headers
  local temp_file=$(mktemp)
  head -1 "$file" > "$temp_file"
  echo "// ROO-CONTEXT: $message" >> "$temp_file"
  tail -n +2 "$file" >> "$temp_file"
  mv "$temp_file" "$file"
  
  echo -e "${GREEN}Added context tag to $file${NC}"
  
  # Update activeContext.md
  update_active_context "$file" "CONTEXT" "$message"
  
  # Update decisionLog.md
  update_decision_log "$file" "$message"
  
  return 0
}

# Add a task tag to a file
add_task_tag() {
  local file="$1"
  local task="$2"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: File not found: $file${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Adding task tag to $file...${NC}"
  
  # Add the tag at the top of the file, after any existing headers
  local temp_file=$(mktemp)
  head -1 "$file" > "$temp_file"
  echo "// ROO-TASK: $task" >> "$temp_file"
  tail -n +2 "$file" >> "$temp_file"
  mv "$temp_file" "$file"
  
  echo -e "${GREEN}Added task tag to $file${NC}"
  
  # Update todo.json
  update_todo_json "$file" "$task"
  
  return 0
}

# Mark a file as migrated
mark_file_migrated() {
  local file="$1"
  local message="$2"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: File not found: $file${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Marking $file as migrated...${NC}"
  
  # Add the tag at the top of the file, after any existing headers
  local temp_file=$(mktemp)
  head -1 "$file" > "$temp_file"
  echo "// ROO-MIGRATED: $message" >> "$temp_file"
  tail -n +2 "$file" >> "$temp_file"
  mv "$temp_file" "$file"
  
  echo -e "${GREEN}Marked $file as migrated${NC}"
  
  # Update progress.md
  update_progress "$file" "MIGRATED" "$message"
  
  return 0
}

# Mark a file as cleaned
mark_file_cleaned() {
  local file="$1"
  local message="$2"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: File not found: $file${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Marking $file as cleaned...${NC}"
  
  # Add the tag at the top of the file, after any existing headers
  local temp_file=$(mktemp)
  head -1 "$file" > "$temp_file"
  echo "// ROO-CLEANED: $message" >> "$temp_file"
  tail -n +2 "$file" >> "$temp_file"
  mv "$temp_file" "$file"
  
  echo -e "${GREEN}Marked $file as cleaned${NC}"
  
  # Update progress.md
  update_progress "$file" "CLEANED" "$message"
  
  return 0
}

# Update activeContext.md with a tag
update_active_context() {
  local file="$1"
  local tag_type="$2"
  local message="$3"
  
  echo -e "${BLUE}Updating active context...${NC}"
  
  # Create active context file if it doesn't exist
  if [ ! -f "$ACTIVE_CONTEXT_FILE" ]; then
    echo "# Active Context" > "$ACTIVE_CONTEXT_FILE"
    echo "" >> "$ACTIVE_CONTEXT_FILE"
    echo "## Context Tags" >> "$ACTIVE_CONTEXT_FILE"
    echo "" >> "$ACTIVE_CONTEXT_FILE"
  fi
  
  # Check if Context Tags section exists
  if ! grep -q "## Context Tags" "$ACTIVE_CONTEXT_FILE"; then
    echo "" >> "$ACTIVE_CONTEXT_FILE"
    echo "## Context Tags" >> "$ACTIVE_CONTEXT_FILE"
    echo "" >> "$ACTIVE_CONTEXT_FILE"
  fi
  
  # Add the tag to the Context Tags section
  sed -i '/## Context Tags/a\
- **'"$file"'**: '"$message"' ('"$DATE"')' "$ACTIVE_CONTEXT_FILE"
  
  echo -e "${GREEN}Updated active context${NC}"
}

# Update todo.json with a task
update_todo_json() {
  local file="$1"
  local task="$2"
  
  echo -e "${BLUE}Updating todo.json...${NC}"
  
  # Call the manage-tasks.sh script to add the task
  "$SCRIPT_DIR/manage-tasks.sh" add "$task" "$file"
  
  echo -e "${GREEN}Updated todo.json${NC}"
}

# Update progress.md with migration or cleaning status
update_progress() {
  local file="$1"
  local tag_type="$2"
  local message="$3"
  
  echo -e "${BLUE}Updating progress.md...${NC}"
  
  # Create progress file if it doesn't exist
  if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Progress Tracking" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Migrated Files" >> "$PROGRESS_FILE"
    echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
    echo "|------|------|-------|" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Cleaned Files" >> "$PROGRESS_FILE"
    echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
    echo "|------|------|-------|" >> "$PROGRESS_FILE"
  fi
  
  # Add the entry to the appropriate section
  if [ "$tag_type" == "MIGRATED" ]; then
    # Check if file is already in the Migrated Files section
    if grep -q "$file" "$PROGRESS_FILE"; then
      echo -e "${YELLOW}File already in progress.md, updating...${NC}"
      sed -i "s|^| $file | .*$|| $file | $DATE | $message ||" "$PROGRESS_FILE"
    else
      # Find the Migrated Files section and add the entry
      sed -i '/## Migrated Files/,/^$/s/^$/| '"$file"' | '"$DATE"' | '"$message"' |\n/' "$PROGRESS_FILE"
    fi
  elif [ "$tag_type" == "CLEANED" ]; then
    # Check if file is already in the Cleaned Files section
    if grep -q "$file" "$PROGRESS_FILE"; then
      echo -e "${YELLOW}File already in progress.md, updating...${NC}"
      sed -i "s|^| $file | .*$|| $file | $DATE | $message ||" "$PROGRESS_FILE"
    else
      # Find the Cleaned Files section and add the entry
      sed -i '/## Cleaned Files/,/^$/s/^$/| '"$file"' | '"$DATE"' | '"$message"' |\n/' "$PROGRESS_FILE"
    fi
  fi
  
  echo -e "${GREEN}Updated progress.md${NC}"
}

# Update decisionLog.md with a context tag
update_decision_log() {
  local file="$1"
  local message="$2"
  
  echo -e "${BLUE}Updating decision log...${NC}"
  
  # Create decision log file if it doesn't exist
  if [ ! -f "$DECISION_LOG_FILE" ]; then
    echo "# Decision Log" > "$DECISION_LOG_FILE"
    echo "" >> "$DECISION_LOG_FILE"
    echo "## Architectural Decisions" >> "$DECISION_LOG_FILE"
    echo "| Date | File | Decision | Rationale |" >> "$DECISION_LOG_FILE"
    echo "|------|------|----------|-----------|" >> "$DECISION_LOG_FILE"
  fi
  
  # Add the entry to the decision log
  echo "| $DATE | $file | $message | Context tag added |" >> "$DECISION_LOG_FILE"
  
  echo -e "${GREEN}Updated decision log${NC}"
}

# Scan for tags in files
scan_for_tags() {
  local directory="${1:-.}"
  
  echo -e "${BLUE}Scanning for tags in $directory...${NC}"
  
  ensure_memory_bank
  ensure_todo_file
  
  # Find all files with ROO- tags
  local context_tags=$(grep -r "// ROO-CONTEXT:" "$directory" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local task_tags=$(grep -r "// ROO-TASK:" "$directory" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local migrated_tags=$(grep -r "// ROO-MIGRATED:" "$directory" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local cleaned_tags=$(grep -r "// ROO-CLEANED:" "$directory" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  
  # Process context tags
  if [ -n "$context_tags" ]; then
    echo -e "${GREEN}Found context tags:${NC}"
    echo "$context_tags"
    
    # Update activeContext.md
    echo "# Active Context" > "$ACTIVE_CONTEXT_FILE"
    echo "" >> "$ACTIVE_CONTEXT_FILE"
    echo "## Context Tags" >> "$ACTIVE_CONTEXT_FILE"
    echo "" >> "$ACTIVE_CONTEXT_FILE"
    
    echo "$context_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-CONTEXT: //')
      echo "- **$file**: $message" >> "$ACTIVE_CONTEXT_FILE"
    done
    
    # Update decisionLog.md
    if [ ! -f "$DECISION_LOG_FILE" ]; then
      echo "# Decision Log" > "$DECISION_LOG_FILE"
      echo "" >> "$DECISION_LOG_FILE"
      echo "## Architectural Decisions" >> "$DECISION_LOG_FILE"
      echo "| Date | File | Decision | Rationale |" >> "$DECISION_LOG_FILE"
      echo "|------|------|----------|-----------|" >> "$DECISION_LOG_FILE"
    fi
    
    echo "$context_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-CONTEXT: //')
      echo "| $DATE | $file | $message | Found during scan |" >> "$DECISION_LOG_FILE"
    done
  else
    echo -e "${YELLOW}No context tags found${NC}"
  fi
  
  # Process task tags
  if [ -n "$task_tags" ]; then
    echo -e "${GREEN}Found task tags:${NC}"
    echo "$task_tags"
    
    echo "$task_tags" | while IFS=':' read -r file rest; do
      task=$(echo "$rest" | sed 's/\/\/ ROO-TASK: //')
      
      # Call the manage-tasks.sh script to add the task
      "$SCRIPT_DIR/manage-tasks.sh" add "$task" "$file"
    done
  else
    echo -e "${YELLOW}No task tags found${NC}"
  fi
  
  # Process migrated tags
  if [ -n "$migrated_tags" ]; then
    echo -e "${GREEN}Found migrated tags:${NC}"
    echo "$migrated_tags"
    
    # Create progress file if it doesn't exist
    if [ ! -f "$PROGRESS_FILE" ]; then
      echo "# Progress Tracking" > "$PROGRESS_FILE"
      echo "" >> "$PROGRESS_FILE"
      echo "## Migrated Files" >> "$PROGRESS_FILE"
      echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
      echo "|------|------|-------|" >> "$PROGRESS_FILE"
      echo "" >> "$PROGRESS_FILE"
      echo "## Cleaned Files" >> "$PROGRESS_FILE"
      echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
      echo "|------|------|-------|" >> "$PROGRESS_FILE"
    fi
    
    # Find the Migrated Files section
    local migrated_section=$(grep -n "## Migrated Files" "$PROGRESS_FILE" | cut -d: -f1)
    local next_section=$(grep -n "##" "$PROGRESS_FILE" | awk -v start="$migrated_section" '$1 > start {print $1; exit}' | cut -d: -f1)
    
    if [ -z "$next_section" ]; then
      next_section=$(wc -l "$PROGRESS_FILE" | awk '{print $1}')
    fi
    
    # Extract the current migrated files section
    local migrated_files_section=$(sed -n "${migrated_section},${next_section}p" "$PROGRESS_FILE")
    
    echo "$migrated_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-MIGRATED: //')
      
      # Check if file is already in the Migrated Files section
      if echo "$migrated_files_section" | grep -q "$file"; then
        echo -e "${YELLOW}File already in progress.md, skipping: $file${NC}"
        continue
      fi
      
      # Add the entry to the Migrated Files section
      sed -i "${migrated_section}a\\| $file | $DATE | $message |" "$PROGRESS_FILE"
    done
  else
    echo -e "${YELLOW}No migrated tags found${NC}"
  fi
  
  # Process cleaned tags
  if [ -n "$cleaned_tags" ]; then
    echo -e "${GREEN}Found cleaned tags:${NC}"
    echo "$cleaned_tags"
    
    # Create progress file if it doesn't exist
    if [ ! -f "$PROGRESS_FILE" ]; then
      echo "# Progress Tracking" > "$PROGRESS_FILE"
      echo "" >> "$PROGRESS_FILE"
      echo "## Migrated Files" >> "$PROGRESS_FILE"
      echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
      echo "|------|------|-------|" >> "$PROGRESS_FILE"
      echo "" >> "$PROGRESS_FILE"
      echo "## Cleaned Files" >> "$PROGRESS_FILE"
      echo "| File | Date | Notes |" >> "$PROGRESS_FILE"
      echo "|------|------|-------|" >> "$PROGRESS_FILE"
    fi
    
    # Find the Cleaned Files section
    local cleaned_section=$(grep -n "## Cleaned Files" "$PROGRESS_FILE" | cut -d: -f1)
    local next_section=$(grep -n "##" "$PROGRESS_FILE" | awk -v start="$cleaned_section" '$1 > start {print $1; exit}' | cut -d: -f1)
    
    if [ -z "$next_section" ]; then
      next_section=$(wc -l "$PROGRESS_FILE" | awk '{print $1}')
    fi
    
    # Extract the current cleaned files section
    local cleaned_files_section=$(sed -n "${cleaned_section},${next_section}p" "$PROGRESS_FILE")
    
    echo "$cleaned_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-CLEANED: //')
      
      # Check if file is already in the Cleaned Files section
      if echo "$cleaned_files_section" | grep -q "$file"; then
        echo -e "${YELLOW}File already in progress.md, skipping: $file${NC}"
        continue
      fi
      
      # Add the entry to the Cleaned Files section
      sed -i "${cleaned_section}a\\| $file | $DATE | $message |" "$PROGRESS_FILE"
    done
  else
    echo -e "${YELLOW}No cleaned tags found${NC}"
  fi
  
  echo -e "${GREEN}Scan complete${NC}"
  
  # Log to roo-observations.md if the helper script exists
  if [ -f "$SCRIPT_DIR/log-cron-observation.sh" ]; then
    # Count the number of tags found
    local context_count=0
    local task_count=0
    local migrated_count=0
    local cleaned_count=0
    
    if [ -n "$context_tags" ]; then
      context_count=$(echo "$context_tags" | wc -l)
    fi
    
    if [ -n "$task_tags" ]; then
      task_count=$(echo "$task_tags" | wc -l)
    fi
    
    if [ -n "$migrated_tags" ]; then
      migrated_count=$(echo "$migrated_tags" | wc -l)
    fi
    
    if [ -n "$cleaned_tags" ]; then
      cleaned_count=$(echo "$cleaned_tags" | wc -l)
    fi
    
    # Determine if any tags were found
    local total_count=$((context_count + task_count + migrated_count + cleaned_count))
    
    if [ $total_count -gt 0 ]; then
      # Construct message with counts
      local message="Found $total_count tags: $context_count context, $task_count task, $migrated_count migrated, $cleaned_count cleaned"
      "$SCRIPT_DIR/log-cron-observation.sh" --label "tag-scan" --status "success" --message "$message"
    else
      "$SCRIPT_DIR/log-cron-observation.sh" --label "tag-scan" --message "No new tags. No issues found."
    fi
  fi
}

# Show help message
show_help() {
  cat << EOF
tag-context.sh - Context Tagging System for Source Files

This script implements a context tagging system for source files that helps
track decisions, tasks, migrations, and cleanup status. It can add tags to
files and scan for existing tags, updating memory-bank files accordingly.

Usage:
  ./scripts/tag-context.sh [command] [arguments...]

Commands:
  add-context <file> <message>    Add a context tag to a file
  add-task <file> <task>          Add a task tag to a file
  mark-migrated <file> <message>  Mark a file as migrated
  mark-cleaned <file> <message>   Mark a file as cleaned
  scan [directory]                Scan for tags and update memory bank
  help                            Show this help message

Examples:
  ./scripts/tag-context.sh add-context src/components/Button.tsx "Using atomic design pattern"
  ./scripts/tag-context.sh add-task src/services/authService.ts "Implement token refresh"
  ./scripts/tag-context.sh mark-migrated src/config/firebase.ts "Migrated to atomic architecture"
  ./scripts/tag-context.sh mark-cleaned src/utils/deprecated.ts "Removed unused functions"
  ./scripts/tag-context.sh scan src/
EOF
}

# Main function
main() {
  ensure_memory_bank
  
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  command="$1"
  shift
  
  case "$command" in
    add-context)
      if [ $# -lt 2 ]; then
        echo -e "${RED}Error: Missing arguments for add-context${NC}"
        echo "Usage: ./scripts/tag-context.sh add-context <file> <message>"
        exit 1
      fi
      add_context_tag "$1" "$2"
      ;;
    add-task)
      if [ $# -lt 2 ]; then
        echo -e "${RED}Error: Missing arguments for add-task${NC}"
        echo "Usage: ./scripts/tag-context.sh add-task <file> <task>"
        exit 1
      fi
      add_task_tag "$1" "$2"
      ;;
    mark-migrated)
      if [ $# -lt 2 ]; then
        echo -e "${RED}Error: Missing arguments for mark-migrated${NC}"
        echo "Usage: ./scripts/tag-context.sh mark-migrated <file> <message>"
        exit 1
      fi
      mark_file_migrated "$1" "$2"
      ;;
    mark-cleaned)
      if [ $# -lt 2 ]; then
        echo -e "${RED}Error: Missing arguments for mark-cleaned${NC}"
        echo "Usage: ./scripts/tag-context.sh mark-cleaned <file> <message>"
        exit 1
      fi
      mark_file_cleaned "$1" "$2"
      ;;
    scan)
      scan_for_tags "${1:-.}"
      ;;
    help)
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
main "$@"