#!/bin/bash
#
# overnight-firebase-migration.sh
#
# This script is designed to run overnight to continue the Firebase atomic architecture migration
# without requiring user interaction. It:
# 1. Sets up a log file for the overnight process
# 2. Runs the accelerate-firebase-migration.sh script with auto-confirm
# 3. Creates a summary report for review in the morning
# 4. Updates the memory bank with the latest migration status
#
# Usage: ./scripts/overnight-firebase-migration.sh [--batch-size=N] [--max-batches=M]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
BATCH_SIZE=5
MAX_BATCHES=10  # Default limit to prevent too many migrations overnight
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="status/overnight-migration"
LOG_FILE="$LOG_DIR/overnight-migration-$TIMESTAMP.log"
SUMMARY_FILE="$LOG_DIR/overnight-migration-summary-$TIMESTAMP.md"

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --batch-size=*)
      BATCH_SIZE="${arg#*=}"
      ;;
    --max-batches=*)
      MAX_BATCHES="${arg#*=}"
      ;;
    --help)
      echo "Usage: $0 [--batch-size=N] [--max-batches=M]"
      echo ""
      echo "Options:"
      echo "  --batch-size=N    Number of files to migrate in each batch (default: 5)"
      echo "  --max-batches=M   Maximum number of batches to process (default: 10)"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize log file
echo "# Overnight Firebase Migration Log" > "$LOG_FILE"
echo "Started at $(date)" >> "$LOG_FILE"
echo "Configuration:" >> "$LOG_FILE"
echo "  Batch Size: $BATCH_SIZE" >> "$LOG_FILE"
echo "  Max Batches: $MAX_BATCHES" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log messages
log_message() {
  local message="$1"
  local color="${2:-$BLUE}"
  
  echo -e "${color}${message}${NC}"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$LOG_FILE"
}

# Function to get current migration status
get_migration_status() {
  if [ -f "status/firebase-atomic-migration-summary.md" ]; then
    local total=$(grep "Total files requiring migration" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
    local migrated=$(grep "Files migrated" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
    local progress=$(grep "Progress" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
    
    echo "$migrated/$total ($progress%)"
  else
    echo "Unknown"
  fi
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
log_message "Starting overnight Firebase migration..." "$GREEN"

# Get initial migration status
INITIAL_STATUS=$(get_migration_status)
log_message "Initial migration status: $INITIAL_STATUS" "$BLUE"

# Run the accelerate-firebase-migration.sh script with auto-confirm
if [ -f "scripts/accelerate-firebase-migration.sh" ]; then
  log_message "Running accelerated migration with batch size $BATCH_SIZE and max batches $MAX_BATCHES..." "$BLUE"
  
  # Set up a temporary script that will run the migration with limits
  TMP_SCRIPT=$(mktemp)
  cat > "$TMP_SCRIPT" << EOF
#!/bin/bash
# Temporary script to run migration with batch limits
BATCH_COUNT=0
while [ \$BATCH_COUNT -lt $MAX_BATCHES ]; do
  # Run one batch
  ./scripts/accelerate-firebase-migration.sh --batch-size=$BATCH_SIZE --auto-confirm
  
  # Check if there are more files to migrate
  if grep -q "No files need migration. All done!" "$LOG_FILE"; then
    echo "Migration complete, no more files to migrate."
    break
  fi
  
  # Increment batch count
  BATCH_COUNT=\$((BATCH_COUNT + 1))
  
  # Log progress
  echo "Completed batch \$BATCH_COUNT of $MAX_BATCHES"
  
  # Sleep briefly to allow system to stabilize
  sleep 5
done
EOF
  
  chmod +x "$TMP_SCRIPT"
  "$TMP_SCRIPT" >> "$LOG_FILE" 2>&1
  rm "$TMP_SCRIPT"
  
  log_message "Accelerated migration completed" "$GREEN"
else
  log_message "Error: accelerate-firebase-migration.sh not found" "$RED"
  exit 1
fi

# Get final migration status
update_memory_bank
FINAL_STATUS=$(get_migration_status)
log_message "Final migration status: $FINAL_STATUS" "$BLUE"

# Create summary report
log_message "Creating summary report..." "$BLUE"

cat > "$SUMMARY_FILE" << EOF
# Overnight Firebase Migration Summary

## Overview
- **Start Time:** $(date -d @$(($(date +%s) - 3600)) '+%Y-%m-%d %H:%M:%S')
- **End Time:** $(date '+%Y-%m-%d %H:%M:%S')
- **Initial Status:** $INITIAL_STATUS
- **Final Status:** $FINAL_STATUS

## Configuration
- **Batch Size:** $BATCH_SIZE
- **Max Batches:** $MAX_BATCHES

## Recently Migrated Files
$(grep -A 10 "Recently Migrated Files" status/firebase-atomic-migration-summary.md)

## Next Steps
1. Review the log file at \`$LOG_FILE\` for details
2. Check for any failed migrations
3. Run \`./scripts/display-diagnostic-summary.sh\` to see the updated migration status
4. Continue with manual migration if needed

## Automated Migration Recommendation
To continue automated migration tomorrow night, run:
\`\`\`
./scripts/overnight-firebase-migration.sh --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES
\`\`\`
EOF

log_message "Summary report created at $SUMMARY_FILE" "$GREEN"
log_message "Overnight migration process completed!" "$GREEN"

# Final message with next steps
cat << EOF

${GREEN}========================================================${NC}
${GREEN}  Overnight Firebase Migration Completed!              ${NC}
${GREEN}========================================================${NC}

${BLUE}Initial Status:${NC} $INITIAL_STATUS
${BLUE}Final Status:${NC} $FINAL_STATUS

${YELLOW}Next Steps:${NC}
1. Review the summary report at:
   $SUMMARY_FILE
2. Check the detailed log at:
   $LOG_FILE
3. Run the diagnostic summary script:
   ./scripts/display-diagnostic-summary.sh

To continue automated migration tomorrow night, run:
./scripts/overnight-firebase-migration.sh --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES

EOF