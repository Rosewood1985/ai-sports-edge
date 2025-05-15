#!/bin/bash

# snapshot-context.sh
# Creates a timestamped snapshot of the current context

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating snapshot of AI Sports Edge context...${NC}"

# Check if master context exists
if [ ! -f ".context/master-context.md" ]; then
  echo -e "${RED}Error: Master context file not found.${NC}"
  echo -e "${YELLOW}Run ./update-context.sh to create a new master context.${NC}"
  exit 1
fi

# Create snapshots directory if it doesn't exist
if [ ! -d ".context/snapshots" ]; then
  mkdir -p .context/snapshots
  echo -e "${YELLOW}Created .context/snapshots directory${NC}"
fi

# Get current date and time for filename
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
SNAPSHOT_FILE=".context/snapshots/context_${TIMESTAMP}.md"

# Copy the current master context to the snapshot file
cp .context/master-context.md "$SNAPSHOT_FILE"

# Add snapshot metadata to the top of the file
FULL_TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
sed -i "1i# AI Sports Edge Context Snapshot - $FULL_TIMESTAMP\n" "$SNAPSHOT_FILE"

# Get current git branch and commit if available
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  BRANCH=$(git branch --show-current)
  COMMIT=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  
  # Add git information to snapshot
  sed -i "2i\n## Git Information\n- Branch: $BRANCH\n- Commit: $COMMIT\n- Message: $COMMIT_MSG\n" "$SNAPSHOT_FILE"
fi

# Get open files from VSCode if possible
# This is a placeholder - in a real implementation, you would need to get this information from VSCode
echo -e "## Open Files\n- services/firebaseSubscriptionService.ts\n- services/firebaseMonitoringService.ts\n- services/firebaseService.ts\n- services/bettingAnalyticsService.ts\n" >> "$SNAPSHOT_FILE"

# Add migration progress
TOTAL_FILES=438
MIGRATED_FILES=$(find . -name "*.atomic.ts" | wc -l)
PERCENT_COMPLETE=$(( (MIGRATED_FILES * 100) / TOTAL_FILES ))

echo -e "## Migration Progress\n- Migrated: $MIGRATED_FILES/$TOTAL_FILES files ($PERCENT_COMPLETE%)\n" >> "$SNAPSHOT_FILE"

echo -e "${GREEN}Snapshot created: $SNAPSHOT_FILE${NC}"

# Create a list of all snapshots
echo -e "${YELLOW}Available snapshots:${NC}"
ls -lt .context/snapshots | grep -v "total" | awk '{print $9}' | sed 's/^/• /'

echo -e "${BLUE}Snapshot creation complete${NC}"
echo -e "${YELLOW}To view a snapshot: cat .context/snapshots/[snapshot_filename]${NC}"