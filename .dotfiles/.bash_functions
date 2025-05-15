#!/bin/bash
# AI Sports Edge .bash_functions
# This file contains useful functions for the AI Sports Edge development environment.

# Configuration
AISPORTSEDGE_ROOT=${AISPORTSEDGE_ROOT:-"/workspaces/ai-sports-edge"}
MEMORY_BANK_DIR="$AISPORTSEDGE_ROOT/memory-bank"
SCRIPTS_DIR="$AISPORTSEDGE_ROOT/scripts"
LOG_DIR="$AISPORTSEDGE_ROOT/logs"
LOG_FILE="$LOG_DIR/roo-context-sync.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure log directory exists
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
fi

# Log a message to the context sync log
log_context_sync() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Print a message with a colored prefix
print_message() {
    local prefix=$1
    local message=$2
    local color=$3
    
    echo -e "${color}[$prefix]${NC} $message"
}

# Check if memory bank exists
check_memory_bank() {
    if [ ! -d "$MEMORY_BANK_DIR" ]; then
        print_message "ERROR" "Memory bank directory not found: $MEMORY_BANK_DIR" "$RED"
        return 1
    fi
    return 0
}

# Update memory bank with current context
update_context() {
    local message="${1:-Automatic context update}"
    
    print_message "INFO" "Updating context: $message" "$BLUE"
    log_context_sync "Updating context: $message"
    
    if ! check_memory_bank; then
        print_message "INFO" "Creating memory bank directory..." "$BLUE"
        log_context_sync "Creating memory bank directory"
        mkdir -p "$MEMORY_BANK_DIR"
    fi
    
    if [ -f "$SCRIPTS_DIR/maintain-context.sh" ]; then
        print_message "INFO" "Running maintain-context.sh update" "$BLUE"
        log_context_sync "Running maintain-context.sh update"
        "$SCRIPTS_DIR/maintain-context.sh" update
        
        if [ $? -eq 0 ]; then
            print_message "SUCCESS" "Context updated successfully" "$GREEN"
            log_context_sync "Context updated successfully"
        else
            print_message "ERROR" "Failed to update context" "$RED"
            log_context_sync "Failed to update context"
            return 1
        fi
    else
        print_message "ERROR" "maintain-context.sh not found" "$RED"
        log_context_sync "ERROR: maintain-context.sh not found"
        return 1
    fi
    
    return 0
}

# Save current context with a message
save_context() {
    local message="${1:-Manual context save}"
    
    print_message "INFO" "Saving context: $message" "$BLUE"
    log_context_sync "Saving context: $message"
    
    if ! check_memory_bank; then
        print_message "ERROR" "Memory bank not found, cannot save context" "$RED"
        log_context_sync "ERROR: Memory bank not found, cannot save context"
        return 1
    fi
    
    if [ -f "$SCRIPTS_DIR/maintain-context.sh" ]; then
        print_message "INFO" "Creating context checkpoint" "$BLUE"
        log_context_sync "Creating context checkpoint"
        "$SCRIPTS_DIR/maintain-context.sh" checkpoint
        
        if [ $? -eq 0 ]; then
            print_message "SUCCESS" "Context saved successfully" "$GREEN"
            log_context_sync "Context saved successfully"
            
            # Add a note to activeContext.md
            local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
            echo -e "\n## Context Save: $timestamp\n\n$message\n" >> "$MEMORY_BANK_DIR/activeContext.md"
            
            print_message "INFO" "Added note to activeContext.md" "$BLUE"
            log_context_sync "Added note to activeContext.md"
        else
            print_message "ERROR" "Failed to save context" "$RED"
            log_context_sync "Failed to save context"
            return 1
        fi
    else
        print_message "ERROR" "maintain-context.sh not found" "$RED"
        log_context_sync "ERROR: maintain-context.sh not found"
        return 1
    fi
    
    return 0
}

