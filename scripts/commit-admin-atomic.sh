#!/bin/bash
# commit-admin-atomic.sh - Script to commit admin atomic components

# Base directory
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
LOG_FILE="$BASE_DIR/logs/admin-atomic-commit.log"

# Create log directory if it doesn't exist
mkdir -p "$BASE_DIR/logs"

# Log function
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feature/admin-atomic-architecture" ]; then
  log_message "Error: Not on feature/admin-atomic-architecture branch. Current branch: $CURRENT_BRANCH"
  log_message "Please run: git checkout feature/admin-atomic-architecture"
  exit 1
fi

# Add the files
log_message "Adding files to git..."
git add \
  src/atomic/atoms/admin/StatusIndicator.tsx \
  src/atomic/atoms/admin/MetricCard.tsx \
  src/atomic/atoms/admin/index.ts \
  src/atomic/molecules/admin/MetricsPanel.tsx \
  src/atomic/molecules/admin/index.ts \
  src/atomic/organisms/admin/AdminHeader.tsx \
  src/atomic/organisms/admin/AdminSidebar.tsx \
  src/atomic/organisms/admin/AdminDashboard.tsx \
  src/atomic/organisms/admin/index.ts \
  src/atomic/templates/AdminLayout.tsx \
  src/atomic/templates/index.ts \
  tasks/admin-atomic-architecture.md

# Commit with message
log_message "Committing changes..."
COMMIT_MSG=$(cat "$BASE_DIR/commit-message-admin-atomic.txt")
git commit -m "$COMMIT_MSG"

# Show status
log_message "Commit complete. Git status:"
git status

log_message "Done!"