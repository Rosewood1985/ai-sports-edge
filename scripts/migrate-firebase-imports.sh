#!/bin/bash

# Firebase Import Migration Script
# This script helps migrate imports from the old Firebase structure to the new atomic architecture

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Firebase import migration...${NC}"

# Create backup directory if it doesn't exist
if [ ! -d "backups/$(date +%Y%m%d)" ]; then
  mkdir -p "backups/$(date +%Y%m%d)"
  echo -e "${GREEN}Created backup directory: backups/$(date +%Y%m%d)${NC}"
fi

# Function to backup a file before modifying it
backup_file() {
  local file=$1
  local backup_dir="backups/$(date +%Y%m%d)"
  local backup_file="${backup_dir}/$(basename ${file}).bak"
  
  cp "${file}" "${backup_file}"
  echo -e "${GREEN}Backed up ${file} to ${backup_file}${NC}"
}

# Find all TypeScript and JavaScript files that import from Firebase config
echo -e "${YELLOW}Searching for files with Firebase imports...${NC}"
files=$(grep -l "from '../config/firebase'" $(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx") 2>/dev/null)

if [ -z "$files" ]; then
  echo -e "${YELLOW}No files found with Firebase imports.${NC}"
  exit 0
fi

echo -e "${GREEN}Found $(echo "$files" | wc -l | tr -d ' ') files with Firebase imports.${NC}"

# Process each file
for file in $files; do
  echo -e "${YELLOW}Processing ${file}...${NC}"
  
  # Skip files in the atomic directory
  if [[ $file == src/atomic/* ]]; then
    echo -e "${YELLOW}Skipping atomic file: ${file}${NC}"
    continue
  fi
  
  # Backup the file
  backup_file "$file"
  
  # Replace imports
  sed -i '' 's|import { auth, firestore } from '\''../config/firebase'\''|import { firebaseService } from '\''../atomic'\''|g' "$file"
  sed -i '' 's|import { auth, firestore, storage } from '\''../config/firebase'\''|import { firebaseService } from '\''../atomic'\''|g' "$file"
  sed -i '' 's|import { auth, firestore, storage, functions } from '\''../config/firebase'\''|import { firebaseService } from '\''../atomic'\''|g' "$file"
  sed -i '' 's|import { auth, firestore, storage, functions, analytics } from '\''../config/firebase'\''|import { firebaseService } from '\''../atomic'\''|g' "$file"
  
  # Replace direct references
  sed -i '' 's/auth\./firebaseService.auth.instance./g' "$file"
  sed -i '' 's/firestore\./firebaseService.firestore.instance./g' "$file"
  sed -i '' 's/storage\./firebaseService.storage.instance./g' "$file"
  sed -i '' 's/functions\./firebaseService.functions.instance./g' "$file"
  sed -i '' 's/analytics\./firebaseService.analytics.instance./g' "$file"
  
  echo -e "${GREEN}Updated ${file}${NC}"
done

echo -e "${GREEN}Firebase import migration completed!${NC}"
echo -e "${YELLOW}Note: You may need to manually adjust some imports and references.${NC}"
echo -e "${YELLOW}Check the files carefully and run tests to ensure everything works correctly.${NC}"