# Sync context between memory-bank files and source code tags
sync_context() {
    print_message "INFO" "Syncing context between memory-bank and source code tags" "$BLUE"
    log_context_sync "Syncing context between memory-bank and source code tags"
    
    if ! check_memory_bank; then
        print_message "ERROR" "Memory bank not found, cannot sync context" "$RED"
        log_context_sync "ERROR: Memory bank not found, cannot sync context"
        return 1
    fi
    
    if [ -f "$SCRIPTS_DIR/tag-context.sh" ]; then
        print_message "INFO" "Scanning for ROO-* tags" "$BLUE"
        log_context_sync "Scanning for ROO-* tags"
        "$SCRIPTS_DIR/tag-context.sh" scan
        
        if [ $? -eq 0 ]; then
            print_message "SUCCESS" "Context synced successfully" "$GREEN"
            log_context_sync "Context synced successfully"
        else
            print_message "ERROR" "Failed to sync context" "$RED"
            log_context_sync "Failed to sync context"
            return 1
        fi
    else
        print_message "ERROR" "tag-context.sh not found" "$RED"
        log_context_sync "ERROR: tag-context.sh not found"
        return 1
    fi
    
    return 0
}

# Check for ROO-* markers in recently modified files
check_markers() {
    local directory="${1:-$AISPORTSEDGE_ROOT}"
    local hours="${2:-24}"
    
    print_message "INFO" "Checking for ROO-* markers in files modified in the last $hours hours" "$BLUE"
    log_context_sync "Checking for ROO-* markers in files modified in the last $hours hours"
    
    # Find files modified in the last N hours
    local modified_files=$(find "$directory" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -mmin -$((hours*60)) 2>/dev/null)
    
    if [ -n "$modified_files" ]; then
        print_message "INFO" "Found $(echo "$modified_files" | wc -l | tr -d ' ') recently modified files" "$BLUE"
        log_context_sync "Found $(echo "$modified_files" | wc -l | tr -d ' ') recently modified files"
        
        # Check for ROO-* markers
        local markers=$(grep -l "// ROO-" $modified_files 2>/dev/null)
        
        if [ -n "$markers" ]; then
            print_message "INFO" "Found ROO-* markers in $(echo "$markers" | wc -l | tr -d ' ') files" "$BLUE"
            log_context_sync "Found ROO-* markers in $(echo "$markers" | wc -l | tr -d ' ') files"
            
            # Print the files with markers
            echo "$markers" | while read file; do
                local tags=$(grep "// ROO-" "$file" | sed 's/^[ \t]*//')
                print_message "FILE" "$file" "$CYAN"
                echo "$tags" | while read tag; do
                    echo "  $tag"
                done
            done
            
            # Ask if user wants to sync context
            read -p "Do you want to sync these markers with the memory bank? (y/n) " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sync_context
            else
                print_message "INFO" "Context sync skipped" "$BLUE"
                log_context_sync "Context sync skipped by user"
            fi
        else
            print_message "INFO" "No ROO-* markers found in recently modified files" "$BLUE"
            log_context_sync "No ROO-* markers found in recently modified files"
        fi
    else
        print_message "INFO" "No files modified in the last $hours hours" "$BLUE"
        log_context_sync "No files modified in the last $hours hours"
    fi
}

# Update memory bank files based on found markers
update_from_markers() {
    print_message "INFO" "Updating memory bank from ROO-* markers" "$BLUE"
    log_context_sync "Updating memory bank from ROO-* markers"
    
    if ! check_memory_bank; then
        print_message "ERROR" "Memory bank not found, cannot update from markers" "$RED"
        log_context_sync "ERROR: Memory bank not found, cannot update from markers"
        return 1
    fi
    
    if [ -f "$SCRIPTS_DIR/tag-context.sh" ]; then
        print_message "INFO" "Scanning for ROO-* tags" "$BLUE"
        log_context_sync "Scanning for ROO-* tags"
        "$SCRIPTS_DIR/tag-context.sh" scan
        
        if [ $? -eq 0 ]; then
            print_message "SUCCESS" "Memory bank updated from markers successfully" "$GREEN"
            log_context_sync "Memory bank updated from markers successfully"
        else
            print_message "ERROR" "Failed to update memory bank from markers" "$RED"
            log_context_sync "Failed to update memory bank from markers"
            return 1
        fi
    else
        print_message "ERROR" "tag-context.sh not found" "$RED"
        log_context_sync "ERROR: tag-context.sh not found"
        return 1
    fi
    
    return 0
}

