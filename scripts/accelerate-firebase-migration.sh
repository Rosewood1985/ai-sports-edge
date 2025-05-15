#!/bin/bash
#
# accelerate-firebase-migration.sh
#
# This script accelerates the Firebase atomic architecture migration by:
# 1. Identifying all files that need migration
# 2. Prioritizing them based on importance and complexity
# 3. Running the migration process on them in batches
# 4. Updating the memory bank after each batch
#
# Usage: ./scripts/accelerate-firebase-migration.sh [--batch-size=N] [--auto-confirm]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
BATCH_SIZE=5
AUTO_CONFIRM=false
TEMP_DIR="/tmp/firebase-migration-$(date +%s)"
LOG_FILE="status/accelerated-migration-$(date +%Y%m%d%H%M%S).log"

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --batch-size=*)
      BATCH_SIZE="${arg#*=}"
      ;;
    --auto-confirm)
      AUTO_CONFIRM=true
      ;;
    --help)
      echo "Usage: $0 [--batch-size=N] [--auto-confirm]"
      echo ""
      echo "Options:"
      echo "  --batch-size=N    Number of files to migrate in each batch (default: 5)"
      echo "  --auto-confirm    Automatically confirm migrations without prompting"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Create directories
mkdir -p status
mkdir -p "$TEMP_DIR"

# Initialize log file
echo "# Accelerated Firebase Migration Log" > "$LOG_FILE"
echo "Started at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log messages
log_message() {
  local message="$1"
  local color="${2:-$BLUE}"
  
  echo -e "${color}${message}${NC}"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$LOG_FILE"
}

# Function to identify files that need migration
identify_files() {
  log_message "Identifying files that need migration..." "$BLUE"
  
  # Find files that import Firebase directly
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "import.*firebase" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    grep -v "atomic" |
    cut -d: -f1 |
    sort -u > "$TEMP_DIR/all_firebase_files.txt"
  
  # Find files that already use firebaseService
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "import.*firebaseService" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    cut -d: -f1 |
    sort -u > "$TEMP_DIR/migrated_files.txt"
  
  # Find files that have the migration header
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "// ✅ MIGRATED: Firebase Atomic Architecture" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    cut -d: -f1 |
    sort -u >> "$TEMP_DIR/migrated_files.txt"
  
  # Deduplicate the migrated files list
  sort -u "$TEMP_DIR/migrated_files.txt" > "$TEMP_DIR/migrated_files_unique.txt"
  
  # Find files that need migration (all Firebase files minus migrated files)
  grep -v -f "$TEMP_DIR/migrated_files_unique.txt" "$TEMP_DIR/all_firebase_files.txt" > "$TEMP_DIR/files_to_migrate.txt"
  
  local total_files=$(wc -l < "$TEMP_DIR/all_firebase_files.txt")
  local migrated_files=$(wc -l < "$TEMP_DIR/migrated_files_unique.txt")
  local remaining_files=$(wc -l < "$TEMP_DIR/files_to_migrate.txt")
  
  log_message "Found $total_files total Firebase files" "$BLUE"
  log_message "$migrated_files files already migrated" "$GREEN"
  log_message "$remaining_files files still need migration" "$YELLOW"
  
  # Write to log file
  echo "Total Firebase files: $total_files" >> "$LOG_FILE"
  echo "Already migrated: $migrated_files" >> "$LOG_FILE"
  echo "Remaining to migrate: $remaining_files" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
}

