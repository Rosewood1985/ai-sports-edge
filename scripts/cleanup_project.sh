#!/bin/bash
# cleanup_project.sh
#
# Automates the cleanup of the AI Sports Edge project
# This script should be run from the project root directory

set -e  # Exit on error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_DIR="./archive"
BACKUP_DIR="$ARCHIVE_DIR/backup-files"
LOG_DIR="$ARCHIVE_DIR/logs"
DEPRECATED_DIR="$ARCHIVE_DIR/deprecated-code"
OLD_CONFIGS_DIR="$ARCHIVE_DIR/old-configs"
REPORT_FILE="./status/cleanup-report-$TIMESTAMP.md"
CLEANUP_BRANCH="cleanup-project-$TIMESTAMP"
DEFAULT_COMMIT_MSG="Project cleanup: Organize files and improve structure"

# Parse command line arguments
AUTO_PUSH=false
while getopts "p" opt; do
  case $opt in
    p)
      AUTO_PUSH=true
      ;;
    \?)
      echo -e "${RED}Invalid option: -$OPTARG${NC}" >&2
      exit 1
      ;;
  esac
done

# Function to log messages
log() {
  echo -e "[$(date +%H:%M:%S)] $1" | tee -a "$CLEANUP_LOG"
}

# Function to count files
count_files() {
  find "$1" -type f -name "$2" | wc -l
}

# Check Git status
echo -e "${BLUE}Checking Git status...${NC}"
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a Git repository${NC}"
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached HEAD")
echo -e "${BLUE}Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cleanup aborted.${NC}"
    exit 1
  fi
fi

# Create cleanup branch if not already on one
if [[ ! $CURRENT_BRANCH =~ ^cleanup-project ]]; then
  echo -e "${BLUE}Creating cleanup branch: ${YELLOW}$CLEANUP_BRANCH${NC}"
  git checkout -b "$CLEANUP_BRANCH"
else
  echo -e "${BLUE}Already on a cleanup branch: ${YELLOW}$CURRENT_BRANCH${NC}"
  CLEANUP_BRANCH=$CURRENT_BRANCH
fi

# Create archive directory structure
echo -e "${BLUE}Creating archive directory structure...${NC}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$DEPRECATED_DIR"
mkdir -p "$OLD_CONFIGS_DIR"
mkdir -p "./status"

# Create a log file for this cleanup operation
CLEANUP_LOG="$LOG_DIR/cleanup_$TIMESTAMP.log"
touch "$CLEANUP_LOG"

log "Starting project cleanup..."

# Create Git backup branch
log "Creating Git backup branch..."
git checkout -b backup-before-cleanup-$TIMESTAMP
git push origin backup-before-cleanup-$TIMESTAMP 2>/dev/null || log "Warning: Could not push backup branch to remote. Continue anyway."

# Switch back to cleanup branch
git checkout "$CLEANUP_BRANCH"

# Initialize report file
cat > "$REPORT_FILE" << EOF
# AI Sports Edge Cleanup Report

**Date:** $(date)
**Branch:** $CLEANUP_BRANCH
**Backup Branch:** backup-before-cleanup-$TIMESTAMP

## Summary of Changes

EOF

# Count files before cleanup
BAK_COUNT_BEFORE=$(count_files "." "*.bak")
LOG_COUNT_BEFORE=$(count_files "." "*.log")
TIMESTAMP_COUNT_BEFORE=$(find . -type f -name "*_20*.log" | wc -l)

log "Found $BAK_COUNT_BEFORE .bak files"
log "Found $LOG_COUNT_BEFORE .log files"
log "Found $TIMESTAMP_COUNT_BEFORE timestamped log files"

# Move backup files to archive
log "Moving backup files to archive..."
find . -name "*.bak" -exec mv {} "$BACKUP_DIR/" \; -exec echo "Moved {} to archive" \; -exec echo "- Moved {} to archive" >> "$REPORT_FILE" \;
find . -name "*.backup" -exec mv {} "$BACKUP_DIR/" \; -exec echo "Moved {} to archive" \; -exec echo "- Moved {} to archive" >> "$REPORT_FILE" \;

# Move log files to archive
log "Moving log files to archive..."
find . -name "*.log" -not -path "./archive/*" -exec mv {} "$LOG_DIR/" \; -exec echo "Moved {} to archive" \; -exec echo "- Moved {} to archive" >> "$REPORT_FILE" \;

# Move files with timestamp suffixes to archive
log "Moving timestamped files to archive..."
find . -name "*_20*.log" -not -path "./archive/*" -exec mv {} "$LOG_DIR/" \; -exec echo "Moved {} to archive" \; -exec echo "- Moved {} to archive" >> "$REPORT_FILE" \;

# Move old webpack configs to archive
log "Moving old webpack configs to archive..."
mkdir -p "$OLD_CONFIGS_DIR/webpack"
find . -name "webpack*.js" -not -name "webpack.config.js" -exec cp {} "$OLD_CONFIGS_DIR/webpack/" \; -exec echo "Copied {} to archive" \; -exec echo "- Copied {} to archive" >> "$REPORT_FILE" \;