# Run migration and update context
run_migration() {
    local file="$1"
    
    if [ -z "$file" ]; then
        print_message "ERROR" "No file specified for migration" "$RED"
        log_context_sync "ERROR: No file specified for migration"
        return 1
    fi
    
    print_message "INFO" "Running migration for $file" "$BLUE"
    log_context_sync "Running migration for $file"
    
    if [ -f "$SCRIPTS_DIR/migrate-firebase-atomic.sh" ]; then
        print_message "INFO" "Running migrate-firebase-atomic.sh" "$BLUE"
        log_context_sync "Running migrate-firebase-atomic.sh for $file"
        "$SCRIPTS_DIR/migrate-firebase-atomic.sh" "$file"
        
        if [ $? -eq 0 ]; then
            print_message "SUCCESS" "Migration completed successfully" "$GREEN"
            log_context_sync "Migration completed successfully for $file"
            
            # Update context after migration
            update_context "Migration completed for $file"
        else
            print_message "ERROR" "Migration failed" "$RED"
            log_context_sync "Migration failed for $file"
            return 1
        fi
    else
        print_message "ERROR" "migrate-firebase-atomic.sh not found" "$RED"
        log_context_sync "ERROR: migrate-firebase-atomic.sh not found"
        return 1
    fi
    
    return 0
}

# Find files by pattern
find_files() {
    local pattern="$1"
    local directory="${2:-$AISPORTSEDGE_ROOT}"
    
    print_message "INFO" "Finding files matching pattern: $pattern in $directory" "$BLUE"
    
    find "$directory" -type f -name "$pattern" | sort
}

# Search file contents
search_content() {
    local pattern="$1"
    local directory="${2:-$AISPORTSEDGE_ROOT}"
    
    print_message "INFO" "Searching for content matching pattern: $pattern in $directory" "$BLUE"
    
    grep -r "$pattern" "$directory" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.md" | sort
}

# Check project health
check_health() {
    print_message "INFO" "Checking project health" "$BLUE"
    log_context_sync "Checking project health"
    
    # Check memory bank
    if check_memory_bank; then
        print_message "SUCCESS" "Memory bank exists" "$GREEN"
    else
        print_message "ERROR" "Memory bank does not exist" "$RED"
    fi
    
    # Check required scripts
    local required_scripts=("maintain-context.sh" "tag-context.sh" "manage-tasks.sh" "update-memory-bank.js")
    for script in "${required_scripts[@]}"; do
        if [ -f "$SCRIPTS_DIR/$script" ]; then
            print_message "SUCCESS" "Script exists: $script" "$GREEN"
        else
            print_message "ERROR" "Script does not exist: $script" "$RED"
        fi
    done
    
    # Check memory bank files
    local required_files=("activeContext.md" "systemPatterns.md" "progress.md" "decisionLog.md" "productContext.md")
    for file in "${required_files[@]}"; do
        if [ -f "$MEMORY_BANK_DIR/$file" ]; then
            print_message "SUCCESS" "Memory bank file exists: $file" "$GREEN"
        else
            print_message "ERROR" "Memory bank file does not exist: $file" "$RED"
        fi
    done
    
    # Check for ROO-* markers
    local markers_count=$(grep -r "// ROO-" "$AISPORTSEDGE_ROOT" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
    print_message "INFO" "Found $markers_count ROO-* markers in the codebase" "$BLUE"
    
    # Check todo.json
    if [ -f "$MEMORY_BANK_DIR/todo.json" ]; then
        local tasks_count=$(cat "$MEMORY_BANK_DIR/todo.json" | jq '. | length')
        print_message "INFO" "Found $tasks_count tasks in todo.json" "$BLUE"
        
        local pending_tasks=$(cat "$MEMORY_BANK_DIR/todo.json" | jq '[.[] | select(.status == "pending")] | length')
        print_message "INFO" "Pending tasks: $pending_tasks" "$BLUE"
        
        local in_progress_tasks=$(cat "$MEMORY_BANK_DIR/todo.json" | jq '[.[] | select(.status == "in-progress")] | length')
        print_message "INFO" "In-progress tasks: $in_progress_tasks" "$BLUE"
        
        local completed_tasks=$(cat "$MEMORY_BANK_DIR/todo.json" | jq '[.[] | select(.status == "completed")] | length')
        print_message "INFO" "Completed tasks: $completed_tasks" "$BLUE"
    else
        print_message "ERROR" "todo.json does not exist" "$RED"
    fi
    
    # Check log file
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(du -h "$LOG_FILE" | cut -f1)
        print_message "INFO" "Context sync log size: $log_size" "$BLUE"
    else
        print_message "ERROR" "Context sync log does not exist" "$RED"
    fi
}

# Create a new component
create_component() {
    local name="$1"
    local level="${2:-atoms}"
    
    if [ -z "$name" ]; then
        print_message "ERROR" "No component name specified" "$RED"
        return 1
    fi
    
    print_message "INFO" "Creating new component: $name at level: $level" "$BLUE"
    log_context_sync "Creating new component: $name at level: $level"
    
    local component_dir="$AISPORTSEDGE_ROOT/atomic/$level"
    
    # Create directory if it doesn't exist
    if [ ! -d "$component_dir" ]; then
        print_message "INFO" "Creating directory: $component_dir" "$BLUE"
        mkdir -p "$component_dir"
    fi
    
    # Create component file
    local component_file="$component_dir/$name.tsx"
    
    if [ -f "$component_file" ]; then
        print_message "ERROR" "Component already exists: $component_file" "$RED"
        log_context_sync "ERROR: Component already exists: $component_file"
        return 1
    fi
    
    print_message "INFO" "Creating component file: $component_file" "$BLUE"
    
    cat > "$component_file" << EOF
// ROO-CONTEXT: Created new $level component: $name
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ${name}Props {
  // Define props here
}

const $name: React.FC<${name}Props> = (props) => {
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Define styles here
  },
});

