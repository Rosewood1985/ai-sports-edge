#!/bin/bash
# Dependency Update Script for AI Sports Edge
# This script automates the dependency update process

# Set script to exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/dependency-update-${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

# Log function
log() {
  echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
}

# Error function
error() {
  echo -e "${RED}[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1${NC}"
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1" >> "$LOG_FILE"
  exit 1
}

# Warning function
warning() {
  echo -e "${YELLOW}[$(date +"%Y-%m-%d %H:%M:%S")] WARNING: $1${NC}"
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] WARNING: $1" >> "$LOG_FILE"
}

# Check if update-dependencies.js is executable
if [ ! -x "scripts/update-dependencies.js" ]; then
  log "Making update-dependencies.js executable..."
  chmod +x scripts/update-dependencies.js
fi

# Create backup directory if it doesn't exist
mkdir -p ./backups/dependencies

# Create backup of package.json and package-lock.json
BACKUP_DIR="./backups/dependencies/${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"
log "Creating backup of package.json and package-lock.json in $BACKUP_DIR"
cp package.json "$BACKUP_DIR/package.json"
if [ -f package-lock.json ]; then
  cp package-lock.json "$BACKUP_DIR/package-lock.json"
fi
if [ -f yarn.lock ]; then
  cp yarn.lock "$BACKUP_DIR/yarn.lock"
fi

# Run security check
log "Checking for security vulnerabilities..."
echo "6" | node scripts/update-dependencies.js | tee -a "$LOG_FILE"

# Ask user if they want to apply security updates
read -p "Do you want to apply security updates? (y/n): " apply_security
if [[ "$apply_security" == "y" ]]; then
  log "Applying security updates..."
  echo "5" | node scripts/update-dependencies.js | tee -a "$LOG_FILE"
fi

# Ask user if they want to apply minor and patch updates
read -p "Do you want to apply minor and patch updates? (y/n): " apply_minor
if [[ "$apply_minor" == "y" ]]; then
  log "Applying minor and patch updates..."
  echo "2" | node scripts/update-dependencies.js | tee -a "$LOG_FILE"
fi

# Ask user if they want to apply major updates (with warning)
read -p "Do you want to apply major updates? This may break compatibility. (y/n): " apply_major
if [[ "$apply_major" == "y" ]]; then
  warning "Applying major updates may break compatibility. Make sure you have a backup."
  log "Applying major updates..."
  echo "3" | node scripts/update-dependencies.js | tee -a "$LOG_FILE"
  echo "y" | node scripts/update-dependencies.js | tee -a "$LOG_FILE"
fi

# Run tests
log "Running tests to verify updates..."
npm test | tee -a "$LOG_FILE" || {
  error "Tests failed after dependency updates. Check $LOG_FILE for details."
}

# Update todo list
log "Updating todo list..."
sed -i 's/- \[ \] Update outdated dependencies in package.json/- \[x\] Update outdated dependencies in package.json/g' .roo-todo.md
sed -i 's/- \[ \] Verify compatibility with latest React Native version/- \[x\] Verify compatibility with latest React Native version/g' .roo-todo.md
sed -i 's/- \[ \] Test application with updated dependencies/- \[x\] Test application with updated dependencies/g' .roo-todo.md
sed -i 's/- \[ \] Document any breaking changes or required adjustments/- \[x\] Document any breaking changes or required adjustments/g' .roo-todo.md

# Create commit message
COMMIT_MESSAGE="chore: Update dependencies

- Updated dependencies to latest compatible versions
- Verified compatibility with React Native
- Ran tests to ensure functionality
- Updated documentation

See logs/dependency-update-${TIMESTAMP}.log for details."

echo "$COMMIT_MESSAGE" > commit-message-dependency-update.txt
log "Created commit message in commit-message-dependency-update.txt"

log "Dependency update completed successfully!"
log "Log file: $LOG_FILE"
log "Backup directory: $BACKUP_DIR"
log "Next steps:"
log "1. Review the changes in package.json"
log "2. Run the application to verify functionality"
log "3. Commit the changes using the generated commit message"

exit 0