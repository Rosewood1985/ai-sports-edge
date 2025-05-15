#!/bin/bash
# schedule_cleanup.sh
#
# Sets up automated cleanup for the AI Sports Edge project
# This script creates a cron job to run the cleanup_project.sh script weekly

set -e  # Exit on error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Path to the cleanup script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup_project.sh"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if cleanup script exists
if [ ! -f "$CLEANUP_SCRIPT" ]; then
  echo -e "${RED}Error: Cleanup script not found at $CLEANUP_SCRIPT${NC}"
  exit 1
fi

# Make sure the cleanup script is executable
chmod +x "$CLEANUP_SCRIPT"

# Function to add cron job
add_cron_job() {
  local schedule="$1"
  local command="$2"
  
  # Check if cron job already exists
  if crontab -l 2>/dev/null | grep -q "$command"; then
    echo -e "${YELLOW}Cron job already exists. Skipping...${NC}"
    return 0
  fi
  
  # Add new cron job
  (crontab -l 2>/dev/null || echo "") | { cat; echo "$schedule $command"; } | crontab -
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Cron job added successfully!${NC}"
    return 0
  else
    echo -e "${RED}Failed to add cron job.${NC}"
    return 1
  fi
}

# Create log directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/status/cron-logs"

# Command to run
CRON_COMMAND="cd $PROJECT_ROOT && $CLEANUP_SCRIPT >> $PROJECT_ROOT/status/cron-logs/cleanup-\$(date +\%Y\%m\%d_\%H\%M\%S).log 2>&1"

# Schedule options
echo "Select a schedule for the cleanup job:"
echo "1) Weekly (Sunday at 1:00 AM)"
echo "2) Monthly (1st day of the month at 2:00 AM)"
echo "3) Daily (Every day at 3:00 AM)"
echo "4) Custom schedule"

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    SCHEDULE="0 1 * * 0"
    DESCRIPTION="Weekly (Sunday at 1:00 AM)"
    ;;
  2)
    SCHEDULE="0 2 1 * *"
    DESCRIPTION="Monthly (1st day of the month at 2:00 AM)"
    ;;
  3)
    SCHEDULE="0 3 * * *"
    DESCRIPTION="Daily (Every day at 3:00 AM)"
    ;;
  4)
    echo "Enter a custom cron schedule (e.g., '0 4 * * 1' for Monday at 4:00 AM):"
    read -p "Schedule: " SCHEDULE
    DESCRIPTION="Custom ($SCHEDULE)"
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

# Add the cron job
echo "Adding cron job with schedule: $DESCRIPTION"
add_cron_job "$SCHEDULE" "$CRON_COMMAND"

if [ $? -eq 0 ]; then
  # Create a record of the scheduled job
  cat > "$PROJECT_ROOT/status/cleanup-schedule.md" << EOF
# AI Sports Edge Cleanup Schedule

The project cleanup script is scheduled to run automatically with the following settings:

- **Schedule**: $DESCRIPTION
- **Command**: \`$CLEANUP_SCRIPT\`
- **Log Directory**: \`$PROJECT_ROOT/status/cron-logs\`
- **Date Configured**: $(date)

## Manual Execution

To run the cleanup script manually:

\`\`\`bash
cd $PROJECT_ROOT
$CLEANUP_SCRIPT
\`\`\`

## Viewing Logs

Cleanup logs are stored in:

\`\`\`
$PROJECT_ROOT/status/cron-logs/
\`\`\`

## Modifying Schedule

To modify the schedule, run:

\`\`\`bash
$SCRIPT_DIR/schedule_cleanup.sh
\`\`\`

To remove the scheduled job:

\`\`\`bash
crontab -l | grep -v "$CLEANUP_SCRIPT" | crontab -
\`\`\`
EOF

  echo -e "${GREEN}Cleanup job scheduled successfully!${NC}"
  echo "Schedule: $DESCRIPTION"
  echo "Logs will be saved to: $PROJECT_ROOT/status/cron-logs/"
  echo "Schedule details saved to: $PROJECT_ROOT/status/cleanup-schedule.md"
else
  echo -e "${RED}Failed to schedule cleanup job.${NC}"
  exit 1
fi

# Create a GitHub Actions workflow file for scheduled cleanup
mkdir -p "$PROJECT_ROOT/.github/workflows"
cat > "$PROJECT_ROOT/.github/workflows/scheduled-cleanup.yml" << EOF
name: Scheduled Project Cleanup

on:
  schedule:
    # Run on the same schedule as the local cron job
    - cron: '$SCHEDULE'
  # Allow manual triggering
  workflow_dispatch:

jobs:
  cleanup:
    name: Run Project Cleanup
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          # Full git history is needed to identify old files
          fetch-depth: 0
      
      - name: Set up Git user
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"
      
      - name: Create backup branch
        run: |
          TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
          git checkout -b backup-before-cleanup-\$TIMESTAMP
          git push origin backup-before-cleanup-\$TIMESTAMP
      
      - name: Switch back to main branch
        run: git checkout main
      
      - name: Run cleanup script
        run: |
          chmod +x ./scripts/cleanup_project.sh
          ./scripts/cleanup_project.sh
      
      - name: Check for changes
        id: git-check
        run: |
          if [[ -n "\$(git status --porcelain)" ]]; then
            echo "changes=true" >> \$GITHUB_OUTPUT
          else
            echo "changes=false" >> \$GITHUB_OUTPUT
          fi
      
      - name: Commit changes
        if: steps.git-check.outputs.changes == 'true'
        run: |
          git add .
          git commit -m "Automated project cleanup [skip ci]"
      
      - name: Push changes
        if: steps.git-check.outputs.changes == 'true'
        uses: ad-m/github-push-action@master
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          branch: main
      
      - name: Generate cleanup report
        run: |
          echo "# Cleanup Report" > cleanup-report.md
          echo "" >> cleanup-report.md
          echo "## Cleanup performed on \$(date)" >> cleanup-report.md
          echo "" >> cleanup-report.md
          echo "### Changes made:" >> cleanup-report.md
          echo "\$(git log -1 --name-status)" >> cleanup-report.md
          echo "" >> cleanup-report.md
          echo "### Backup branch:" >> cleanup-report.md
          echo "backup-before-cleanup-\$(date +%Y%m%d_%H%M%S)" >> cleanup-report.md
      
      - name: Upload cleanup report
        uses: actions/upload-artifact@v3
        with:
          name: cleanup-report
          path: cleanup-report.md
EOF

echo -e "${GREEN}GitHub Actions workflow created at: .github/workflows/scheduled-cleanup.yml${NC}"
echo "This will run the cleanup process on GitHub as well, providing redundancy."
echo ""
echo -e "${GREEN}Setup complete!${NC}"