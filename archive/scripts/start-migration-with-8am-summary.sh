#!/bin/bash
#
# start-migration-with-8am-summary.sh
#
# This script starts the Firebase migration process immediately and schedules
# a summary report to be generated at 8:00 AM without stopping the migration.
#
# Usage: ./scripts/start-migration-with-8am-summary.sh [--batch-size=N] [--max-batches=M]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
BATCH_SIZE=5
MAX_BATCHES=1000  # Very high number to allow continuous migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="status/overnight-migration"
LOG_FILE="$LOG_DIR/migration-$TIMESTAMP.log"
SUMMARY_FILE="$LOG_DIR/migration-summary-8am-$TIMESTAMP.md"

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
      echo "  --max-batches=M   Maximum number of batches to process (default: 1000)"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize log file
echo "# Firebase Migration Log" > "$LOG_FILE"
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

# Function to create a summary report
create_summary_report() {
  local summary_file=$1
  local start_time=$2
  
  # Get current migration status
  local current_status=$(get_migration_status)
  
  # Create summary report
  cat > "$summary_file" << EOF
# Firebase Migration 8 AM Summary

## Overview
- **Start Time:** $(date -d @$start_time '+%Y-%m-%d %H:%M:%S')
- **Current Time:** $(date '+%Y-%m-%d %H:%M:%S')
- **Current Status:** $current_status

## Recently Migrated Files
$(grep -A 10 "Recently Migrated Files" status/firebase-atomic-migration-summary.md)

## Migration Log
The migration log is available at:
\`\`\`
$LOG_FILE
\`\`\`

## Next Steps
1. Review the migration progress using:
   \`\`\`
   ./scripts/display-diagnostic-summary.sh
   \`\`\`

2. Update the memory bank:
   \`\`\`
   npm run memory:update
   \`\`\`

3. Create a memory bank checkpoint:
   \`\`\`
   npm run memory:checkpoint
   \`\`\`

## Migration Status
The migration process is still running and will continue until all files are migrated.
To check the current status, run:
\`\`\`
cat status/firebase-atomic-migration-summary.md
\`\`\`
EOF

  log_message "Created 8 AM summary report at $summary_file" "$GREEN"
  
  # Display notification
  echo -e "\n${GREEN}========================================================${NC}"
  echo -e "${GREEN}  8:00 AM Migration Summary Generated!                  ${NC}"
  echo -e "${GREEN}========================================================${NC}"
  echo -e "${BLUE}Summary report available at:${NC}"
  echo -e "  $summary_file"
  echo -e "${BLUE}Current migration status:${NC} $current_status"
  echo -e "${YELLOW}The migration process is still running and will continue until completion.${NC}"
}

# Calculate the time until 8 AM
current_hour=$(date +%H)
current_minute=$(date +%M)
minutes_until_8am=0

if [ $current_hour -lt 8 ]; then
  hours_until_8am=$((8 - current_hour - 1))
  minutes_until_8am=$((60 - current_minute + hours_until_8am * 60))
else
  # If it's already past 8 AM, schedule for tomorrow
  hours_until_8am=$((24 - current_hour + 8 - 1))
  minutes_until_8am=$((60 - current_minute + hours_until_8am * 60))
fi

# Record the start time
start_time=$(date +%s)

# Schedule the summary report generation at 8 AM
log_message "Scheduling 8 AM summary report generation in $minutes_until_8am minutes" "$BLUE"

# Use at command to schedule the summary generation
if command -v at &> /dev/null; then
  # Create a temporary script for the at command
  TMP_SCRIPT=$(mktemp)
  cat > "$TMP_SCRIPT" << EOF
#!/bin/bash
cd $(pwd)
$(declare -f create_summary_report)
create_summary_report "$SUMMARY_FILE" "$start_time"
EOF
  chmod +x "$TMP_SCRIPT"
  
  # Schedule with at command
  echo "$TMP_SCRIPT" | at now + $minutes_until_8am minutes 2>/dev/null
  
  if [ $? -eq 0 ]; then
    log_message "Summary report scheduled successfully for 8:00 AM" "$GREEN"
  else
    log_message "Failed to schedule summary report with 'at' command" "$RED"
    log_message "Will attempt to use sleep instead" "$YELLOW"
    
    # Fallback to sleep
    (
      sleep $((minutes_until_8am * 60))
      create_summary_report "$SUMMARY_FILE" "$start_time"
    ) &
    SLEEP_PID=$!
    log_message "Summary report scheduled with sleep (PID: $SLEEP_PID)" "$GREEN"
  fi
else
  log_message "'at' command not available, using sleep instead" "$YELLOW"
  
  # Use sleep as fallback
  (
    sleep $((minutes_until_8am * 60))
    create_summary_report "$SUMMARY_FILE" "$start_time"
  ) &
  SLEEP_PID=$!
  log_message "Summary report scheduled with sleep (PID: $SLEEP_PID)" "$GREEN"
fi

# Get initial migration status
INITIAL_STATUS=$(get_migration_status)
log_message "Initial migration status: $INITIAL_STATUS" "$BLUE"

# Start the migration process
log_message "Starting Firebase migration with batch size $BATCH_SIZE..." "$GREEN"

# Run the migration in the background
./scripts/overnight-firebase-migration.sh --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES >> "$LOG_FILE" 2>&1 &
MIGRATION_PID=$!

log_message "Migration process started with PID: $MIGRATION_PID" "$GREEN"
log_message "Migration will continue running until completion" "$GREEN"
log_message "A summary report will be generated at 8:00 AM" "$GREEN"

# Final message
cat << EOF

${GREEN}========================================================${NC}
${GREEN}  Firebase Migration Started!                           ${NC}
${GREEN}========================================================${NC}

${BLUE}Initial Status:${NC} $INITIAL_STATUS
${BLUE}Migration PID:${NC} $MIGRATION_PID
${BLUE}Log File:${NC} $LOG_FILE

${YELLOW}A summary report will be generated at 8:00 AM at:${NC}
  $SUMMARY_FILE

${YELLOW}The migration will continue running until all files are migrated.${NC}

To check the current status at any time, run:
  ./scripts/display-diagnostic-summary.sh

To update the memory bank:
  npm run memory:update

EOF