#!/bin/bash
#
# update-firebase-migration-status.sh
#
# This script updates the memory bank with information about the Firebase atomic migration progress.
# It scans the codebase to identify migrated and pending files, and updates the memory bank accordingly.
#
# Usage: ./scripts/update-firebase-migration-status.sh

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Memory bank files
ACTIVE_CONTEXT="memory-bank/activeContext.md"
PROGRESS_FILE="memory-bank/progress.md"
MIGRATION_STATUS_FILE="memory-bank/firebase-migration-status.json"

# Create memory bank directory if it doesn't exist
mkdir -p memory-bank

# Function to scan for migrated files
scan_migrated_files() {
  echo -e "${BLUE}Scanning for migrated files...${NC}"
  
  # Find files that import firebaseService
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "import.*firebaseService" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    cut -d: -f1 |
    sort -u > /tmp/migrated_files.txt
  
  # Find files that have the migration header
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "// ✅ MIGRATED: Firebase Atomic Architecture" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    cut -d: -f1 |
    sort -u >> /tmp/migrated_files.txt
  
  # Deduplicate the list
  sort -u /tmp/migrated_files.txt > /tmp/migrated_files_unique.txt
  
  echo -e "${GREEN}Found $(wc -l < /tmp/migrated_files_unique.txt) migrated files${NC}"
}

# Function to scan for pending files
scan_pending_files() {
  echo -e "${BLUE}Scanning for pending files...${NC}"
  
  # Find files that import Firebase directly
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    "import.*firebase" . | 
    grep -v "node_modules" | 
    grep -v "__archived" |
    grep -v "atomic" |
    cut -d: -f1 |
    sort -u > /tmp/pending_files.txt
  
  # Remove files that are already migrated
  grep -v -f /tmp/migrated_files_unique.txt /tmp/pending_files.txt > /tmp/pending_files_filtered.txt
  
  echo -e "${YELLOW}Found $(wc -l < /tmp/pending_files_filtered.txt) pending files${NC}"
}

# Function to update the migration status JSON file
update_migration_status_json() {
  echo -e "${BLUE}Updating migration status JSON...${NC}"
  
  # Create initial JSON structure if it doesn't exist
  if [ ! -f "$MIGRATION_STATUS_FILE" ]; then
    echo '{
  "lastUpdated": "",
  "migratedFiles": [],
  "pendingFiles": []
}' > "$MIGRATION_STATUS_FILE"
  fi
  
  # Create a temporary file for the new JSON
  echo '{
  "lastUpdated": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "migratedFiles": [' > /tmp/migration_status.json
  
  # Add migrated files
  first=true
  while IFS= read -r file; do
    if [ "$first" = true ]; then
      first=false
    else
      echo ',' >> /tmp/migration_status.json
    fi
    echo '    "'"$file"'"' >> /tmp/migration_status.json
  done < /tmp/migrated_files_unique.txt
  
  echo '  ],
  "pendingFiles": [' >> /tmp/migration_status.json
  
  # Add pending files
  first=true
  while IFS= read -r file; do
    if [ "$first" = true ]; then
      first=false
    else
      echo ',' >> /tmp/migration_status.json
    fi
    echo '    "'"$file"'"' >> /tmp/migration_status.json
  done < /tmp/pending_files_filtered.txt
  
  echo '  ]
}' >> /tmp/migration_status.json
  
  # Replace the migration status file with the new one
  mv /tmp/migration_status.json "$MIGRATION_STATUS_FILE"
  
  echo -e "${GREEN}Migration status JSON updated${NC}"
}

# Function to update the active context file
update_active_context() {
  echo -e "${BLUE}Updating active context...${NC}"
  
  # Create active context file if it doesn't exist
  if [ ! -f "$ACTIVE_CONTEXT" ]; then
    echo "# Active Context for Firebase Atomic Migration" > "$ACTIVE_CONTEXT"
    echo "" >> "$ACTIVE_CONTEXT"
  fi
  
  # Get the first pending file as the current focus
  CURRENT_FOCUS=$(head -n 1 /tmp/pending_files_filtered.txt)
  
  # Update the active context file
  cat > "$ACTIVE_CONTEXT" << EOF
# Active Context for Firebase Atomic Migration

## Current Focus
- Migrating ${CURRENT_FOCUS:-"(no pending files)"} to Firebase atomic architecture

## Migration Status
EOF
  
  # Add migrated files
  while IFS= read -r file; do
    echo "- ✅ $file (completed)" >> "$ACTIVE_CONTEXT"
  done < /tmp/migrated_files_unique.txt
  
  # Add pending files (limit to 10)
  count=0
  while IFS= read -r file; do
    echo "- 📋 $file (pending)" >> "$ACTIVE_CONTEXT"
    count=$((count + 1))
    if [ $count -ge 10 ]; then
      break
    fi
  done < /tmp/pending_files_filtered.txt
  
  # Add more indicator if there are more pending files
  if [ $(wc -l < /tmp/pending_files_filtered.txt) -gt 10 ]; then
    echo "- ... and $(( $(wc -l < /tmp/pending_files_filtered.txt) - 10 )) more pending files" >> "$ACTIVE_CONTEXT"
  fi
  
  # Add last updated timestamp
  echo "" >> "$ACTIVE_CONTEXT"
  echo "## Last Updated" >> "$ACTIVE_CONTEXT"
  echo "- Date: $(date +"%Y-%m-%d")" >> "$ACTIVE_CONTEXT"
  echo "- Time: $(date +"%H:%M:%S") UTC" >> "$ACTIVE_CONTEXT"
  
  echo -e "${GREEN}Active context updated${NC}"
}

