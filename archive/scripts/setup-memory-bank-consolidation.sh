#!/bin/bash
#
# setup-memory-bank-consolidation.sh
#
# This script sets up the memory bank consolidation system by:
# 1. Making the JavaScript file executable
# 2. Setting up triggers to run it automatically when:
#    - A new memory-bank file is added
#    - Context reload reveals duplication
#    - Manual prompt includes the word "consolidate"
#

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
CONTEXT_DIR="$PROJECT_ROOT/context"
STATUS_DIR="$PROJECT_ROOT/status"
LOGS_DIR="$PROJECT_ROOT/logs"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
CRON_FILE="$PROJECT_ROOT/.cronrc"

# Ensure directories exist
mkdir -p "$MEMORY_BANK_DIR"
mkdir -p "$CONTEXT_DIR"
mkdir -p "$STATUS_DIR"
mkdir -p "$LOGS_DIR"

echo -e "${BLUE}Setting up Memory Bank Consolidation System...${NC}"

# 1. Make the JavaScript file executable
chmod +x "$CONSOLIDATION_SCRIPT"
echo -e "${GREEN}Made consolidation script executable${NC}"

# 2. Create a file watcher script to detect new memory-bank files
cat > "$SCRIPT_DIR/watch-memory-bank.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
LAST_FILES_LIST="$MEMORY_BANK_DIR/.last-files-list"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
LOG_FILE="$PROJECT_ROOT/logs/memory-bank-watcher.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
}

# Get current list of files
current_files=$(find "$MEMORY_BANK_DIR" -name "*.md" | sort)

# If last files list doesn't exist, create it
if [ ! -f "$LAST_FILES_LIST" ]; then
  echo "$current_files" > "$LAST_FILES_LIST"
  log "Initialized last files list"
  exit 0
fi

# Get last files list
last_files=$(cat "$LAST_FILES_LIST")

# Compare file counts
last_count=$(echo "$last_files" | wc -l)
current_count=$(echo "$current_files" | wc -l)

# If file count has increased, run consolidation
if [ "$current_count" -gt "$last_count" ]; then
  log "New files detected in memory bank (was: $last_count, now: $current_count)"
  log "Running consolidation script..."
  
  # Run consolidation script
  node "$CONSOLIDATION_SCRIPT" >> "$LOG_FILE" 2>&1
  
  log "Consolidation complete"
fi

# Update last files list
echo "$current_files" > "$LAST_FILES_LIST"
EOF

chmod +x "$SCRIPT_DIR/watch-memory-bank.sh"
echo -e "${GREEN}Created file watcher script${NC}"

# 3. Create a hook for context reload
cat > "$SCRIPT_DIR/context-reload-hook.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
LOG_FILE="$PROJECT_ROOT/logs/context-reload-hook.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
}

log "Context reload detected, running consolidation script..."

# Run consolidation script
node "$CONSOLIDATION_SCRIPT" >> "$LOG_FILE" 2>&1

log "Consolidation complete"
EOF

chmod +x "$SCRIPT_DIR/context-reload-hook.sh"
echo -e "${GREEN}Created context reload hook${NC}"

# 4. Create a command alias for manual consolidation
cat > "$SCRIPT_DIR/consolidate-memory-bank.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"

echo "Running memory bank consolidation..."
node "$CONSOLIDATION_SCRIPT" --verbose
echo "Consolidation complete!"
EOF

chmod +x "$SCRIPT_DIR/consolidate-memory-bank.sh"
echo -e "${GREEN}Created manual consolidation command${NC}"

# 5. Add to .cronrc for automatic execution
if [ ! -f "$CRON_FILE" ]; then
  echo "# AI Sports Edge Cron Jobs" > "$CRON_FILE"
  echo "" >> "$CRON_FILE"
fi

