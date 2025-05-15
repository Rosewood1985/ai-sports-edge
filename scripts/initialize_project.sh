#!/bin/bash
# initialize_project.sh - Quick-start initialization script

set -e

# Create .roocode directory if it doesn't exist
mkdir -p .roocode

# Create project ID if it doesn't exist
if [ ! -f ".roocode/project_id" ]; then
  project_name=$(basename "$(pwd)")
  timestamp=$(date +%s)
  unique_id="${project_name}-${timestamp}"
  echo "$unique_id" > .roocode/project_id
  echo "Project ID created: $unique_id"
fi

# Store project root
echo "$(pwd)" > .roocode/project_root

# Log access
mkdir -p "$(dirname ".roocode/last_access.log")"
echo "$(date "+%Y-%m-%d %H:%M:%S") - Project $(cat .roocode/project_id) accessed from $(pwd)" >> .roocode/last_access.log

# Display project status
echo "======================================"
echo "Project Status"
echo "======================================"
echo "Project ID: $(cat .roocode/project_id 2>/dev/null || echo "unknown")"
echo "Last access: $(tail -n 1 .roocode/last_access.log 2>/dev/null || echo "unknown")"

# Check for uncommitted changes
if git status --porcelain 2>/dev/null | grep -q .; then
  echo "⚠️ You have uncommitted changes. Consider committing before starting new work."
fi

# Create session marker
echo "Session started at $(date)" > .roocode/current_session.txt

echo ""
echo "Project initialized and ready for work!"