# Move deprecated Firebase implementations to archive
log "Moving deprecated Firebase implementations to archive..."
mkdir -p "$DEPRECATED_DIR/firebase"
[ -f "firebase.js" ] && cp firebase.js "$DEPRECATED_DIR/firebase/" && echo "Copied firebase.js to archive" && echo "- Copied firebase.js to archive" >> "$REPORT_FILE"
[ -f "src/config/firebase.js" ] && cp src/config/firebase.js "$DEPRECATED_DIR/firebase/" && echo "Copied src/config/firebase.js to archive" && echo "- Copied src/config/firebase.js to archive" >> "$REPORT_FILE"
[ -f "config/firebase.js" ] && cp config/firebase.js "$DEPRECATED_DIR/firebase/" && echo "Copied config/firebase.js to archive" && echo "- Copied config/firebase.js to archive" >> "$REPORT_FILE"

# Update .gitignore
log "Updating .gitignore..."
cat > .gitignore.new << EOF
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env
.env.*
!.env.example
!.env.template

# typescript
*.tsbuildinfo

# Build directories
/build/
/coverage/
/.cache/

# Logs
*.log

# Backup files
*.bak
*.backup
*-old*
*-copy*
*-final*
*_20*

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log
.runtimeconfig.json

# Archive directory
/archive/
EOF

# Only replace .gitignore if there are differences
if ! cmp -s .gitignore .gitignore.new; then
  mv .gitignore.new .gitignore
  log "Updated .gitignore with new exclusions"
  echo "- Updated .gitignore with new exclusions" >> "$REPORT_FILE"
else
  rm .gitignore.new
  log ".gitignore already up to date"
  echo "- .gitignore already up to date" >> "$REPORT_FILE"
fi

# Count files after cleanup
BAK_COUNT_AFTER=$(count_files "." "*.bak")
LOG_COUNT_AFTER=$(count_files "." "*.log")
TIMESTAMP_COUNT_AFTER=$(find . -type f -name "*_20*.log" | wc -l)

# Add statistics to report
cat >> "$REPORT_FILE" << EOF

## Statistics

| File Type | Before | After | Moved to Archive |
|-----------|--------|-------|-----------------|
| .bak files | $BAK_COUNT_BEFORE | $BAK_COUNT_AFTER | $(($BAK_COUNT_BEFORE - $BAK_COUNT_AFTER)) |
| .log files | $LOG_COUNT_BEFORE | $LOG_COUNT_AFTER | $(($LOG_COUNT_BEFORE - $LOG_COUNT_AFTER)) |
| Timestamped files | $TIMESTAMP_COUNT_BEFORE | $TIMESTAMP_COUNT_AFTER | $(($TIMESTAMP_COUNT_BEFORE - $TIMESTAMP_COUNT_AFTER)) |

## Next Steps

1. Review the changes with \`git status\`
2. Commit the changes with \`git commit -m "Project cleanup phase 1"\`
3. Continue with Firebase configuration consolidation

## Backup Information

A backup branch \`backup-before-cleanup-$TIMESTAMP\` was created before making any changes.
To restore the project to its state before cleanup, run:

\`\`\`bash
git checkout backup-before-cleanup-$TIMESTAMP
\`\`\`
EOF

# Summary
log "Cleanup completed successfully!"
log "Summary:"
log "- Archive directory created at: $ARCHIVE_DIR"
log "- Backup files moved to: $BACKUP_DIR"
log "- Log files moved to: $LOG_DIR"
log "- Deprecated code moved to: $DEPRECATED_DIR"
log "- Old configs moved to: $OLD_CONFIGS_DIR"
log "- .gitignore updated"
log ""

# Stage all changes
echo -e "${BLUE}Staging changes...${NC}"
git add .

# Check if there are changes to commit
if [[ -z $(git status --porcelain) ]]; then
  echo -e "${YELLOW}No changes to commit.${NC}"
else
  # Prompt for commit message
  echo -e "${BLUE}Changes ready to commit.${NC}"
  echo -e "${YELLOW}Default commit message:${NC} $DEFAULT_COMMIT_MSG"
  read -p "Enter commit message (press Enter to use default): " COMMIT_MSG
  COMMIT_MSG=${COMMIT_MSG:-$DEFAULT_COMMIT_MSG}
  
  # Commit changes
  echo -e "${BLUE}Committing changes...${NC}"
  git commit -m "$COMMIT_MSG"
  
  # Verify commit was successful
  if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}Changes committed successfully!${NC}"
    
    # Push to remote if requested
    if [[ $AUTO_PUSH == true ]]; then
      echo -e "${BLUE}Pushing changes to remote...${NC}"
      git push origin "$CLEANUP_BRANCH"
      
      if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}Changes pushed to remote successfully!${NC}"
      else
        echo -e "${RED}Failed to push changes to remote.${NC}"
        echo -e "${YELLOW}You can push manually with:${NC} git push origin $CLEANUP_BRANCH"
      fi
    else
      echo -e "${YELLOW}To push changes to remote, run:${NC} git push origin $CLEANUP_BRANCH"
    fi
  else
    echo -e "${RED}Failed to commit changes.${NC}"
    echo -e "${YELLOW}You can commit manually with:${NC} git commit -m \"$COMMIT_MSG\""
  fi
fi

echo -e "${GREEN}Cleanup process completed!${NC}"
echo -e "${BLUE}For a detailed cleanup report, see:${NC} $REPORT_FILE"
echo -e "${BLUE}For a detailed cleanup log, see:${NC} $CLEANUP_LOG"

# Print usage instructions
echo -e "\n${BLUE}Usage:${NC}"
echo -e "  ${YELLOW}./scripts/cleanup_project.sh${NC}       # Run cleanup without pushing"
echo -e "  ${YELLOW}./scripts/cleanup_project.sh -p${NC}    # Run cleanup and push to remote"
