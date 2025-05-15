#!/bin/bash

# end-task.sh
# Saves context and creates a summary of completed work

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Ending AI Sports Edge task session...${NC}"

# Get current date and time
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_ONLY=$(date "+%Y-%m-%d")

# Create task summaries directory if it doesn't exist
if [ ! -d ".context/task-summaries" ]; then
  mkdir -p .context/task-summaries
  echo -e "${YELLOW}Created .context/task-summaries directory${NC}"
fi

# Prompt for task summary
echo -e "${YELLOW}Please enter a brief description of the completed task:${NC}"
read -e TASK_DESCRIPTION

# Prompt for task outcome
echo -e "${YELLOW}Please enter the outcome or result of the task:${NC}"
read -e TASK_OUTCOME

# Prompt for any issues encountered
echo -e "${YELLOW}Please enter any issues or challenges encountered (press Enter if none):${NC}"
read -e TASK_ISSUES

# Prompt for next steps
echo -e "${YELLOW}Please enter next steps or follow-up tasks (press Enter if none):${NC}"
read -e NEXT_STEPS

# Create a unique filename for the task summary
SUMMARY_FILE=".context/task-summaries/task_${DATE_ONLY}_$(date "+%H%M%S").md"

# Create the task summary file
cat > "$SUMMARY_FILE" << EOF
# Task Summary - $TIMESTAMP

## Description
$TASK_DESCRIPTION

## Outcome
$TASK_OUTCOME

EOF

# Add issues section if provided
if [ -n "$TASK_ISSUES" ]; then
  cat >> "$SUMMARY_FILE" << EOF
## Issues Encountered
$TASK_ISSUES

EOF
fi

# Add next steps section if provided
if [ -n "$NEXT_STEPS" ]; then
  cat >> "$SUMMARY_FILE" << EOF
## Next Steps
$NEXT_STEPS

EOF
fi

# Add files modified section
echo -e "## Files Modified" >> "$SUMMARY_FILE"
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  # Get list of modified files from git
  git status --porcelain | grep -E '^.M' | awk '{print $2}' | sed 's/^/- /' >> "$SUMMARY_FILE"
else
  echo -e "- (Git information not available)" >> "$SUMMARY_FILE"
fi

# Update master context with task completion
if [ -f ".context/master-context.md" ] && [ -f "./update-context.sh" ]; then
  echo -e "${YELLOW}Updating master context with task completion...${NC}"
  ./update-context.sh
  
  # Add completed task to Recent Changes section
  if grep -q "^## Recent Changes" ".context/master-context.md"; then
    sed -i "/^## Recent Changes/a\\- $TASK_DESCRIPTION (completed $DATE_ONLY)" ".context/master-context.md"
  fi
  
  # Update Next Steps section if provided
  if [ -n "$NEXT_STEPS" ] && grep -q "^## Next Steps" ".context/master-context.md"; then
    sed -i "/^## Next Steps/a\\- $NEXT_STEPS" ".context/master-context.md"
  fi
fi

# Take a final snapshot of the context
if [ -f "./snapshot-context.sh" ]; then
  echo -e "${YELLOW}Creating end-of-task snapshot...${NC}"
  ./snapshot-context.sh
fi

echo -e "${GREEN}Task summary created: $SUMMARY_FILE${NC}"
echo -e "${BLUE}Task session ended successfully${NC}"