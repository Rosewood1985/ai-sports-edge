#!/bin/bash
#
# update-progress.sh
#
# Updates progress.md with the latest implementation progress
# Runs every 15 minutes via .cronrc
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
PROGRESS_FILE="$MEMORY_BANK_DIR/progress.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date +"%Y-%m-%d")
LOG_FILE="$PROJECT_ROOT/logs/progress-update.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log start
echo "🔄 Starting progress update at $TIMESTAMP" >> "$LOG_FILE"

# Ensure memory bank directory exists
if [ ! -d "$MEMORY_BANK_DIR" ]; then
  echo -e "${YELLOW}Memory bank directory not found, creating${NC}"
  mkdir -p "$MEMORY_BANK_DIR"
  echo "Created memory bank directory" >> "$LOG_FILE"
fi

# Ensure progress.md exists
if [ ! -f "$PROGRESS_FILE" ]; then
  echo -e "${YELLOW}progress.md not found, creating file${NC}"
  cat > "$PROGRESS_FILE" << EOF
# Progress Tracking

This file tracks implementation progress and feature status.

## Implementation Progress

| Feature | Status | Last Updated | Notes |
|---------|--------|--------------|-------|

## Migrated Files

| File | Date | Notes |
|------|------|-------|

## Cleaned Files

| File | Date | Notes |
|------|------|-------|

EOF
  echo "Created progress.md" >> "$LOG_FILE"
fi

# Function to update implementation progress from code comments
update_implementation_progress() {
  echo -e "${BLUE}Updating implementation progress from code comments${NC}"
  
  # Find all files with ROO-PROGRESS tags
  local progress_tags=$(grep -r "// ROO-PROGRESS:" "$PROJECT_ROOT" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  
  if [ -n "$progress_tags" ]; then
    echo -e "${GREEN}Found progress tags:${NC}"
    echo "$progress_tags"
    echo "Found progress tags" >> "$LOG_FILE"
    
    # Process each progress tag
    echo "$progress_tags" | while IFS=':' read -r file rest; do
      # Extract feature and status
      local tag_content=$(echo "$rest" | sed 's/\/\/ ROO-PROGRESS: //')
      local feature=$(echo "$tag_content" | cut -d'|' -f1 | xargs)
      local status=$(echo "$tag_content" | cut -d'|' -f2 | xargs)
      local notes=$(echo "$tag_content" | cut -d'|' -f3- | xargs)
      
      if [ -z "$notes" ]; then
        notes="Updated from $file"
      fi
      
      # Check if feature already exists in progress.md
      if grep -q "$feature" "$PROGRESS_FILE"; then
        echo -e "${YELLOW}Feature already in progress.md, updating: $feature${NC}"
        # Update the existing entry
        sed -i "s/| $feature | .* | .* | .* |/| $feature | $status | $DATE | $notes |/" "$PROGRESS_FILE"
        echo "Updated feature: $feature" >> "$LOG_FILE"
      else
        echo -e "${GREEN}Adding new feature to progress.md: $feature${NC}"
        # Find the Implementation Progress section
        local section_line=$(grep -n "## Implementation Progress" "$PROGRESS_FILE" | cut -d: -f1)
        local table_line=$((section_line + 2))
        
        # Add the new entry to the table
        sed -i "$((table_line + 1))i\\| $feature | $status | $DATE | $notes |" "$PROGRESS_FILE"
        echo "Added new feature: $feature" >> "$LOG_FILE"
      fi
    done
  else
    echo -e "${YELLOW}No progress tags found${NC}"
    echo "No progress tags found" >> "$LOG_FILE"
  fi
}

# Function to update progress from task status changes
update_progress_from_tasks() {
  echo -e "${BLUE}Updating progress from task status changes${NC}"
  
  # Check if todo.json exists
  local todo_file="$MEMORY_BANK_DIR/todo.json"
  if [ ! -f "$todo_file" ]; then
    echo -e "${YELLOW}todo.json not found, skipping task status update${NC}"
    echo "todo.json not found, skipping task status update" >> "$LOG_FILE"
    return
  fi
  
  # Get completed tasks from today
  local completed_tasks=$(jq -r '.tasks[] | select(.status == "completed" and .updated | startswith("'"$DATE"'")) | "\(.id)|\(.title)|\(.updated)"' "$todo_file")
  
  if [ -n "$completed_tasks" ]; then
    echo -e "${GREEN}Found completed tasks:${NC}"
    echo "$completed_tasks"
    echo "Found completed tasks" >> "$LOG_FILE"
    
    # Find the Implementation Progress section
    local section_line=$(grep -n "## Implementation Progress" "$PROGRESS_FILE" | cut -d: -f1)
    local table_line=$((section_line + 2))
    
    # Process each completed task
    echo "$completed_tasks" | while IFS='|' read -r id title updated; do
      # Check if task already exists in progress.md
      if ! grep -q "$title" "$PROGRESS_FILE"; then
        echo -e "${GREEN}Adding completed task to progress.md: $title${NC}"
        # Add the new entry to the table
        sed -i "$((table_line + 1))i\\| $title | completed | $DATE | Completed task $id |" "$PROGRESS_FILE"
        echo "Added completed task: $title" >> "$LOG_FILE"
      fi
    done
  else
    echo -e "${YELLOW}No completed tasks found today${NC}"
    echo "No completed tasks found today" >> "$LOG_FILE"
  fi
}

# Main function
main() {
  update_implementation_progress
  update_progress_from_tasks
  
  echo -e "${GREEN}Progress update completed${NC}"
  echo "✅ Progress update completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG_FILE"
  echo "-------------------------------------------" >> "$LOG_FILE"
  
  # Log to roo-observations.md if the helper script exists
  if [ -f "$SCRIPT_DIR/log-cron-observation.sh" ]; then
    # Count progress updates
    local progress_count=$(grep -r "// ROO-PROGRESS:" "$PROJECT_ROOT" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
    local completed_count=0
    
    # Check if todo.json exists
    local todo_file="$MEMORY_BANK_DIR/todo.json"
    if [ -f "$todo_file" ]; then
      completed_count=$(jq -r '.tasks[] | select(.status == "completed" and .updated | startswith("'"$DATE"'"))' "$todo_file" | jq -s 'length')
    fi
    
    if [ "$progress_count" -gt 0 ] || [ "$completed_count" -gt 0 ]; then
      "$SCRIPT_DIR/log-cron-observation.sh" --label "update-progress" --status "success" --message "Updated progress tracking with $progress_count progress tags and $completed_count completed tasks"
    else
      "$SCRIPT_DIR/log-cron-observation.sh" --label "update-progress" --message "No new progress updates found."
    fi
  fi
}

# Run the script
main