#!/bin/bash
#
# consolidate-scripts.sh
#
# This script finds scattered .sh scripts outside of the scripts directory
# and moves them to the scripts directory, creating symbolic links in their
# original locations to maintain backward compatibility.
#
# Usage: ./scripts/consolidate-scripts.sh [--dry-run] [--no-links] [--comprehensive]

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DRY_RUN=false
NO_LINKS=false
COMPREHENSIVE=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --no-links)
      NO_LINKS=true
      ;;
    --comprehensive)
      COMPREHENSIVE=true
      ;;
    --help)
      echo "Usage: $0 [--dry-run] [--no-links] [--comprehensive]"
      echo ""
      echo "Options:"
      echo "  --dry-run        Show what would be done without actually doing it"
      echo "  --no-links       Don't create symbolic links in original locations"
      echo "  --comprehensive  Perform comprehensive consolidation including reference updates"
      echo "  --help           Show this help message"
      exit 0
      ;;
  esac
done

# Log file
LOG_FILE="status/script-consolidation-$(date +%Y%m%d%H%M%S).log"
mkdir -p status

# Initialize log file
echo "# Script Consolidation Log" > "$LOG_FILE"
echo "Started at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log messages
log_message() {
  local message="$1"
  local color="${2:-$BLUE}"
  
  echo -e "${color}${message}${NC}"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$LOG_FILE"
}

# Find scattered .sh scripts
log_message "Finding scattered .sh scripts..." "$BLUE"

# Exclude node_modules, scripts, tools, and __archived directories
SCATTERED_SCRIPTS=$(find /workspaces/ai-sports-edge -type f -name "*.sh" | 
  grep -v "/node_modules/" | 
  grep -v "/scripts/" | 
  grep -v "/tools/" | 
  grep -v "/__archived/" |
  grep -v "/functions/node_modules/")

# Count scripts
SCRIPT_COUNT=$(echo "$SCATTERED_SCRIPTS" | wc -l)

log_message "Found $SCRIPT_COUNT scattered scripts" "$BLUE"
echo "$SCATTERED_SCRIPTS" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Process each script
if [ "$SCRIPT_COUNT" -gt 0 ]; then
  log_message "Processing scripts..." "$BLUE"
  
  # Create scripts directory if it doesn't exist
  mkdir -p scripts
  
  # Process each script
  echo "$SCATTERED_SCRIPTS" | while read -r script; do
    # Skip if script doesn't exist
    if [ ! -f "$script" ]; then
      continue
    fi
    
    # Get script name and directory
    SCRIPT_NAME=$(basename "$script")
    SCRIPT_DIR=$(dirname "$script")
    
    # Check if a script with the same name already exists in scripts directory
    if [ -f "scripts/$SCRIPT_NAME" ]; then
      # Generate a unique name
      SCRIPT_BASE=$(basename "$SCRIPT_NAME" .sh)
      SCRIPT_DIR_SAFE=$(echo "$SCRIPT_DIR" | tr '/' '-' | sed 's/^-//' | sed 's/-$//')
      NEW_SCRIPT_NAME="${SCRIPT_BASE}-${SCRIPT_DIR_SAFE}.sh"
      
      log_message "Script with name $SCRIPT_NAME already exists in scripts directory. Renaming to $NEW_SCRIPT_NAME" "$YELLOW"
    else
      NEW_SCRIPT_NAME="$SCRIPT_NAME"
    fi
    
    # Copy script to scripts directory
    if [ "$DRY_RUN" = false ]; then
      cp "$script" "scripts/$NEW_SCRIPT_NAME"
      chmod +x "scripts/$NEW_SCRIPT_NAME"
      
      # Create symbolic link if requested
      if [ "$NO_LINKS" = false ]; then
        # Create backup of original script
        cp "$script" "${script}.bak"
        
        # Remove original script
        rm "$script"
        
        # Create symbolic link
        ln -s "$(realpath "scripts/$NEW_SCRIPT_NAME")" "$script"
        
        log_message "Created symbolic link from $script to scripts/$NEW_SCRIPT_NAME" "$GREEN"
      else
        # Just remove the original script
        rm "$script"
        
        log_message "Moved $script to scripts/$NEW_SCRIPT_NAME" "$GREEN"
      fi
    else
      log_message "Would move $script to scripts/$NEW_SCRIPT_NAME" "$YELLOW"
      
      if [ "$NO_LINKS" = false ]; then
        log_message "Would create symbolic link from $script to scripts/$NEW_SCRIPT_NAME" "$YELLOW"
      fi
    fi
    
    # Log the operation
    echo "- $script -> scripts/$NEW_SCRIPT_NAME" >> "$LOG_FILE"
  done
  
  log_message "Script consolidation completed" "$GREEN"
