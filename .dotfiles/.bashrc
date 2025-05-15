#!/bin/bash
# AI Sports Edge .bashrc
# This file is sourced by bash for login shells.

# Source global definitions
if [ -f /etc/bashrc ]; then
    . /etc/bashrc
fi

# Set up environment variables
export AISPORTSEDGE_ROOT="/workspaces/ai-sports-edge"
export PATH="$PATH:$AISPORTSEDGE_ROOT/scripts"
export EDITOR="vim"

# Set up colors for prompt
RESET="\[\033[0m\]"
RED="\[\033[0;31m\]"
GREEN="\[\033[0;32m\]"
YELLOW="\[\033[0;33m\]"
BLUE="\[\033[0;34m\]"
PURPLE="\[\033[0;35m\]"
CYAN="\[\033[0;36m\]"

# Set up git prompt
parse_git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'
}

# Set up prompt
PS1="$GREEN\u@ai-sports-edge$RESET:$BLUE\w$YELLOW\$(parse_git_branch)$RESET\$ "

# Source aliases and functions
if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

if [ -f ~/.bash_functions ]; then
    . ~/.bash_functions
fi

# Initialize memory bank if it doesn't exist
initialize_memory_bank() {
    local memory_bank_dir="$AISPORTSEDGE_ROOT/memory-bank"
    local log_dir="$AISPORTSEDGE_ROOT/logs"
    local log_file="$log_dir/roo-context-sync.log"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create log directory if it doesn't exist
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir"
        echo "[$timestamp] Created logs directory" >> "$log_file"
    fi
    
    # Log startup
    echo "[$timestamp] Starting context initialization" >> "$log_file"
    
    # Check if memory bank exists
    if [ ! -d "$memory_bank_dir" ]; then
        echo "[$timestamp] Memory bank not found, initializing..." >> "$log_file"
        mkdir -p "$memory_bank_dir"
        
        # Run initialize-memory-bank.sh if it exists
        if [ -f "$AISPORTSEDGE_ROOT/scripts/initialize-memory-bank.sh" ]; then
            echo "[$timestamp] Running initialize-memory-bank.sh" >> "$log_file"
            "$AISPORTSEDGE_ROOT/scripts/initialize-memory-bank.sh"
        else
            echo "[$timestamp] ERROR: initialize-memory-bank.sh not found" >> "$log_file"
        fi
    else
        echo "[$timestamp] Memory bank found, checking for updates..." >> "$log_file"
        
        # Check if memory bank files exist
        if [ ! -f "$memory_bank_dir/activeContext.md" ] || \
           [ ! -f "$memory_bank_dir/systemPatterns.md" ] || \
           [ ! -f "$memory_bank_dir/progress.md" ] || \
           [ ! -f "$memory_bank_dir/decisionLog.md" ] || \
           [ ! -f "$memory_bank_dir/productContext.md" ]; then
            echo "[$timestamp] Some memory bank files missing, running update..." >> "$log_file"
            
            # Run maintain-context.sh if it exists
            if [ -f "$AISPORTSEDGE_ROOT/scripts/maintain-context.sh" ]; then
                echo "[$timestamp] Running maintain-context.sh update" >> "$log_file"
                "$AISPORTSEDGE_ROOT/scripts/maintain-context.sh" update
            else
                echo "[$timestamp] ERROR: maintain-context.sh not found" >> "$log_file"
            fi
        fi
    fi
    
    # Restore context from activeContext.md
    if [ -f "$memory_bank_dir/activeContext.md" ]; then
        echo "[$timestamp] Restoring context from activeContext.md" >> "$log_file"
        echo ""
        echo "=== Current Context ==="
        grep -A 5 "## Context Tags" "$memory_bank_dir/activeContext.md" | tail -n +2 | head -n 5
        echo "===================="
        echo ""
    fi
    
    # Restore tasks from todo.json
    if [ -f "$memory_bank_dir/todo.json" ]; then
        echo "[$timestamp] Restoring tasks from todo.json" >> "$log_file"
        echo ""
        echo "=== Pending Tasks ==="
        if [ -f "$AISPORTSEDGE_ROOT/scripts/manage-tasks.sh" ]; then
            "$AISPORTSEDGE_ROOT/scripts/manage-tasks.sh" list pending | head -n 10
        else
            echo "No task management script found"
        fi
        echo "===================="
        echo ""
    fi
    
    echo "[$timestamp] Context initialization complete" >> "$log_file"
}

# Check for ROO-* markers in recently modified files
check_for_markers() {
    local log_dir="$AISPORTSEDGE_ROOT/logs"
    local log_file="$log_dir/roo-context-sync.log"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "[$timestamp] Checking for ROO-* markers in recently modified files" >> "$log_file"
    
    # Find files modified in the last 24 hours
    local modified_files=$(find "$AISPORTSEDGE_ROOT" -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -mtime -1 2>/dev/null)
    
    if [ -n "$modified_files" ]; then
        echo "[$timestamp] Found $(echo "$modified_files" | wc -l) recently modified files" >> "$log_file"
        
        # Check for ROO-* markers
        local markers=$(grep -l "// ROO-" $modified_files 2>/dev/null)
        
        if [ -n "$markers" ]; then
            echo "[$timestamp] Found ROO-* markers in $(echo "$markers" | wc -l) files" >> "$log_file"
            
            # Run tag-context.sh scan if it exists
            if [ -f "$AISPORTSEDGE_ROOT/scripts/tag-context.sh" ]; then
                echo "[$timestamp] Running tag-context.sh scan" >> "$log_file"
                "$AISPORTSEDGE_ROOT/scripts/tag-context.sh" scan
            else
                echo "[$timestamp] ERROR: tag-context.sh not found" >> "$log_file"
            fi
        else
            echo "[$timestamp] No ROO-* markers found in recently modified files" >> "$log_file"
        fi
    else
        echo "[$timestamp] No recently modified files found" >> "$log_file"
    fi
}

# Run initialization on startup
initialize_memory_bank

# Welcome message
echo ""
echo "Welcome to AI Sports Edge development environment!"
echo "Memory bank is initialized and context is restored."
echo "Use 'roo' to update context, 'save' to save context, and 'migrate' to run migration."
echo "For more commands, type 'commands' or see .dotfiles/README.md"
echo ""

# Auto-load .env file if it exists
if [ -f "$AISPORTSEDGE_ROOT/.env" ]; then
    set -a
    source "$AISPORTSEDGE_ROOT/.env"
    set +a
fi

# Check for ROO-* markers in recently modified files
check_for_markers
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Start cronrc-runner on container startup
if [ -f "/workspaces/ai-sports-edge/scripts/start-cronrc.sh" ]; then
  /workspaces/ai-sports-edge/scripts/start-cronrc.sh > /dev/null 2>&1
fi
