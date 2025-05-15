#!/bin/bash
#
# run-complete-migration.sh
#
# This script runs the complete Firebase atomic architecture migration process
# from start to finish, including initialization, migration, and verification.
#
# Usage: ./scripts/run-complete-migration.sh [--auto-confirm] [--batch-size=N]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
AUTO_CONFIRM=false
BATCH_SIZE=5

for arg in "$@"; do
  case $arg in
    --auto-confirm)
      AUTO_CONFIRM=true
      ;;
    --batch-size=*)
      BATCH_SIZE="${arg#*=}"
      ;;
    --help)
      echo "Usage: $0 [--auto-confirm] [--batch-size=N]"
      echo ""
      echo "Options:"
      echo "  --auto-confirm    Run all steps without prompting for confirmation"
      echo "  --batch-size=N    Number of files to migrate in each batch (default: 5)"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Function to run a step with confirmation
run_step() {
  local step_name="$1"
  local command="$2"
  
  echo -e "${BLUE}Step: ${step_name}${NC}"
  
  if ! $AUTO_CONFIRM; then
    echo -e "${YELLOW}Do you want to run this step? (y/n)${NC}"
    read -r confirm
    
    if [[ "$confirm" != "y" ]]; then
      echo -e "${YELLOW}Skipping step: ${step_name}${NC}"
      return 0
    fi
  fi
  
  echo -e "${BLUE}Running: ${command}${NC}"
  eval "$command"
  
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}Step failed with exit code $exit_code: ${step_name}${NC}"
    
    if ! $AUTO_CONFIRM; then
      echo -e "${YELLOW}Do you want to continue with the next step? (y/n)${NC}"
      read -r continue_confirm
      
      if [[ "$continue_confirm" != "y" ]]; then
        echo -e "${RED}Migration process aborted${NC}"
        exit 1
      fi
    else
      echo -e "${RED}Aborting migration process due to error${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}Step completed successfully: ${step_name}${NC}"
  fi
}

# Main execution
echo -e "${GREEN}Starting complete Firebase atomic architecture migration process${NC}"

# Step 1: Initialize memory bank
run_step "Initialize memory bank" "bash scripts/initialize-memory-bank.sh"

# Step 2: Run retroactive tagging on existing migrated files
run_step "Retroactive tagging" "bash scripts/retro-tag-migrated.sh"

# Step 3: Update migration status
run_step "Update migration status" "bash scripts/update-firebase-migration-status.sh"

# Step 4: Run accelerated migration
if $AUTO_CONFIRM; then
  run_step "Accelerated migration" "bash scripts/accelerate-firebase-migration.sh --auto-confirm --batch-size=$BATCH_SIZE"
else
  run_step "Accelerated migration" "bash scripts/accelerate-firebase-migration.sh --batch-size=$BATCH_SIZE"
fi

# Step 5: Final retroactive tagging
run_step "Final retroactive tagging" "bash scripts/retro-tag-migrated.sh"

# Step 6: Final update of migration status
run_step "Final migration status update" "bash scripts/update-firebase-migration-status.sh"

# Step 7: Create memory bank checkpoint
run_step "Create memory bank checkpoint" "bash scripts/maintain-context.sh checkpoint"

echo -e "${GREEN}Complete Firebase atomic architecture migration process finished!${NC}"
echo -e "${GREEN}Check the memory bank and status files for details.${NC}"