else
  log_message "No scattered scripts found" "$GREEN"
fi

# Update references in files if comprehensive mode is enabled
if [ "$COMPREHENSIVE" = true ] && [ "$DRY_RUN" = false ]; then
  log_message "Performing comprehensive reference updates..." "$BLUE"
  
  # Create a mapping file of old paths to new paths
  MAPPING_FILE="status/script-mapping-$(date +%Y%m%d%H%M%S).json"
  echo "{" > "$MAPPING_FILE"
  
  # Add each script to the mapping file
  FIRST=true
  echo "$SCATTERED_SCRIPTS" | while read -r script; do
    if [ ! -f "$script" ]; then
      continue
    fi
    
    SCRIPT_NAME=$(basename "$script")
    SCRIPT_DIR=$(dirname "$script")
    
    # Check if a script with the same name already exists in scripts directory
    if [ -f "scripts/$SCRIPT_NAME" ]; then
      # Generate a unique name
      SCRIPT_BASE=$(basename "$SCRIPT_NAME" .sh)
      SCRIPT_DIR_SAFE=$(echo "$SCRIPT_DIR" | tr '/' '-' | sed 's/^-//' | sed 's/-$//')
      NEW_SCRIPT_NAME="${SCRIPT_BASE}-${SCRIPT_DIR_SAFE}.sh"
    else
      NEW_SCRIPT_NAME="$SCRIPT_NAME"
    fi
    
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      echo "," >> "$MAPPING_FILE"
    fi
    
    # Add to mapping file
    echo "  \"$script\": \"scripts/$NEW_SCRIPT_NAME\"" >> "$MAPPING_FILE"
  done
  
  echo "}" >> "$MAPPING_FILE"
  
  log_message "Created script mapping file: $MAPPING_FILE" "$GREEN"
  
  # Find all files that might reference the scripts
  log_message "Searching for files that reference the scripts..." "$BLUE"
  
  # Find all potential files that might reference scripts
  POTENTIAL_FILES=$(find /workspaces/ai-sports-edge -type f \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/build/*" \
    -not -path "*/dist/*" \
    \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" \) \
    | grep -v "$MAPPING_FILE")
  
  # Update references in files
  log_message "Updating references in files..." "$BLUE"
  
  # Load mapping file
  MAPPING=$(cat "$MAPPING_FILE")
  
  # Process each file
  echo "$POTENTIAL_FILES" | while read -r file; do
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
      continue
    fi
    
    # Check if file contains any of the old paths
    CONTAINS_REFS=false
    
    echo "$SCATTERED_SCRIPTS" | while read -r script; do
      if grep -q "$script" "$file"; then
        CONTAINS_REFS=true
        break
      fi
    done
    
    if [ "$CONTAINS_REFS" = true ]; then
      log_message "Updating references in $file" "$BLUE"
      
      # Create a backup of the file
      cp "$file" "${file}.bak"
      
      # Update references
      echo "$SCATTERED_SCRIPTS" | while read -r script; do
        if [ ! -f "$script" ]; then
          continue
        fi
        
        SCRIPT_NAME=$(basename "$script")
        
        # Check if a script with the same name already exists in scripts directory
        if [ -f "scripts/$SCRIPT_NAME" ]; then
          # Generate a unique name
          SCRIPT_BASE=$(basename "$SCRIPT_NAME" .sh)
          SCRIPT_DIR=$(dirname "$script")
          SCRIPT_DIR_SAFE=$(echo "$SCRIPT_DIR" | tr '/' '-' | sed 's/^-//' | sed 's/-$//')
          NEW_SCRIPT_NAME="${SCRIPT_BASE}-${SCRIPT_DIR_SAFE}.sh"
        else
          NEW_SCRIPT_NAME="$SCRIPT_NAME"
        fi
        
        # Replace references
        sed -i "s|$script|scripts/$NEW_SCRIPT_NAME|g" "$file"
      done
      
      log_message "Updated references in $file" "$GREEN"
    fi
  done
  
  log_message "Comprehensive reference updates completed" "$GREEN"
fi

# Final summary
if [ "$DRY_RUN" = true ]; then
  log_message "This was a dry run. No changes were made." "$YELLOW"
fi

if [ "$COMPREHENSIVE" = true ]; then
  log_message "Comprehensive consolidation completed. See $LOG_FILE for details" "$BLUE"
else
  log_message "Basic consolidation completed. See $LOG_FILE for details" "$BLUE"
fi