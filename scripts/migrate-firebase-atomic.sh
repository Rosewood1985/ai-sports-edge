#!/bin/bash

# Firebase Atomic Architecture Migration Script
# This script helps automate the migration of files to use the consolidated Firebase service

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="status/firebase-atomic-migration.log"
SUMMARY_FILE="status/firebase-atomic-migration-summary.md"

# Create log directory if it doesn't exist
mkdir -p status

# Initialize log file
echo "# Firebase Atomic Architecture Migration Log" > "$LOG_FILE"
echo "Started migration at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Initialize summary file
echo "# Firebase Atomic Architecture Migration Summary" > "$SUMMARY_FILE"
echo "Last updated: $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Progress" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Function to log messages
log_message() {
  echo -e "${2:-$BLUE}$1${NC}"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to update summary
update_summary() {
  # Count total files that need migration
  TOTAL_FILES=$(grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | wc -l)
  
  # Count migrated files (files that import from atomic architecture)
  MIGRATED_FILES=$(grep -r "import.*firebaseService.*from.*atomic" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | wc -l)
  
  # Calculate percentage
  PERCENTAGE=$((MIGRATED_FILES * 100 / TOTAL_FILES))
  
  # Update summary file
  echo "- Total files requiring migration: $TOTAL_FILES" > "$SUMMARY_FILE.tmp"
  echo "- Files migrated: $MIGRATED_FILES" >> "$SUMMARY_FILE.tmp"
  echo "- Progress: $PERCENTAGE%" >> "$SUMMARY_FILE.tmp"
  echo "" >> "$SUMMARY_FILE.tmp"
  
  # Add recently migrated files
  echo "## Recently Migrated Files" >> "$SUMMARY_FILE.tmp"
  echo "" >> "$SUMMARY_FILE.tmp"
  tail -n 10 "$LOG_FILE" | grep "Migrated" | sed 's/.*Migrated /- /' >> "$SUMMARY_FILE.tmp"
  echo "" >> "$SUMMARY_FILE.tmp"
  
  # Add files still needing migration
  echo "## Files Still Needing Migration" >> "$SUMMARY_FILE.tmp"
  echo "" >> "$SUMMARY_FILE.tmp"
  grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | grep -v "atomic" | head -n 20 | sed 's/\(.*\):\(.*\)/- \1/' >> "$SUMMARY_FILE.tmp"
  
  # Replace summary file with new content
  mv "$SUMMARY_FILE.tmp" "$SUMMARY_FILE"
  
  log_message "Updated migration summary: $MIGRATED_FILES/$TOTAL_FILES files ($PERCENTAGE%)"
}

# Function to migrate a file
migrate_file() {
  local file=$1
  local backup_file="${file}.bak"
  
  log_message "Migrating $file..." "$YELLOW"
  
  # Create backup
  cp "$file" "$backup_file"
  
  # Perform the migration
  # 1. Replace Firebase imports with atomic architecture import
  sed -i.tmp '
    # Add firebaseService import if not already present
    /import.*firebaseService/! {
      /import/a\
import { firebaseService } from '\''../src/atomic/organisms/firebaseService'\'';
    }
    
    # Replace direct Firebase imports
    s/import { getAuth.* } from '\''firebase\/auth'\'';/\/\/ Replaced with firebaseService/g
    s/import { getFirestore.* } from '\''firebase\/firestore'\'';/\/\/ Replaced with firebaseService/g
    s/import { getFunctions.* } from '\''firebase\/functions'\'';/\/\/ Replaced with firebaseService/g
    s/import { getStorage.* } from '\''firebase\/storage'\'';/\/\/ Replaced with firebaseService/g
    s/import { getAnalytics.* } from '\''firebase\/analytics'\'';/\/\/ Replaced with firebaseService/g
  ' "$file"
  
  # 2. Replace direct Firebase method calls
  sed -i.tmp '
    s/getAuth()/firebaseService.auth.instance/g
    s/getFirestore()/firebaseService.firestore.instance/g
    s/getFunctions()/firebaseService.functions.instance/g
    s/getStorage()/firebaseService.storage.instance/g
    s/getAnalytics()/firebaseService.analytics.instance/g
    
    # Replace common Firestore methods
    s/collection(/firebaseService.firestore.collection(/g
    s/doc(/firebaseService.firestore.doc(/g
    s/query(/firebaseService.firestore.query(/g
    s/where(/firebaseService.firestore.where(/g
    s/orderBy(/firebaseService.firestore.orderBy(/g
    s/limit(/firebaseService.firestore.limit(/g
  ' "$file"
  
  # Remove temporary files
  rm -f "${file}.tmp"
  
  # Log the migration
  log_message "Migrated $file successfully" "$GREEN"
  
  # Tag the file with migration header
  if [ -f "scripts/tag-headers.sh" ]; then
    log_message "Tagging file with migration header..." "$BLUE"
    bash scripts/tag-headers.sh migrated "$file"
    log_message "File tagged successfully" "$GREEN"
  else
    log_message "Warning: tag-headers.sh not found, skipping file tagging" "$YELLOW"
  fi
  
  # Update summary
  update_summary
}

# Function to find files that need migration
find_files_to_migrate() {
  log_message "Searching for files that need migration..." "$BLUE"
  
  # Find files that import Firebase directly
  grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" . | 
    grep -v "node_modules" | 
    grep -v "archive" | 
    grep -v "atomic" |
    cut -d: -f1 |
    sort -u > /tmp/files_to_migrate.txt
  
  log_message "Found $(wc -l < /tmp/files_to_migrate.txt) files that need migration" "$BLUE"
}

# Main execution
log_message "Starting Firebase Atomic Architecture Migration" "$GREEN"

# Find files to migrate
find_files_to_migrate

# Ask for confirmation
echo -e "${YELLOW}This script will attempt to migrate $(wc -l < /tmp/files_to_migrate.txt) files to use the atomic architecture.${NC}"
echo -e "${YELLOW}Do you want to proceed? (y/n)${NC}"
read -r confirm

if [[ "$confirm" != "y" ]]; then
  log_message "Migration cancelled by user" "$RED"
  exit 0
fi

# Ask if user wants to migrate all files or specific files
echo -e "${YELLOW}Do you want to migrate all files or specific files?${NC}"
echo -e "${YELLOW}1. Migrate all files${NC}"
echo -e "${YELLOW}2. Migrate specific files${NC}"
echo -e "${YELLOW}3. Migrate a single file${NC}"
read -r option

case $option in
  1)
    # Migrate all files
    log_message "Migrating all files..." "$BLUE"
    while IFS= read -r file; do
      migrate_file "$file"
    done < /tmp/files_to_migrate.txt
    ;;
  2)
    # Migrate specific files
    echo -e "${YELLOW}Enter a pattern to match files (e.g., 'hooks/*.ts'):${NC}"
    read -r pattern
    log_message "Migrating files matching pattern: $pattern" "$BLUE"
    grep "$pattern" /tmp/files_to_migrate.txt > /tmp/selected_files.txt
    echo -e "${YELLOW}Found $(wc -l < /tmp/selected_files.txt) files matching pattern${NC}"
    echo -e "${YELLOW}Proceed with migration? (y/n)${NC}"
    read -r confirm_pattern
    if [[ "$confirm_pattern" == "y" ]]; then
      while IFS= read -r file; do
        migrate_file "$file"
      done < /tmp/selected_files.txt
    else
      log_message "Migration cancelled by user" "$RED"
    fi
    ;;
  3)
    # Migrate a single file
    echo -e "${YELLOW}Enter the path to the file you want to migrate:${NC}"
    read -r single_file
    if [[ -f "$single_file" ]]; then
      migrate_file "$single_file"
    else
      log_message "File not found: $single_file" "$RED"
    fi
    ;;
  *)
    log_message "Invalid option. Migration cancelled." "$RED"
    ;;
esac

# Clean up
rm -f /tmp/files_to_migrate.txt /tmp/selected_files.txt

# Final summary
update_summary
log_message "Migration completed. See $LOG_FILE for details and $SUMMARY_FILE for summary." "$GREEN"

# Make the script executable
chmod +x "$0"