# Function to prioritize files
prioritize_files() {
  log_message "Prioritizing files for migration..." "$BLUE"
  
  # Create priority categories
  > "$TEMP_DIR/priority_high.txt"
  > "$TEMP_DIR/priority_medium.txt"
  > "$TEMP_DIR/priority_low.txt"
  
  # Process each file
  while IFS= read -r file; do
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
      continue
    fi
    
    # Check file content and path for priority determination
    if grep -q "firestore\|functions\|auth" "$file" || [[ "$file" == *"service"* ]]; then
      # High priority: Services and files with direct Firebase usage
      echo "$file" >> "$TEMP_DIR/priority_high.txt"
    elif [[ "$file" == *"component"* ]] || [[ "$file" == *"screen"* ]] || [[ "$file" == *"page"* ]]; then
      # Medium priority: UI components, screens, and pages
      echo "$file" >> "$TEMP_DIR/priority_medium.txt"
    else
      # Low priority: Everything else
      echo "$file" >> "$TEMP_DIR/priority_low.txt"
    fi
  done < "$TEMP_DIR/files_to_migrate.txt"
  
  # Combine files in priority order
  cat "$TEMP_DIR/priority_high.txt" "$TEMP_DIR/priority_medium.txt" "$TEMP_DIR/priority_low.txt" > "$TEMP_DIR/prioritized_files.txt"
  
  local high_count=$(wc -l < "$TEMP_DIR/priority_high.txt")
  local medium_count=$(wc -l < "$TEMP_DIR/priority_medium.txt")
  local low_count=$(wc -l < "$TEMP_DIR/priority_low.txt")
  
  log_message "Prioritized files:" "$BLUE"
  log_message "  High priority: $high_count files" "$RED"
  log_message "  Medium priority: $medium_count files" "$YELLOW"
  log_message "  Low priority: $low_count files" "$GREEN"
  
  # Write to log file
  echo "Priority breakdown:" >> "$LOG_FILE"
  echo "  High priority: $high_count files" >> "$LOG_FILE"
  echo "  Medium priority: $medium_count files" >> "$LOG_FILE"
  echo "  Low priority: $low_count files" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
}

# Function to migrate a batch of files
migrate_batch() {
  local batch_num=$1
  local start_line=$2
  local end_line=$3
  
  log_message "Migrating batch $batch_num (files $start_line-$end_line)..." "$BLUE"
  
  # Extract the batch of files
  sed -n "${start_line},${end_line}p" "$TEMP_DIR/prioritized_files.txt" > "$TEMP_DIR/current_batch.txt"
  
  # Log the batch
  echo "Batch $batch_num (files $start_line-$end_line):" >> "$LOG_FILE"
  cat "$TEMP_DIR/current_batch.txt" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  
  # Process each file in the batch
  local success_count=0
  local failure_count=0
  
  while IFS= read -r file; do
    log_message "Migrating file: $file" "$YELLOW"
    
    # Create backup
    local backup_file="${file}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$file" "$backup_file"
    
    # Run migration
    if [ -f "scripts/migrate-and-update.sh" ]; then
      # Use the comprehensive workflow script
      if $AUTO_CONFIRM; then
        yes | ./scripts/migrate-and-update.sh "$file" >> "$LOG_FILE" 2>&1
      else
        ./scripts/migrate-and-update.sh "$file" >> "$LOG_FILE" 2>&1
      fi
    else
      # Fallback to basic migration
      if [ -f "scripts/migrate-firebase-atomic.sh" ]; then
        if $AUTO_CONFIRM; then
          echo "3" | echo "$file" | yes | ./scripts/migrate-firebase-atomic.sh >> "$LOG_FILE" 2>&1
        else
          echo "3" | echo "$file" | ./scripts/migrate-firebase-atomic.sh >> "$LOG_FILE" 2>&1
        fi
      else
        log_message "Error: No migration script found" "$RED"
        failure_count=$((failure_count + 1))
        continue
      fi
      
      # Tag the file
      if [ -f "scripts/tag-headers.sh" ]; then
        ./scripts/tag-headers.sh migrated "$file" >> "$LOG_FILE" 2>&1
      fi
    fi
    
    # Check if migration was successful
    if grep -q "import.*firebaseService" "$file" || grep -q "// ✅ MIGRATED" "$file"; then
      log_message "✅ Successfully migrated: $file" "$GREEN"
      success_count=$((success_count + 1))
    else
      log_message "❌ Failed to migrate: $file" "$RED"
      failure_count=$((failure_count + 1))
      
      # Restore backup
      log_message "Restoring backup for $file" "$YELLOW"
      cp "$backup_file" "$file"
    fi
  done < "$TEMP_DIR/current_batch.txt"
  
  log_message "Batch $batch_num completed: $success_count succeeded, $failure_count failed" "$BLUE"
  echo "Batch $batch_num results: $success_count succeeded, $failure_count failed" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  
  return $success_count
}

