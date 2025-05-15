#!/bin/bash
#
# background-consolidate.sh
#
# Performs background consolidation of files, tags, and memory bank documents
# Runs every 12 minutes via .cronrc
#
# This script combines functionality from various consolidation, deduplication,
# cleanup, and migration scripts to provide a unified background process for
# maintaining project consistency.
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
ACTIVE_CONTEXT_FILE="$MEMORY_BANK_DIR/activeContext.md"
PROGRESS_FILE="$MEMORY_BANK_DIR/progress.md"
DECISION_LOG_FILE="$MEMORY_BANK_DIR/decisionLog.md"
TODO_FILE="$MEMORY_BANK_DIR/todo.json"
TASK_LOG_FILE="$PROJECT_ROOT/tasks/task-rolling-log.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date +"%Y-%m-%d")
LOG_FILE="$PROJECT_ROOT/logs/background-consolidate.log"
ARCHIVE_DIR="$PROJECT_ROOT/archive"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log start
echo "🔄 Starting background consolidation at $TIMESTAMP" >> "$LOG_FILE"

# ==== DETECT CANDIDATES ====
# Functions that identify files for processing

# ==== detect_duplicate_files ====
# Purpose: Find duplicate files in the project
# Input: Directory to search
# Output: List of duplicate files

detect_duplicate_files() {
  local dir="${1:-.}"
  local temp_file=$(mktemp)
  
  echo -e "${BLUE}Detecting duplicate files in $dir...${NC}"
  echo "Detecting duplicate files in $dir..." >> "$LOG_FILE"
  
  # Find all files and compute MD5 hashes
  find "$dir" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/archive/*" -exec md5sum {} \; | sort > "$temp_file"
  
  # Find duplicate hashes
  local duplicates=$(awk '{print $1}' "$temp_file" | sort | uniq -d)
  
  if [ -n "$duplicates" ]; then
    echo -e "${YELLOW}Found duplicate files:${NC}"
    echo "Found duplicate files:" >> "$LOG_FILE"
    
    for hash in $duplicates; do
      echo -e "${YELLOW}Files with hash $hash:${NC}"
      echo "Files with hash $hash:" >> "$LOG_FILE"
      grep "$hash" "$temp_file" | awk '{print $2}' | while read -r file; do
        echo -e "  ${YELLOW}$file${NC}"
        echo "  $file" >> "$LOG_FILE"
      done
    done
  else
    echo -e "${GREEN}No duplicate files found${NC}"
    echo "No duplicate files found" >> "$LOG_FILE"
  fi
  
  rm "$temp_file"
  
  # Return the number of duplicate hashes
  echo "$duplicates" | wc -l
}
# ==== End detect_duplicate_files ====

# ==== detect_orphaned_files ====
# Purpose: Find orphaned files (not referenced anywhere)
# Input: File extensions to check
# Output: List of orphaned files

detect_orphaned_files() {
  local extensions="${1:-js,jsx,ts,tsx,sh,md,json}"
  local temp_file=$(mktemp)
  
  echo -e "${BLUE}Detecting orphaned files with extensions: $extensions...${NC}"
  echo "Detecting orphaned files with extensions: $extensions..." >> "$LOG_FILE"
  
  # Find all files with the specified extensions
  find "$PROJECT_ROOT" -type f -name "*.*" | grep -E "\.(${extensions})$" | grep -v "node_modules" | grep -v ".git" | grep -v "archived" > "$temp_file"
  
  local orphaned_files=()
  local total_files=$(wc -l < "$temp_file")
  local processed=0
  
  # Check each file to see if it's referenced anywhere
  while IFS= read -r file; do
    processed=$((processed + 1))
    if [ $((processed % 10)) -eq 0 ]; then
      echo -e "${BLUE}Processed $processed/$total_files files${NC}"
    fi
    
    local filename=$(basename "$file")
    local references=$(grep -r --include="*.{$extensions}" "$filename" "$PROJECT_ROOT" | grep -v "$file" | wc -l)
    
    # Also check if it's referenced in memory bank files
    local mb_references=$(grep -l "$filename" "$PROGRESS_FILE" "$TODO_FILE" "$TASK_LOG_FILE" 2>/dev/null | wc -l)
    
    # Check if file was modified in the last 30 days
    local last_modified=$(stat -c %Y "$file")
    local now=$(date +%s)
    local days_since_modified=$(( (now - last_modified) / 86400 ))
    
    if [ "$references" -eq 0 ] && [ "$mb_references" -eq 0 ] && [ "$days_since_modified" -gt 30 ]; then
      orphaned_files+=("$file|$days_since_modified")
    fi
  done < "$temp_file"
  
  if [ ${#orphaned_files[@]} -gt 0 ]; then
    echo -e "${YELLOW}Found ${#orphaned_files[@]} orphaned files:${NC}"
    echo "Found ${#orphaned_files[@]} orphaned files:" >> "$LOG_FILE"
    
    for entry in "${orphaned_files[@]}"; do
      IFS='|' read -r file days <<< "$entry"
      echo -e "  ${YELLOW}$file (not modified in $days days)${NC}"
      echo "  $file (not modified in $days days)" >> "$LOG_FILE"
    done
  else
    echo -e "${GREEN}No orphaned files found${NC}"
    echo "No orphaned files found" >> "$LOG_FILE"
  fi
  
  rm "$temp_file"
  
  # Return the number of orphaned files
  echo "${#orphaned_files[@]}"
}
# ==== End detect_orphaned_files ====

# ==== detect_firebase_duplicates ====
# Purpose: Find duplicate Firebase implementations
# Input: None
# Output: List of files with Firebase imports

detect_firebase_duplicates() {
  echo -e "${BLUE}Detecting duplicate Firebase implementations...${NC}"
  echo "Detecting duplicate Firebase implementations..." >> "$LOG_FILE"
  
  # Find files with Firebase imports
  local firebase_imports=$(grep -r --include="*.{js,jsx,ts,tsx}" "import.*from ['\"]\(firebase\|@firebase\)" "$PROJECT_ROOT" | grep -v "node_modules" | grep -v "firebaseService")
  
  if [ -n "$firebase_imports" ]; then
    echo -e "${YELLOW}Found files with direct Firebase imports:${NC}"
    echo "Found files with direct Firebase imports:" >> "$LOG_FILE"
    echo "$firebase_imports" | while read -r line; do
      echo -e "  ${YELLOW}$line${NC}"
      echo "  $line" >> "$LOG_FILE"
    done
  else
    echo -e "${GREEN}No duplicate Firebase implementations found${NC}"
    echo "No duplicate Firebase implementations found" >> "$LOG_FILE"
  fi
  
  # Return the number of files with Firebase imports
  echo "$firebase_imports" | wc -l
}
# ==== End detect_firebase_duplicates ====

# ==== DEDUPLICATE TAGS ====
# Functions that remove redundant tags

# ==== deduplicate_progress_entries ====
# Purpose: Remove duplicate entries from progress.md
# Input: None
# Output: Number of duplicates removed

deduplicate_progress_entries() {
  echo -e "${BLUE}Deduplicating progress entries...${NC}"
  echo "Deduplicating progress entries..." >> "$LOG_FILE"
  
  if [ ! -f "$PROGRESS_FILE" ]; then
    echo -e "${YELLOW}Progress file not found, skipping deduplication${NC}"
    echo "Progress file not found, skipping deduplication" >> "$LOG_FILE"
    return 0
  fi
  
  # Create a backup of the original file
  local backup_file="${PROGRESS_FILE}.bak"
  cp "$PROGRESS_FILE" "$backup_file"
  
  # Count entries before cleaning
  local before_count=$(grep -c "|" "$PROGRESS_FILE")
  
  # Extract the Implementation Progress section
  local section_start=$(grep -n "## Implementation Progress" "$PROGRESS_FILE" | cut -d: -f1)
  if [ -z "$section_start" ]; then
    echo -e "${YELLOW}Implementation Progress section not found${NC}"
    echo "Implementation Progress section not found" >> "$LOG_FILE"
    return 0
  fi
  
  local next_section=$(grep -n "^##" "$PROGRESS_FILE" | awk -v start="$section_start" '$1 > start {print $1; exit}' | cut -d: -f1)
  
  if [ -z "$next_section" ]; then
    next_section=$(wc -l "$PROGRESS_FILE" | awk '{print $1}')
  fi
  
  # Extract the header and table header
  local header_lines=$((section_start + 2))
  local header=$(head -n "$header_lines" "$PROGRESS_FILE" | tail -n 3)
  
  # Extract the table content
  local table_content=$(sed -n "$((header_lines + 1)),$((next_section - 1))p" "$PROGRESS_FILE")
  
  # Remove duplicate entries
  local unique_content=$(echo "$table_content" | sort -u)
  
  # Sort by status (completed first, then in-progress, then pending)
  local completed=$(echo "$unique_content" | grep "| completed |" | sort)
  local in_progress=$(echo "$unique_content" | grep "| in-progress |" | sort)
  local pending=$(echo "$unique_content" | grep "| pending |" | sort)
  local other=$(echo "$unique_content" | grep -v "| completed |" | grep -v "| in-progress |" | grep -v "| pending |" | sort)
  
  # Create the new section content
  local new_section="## Implementation Progress

| Feature | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
$completed
$in_progress
$pending
$other"
  
  # Replace the old section with the new one
  local temp_file=$(mktemp)
  head -n "$((section_start - 1))" "$PROGRESS_FILE" > "$temp_file"
  echo "$new_section" >> "$temp_file"
  tail -n "+$next_section" "$PROGRESS_FILE" >> "$temp_file"
  mv "$temp_file" "$PROGRESS_FILE"
  
  # Count entries after cleaning
  local after_count=$(grep -c "|" "$PROGRESS_FILE")
  local removed_count=$((before_count - after_count))
  
  echo -e "${GREEN}Removed $removed_count duplicate entries from progress.md${NC}"
  echo "Removed $removed_count duplicate entries from progress.md" >> "$LOG_FILE"
  
  # Return the number of duplicates removed
  echo "$removed_count"
}
# ==== End deduplicate_progress_entries ====

# ==== deduplicate_task_entries ====
# Purpose: Remove duplicate entries from task-rolling-log.md
# Input: None
# Output: Number of duplicates removed

deduplicate_task_entries() {
  echo -e "${BLUE}Deduplicating task entries...${NC}"
  echo "Deduplicating task entries..." >> "$LOG_FILE"
  
  if [ ! -f "$TASK_LOG_FILE" ]; then
    echo -e "${YELLOW}Task log file not found, skipping deduplication${NC}"
    echo "Task log file not found, skipping deduplication" >> "$LOG_FILE"
    return 0
  fi
  
  # Create a backup of the original file
  local backup_file="${TASK_LOG_FILE}.bak"
  cp "$TASK_LOG_FILE" "$backup_file"
  
  # Count entries before cleaning
  local before_count=$(grep -c "TASK-" "$TASK_LOG_FILE")
  
  # Get all task IDs
  local task_ids=$(grep -o "TASK-[0-9]*" "$TASK_LOG_FILE" | sort | uniq)
  
  # For each task ID, keep only the most recent entry
  for id in $task_ids; do
    # Count occurrences of this task ID
    local count=$(grep -c "$id" "$TASK_LOG_FILE")
    
    if [ "$count" -gt 1 ]; then
      echo -e "${YELLOW}Found $count occurrences of $id${NC}"
      echo "Found $count occurrences of $id" >> "$LOG_FILE"
      
      # Get the most recent entry (assuming it's the one with the latest date section)
      local latest_section=$(grep -B 5 "$id" "$TASK_LOG_FILE" | grep -o "## [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" | tail -1)
      
      if [ -n "$latest_section" ]; then
        # Remove all other occurrences of this task ID
        local temp_file=$(mktemp)
        awk -v id="$id" -v section="$latest_section" '
          /## [0-9]{4}-[0-9]{2}-[0-9]{2}/ { current_section = $0 }
          $0 ~ id && current_section != section { next }
          { print }
        ' "$TASK_LOG_FILE" > "$temp_file"
        mv "$temp_file" "$TASK_LOG_FILE"
      fi
    fi
  done
  
  # Count entries after cleaning
  local after_count=$(grep -c "TASK-" "$TASK_LOG_FILE")
  local removed_count=$((before_count - after_count))
  
  echo -e "${GREEN}Removed $removed_count duplicate entries from task-rolling-log.md${NC}"
  echo "Removed $removed_count duplicate entries from task-rolling-log.md" >> "$LOG_FILE"
  
  # Return the number of duplicates removed
  echo "$removed_count"
}
# ==== MERGE CONTEXT ====
# Functions that combine related context data

# ==== ensure_memory_bank ====
# Purpose: Ensure memory bank directory exists
# Input: None
# Output: None

ensure_memory_bank() {
  if [ ! -d "$MEMORY_BANK_DIR" ]; then
    echo -e "${YELLOW}Memory bank directory not found, creating${NC}"
    echo "Memory bank directory not found, creating" >> "$LOG_FILE"
    mkdir -p "$MEMORY_BANK_DIR"
    echo -e "${GREEN}Created memory bank directory: $MEMORY_BANK_DIR${NC}"
    echo "Created memory bank directory: $MEMORY_BANK_DIR" >> "$LOG_FILE"
  fi
}
# ==== End ensure_memory_bank ====

# ==== update_active_context ====
# Purpose: Update active context with new information
# Input: File, tag type, message
# Output: None

update_active_context() {
  local file="$1"
  local tag_type="$2"
  local message="$3"
  
  echo -e "${BLUE}Updating active context...${NC}"
  echo "Updating active context..." >> "$LOG_FILE"
  
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
  
  # Check if this file+message combination already exists
  if grep -q "$file.*$message" "$ACTIVE_CONTEXT_FILE"; then
    echo -e "${YELLOW}Context already exists, skipping${NC}"
    echo "Context already exists, skipping" >> "$LOG_FILE"
    return
  fi
  
  # Add the tag to the Context Tags section
  sed -i '/## Context Tags/a\
- **'"$file"'**: '"$message"' ('"$DATE"')' "$ACTIVE_CONTEXT_FILE"
  
  echo -e "${GREEN}Updated active context${NC}"
  echo "Updated active context" >> "$LOG_FILE"
}
# ==== End update_active_context ====

# ==== merge_context_from_tags ====
# Purpose: Merge context from code tags into memory bank
# Input: Directory to scan
# Output: Number of tags processed

merge_context_from_tags() {
  local dir="${1:-.}"
  
  echo -e "${BLUE}Merging context from tags in $dir...${NC}"
  echo "Merging context from tags in $dir..." >> "$LOG_FILE"
  
  # Find all files with ROO- tags
  local context_tags=$(grep -r "// ROO-CONTEXT:" "$dir" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local task_tags=$(grep -r "// ROO-TASK:" "$dir" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local migrated_tags=$(grep -r "// ROO-MIGRATED:" "$dir" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  local cleaned_tags=$(grep -r "// ROO-CLEANED:" "$dir" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "")
  
  local tag_count=0
  
  # Process context tags
  if [ -n "$context_tags" ]; then
    echo -e "${GREEN}Found context tags:${NC}"
    echo "Found context tags:" >> "$LOG_FILE"
    
    echo "$context_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-CONTEXT: //')
      echo -e "  ${GREEN}$file: $message${NC}"
      echo "  $file: $message" >> "$LOG_FILE"
      update_active_context "$file" "CONTEXT" "$message"
      tag_count=$((tag_count + 1))
    done
  fi
  
  # Process task tags
  if [ -n "$task_tags" ]; then
    echo -e "${GREEN}Found task tags:${NC}"
    echo "Found task tags:" >> "$LOG_FILE"
    
    echo "$task_tags" | while IFS=':' read -r file rest; do
      task=$(echo "$rest" | sed 's/\/\/ ROO-TASK: //')
      echo -e "  ${GREEN}$file: $task${NC}"
      echo "  $file: $task" >> "$LOG_FILE"
      
      # Call the manage-tasks.sh script to add the task if it exists
      if [ -f "$SCRIPT_DIR/manage-tasks.sh" ]; then
        "$SCRIPT_DIR/manage-tasks.sh" add "$task" "$file"
      else
        echo -e "${YELLOW}manage-tasks.sh not found, skipping task addition${NC}"
        echo "manage-tasks.sh not found, skipping task addition" >> "$LOG_FILE"
      fi
      
      tag_count=$((tag_count + 1))
    done
  fi
  
  # Process migrated tags
  if [ -n "$migrated_tags" ]; then
    echo -e "${GREEN}Found migrated tags:${NC}"
    echo "Found migrated tags:" >> "$LOG_FILE"
    
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
    
    echo "$migrated_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-MIGRATED: //')
      echo -e "  ${GREEN}$file: $message${NC}"
      echo "  $file: $message" >> "$LOG_FILE"
      
      # Check if file is already in the Migrated Files section
      if grep -q "$file" "$PROGRESS_FILE"; then
        echo -e "${YELLOW}File already in progress.md, skipping: $file${NC}"
        echo "File already in progress.md, skipping: $file" >> "$LOG_FILE"
        continue
      fi
      
      # Add the entry to the Migrated Files section
      sed -i '/## Migrated Files/,/^$/s/^$/| '"$file"' | '"$DATE"' | '"$message"' |\n/' "$PROGRESS_FILE"
      tag_count=$((tag_count + 1))
    done
  fi
  
  # Process cleaned tags
  if [ -n "$cleaned_tags" ]; then
    echo -e "${GREEN}Found cleaned tags:${NC}"
    echo "Found cleaned tags:" >> "$LOG_FILE"
    
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
    
    echo "$cleaned_tags" | while IFS=':' read -r file rest; do
      message=$(echo "$rest" | sed 's/\/\/ ROO-CLEANED: //')
      echo -e "  ${GREEN}$file: $message${NC}"
      echo "  $file: $message" >> "$LOG_FILE"
      
      # Check if file is already in the Cleaned Files section
      if grep -q "$file" "$PROGRESS_FILE"; then
        echo -e "${YELLOW}File already in progress.md, skipping: $file${NC}"
        echo "File already in progress.md, skipping: $file" >> "$LOG_FILE"
        continue
      fi
      
      # Add the entry to the Cleaned Files section
      sed -i '/## Cleaned Files/,/^$/s/^$/| '"$file"' | '"$DATE"' | '"$message"' |\n/' "$PROGRESS_FILE"
      tag_count=$((tag_count + 1))
    done
  fi
  
  echo -e "${GREEN}Processed $tag_count tags${NC}"
  echo "Processed $tag_count tags" >> "$LOG_FILE"
  
  # Return the number of tags processed
  echo "$tag_count"
}
# ==== End merge_context_from_tags ====
# ==== End deduplicate_task_entries ====

# ==== REMOVE LEGACY ====
# Functions that clean outdated files

# ==== create_archive_directories ====
# Purpose: Create archive directories
# Input: None
# Output: None

create_archive_directories() {
  echo -e "${BLUE}Creating archive directories...${NC}"
  echo "Creating archive directories..." >> "$LOG_FILE"
  
  mkdir -p "$ARCHIVE_DIR/backup"
  mkdir -p "$ARCHIVE_DIR/duplicate"
  mkdir -p "$ARCHIVE_DIR/deprecated"
  mkdir -p "$ARCHIVE_DIR/logs"
  
  echo -e "${GREEN}Created archive directories${NC}"
  echo "Created archive directories" >> "$LOG_FILE"
}
# ==== End create_archive_directories ====

# ==== archive_backup_files ====
# Purpose: Move backup files to archive
# Input: None
# Output: Number of files archived

archive_backup_files() {
  echo -e "${BLUE}Archiving backup files...${NC}"
  echo "Archiving backup files..." >> "$LOG_FILE"
  
  # Find all .bak files
  local backup_files=$(find "$PROJECT_ROOT" -name "*.bak" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/archive/*")
  local count=0
  
  if [ -n "$backup_files" ]; then
    echo -e "${YELLOW}Found backup files:${NC}"
    echo "Found backup files:" >> "$LOG_FILE"
    
    echo "$backup_files" | while read -r file; do
      echo -e "  ${YELLOW}$file${NC}"
      echo "  $file" >> "$LOG_FILE"
      
      # Create relative path for archive
      local rel_path=$(echo "$file" | sed "s|$PROJECT_ROOT/||")
      local archive_path="$ARCHIVE_DIR/backup/$rel_path"
      
      # Create directory structure in archive
      mkdir -p "$(dirname "$archive_path")"
      
      # Move file to archive
      mv "$file" "$archive_path"
      
      count=$((count + 1))
    done
    
    echo -e "${GREEN}Archived $count backup files${NC}"
    echo "Archived $count backup files" >> "$LOG_FILE"
  else
    echo -e "${GREEN}No backup files found${NC}"
    echo "No backup files found" >> "$LOG_FILE"
  fi
  
  # Return the number of files archived
  echo "$count"
}
# ==== End archive_backup_files ====

# ==== cleanup_expired_cache ====
# Purpose: Clean up expired cache entries
# Input: None
# Output: Number of entries removed

cleanup_expired_cache() {
  echo -e "${BLUE}Cleaning up expired cache...${NC}"
  echo "Cleaning up expired cache..." >> "$LOG_FILE"
  
  # Check if cache directory exists
  local cache_dir="$PROJECT_ROOT/cache"
  if [ ! -d "$cache_dir" ]; then
    echo -e "${YELLOW}Cache directory not found, skipping cleanup${NC}"
    echo "Cache directory not found, skipping cleanup" >> "$LOG_FILE"
    return 0
  fi
  
  # Find cache files older than 7 days
  local old_files=$(find "$cache_dir" -type f -mtime +7)
  local count=0
  
  if [ -n "$old_files" ]; then
    echo -e "${YELLOW}Found expired cache files:${NC}"
    echo "Found expired cache files:" >> "$LOG_FILE"
    
    echo "$old_files" | while read -r file; do
      echo -e "  ${YELLOW}$file${NC}"
      echo "  $file" >> "$LOG_FILE"
      
      # Remove file
      rm "$file"
      
      count=$((count + 1))
    done
    
    echo -e "${GREEN}Removed $count expired cache files${NC}"
    echo "Removed $count expired cache files" >> "$LOG_FILE"
  else
    echo -e "${GREEN}No expired cache files found${NC}"
    echo "No expired cache files found" >> "$LOG_FILE"
  fi
  
  # Return the number of files removed
  echo "$count"
}
# ==== End cleanup_expired_cache ====

# ==== SYNC WITH MEMORY BANK ====
# Functions that update memory storage

# ==== sync_todo_to_log ====
# Purpose: Sync tasks from todo.json to task-rolling-log.md
# Input: None
# Output: Number of tasks synced

sync_todo_to_log() {
  echo -e "${BLUE}Syncing tasks from todo.json to task-rolling-log.md...${NC}"
  echo "Syncing tasks from todo.json to task-rolling-log.md..." >> "$LOG_FILE"
  
  # Check if todo.json exists
  if [ ! -f "$TODO_FILE" ]; then
    echo -e "${YELLOW}todo.json not found, skipping sync${NC}"
    echo "todo.json not found, skipping sync" >> "$LOG_FILE"
    return 0
  fi
  
  # Check if task-rolling-log.md exists
  if [ ! -f "$TASK_LOG_FILE" ]; then
    echo -e "${YELLOW}task-rolling-log.md not found, creating${NC}"
    echo "task-rolling-log.md not found, creating" >> "$LOG_FILE"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$TASK_LOG_FILE")"
    
    # Create task log file
    cat > "$TASK_LOG_FILE" << EOF
# Task Rolling Log

## $DATE

### Added

### Updated

EOF
  fi
  
  # Ensure today's section exists
  if ! grep -q "## $DATE" "$TASK_LOG_FILE"; then
    echo -e "${BLUE}Adding today's section to task log${NC}"
    echo "Adding today's section to task log" >> "$LOG_FILE"
    
    # Insert after the first line
    sed -i "1a\\
\\
## $DATE\\
\\
### Added\\
\\
### Updated\\
" "$TASK_LOG_FILE"
  fi
  
  # Get today's tasks from todo.json
  local today_created=$(jq -r '.tasks[] | select(.created | startswith("'"$DATE"'")) | "\(.priority)|\(.id)|\(.title)|\(.status)|\(.created)"' "$TODO_FILE" 2>/dev/null || echo "")
  local today_updated=$(jq -r '.tasks[] | select(.updated | startswith("'"$DATE"'") and (.created | startswith("'"$DATE"'") | not)) | "\(.priority)|\(.id)|\(.title)|\(.status)|\(.updated)"' "$TODO_FILE" 2>/dev/null || echo "")
  
  local count=0
  
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
        count=$((count + 1))
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
        count=$((count + 1))
      fi
    done
  else
    echo -e "${YELLOW}No tasks updated today${NC}"
    echo "No tasks updated today" >> "$LOG_FILE"
  fi
  
  echo -e "${GREEN}Synced $count tasks to task-rolling-log.md${NC}"
  echo "Synced $count tasks to task-rolling-log.md" >> "$LOG_FILE"
  
  # Return the number of tasks synced
  echo "$count"
}
# ==== End sync_todo_to_log ====

# Main function
main() {
  # Run memory bank consolidation
  if [ -f "$SCRIPT_DIR/memory-bank-consolidation.js" ]; then
    echo -e "${BLUE}=== Running Memory Bank Consolidation ===033[0m"
    echo "=== Running Memory Bank Consolidation ===" >> "$LOG_FILE"
    node "$SCRIPT_DIR/memory-bank-consolidation.js" >> "$LOG_FILE" 2>&1
  fi
  # Create archive directories
  create_archive_directories
  
  # Ensure memory bank exists
  ensure_memory_bank
  
  # Detect candidates
  echo -e "${BLUE}=== Detecting Candidates ===${NC}"
  echo "=== Detecting Candidates ===" >> "$LOG_FILE"
  
  local duplicate_count=$(detect_duplicate_files)
  local orphaned_count=$(detect_orphaned_files "js,jsx,ts,tsx,sh,md,json")
  local firebase_count=$(detect_firebase_duplicates)
  
  # Deduplicate tags
  echo -e "${BLUE}=== Deduplicating Tags ===${NC}"
  echo "=== Deduplicating Tags ===" >> "$LOG_FILE"
  
  local progress_dupes=$(deduplicate_progress_entries)
  local task_dupes=$(deduplicate_task_entries)
  
  # Merge context
  echo -e "${BLUE}=== Merging Context ===${NC}"
  echo "=== Merging Context ===" >> "$LOG_FILE"
  
  local tag_count=$(merge_context_from_tags)
  
  # Remove legacy
  echo -e "${BLUE}=== Removing Legacy ===${NC}"
  echo "=== Removing Legacy ===" >> "$LOG_FILE"
  
  local archived_count=$(archive_backup_files)
  local cache_count=$(cleanup_expired_cache)
  
  # Sync with memory bank
  echo -e "${BLUE}=== Syncing with Memory Bank ===${NC}"
  echo "=== Syncing with Memory Bank ===" >> "$LOG_FILE"
  
  local synced_count=$(sync_todo_to_log)
  
  # Log completion
  echo -e "${GREEN}Background consolidation completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")${NC}"
  echo "Background consolidation completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG_FILE"
  echo "-------------------------------------------" >> "$LOG_FILE"
  
  # Log to roo-observations.md if the helper script exists
  if [ -f "$SCRIPT_DIR/log-cron-observation.sh" ]; then
    local message=""
    local status="info"
    
    # Determine status based on findings
    if [ "$duplicate_count" -gt 0 ] || [ "$orphaned_count" -gt 0 ] || [ "$firebase_count" -gt 0 ]; then
      status="warning"
      message="Found $duplicate_count duplicate files, $orphaned_count orphaned files, and $firebase_count Firebase duplicates"
    elif [ "$progress_dupes" -gt 0 ] || [ "$task_dupes" -gt 0 ] || [ "$tag_count" -gt 0 ] || [ "$archived_count" -gt 0 ] || [ "$cache_count" -gt 0 ] || [ "$synced_count" -gt 0 ]; then
      status="success"
      message="Processed $tag_count tags, removed $progress_dupes + $task_dupes duplicates, archived $archived_count files, cleaned $cache_count cache entries, synced $synced_count tasks"
    else
      message="No consolidation actions needed"
    fi
    
    "$SCRIPT_DIR/log-cron-observation.sh" --label "consolidate" --status "$status" --message "$message"
  fi
}

# Run the script
main
