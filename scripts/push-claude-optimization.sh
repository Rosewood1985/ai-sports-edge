#!/bin/bash

# Push Claude Optimization Script
# This script commits and pushes the Claude optimization changes to GitHub

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to log messages
log() {
  local level=$1
  local message=$2
  
  case $level in
    info)
      echo -e "${GREEN}[INFO]${NC} $message"
      ;;
    warn)
      echo -e "${YELLOW}[WARN]${NC} $message"
      ;;
    error)
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Check if required files exist
if [[ ! -f "services/claudeOptimizationService.ts" ]]; then
  log "error" "Claude optimization service not found at services/claudeOptimizationService.ts"
  exit 1
fi

if [[ ! -f "scripts/claude-usage-report.sh" ]]; then
  log "error" "Claude usage report script not found at scripts/claude-usage-report.sh"
  exit 1
fi

if [[ ! -f "scripts/deploy-claude-optimization.sh" ]]; then
  log "error" "Claude deployment script not found at scripts/deploy-claude-optimization.sh"
  exit 1
fi

if [[ ! -f "commit-message-claude-optimization.txt" ]]; then
  log "error" "Commit message file not found at commit-message-claude-optimization.txt"
  exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
  log "error" "git is not installed or not in PATH"
  exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
  log "error" "Not in a git repository"
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "info" "Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  # There are changes
  log "info" "Uncommitted changes detected"
else
  log "warn" "No uncommitted changes detected"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "info" "Operation cancelled"
    exit 0
  fi
fi

# Stage the files
log "info" "Staging files..."
git add services/claudeOptimizationService.ts
git add scripts/claude-usage-report.sh
git add scripts/deploy-claude-optimization.sh
git add commit-message-claude-optimization.txt

# Check if any AI services were modified
AI_SERVICES=(
  "services/aiSummaryService.ts"
  "services/aiPredictionService.ts"
  "services/aiNewsAnalysisService.ts"
  "services/aiPickSelector.ts"
)

for service in "${AI_SERVICES[@]}"; do
  if [[ -f "$service" ]]; then
    if ! git diff-index --quiet HEAD -- "$service"; then
      log "info" "Staging modified AI service: $service"
      git add "$service"
    fi
  fi
done

# Commit the changes
log "info" "Committing changes..."
git commit -F commit-message-claude-optimization.txt

# Check if commit was successful
if [ $? -ne 0 ]; then
  log "error" "Failed to commit changes"
  exit 1
fi

# Ask if we should push
read -p "Push changes to remote? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Push to remote
  log "info" "Pushing changes to remote..."
  git push origin $CURRENT_BRANCH
  
  # Check if push was successful
  if [ $? -ne 0 ]; then
    log "error" "Failed to push changes"
    exit 1
  fi
  
  log "info" "Changes pushed successfully"
else
  log "info" "Changes committed but not pushed"
fi

log "info" "Claude optimization changes committed successfully"
log "info" "To deploy the changes, run: ./scripts/deploy-claude-optimization.sh"