export default $name;
EOF
    
    print_message "SUCCESS" "Component created: $component_file" "$GREEN"
    log_context_sync "Component created: $component_file"
    
    # Create index file if it doesn't exist
    local index_file="$component_dir/index.ts"
    
    if [ ! -f "$index_file" ]; then
        print_message "INFO" "Creating index file: $index_file" "$BLUE"
        
        cat > "$index_file" << EOF
// ROO-CONTEXT: Created index file for $level components
export { default as $name } from './$name';
EOF
    else
        print_message "INFO" "Updating index file: $index_file" "$BLUE"
        
        # Check if component is already exported
        if grep -q "export { default as $name }" "$index_file"; then
            print_message "INFO" "Component already exported in index file" "$BLUE"
        else
            # Add export to index file
            echo "export { default as $name } from './$name';" >> "$index_file"
            print_message "SUCCESS" "Added export to index file" "$GREEN"
        fi
    fi
    
    # Update context
    update_context "Created new $level component: $name"
    
    return 0
}

# List available commands
list_commands() {
    print_message "COMMANDS" "Available commands:" "$CYAN"
    echo ""
    echo "Context Management:"
    echo "  roo                     Update context"
    echo "  save [message]          Save context with optional message"
    echo "  migrate <file>          Run migration for a file"
    echo "  sync-context            Sync context between memory-bank and source code tags"
    echo "  check-markers [hours]   Check for ROO-* markers in recently modified files"
    echo "  update-from-markers     Update memory bank from ROO-* markers"
    echo "  check-health            Check project health"
    echo ""
    echo "Task Management:"
    echo "  tasks                   List all tasks"
    echo "  task-add <task> [source] [priority]  Add a new task"
    echo "  task-update <id> <field> <value>     Update a task field"
    echo "  task-complete <id> [message]         Mark a task as completed"
    echo "  task-search <query>                  Search for tasks"
    echo "  task-pending             List pending tasks"
    echo "  task-progress            List in-progress tasks"
    echo "  task-done                List completed tasks"
    echo ""
    echo "Navigation:"
    echo "  cdroot                  Navigate to project root"
    echo "  cdscripts               Navigate to scripts directory"
    echo "  cdtools                 Navigate to tools directory"
    echo "  cdmem                   Navigate to memory-bank directory"
    echo "  cdatomic                Navigate to atomic directory"
    echo "  cdcomponents            Navigate to components directory"
    echo "  cdservices              Navigate to services directory"
    echo "  cdhooks                 Navigate to hooks directory"
    echo "  cddocs                  Navigate to docs directory"
    echo ""
    echo "File Operations:"
    echo "  find_files <pattern> [directory]     Find files by pattern"
    echo "  search_content <pattern> [directory] Search file contents"
    echo "  create_component <name> [level]      Create a new component"
    echo ""
    echo "Git Operations:"
    echo "  gs                      Git status"
    echo "  ga                      Git add"
    echo "  gc <message>            Git commit with message"
    echo "  gp                      Git push"
    echo "  gl                      Git pull"
    echo "  gd                      Git diff"
    echo "  gb                      Git branch"
    echo "  gco <branch>            Git checkout"
    echo "  glog                    Git log with graph"
    echo "  gsync                   Git pull and push"
    echo ""
}

# Alias for list_commands
commands() {
    list_commands
}
