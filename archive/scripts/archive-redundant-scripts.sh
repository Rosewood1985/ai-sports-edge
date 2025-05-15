#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp for logs
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Create archive directory if it doesn't exist
mkdir -p archive/scripts

echo -e "${BLUE}=== Archiving Redundant Scripts at $TIMESTAMP ===${NC}"

# List of scripts to archive (now consolidated into system-health-check.sh)
REDUNDANT_SCRIPTS=(
  "verify-context-systems.sh"
  "verify-deployment-health.sh"
  "push-health-check.sh"
  "push-health-check-fix.sh"
)

# Archive each script
for script in "${REDUNDANT_SCRIPTS[@]}"; do
  if [ -f "scripts/$script" ]; then
    # Add a comment at the top of the file indicating it's been consolidated
    temp_file=$(mktemp)
    echo "# ARCHIVED: This script has been consolidated into system-health-check.sh" > "$temp_file"
    echo "# Archived on: $TIMESTAMP" >> "$temp_file"
    echo "" >> "$temp_file"
    cat "scripts/$script" >> "$temp_file"
    
    # Move to archive
    mv "$temp_file" "archive/scripts/$script"
    
    # Remove original
    rm "scripts/$script"
    
    echo -e "${GREEN}Archived scripts/$script to archive/scripts/$script${NC}"
  else
    echo -e "${YELLOW}Script not found: scripts/$script${NC}"
  fi
done

# Log observation
if [ -f "status/roo-observations.md" ]; then
  echo "" >> status/roo-observations.md
  echo "### [file-cleanup] @ $TIMESTAMP" >> status/roo-observations.md
  echo "- 🧹 Archived redundant verification scripts that were consolidated into system-health-check.sh" >> status/roo-observations.md
  echo "- 📦 Scripts moved to archive/scripts/ with appropriate headers" >> status/roo-observations.md
  echo "- 🔍 This reduces file sprawl and maintains a cleaner scripts directory" >> status/roo-observations.md
  echo "" >> status/roo-observations.md
  echo "---" >> status/roo-observations.md
  echo -e "${GREEN}Observation logged successfully${NC}"
else
  echo -e "${RED}status/roo-observations.md not found${NC}"
fi

echo -e "${GREEN}Script archiving completed at $TIMESTAMP${NC}"