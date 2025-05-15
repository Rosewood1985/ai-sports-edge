#!/bin/bash
# scripts/full-sweep.sh
# Unified maintenance orchestration script for AI Sports Edge
# Consolidates various maintenance tasks into a single script with modular architecture

# Configuration
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/full-sweep-$(date +%Y%m%d_%H%M%S).log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
METRICS_FILE="status/maintenance-metrics.json"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Initialize log file
echo "# Full Sweep Maintenance Log - $TIMESTAMP" > "$LOG_FILE"
echo "# AI Sports Edge Maintenance Orchestration" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Initialize metrics
start_time=$(date +%s)
declare -A metrics
metrics["start_time"]="$TIMESTAMP"
metrics["components_processed"]=0
metrics["files_cleaned"]=0
metrics["tasks_processed"]=0
metrics["errors_encountered"]=0
metrics["warnings_encountered"]=0

# Function to log messages
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
  
  if [[ "$level" == "ERROR" ]]; then
    ((metrics["errors_encountered"]++))
  elif [[ "$level" == "WARNING" ]]; then
    ((metrics["warnings_encountered"]++))
  fi
}

# Function to handle errors
handle_error() {
  local error_message="$1"
  local error_source="$2"
  log "ERROR" "Error in $error_source: $error_message"
  
  # Add error to metrics
  metrics["last_error"]="$error_source: $error_message"
  
  # Continue execution (non-fatal error)
  return 1
}

# Function to update metrics
update_metrics() {
  local key="$1"
  local value="$2"
  metrics["$key"]="$value"
}

# Function to save metrics
save_metrics() {
  # Calculate duration
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  metrics["duration_seconds"]=$duration
  metrics["end_time"]=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Convert metrics to JSON
  local json="{\n"
  for key in "${!metrics[@]}"; do
    # Check if value is numeric
    if [[ "${metrics[$key]}" =~ ^[0-9]+$ ]]; then
      json+="  \"$key\": ${metrics[$key]},\n"
    else
      json+="  \"$key\": \"${metrics[$key]}\",\n"
    fi
  done
  # Remove trailing comma and close JSON
  json=$(echo -e "$json" | sed '$ s/,$//')
  json+="\n}"
  
  # Save metrics to file
  echo -e "$json" > "$METRICS_FILE"
  log "INFO" "Metrics saved to $METRICS_FILE"
}

# Function to check system prerequisites
check_prerequisites() {
  log "INFO" "Checking system prerequisites..."
  
  # Check for required commands
  for cmd in grep find sed awk jq; do
    if ! command -v $cmd &> /dev/null; then
      handle_error "$cmd command not found" "prerequisites"
    fi
  done
  
  # Check for required directories
  for dir in "memory-bank" "scripts" "status"; do
    if [ ! -d "$dir" ]; then
      handle_error "$dir directory not found" "prerequisites"
    fi
  done
  
  log "INFO" "Prerequisites check completed"
  return 0
}

# Function to clean up temporary files
cleanup_temp_files() {
  log "INFO" "Cleaning up temporary files..."
  
  # Find and remove temporary files
  local temp_files=$(find . -type f -name "*.tmp" -o -name "*.bak" -o -name "*.swp" -o -name "*~")
  local count=0
  
  if [ -n "$temp_files" ]; then
    while IFS= read -r file; do
      log "DEBUG" "Removing temporary file: $file"
      rm "$file"
      ((count++))
    done <<< "$temp_files"
  fi
  
  update_metrics "files_cleaned" $count
  log "INFO" "Cleaned up $count temporary files"
  return 0
}

# Function to consolidate task logs
consolidate_task_logs() {
  log "INFO" "Consolidating task logs..."
  
  if [ -f "scripts/update-task-log.sh" ]; then
    log "DEBUG" "Running update-task-log.sh"
    ./scripts/update-task-log.sh >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
      handle_error "Failed to run update-task-log.sh" "consolidate_task_logs"
    else
      log "INFO" "Task logs consolidated successfully"
      ((metrics["tasks_processed"]++))
    fi
  else
    handle_error "update-task-log.sh not found" "consolidate_task_logs"
  fi
  
  return 0
}

# Function to update app history
update_app_history() {
  log "INFO" "Updating app history..."
  
  if [ -f "scripts/update-app-history.sh" ]; then
    log "DEBUG" "Running update-app-history.sh"
    ./scripts/update-app-history.sh >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
      handle_error "Failed to run update-app-history.sh" "update_app_history"
    else
      log "INFO" "App history updated successfully"
      ((metrics["components_processed"]++))
    fi
  else
    handle_error "update-app-history.sh not found" "update_app_history"
  fi
  
  return 0
}

