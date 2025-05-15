#!/bin/bash
# start.sh - Start the development server with project consistency checks

set -e

# Ensure we're in the right project
if [ -f ".roocode/project_root" ]; then
  PROJECT_ROOT=$(cat ".roocode/project_root")
  if [ "$(pwd)" != "$PROJECT_ROOT" ]; then
    echo "⚠️ Warning: You're not in the project root directory."
    echo "Current directory: $(pwd)"
    echo "Project root: $PROJECT_ROOT"
    
    read -p "Change to project root? [Y/n] " response
    if [[ "$response" =~ ^[Nn]$ ]]; then
      echo "Continuing in current directory."
    else
      cd "$PROJECT_ROOT"
      echo "Changed to project root: $PROJECT_ROOT"
    fi
  fi
fi

# Log access
if [ -f ".roocode/project_id" ]; then
  project_id=$(cat ".roocode/project_id")
  echo "$(date "+%Y-%m-%d %H:%M:%S") - Project $project_id accessed from $(pwd)" >> .roocode/last_access.log
fi

# Start development server
if [ -f "package.json" ]; then
  # Look for start script in package.json
  if grep -q '"start"' package.json; then
    echo "Starting development server..."
    
    # Log the start in memory bank
    if [ -f ".roocode/memory_bank.md" ]; then
      echo "- Started development server at $(date)" >> .roocode/memory_bank.md
    fi
    
    # Run the start script
    if command -v yarn > /dev/null; then
      yarn start
    else
      npm start
    fi
  else
    echo "No start script found in package.json"
    exit 1
  fi
else
  echo "No package.json found. Unable to start development server."
  exit 1
fi