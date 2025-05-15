#!/bin/bash
#
# log-cron-observation.sh
#
# Logs observations from cron jobs to status/roo-observations.md
# Used by .cronrc jobs to append their outcome or context insights
#
# Usage:
#   ./scripts/log-cron-observation.sh --label save-context --message "Context saved. No anomalies."
#   ./scripts/log-cron-observation.sh --label tag-scan --status warning --message "Found 2 tags without tasks."
#

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
LABEL=""
MESSAGE=""
STATUS="info" # info, success, warning, error
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OBSERVATIONS_FILE="status/roo-observations.md"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --label)
      LABEL="$2"
      shift 2
      ;;
    --message)
      MESSAGE="$2"
      shift 2
      ;;
    --status)
      STATUS="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$LABEL" ]; then
  echo -e "${RED}Error: --label is required${NC}"
  exit 1
fi

if [ -z "$MESSAGE" ]; then
  echo -e "${RED}Error: --message is required${NC}"
  exit 1
fi

# Ensure observations file exists
if [ ! -f "$OBSERVATIONS_FILE" ]; then
  echo -e "${YELLOW}Creating $OBSERVATIONS_FILE${NC}"
  mkdir -p $(dirname "$OBSERVATIONS_FILE")
  cat > "$OBSERVATIONS_FILE" << EOF
# Roo Observations Log

This file contains automated observations from cron jobs, providing insights into system behavior, task execution, and potential issues.

## Purpose

- Track insights and observations from automated processes
- Create an audit trail of automated activities
- Identify patterns and anomalies
- Facilitate continuous improvement of automated processes

## Format

Each entry follows this format:

\`\`\`
### [job-label] @ YYYY-MM-DDThh:mm:ssZ
- ✅/⚠️/❌ Observation 1
- ✅/⚠️/❌ Observation 2
...

---
\`\`\`

## Log Entries

EOF
fi

# Determine status icon
case $STATUS in
  success)
    ICON="✅"
    ;;
  warning)
    ICON="⚠️"
    ;;
  error)
    ICON="❌"
    ;;
  *)
    ICON="🔍"
    ;;
esac

# Format the entry
ENTRY="### [$LABEL] @ $TIMESTAMP
- $ICON $MESSAGE

---
"

# Append the entry to the observations file
echo -e "${BLUE}Appending observation to $OBSERVATIONS_FILE${NC}"
echo -e "$ENTRY" >> "$OBSERVATIONS_FILE"
echo -e "${GREEN}Observation logged successfully${NC}"

# If this is a simple "no issues" message, log it more concisely
if [[ "$MESSAGE" == "No new tags. No issues found." || "$MESSAGE" == "Context saved. No anomalies." ]]; then
  echo -e "${GREEN}[$LABEL] completed successfully with no issues${NC}"
else
  echo -e "${YELLOW}[$LABEL] observation: $MESSAGE${NC}"
fi

exit 0