# Function to archive redundant files
archive_redundant_files() {
  log "INFO" "Archiving redundant files..."
  
  if [ -f "scripts/archive-redundant-files.sh" ]; then
    log "DEBUG" "Running archive-redundant-files.sh"
    ./scripts/archive-redundant-files.sh >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
      handle_error "Failed to run archive-redundant-files.sh" "archive_redundant_files"
    else
      log "INFO" "Redundant files archived successfully"
      ((metrics["components_processed"]++))
    fi
  else
    handle_error "archive-redundant-files.sh not found" "archive_redundant_files"
  fi
  
  return 0
}

# Function to update memory bank
update_memory_bank() {
  log "INFO" "Updating memory bank..."
  
  if [ -f "scripts/update-memory-bank.js" ]; then
    log "DEBUG" "Running update-memory-bank.js"
    node scripts/update-memory-bank.js --checkpoint >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
      handle_error "Failed to run update-memory-bank.js" "update_memory_bank"
    else
      log "INFO" "Memory bank updated successfully"
      ((metrics["components_processed"]++))
    fi
  else
    handle_error "update-memory-bank.js not found" "update_memory_bank"
  fi
  
  return 0
}

# Function to validate cron jobs
validate_cron_jobs() {
  log "INFO" "Validating cron jobs..."
  
  if [ -f ".cronrc" ]; then
    log "DEBUG" "Checking .cronrc entries"
    
    # Parse .cronrc file
    local cron_entries=$(grep -v "^#" .cronrc | grep -v "^$")
    local valid_entries=0
    local invalid_entries=0
    
    # Create cron validation log
    local cron_log="status/cron-validation-log.md"
    echo "# Cron Validation Log - $TIMESTAMP" > "$cron_log"
    echo "" >> "$cron_log"
    echo "| Schedule | Label | Command | Status | Issue |" >> "$cron_log"
    echo "|----------|-------|---------|--------|-------|" >> "$cron_log"
    
    while IFS= read -r entry; do
      # Parse entry
      local schedule=$(echo "$entry" | awk '{print $1}')
      local label=$(echo "$entry" | awk '{print $2}')
      local command=$(echo "$entry" | awk '{$1=""; $2=""; print $0}' | sed 's/^[ \t]*//')
      
      # Validate command
      local status="✅ Valid"
      local issue=""
      
      # Check if command exists
      local cmd_path=$(echo "$command" | awk '{print $1}')
      if [[ "$cmd_path" == ./* ]]; then
        if [ ! -f "$cmd_path" ]; then
          status="❌ Invalid"
          issue="Command file not found"
          ((invalid_entries++))
        elif [ ! -x "$cmd_path" ]; then
          status="⚠️ Warning"
          issue="Command file not executable"
          ((metrics["warnings_encountered"]++))
        else
          ((valid_entries++))
        fi
      else
        if ! command -v "$cmd_path" &> /dev/null; then
          status="❌ Invalid"
          issue="Command not found"
          ((invalid_entries++))
        else
          ((valid_entries++))
        fi
      fi
      
      # Add to log
      echo "| $schedule | $label | $command | $status | $issue |" >> "$cron_log"
    done <<< "$cron_entries"
    
    log "INFO" "Cron validation completed: $valid_entries valid, $invalid_entries invalid"
    update_metrics "valid_cron_entries" $valid_entries
    update_metrics "invalid_cron_entries" $invalid_entries
  else
    handle_error ".cronrc not found" "validate_cron_jobs"
  fi
  
  return 0
}

# Function to check for code duplication
check_code_duplication() {
  log "INFO" "Checking for code duplication..."
  
  # Define directories to check
  local dirs=("src" "scripts" "services" "functions")
  local extensions=("js" "ts" "tsx" "jsx" "sh")
  local duplication_log="status/code-duplication-log.md"
  
  echo "# Code Duplication Log - $TIMESTAMP" > "$duplication_log"
  echo "" >> "$duplication_log"
  echo "## Potential Duplicate Files" >> "$duplication_log"
  echo "" >> "$duplication_log"
  
  # Find files with similar names
  log "DEBUG" "Finding files with similar names"
  echo "### Files with Similar Names" >> "$duplication_log"
  echo "" >> "$duplication_log"
  echo "| Base Name | Files | Similarity |" >> "$duplication_log"
  echo "|-----------|-------|------------|" >> "$duplication_log"
  
  local similar_files=0
  
  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
      for ext in "${extensions[@]}"; do
        # Find base names (without extension)
        local base_names=$(find "$dir" -type f -name "*.$ext" | sed "s/\.$ext$//" | sort | uniq)
        
        while IFS= read -r base; do
          # Find files with this base name but different extensions
          local matches=$(find "${dirs[@]}" -type f -name "$(basename "$base").*" | sort)
          local count=$(echo "$matches" | wc -l)
          
          if [ "$count" -gt 1 ]; then
            local file_list=$(echo "$matches" | tr '\n' ', ' | sed 's/,$//')
            echo "| $(basename "$base") | $file_list | Similar names |" >> "$duplication_log"
            ((similar_files++))
          fi
        done <<< "$base_names"
      done
    fi
  done
  
  log "INFO" "Found $similar_files sets of files with similar names"
  update_metrics "similar_files" $similar_files
  
  # Find backup files
  log "DEBUG" "Finding backup files"
  echo "" >> "$duplication_log"
  echo "### Backup Files" >> "$duplication_log"
  echo "" >> "$duplication_log"
  echo "| Original File | Backup File |" >> "$duplication_log"
  echo "|---------------|-------------|" >> "$duplication_log"
  
  local backup_files=0
  
  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
      local backups=$(find "$dir" -type f -name "*.bak" -o -name "*.backup" -o -name "*~")
      
      while IFS= read -r backup; do
        if [ -n "$backup" ]; then
          local original=${backup%.bak}
          original=${original%.backup}
          original=${original%\~}
          
          if [ -f "$original" ]; then
            echo "| $original | $backup |" >> "$duplication_log"
            ((backup_files++))
          fi
        fi
      done <<< "$backups"
    fi
  done
  
  log "INFO" "Found $backup_files backup files"
  update_metrics "backup_files" $backup_files
  
  return 0
}

# Function to update historical context
update_historical_context() {
  log "INFO" "Updating historical context..."
  
  # Extract historical information from maintenance components
  local history_file="memory-bank/app-history.md"
  local temp_history="$LOG_DIR/temp-history.md"
  
  # Ensure history file exists
  if [ ! -f "$history_file" ]; then
    log "WARNING" "History file not found, creating new one"
    echo "# AI Sports Edge App History" > "$history_file"
    echo "" >> "$history_file"
    echo "This document tracks the historical implementation data of the AI Sports Edge application." >> "$history_file"
    echo "" >> "$history_file"
  fi
  
  # Create temporary history entry
  echo "## [Maintenance] System Maintenance - $TIMESTAMP" > "$temp_history"
  echo "" >> "$temp_history"
  echo "### Components Processed" >> "$temp_history"
  echo "" >> "$temp_history"
  
  # Add maintenance components
  for script in "update-task-log.sh" "update-app-history.sh" "archive-redundant-files.sh" "update-memory-bank.js"; do
    if [ -f "scripts/$script" ]; then
      local last_modified=$(stat -c %y "scripts/$script" 2>/dev/null || stat -f "%Sm" "scripts/$script" 2>/dev/null)
      echo "- **$script**: Last modified $last_modified" >> "$temp_history"
    fi
  done
  
  echo "" >> "$temp_history"
  echo "### Maintenance Metrics" >> "$temp_history"
  echo "" >> "$temp_history"
  echo "- Files cleaned: ${metrics["files_cleaned"]}" >> "$temp_history"
  echo "- Tasks processed: ${metrics["tasks_processed"]}" >> "$temp_history"
  echo "- Components processed: ${metrics["components_processed"]}" >> "$temp_history"
  echo "- Errors encountered: ${metrics["errors_encountered"]}" >> "$temp_history"
  echo "- Warnings encountered: ${metrics["warnings_encountered"]}" >> "$temp_history"
  echo "" >> "$temp_history"
  echo "### Maintenance Strategy" >> "$temp_history"
  echo "" >> "$temp_history"
  echo "The system maintenance strategy includes:" >> "$temp_history"
  echo "- Regular cleanup of temporary files" >> "$temp_history"
  echo "- Consolidation of task logs" >> "$temp_history"
  echo "- Updating app history" >> "$temp_history"
  echo "- Archiving redundant files" >> "$temp_history"
  echo "- Updating memory bank" >> "$temp_history"
  echo "- Validating cron jobs" >> "$temp_history"
  echo "- Checking for code duplication" >> "$temp_history"
  echo "" >> "$temp_history"
  
  # Append to history file
  cat "$temp_history" >> "$history_file"
  log "INFO" "Historical context updated in $history_file"
  
  return 0
}

# Main function
main() {
  log "INFO" "Starting full sweep maintenance..."
  
  # Check prerequisites
  check_prerequisites || log "WARNING" "Prerequisites check failed, continuing anyway"
  
  # Run maintenance tasks
  cleanup_temp_files
  consolidate_task_logs
  update_app_history
  archive_redundant_files
  update_memory_bank
  validate_cron_jobs
  check_code_duplication
  update_historical_context
  
  # Save metrics
  save_metrics
  
  log "INFO" "Full sweep maintenance completed"
  return 0
}

# Run main function
main
exit $?