# Check if entry already exists
if ! grep -q "watch-memory-bank.sh" "$CRON_FILE"; then
  echo "# Memory Bank Consolidation - Check for new files every 5 minutes" >> "$CRON_FILE"
  echo "*/5 * * * * $SCRIPT_DIR/watch-memory-bank.sh" >> "$CRON_FILE"
  echo -e "${GREEN}Added cron job for file watching${NC}"
else
  echo -e "${YELLOW}Cron job already exists, skipping${NC}"
fi

# 6. Add hook to update-memory-bank.js
if [ -f "$SCRIPT_DIR/update-memory-bank.js" ]; then
  # Check if hook already exists
  if ! grep -q "context-reload-hook.sh" "$SCRIPT_DIR/update-memory-bank.js"; then
    # Add hook to the end of the main function
    sed -i '/console.log(.Memory bank update complete.);/a \
  // Run consolidation hook\
  try {\
    require("child_process").execSync("bash " + __dirname + "/context-reload-hook.sh");\
  } catch (error) {\
    console.error("Failed to run consolidation hook:", error.message);\
  }' "$SCRIPT_DIR/update-memory-bank.js"
    echo -e "${GREEN}Added hook to update-memory-bank.js${NC}"
  else
    echo -e "${YELLOW}Hook already exists in update-memory-bank.js, skipping${NC}"
  fi
else
  echo -e "${YELLOW}update-memory-bank.js not found, skipping hook${NC}"
fi

# 7. Create a command interceptor for manual prompts
cat > "$SCRIPT_DIR/command-interceptor.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
LOG_FILE="$PROJECT_ROOT/logs/command-interceptor.log"

# Get the command from stdin
read -r command

# Check if the command contains "consolidate"
if [[ "$command" == *"consolidate"* ]]; then
  # Run the consolidation script
  node "$CONSOLIDATION_SCRIPT" --verbose
fi

# Pass the command through
echo "$command"
EOF

chmod +x "$SCRIPT_DIR/command-interceptor.sh"
echo -e "${GREEN}Created command interceptor${NC}"

# 8. Add to background-consolidate.sh if it exists
if [ -f "$SCRIPT_DIR/background-consolidate.sh" ]; then
  # Check if consolidation is already included
  if ! grep -q "memory-bank-consolidation.js" "$SCRIPT_DIR/background-consolidate.sh"; then
    # Find the main function
    line_number=$(grep -n "main()" "$SCRIPT_DIR/background-consolidate.sh" | cut -d: -f1)
    
    if [ -n "$line_number" ]; then
      # Add consolidation to the main function
      sed -i "${line_number}a\\
  # Run memory bank consolidation\\
  if [ -f \"\$SCRIPT_DIR/memory-bank-consolidation.js\" ]; then\\
    echo -e \"\${BLUE}=== Running Memory Bank Consolidation ===${NC}\"\\
    echo \"=== Running Memory Bank Consolidation ===\" >> \"\$LOG_FILE\"\\
    node \"\$SCRIPT_DIR/memory-bank-consolidation.js\" >> \"\$LOG_FILE\" 2>&1\\
  fi" "$SCRIPT_DIR/background-consolidate.sh"
      echo -e "${GREEN}Added consolidation to background-consolidate.sh${NC}"
    else
      echo -e "${YELLOW}Could not find main function in background-consolidate.sh, skipping${NC}"
    fi
  else
    echo -e "${YELLOW}Consolidation already included in background-consolidate.sh, skipping${NC}"
  fi
else
  echo -e "${YELLOW}background-consolidate.sh not found, skipping${NC}"
fi

echo -e "${GREEN}Memory Bank Consolidation System setup complete!${NC}"
echo ""
echo "The system will now automatically consolidate memory bank files when:"
echo "1. New files are added to the memory-bank directory (checked every 5 minutes)"
echo "2. Context is reloaded via update-memory-bank.js"
echo "3. Background consolidation runs"
echo ""
echo "You can also manually trigger consolidation by running:"
echo "  ./scripts/consolidate-memory-bank.sh"
echo ""