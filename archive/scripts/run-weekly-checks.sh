#!/bin/bash

# run-weekly-checks.sh
#
# This script performs weekly maintenance checks on the AI Sports Edge project.
# It verifies the integrity of the codebase, checks for potential issues,
# and generates a weekly status report.
#
# Usage:
#   ./scripts/run-weekly-checks.sh
#
# Runs every 12 hours via .cronrc

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
REPORT_FILE="$STATUS_DIR/weekly-check-$TIMESTAMP.md"
LOG_FILE="$LOGS_DIR/weekly-check-$TIMESTAMP.log"

# Ensure directories exist
mkdir -p "$LOGS_DIR"
mkdir -p "$STATUS_DIR"

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
    return 1
  fi
  return 0
}

# Check for large files
check_large_files() {
  print_message "INFO" "Checking for large files..." "$BLUE"
  log "Checking for large files..."
  
  # Find files larger than 10MB
  find "$PROJECT_ROOT" -type f -size +10M -not -path "*/node_modules/*" -not -path "*/\.*" | while read -r file; do
    local rel_path="${file#$PROJECT_ROOT/}"
    local size=$(du -h "$file" | cut -f1)
    echo "- $rel_path ($size)"
  done
}

# Check for duplicate files
check_duplicate_files() {
  print_message "INFO" "Checking for potential duplicate files..." "$BLUE"
  log "Checking for potential duplicate files..."
  
  # Find files with similar names
  find "$PROJECT_ROOT" -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | sort | uniq -d -w 10 | while read -r file; do
    local rel_path="${file#$PROJECT_ROOT/}"
    echo "- $rel_path"
  done
}

# Check memory bank integrity
check_memory_bank_integrity() {
  print_message "INFO" "Checking memory bank integrity..." "$BLUE"
  log "Checking memory bank integrity..."
  
  if ! check_memory_bank; then
    echo "- Memory bank not found"
    return
  fi
  
  # Check if all required files exist
  local missing_files=0
  for file in "activeContext.md" "systemPatterns.md" "progress.md" "decisionLog.md" "productContext.md"; do
    if [ ! -f "$MEMORY_BANK_DIR/$file" ]; then
      echo "- Missing file: $file"
      missing_files=$((missing_files + 1))
    fi
  done
  
  if [ $missing_files -eq 0 ]; then
    echo "- All required memory bank files are present"
  fi
  
  # Check for empty files
  local empty_files=0
  for file in "$MEMORY_BANK_DIR"/*.md; do
    if [ ! -s "$file" ]; then
      local filename=$(basename "$file")
      echo "- Empty file: $filename"
      empty_files=$((empty_files + 1))
    fi
  done
  
  if [ $empty_files -eq 0 ]; then
    echo "- No empty memory bank files found"
  fi
  
  # Check for checkpoints
  if [ -d "$MEMORY_BANK_DIR/checkpoints" ]; then
    local checkpoint_count=$(find "$MEMORY_BANK_DIR/checkpoints" -type f | wc -l)
    echo "- Found $checkpoint_count checkpoints"
    
    # Check for recent checkpoints
    local recent_checkpoints=$(find "$MEMORY_BANK_DIR/checkpoints" -type f -mtime -7 | wc -l)
    echo "- $recent_checkpoints checkpoints created in the last 7 days"
  else
    echo "- No checkpoints directory found"
  fi
}

# Check for outdated dependencies
check_dependencies() {
  print_message "INFO" "Checking for outdated dependencies..." "$BLUE"
  log "Checking for outdated dependencies..."
  
  # Check if package.json exists
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    # Check if npm is available
    if command -v npm >/dev/null 2>&1; then
      echo "- package.json found, checking dependencies..."
      
      # Get outdated dependencies
      local outdated=$(npm --prefix "$PROJECT_ROOT" outdated --json 2>/dev/null)
      
      if [ -n "$outdated" ] && [ "$outdated" != "{}" ]; then
        echo "- Outdated dependencies found:"
        echo "$outdated" | grep -o '"[^"]*":' | tr -d '":' | while read -r pkg; do
          echo "  - $pkg"
        done
      else
        echo "- No outdated dependencies found"
      fi
    else
      echo "- npm not available, skipping dependency check"
    fi
  else
    echo "- No package.json found"
  fi
}

# Check for TODO comments
check_todo_comments() {
  print_message "INFO" "Checking for TODO comments..." "$BLUE"
  log "Checking for TODO comments..."
  
  # Find TODO comments in code files
  local todo_count=$(grep -r "TODO" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" "$PROJECT_ROOT" | wc -l)
  echo "- Found $todo_count TODO comments in code files"
  
  # List the first 5 TODO comments
  echo "- Recent TODOs:"
  grep -r "TODO" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" "$PROJECT_ROOT" | head -n 5 | while read -r line; do
    echo "  - $line"
  done
}

# Check for unused files
check_unused_files() {
  print_message "INFO" "Checking for potentially unused files..." "$BLUE"
  log "Checking for potentially unused files..."
  
  # Find files not modified in the last 30 days
  local old_files=$(find "$PROJECT_ROOT" -type f -mtime +30 -not -path "*/node_modules/*" -not -path "*/\.*" -not -path "*/docs/*" | wc -l)
  echo "- Found $old_files files not modified in the last 30 days"
  
  # List some examples
  echo "- Examples of potentially unused files:"
  find "$PROJECT_ROOT" -type f -mtime +30 -not -path "*/node_modules/*" -not -path "*/\.*" -not -path "*/docs/*" | head -n 5 | while read -r file; do
    local rel_path="${file#$PROJECT_ROOT/}"
    echo "  - $rel_path (last modified: $(date -r "$file" '+%Y-%m-%d'))"
  done
}

# Generate weekly report
generate_report() {
  print_message "INFO" "Generating weekly report..." "$BLUE"
  log "Generating weekly report..."
  
  # Create report file
  cat > "$REPORT_FILE" << EOF
# Weekly Maintenance Check Report - $(date +"%Y-%m-%d")

This report provides an overview of the weekly maintenance checks performed on the AI Sports Edge project.

## Large Files (>10MB)

$(check_large_files)

## Potential Duplicate Files

$(check_duplicate_files)

## Memory Bank Integrity

$(check_memory_bank_integrity)

## Dependency Status

$(check_dependencies)

## TODO Comments

$(check_todo_comments)

## Potentially Unused Files

$(check_unused_files)

## Recommendations

1. Review and address any large files to optimize repository size
2. Investigate potential duplicate files to reduce redundancy
3. Ensure memory bank integrity by addressing any missing or empty files
4. Update outdated dependencies to maintain security and performance
5. Review and address TODO comments in the codebase
6. Consider cleaning up or archiving unused files

## Next Steps

- Schedule time to address the issues identified in this report
- Run manual checks for areas not covered by automated checks
- Update documentation to reflect any changes made

Report generated on $(date +"%Y-%m-%d %H:%M:%S")
EOF
  
  # Create a symlink to the latest report
  ln -sf "$REPORT_FILE" "$STATUS_DIR/latest-weekly-check.md"
  
  print_message "SUCCESS" "Weekly report generated: $REPORT_FILE" "$GREEN"
  log "Weekly report generated: $REPORT_FILE"
}

# Main function
main() {
  print_message "INFO" "Starting weekly maintenance checks..." "$BLUE"
  log "Starting weekly maintenance checks..."
  
  # Generate report
  generate_report
  
  print_message "SUCCESS" "Weekly maintenance checks completed" "$GREEN"
  log "Weekly maintenance checks completed"
}

# Run the script
main