# Function to update the progress file
update_progress_file() {
  echo -e "${BLUE}Updating progress file...${NC}"
  
  # Create progress file if it doesn't exist
  if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Firebase Atomic Architecture Migration Progress" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Overview" >> "$PROGRESS_FILE"
    echo "This document tracks the progress of migrating service files to the Firebase atomic architecture." >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
  fi
  
  # Calculate progress percentage
  TOTAL_FILES=$(( $(wc -l < /tmp/migrated_files_unique.txt) + $(wc -l < /tmp/pending_files_filtered.txt) ))
  MIGRATED_FILES=$(wc -l < /tmp/migrated_files_unique.txt)
  
  if [ $TOTAL_FILES -gt 0 ]; then
    PERCENTAGE=$(( MIGRATED_FILES * 100 / TOTAL_FILES ))
  else
    PERCENTAGE=100
  fi
  
  # Update the progress file
  cat > "$PROGRESS_FILE" << EOF
# Firebase Atomic Architecture Migration Progress

## Overview
This document tracks the progress of migrating service files to the Firebase atomic architecture.

## Progress Summary
- Total Files: $TOTAL_FILES
- Migrated Files: $MIGRATED_FILES
- Pending Files: $(wc -l < /tmp/pending_files_filtered.txt)
- Completion: $PERCENTAGE%

## Completed Migrations
| Service File | Status | Date Completed | Notes |
|-------------|--------|----------------|-------|
EOF
  
  # Add migrated files
  while IFS= read -r file; do
    # Check if the file has a migration header
    if grep -q "// ✅ MIGRATED: Firebase Atomic Architecture" "$file" 2>/dev/null; then
      echo "| $file | ✅ Completed | $(date +"%Y-%m-%d") | All functions migrated to use firebaseService |" >> "$PROGRESS_FILE"
    else
      echo "| $file | ✅ Completed | Prior | Previously migrated |" >> "$PROGRESS_FILE"
    fi
  done < /tmp/migrated_files_unique.txt
  
  # Add pending files section
  cat >> "$PROGRESS_FILE" << EOF

## Pending Migrations
| Service File | Status | Priority | Notes |
|-------------|--------|----------|-------|
EOF
  
  # Add pending files
  while IFS= read -r file; do
    # Determine priority based on file path
    if [[ "$file" == *"service"* ]]; then
      PRIORITY="High"
    elif [[ "$file" == *"firebase"* ]]; then
      PRIORITY="High"
    else
      PRIORITY="Medium"
    fi
    
    echo "| $file | 📋 Pending | $PRIORITY | Contains Firebase references |" >> "$PROGRESS_FILE"
  done < /tmp/pending_files_filtered.txt
  
  # Add migration patterns section
  cat >> "$PROGRESS_FILE" << EOF

## Migration Patterns Applied
- Replaced direct Firebase imports with atomic architecture imports
- Updated Firestore operations to use firebaseService.firestore methods
- Updated Firebase Functions calls to use firebaseService.functions.callFunction
- Added proper type assertions for backward compatibility
- Maintained consistent error handling patterns

## Next Steps
1. Identify remaining files that need migration
2. Prioritize based on dependencies and complexity
3. Create automated tests to verify functionality after migration
4. Update documentation to reflect new patterns
EOF
  
  echo -e "${GREEN}Progress file updated${NC}"
}

# Main execution
echo -e "${BLUE}Starting Firebase migration status update...${NC}"

# Scan for migrated and pending files
scan_migrated_files
scan_pending_files

# Update memory bank files
update_migration_status_json
update_active_context
update_progress_file

# Clean up temporary files
rm -f /tmp/migrated_files.txt /tmp/migrated_files_unique.txt /tmp/pending_files.txt /tmp/pending_files_filtered.txt

echo -e "${GREEN}Firebase migration status update completed${NC}"