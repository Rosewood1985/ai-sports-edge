#!/bin/bash
#
# migrate-and-update.sh
#
# This script provides a complete workflow for migrating a file to the Firebase atomic architecture,
# tagging it, updating the memory bank, and running tests.
#
# Usage: ./scripts/migrate-and-update.sh path/to/file.ts

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if a file path is provided
if [ $# -lt 1 ]; then
  echo -e "${RED}Error: No file path provided${NC}"
  echo "Usage: $0 path/to/file.ts"
  exit 1
fi

MIGRATED_FILE="$1"

# Check if the file exists
if [ ! -f "$MIGRATED_FILE" ]; then
  echo -e "${RED}Error: File '$MIGRATED_FILE' does not exist${NC}"
  exit 1
fi

# Check if the file is already migrated
if grep -q "✅ MIGRATED\|🧩 CONSOLIDATED" "$MIGRATED_FILE"; then
  echo -e "${YELLOW}Warning: File '$MIGRATED_FILE' already has a migration header${NC}"
  echo -e "${YELLOW}Do you want to proceed anyway? (y/n)${NC}"
  read -r confirm
  if [[ "$confirm" != "y" ]]; then
    echo -e "${RED}Migration cancelled by user${NC}"
    exit 0
  fi
fi

# Step 1: Create a backup
BACKUP_FILE="${MIGRATED_FILE}.bak.$(date +%Y%m%d%H%M%S)"
echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"
cp "$MIGRATED_FILE" "$BACKUP_FILE"

# Step 2: Run the migration
echo -e "${BLUE}Running migration for $MIGRATED_FILE...${NC}"
if [ -f "scripts/migrate-firebase-atomic.sh" ]; then
  # Use the migration script
  echo -e "${BLUE}Using migrate-firebase-atomic.sh script...${NC}"
  echo "3" | bash scripts/migrate-firebase-atomic.sh <<< "$MIGRATED_FILE"
else
  # Manual migration notice
  echo -e "${YELLOW}Warning: migrate-firebase-atomic.sh not found${NC}"
  echo -e "${YELLOW}Please manually migrate the file and then continue${NC}"
  echo -e "${YELLOW}Press Enter when ready to continue...${NC}"
  read -r
fi

# Step 3: Tag the file
echo -e "${BLUE}Tagging file with migration header...${NC}"
if [ -f "scripts/tag-headers.sh" ]; then
  bash scripts/tag-headers.sh migrated "$MIGRATED_FILE"
else
  echo -e "${YELLOW}Warning: tag-headers.sh not found, adding basic header${NC}"
  sed -i "1i// ✅ MIGRATED: Firebase Atomic Architecture" "$MIGRATED_FILE"
fi

# Step 4: Run tests if available
echo -e "${BLUE}Running tests...${NC}"
if [ -f "package.json" ] && grep -q "\"test\":" "package.json"; then
  # Extract the file name without extension
  FILE_NAME=$(basename "$MIGRATED_FILE" | sed 's/\.[^.]*$//')
  
  # Try to run tests for this file
  echo -e "${BLUE}Running tests for $FILE_NAME...${NC}"
  npm test -- -t "$FILE_NAME" || echo -e "${YELLOW}Warning: Tests failed or not found for $FILE_NAME${NC}"
else
  echo -e "${YELLOW}Warning: No test command found in package.json${NC}"
fi

# Step 5: Update memory bank
echo -e "${BLUE}Updating memory bank...${NC}"
if [ -f "scripts/update-memory-bank.js" ]; then
  node scripts/update-memory-bank.js --force
elif [ -f "scripts/maintain-context.sh" ]; then
  bash scripts/maintain-context.sh update
else
  echo -e "${YELLOW}Warning: Memory bank update scripts not found${NC}"
fi

# Step 6: Create a checkpoint
echo -e "${BLUE}Creating memory bank checkpoint...${NC}"
if [ -f "scripts/maintain-context.sh" ]; then
  bash scripts/maintain-context.sh checkpoint
else
  echo -e "${YELLOW}Warning: maintain-context.sh not found, skipping checkpoint${NC}"
fi

# Step 7: Final verification
echo -e "${BLUE}Verifying migration...${NC}"
if grep -q "import.*firebaseService" "$MIGRATED_FILE"; then
  echo -e "${GREEN}✅ File successfully migrated to use firebaseService${NC}"
else
  echo -e "${YELLOW}⚠️ Warning: File may not be properly migrated${NC}"
  echo -e "${YELLOW}   Please verify the file manually${NC}"
fi

echo -e "${GREEN}Migration workflow completed for $MIGRATED_FILE${NC}"
echo -e "${GREEN}Backup created at $BACKUP_FILE${NC}"