# Function to update memory bank
update_memory_bank() {
  log_message "Updating memory bank..." "$BLUE"
  
  # Run update-firebase-migration-status.sh if available
  if [ -f "scripts/update-firebase-migration-status.sh" ]; then
    ./scripts/update-firebase-migration-status.sh >> "$LOG_FILE" 2>&1
    log_message "Memory bank updated via update-firebase-migration-status.sh" "$GREEN"
  elif [ -f "scripts/maintain-context.sh" ]; then
    # Fallback to maintain-context.sh
    ./scripts/maintain-context.sh update >> "$LOG_FILE" 2>&1
    log_message "Memory bank updated via maintain-context.sh" "$GREEN"
  else
    log_message "Warning: No memory bank update script found" "$YELLOW"
  fi
  
  # Create a checkpoint
  if [ -f "scripts/maintain-context.sh" ]; then
    ./scripts/maintain-context.sh checkpoint >> "$LOG_FILE" 2>&1
    log_message "Memory bank checkpoint created" "$GREEN"
  fi
}

# Main execution
log_message "Starting accelerated Firebase migration..." "$GREEN"

# Step 1: Identify files that need migration
identify_files

# Check if there are files to migrate
if [ ! -s "$TEMP_DIR/files_to_migrate.txt" ]; then
  log_message "No files need migration. All done!" "$GREEN"
  rm -rf "$TEMP_DIR"
  exit 0
fi

# Step 2: Prioritize files
prioritize_files

# Step 3: Confirm migration
total_files=$(wc -l < "$TEMP_DIR/prioritized_files.txt")
total_batches=$(( (total_files + BATCH_SIZE - 1) / BATCH_SIZE ))

log_message "Ready to migrate $total_files files in $total_batches batches of up to $BATCH_SIZE files each" "$BLUE"

if ! $AUTO_CONFIRM; then
  echo -e "${YELLOW}Do you want to proceed with the migration? (y/n)${NC}"
  read -r confirm
  
  if [[ "$confirm" != "y" ]]; then
    log_message "Migration cancelled by user" "$RED"
    rm -rf "$TEMP_DIR"
    exit 0
  fi
fi

# Step 4: Migrate files in batches
for ((batch=1; batch<=total_batches; batch++)); do
  start_line=$(( (batch - 1) * BATCH_SIZE + 1 ))
  end_line=$(( batch * BATCH_SIZE ))
  
  # Ensure end_line doesn't exceed total_files
  if [ $end_line -gt $total_files ]; then
    end_line=$total_files
  fi
  
  # Migrate the batch
  migrate_batch $batch $start_line $end_line
  success_count=$?
  
  # Update memory bank after each batch
  update_memory_bank
  
  # Ask to continue if not auto-confirming
  if ! $AUTO_CONFIRM && [ $batch -lt $total_batches ]; then
    echo -e "${YELLOW}Continue with the next batch? (y/n)${NC}"
    read -r continue_confirm
    
    if [[ "$continue_confirm" != "y" ]]; then
      log_message "Migration paused after batch $batch" "$YELLOW"
      break
    fi
  fi
done

# Step 5: Final update and cleanup
update_memory_bank

# Run retro-tag-migrated.sh to ensure all files are tagged
if [ -f "scripts/retro-tag-migrated.sh" ]; then
  log_message "Running retroactive tagging..." "$BLUE"
  ./scripts/retro-tag-migrated.sh >> "$LOG_FILE" 2>&1
  log_message "Retroactive tagging completed" "$GREEN"
fi

# Clean up
rm -rf "$TEMP_DIR"

log_message "Accelerated migration completed! See $LOG_FILE for details." "$GREEN"