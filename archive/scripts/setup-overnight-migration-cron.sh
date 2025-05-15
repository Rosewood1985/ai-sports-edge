#!/bin/bash
#
# setup-overnight-migration-cron.sh
#
# This script sets up a cron job to run the overnight Firebase migration process
# at a specified time. It creates the necessary directory structure and adds
# the cron job to the user's crontab.
#
# Usage: ./scripts/setup-overnight-migration-cron.sh [--hour=H] [--minute=M] [--batch-size=N] [--max-batches=B]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
HOUR=1        # 1 AM by default
MINUTE=0      # At the start of the hour
BATCH_SIZE=5  # Default batch size
MAX_BATCHES=10 # Default max batches

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --hour=*)
      HOUR="${arg#*=}"
      ;;
    --minute=*)
      MINUTE="${arg#*=}"
      ;;
    --batch-size=*)
      BATCH_SIZE="${arg#*=}"
      ;;
    --max-batches=*)
      MAX_BATCHES="${arg#*=}"
      ;;
    --help)
      echo "Usage: $0 [--hour=H] [--minute=M] [--batch-size=N] [--max-batches=B]"
      echo ""
      echo "Options:"
      echo "  --hour=H          Hour to run the migration (0-23, default: 1)"
      echo "  --minute=M        Minute to run the migration (0-59, default: 0)"
      echo "  --batch-size=N    Number of files to migrate in each batch (default: 5)"
      echo "  --max-batches=B   Maximum number of batches to process (default: 10)"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Validate hour and minute
if ! [[ "$HOUR" =~ ^[0-9]+$ ]] || [ "$HOUR" -lt 0 ] || [ "$HOUR" -gt 23 ]; then
  echo -e "${RED}Error: Hour must be a number between 0 and 23${NC}"
  exit 1
fi

if ! [[ "$MINUTE" =~ ^[0-9]+$ ]] || [ "$MINUTE" -lt 0 ] || [ "$MINUTE" -gt 59 ]; then
  echo -e "${RED}Error: Minute must be a number between 0 and 59${NC}"
  exit 1
fi

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_SCRIPT="$PROJECT_DIR/scripts/overnight-firebase-migration.sh"

# Check if the migration script exists
if [ ! -f "$MIGRATION_SCRIPT" ]; then
  echo -e "${RED}Error: Overnight migration script not found at $MIGRATION_SCRIPT${NC}"
  exit 1
fi

# Make sure the migration script is executable
chmod +x "$MIGRATION_SCRIPT"

# Create the cron job command
CRON_CMD="$MINUTE $HOUR * * * cd $PROJECT_DIR && $MIGRATION_SCRIPT --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES >> $PROJECT_DIR/status/overnight-migration/cron-$(date +\%Y\%m\%d).log 2>&1"

# Create the status/overnight-migration directory if it doesn't exist
mkdir -p "$PROJECT_DIR/status/overnight-migration"

# Check if crontab is available
if ! command -v crontab &> /dev/null; then
  echo -e "${RED}Error: crontab command not found. Cannot set up cron job.${NC}"
  echo -e "${YELLOW}To run the migration manually at the desired time, use:${NC}"
  echo -e "cd $PROJECT_DIR && $MIGRATION_SCRIPT --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES"
  exit 1
fi

# Add the cron job to the user's crontab
(crontab -l 2>/dev/null | grep -v "$MIGRATION_SCRIPT" ; echo "$CRON_CMD") | crontab -

# Verify the cron job was added
if crontab -l | grep -q "$MIGRATION_SCRIPT"; then
  echo -e "${GREEN}Cron job successfully set up!${NC}"
  echo -e "${BLUE}The overnight Firebase migration will run at ${HOUR}:$(printf "%02d" $MINUTE) every day.${NC}"
  echo -e "${BLUE}Migration configuration:${NC}"
  echo -e "  - Batch size: $BATCH_SIZE"
  echo -e "  - Max batches: $MAX_BATCHES"
  echo -e "${BLUE}Logs will be saved to:${NC}"
  echo -e "  $PROJECT_DIR/status/overnight-migration/"
else
  echo -e "${RED}Failed to set up cron job.${NC}"
  echo -e "${YELLOW}To run the migration manually at the desired time, use:${NC}"
  echo -e "cd $PROJECT_DIR && $MIGRATION_SCRIPT --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES"
  exit 1
fi

# Create a README file with instructions
README_FILE="$PROJECT_DIR/status/overnight-migration/README.md"
cat > "$README_FILE" << EOF
# Overnight Firebase Migration

## Overview
This directory contains logs and summaries from the automated overnight Firebase migration process.

## Configuration
- **Schedule:** ${HOUR}:$(printf "%02d" $MINUTE) daily
- **Batch Size:** $BATCH_SIZE files per batch
- **Max Batches:** $MAX_BATCHES batches per run

## Usage

### View Current Cron Job
\`\`\`
crontab -l | grep overnight-firebase-migration
\`\`\`

### Modify Schedule
To change the schedule, run:
\`\`\`
./scripts/setup-overnight-migration-cron.sh --hour=H --minute=M --batch-size=N --max-batches=B
\`\`\`

### Disable Overnight Migration
To disable the overnight migration, run:
\`\`\`
crontab -l | grep -v "overnight-firebase-migration" | crontab -
\`\`\`

### Run Manually
To run the migration manually:
\`\`\`
./scripts/overnight-firebase-migration.sh --batch-size=$BATCH_SIZE --max-batches=$MAX_BATCHES
\`\`\`

## Logs
- **Daily Cron Logs:** \`cron-YYYYMMDD.log\`
- **Migration Logs:** \`overnight-migration-YYYYMMDDHHMMSS.log\`
- **Migration Summaries:** \`overnight-migration-summary-YYYYMMDDHHMMSS.md\`

## Morning Review Process
1. Check the latest summary file for migration progress
2. Review any failed migrations
3. Run \`./scripts/display-diagnostic-summary.sh\` to see current status
4. Update the memory bank with \`npm run memory:update\`
EOF

echo -e "${GREEN}Created README file with instructions at:${NC}"
echo -e "  $README_FILE"

# Final message
cat << EOF

${GREEN}========================================================${NC}
${GREEN}  Overnight Firebase Migration Setup Complete!          ${NC}
${GREEN}========================================================${NC}

${BLUE}The migration will run at ${HOUR}:$(printf "%02d" $MINUTE) every day with:${NC}
- Batch size: $BATCH_SIZE
- Max batches: $MAX_BATCHES

${YELLOW}To review the setup and instructions:${NC}
cat $README_FILE

${YELLOW}To run a test migration now:${NC}
$MIGRATION_SCRIPT --batch-size=2 --max-batches=1

EOF