#!/bin/bash
# AI Sports Edge .bash_aliases
# This file contains useful aliases for the AI Sports Edge development environment.

# Configuration
AISPORTSEDGE_ROOT=${AISPORTSEDGE_ROOT:-"/workspaces/ai-sports-edge"}
SCRIPTS_DIR="$AISPORTSEDGE_ROOT/scripts"

# Context Management Aliases
alias roo="$SCRIPTS_DIR/maintain-context.sh update"
alias save="source ~/.bash_functions && save_context"
alias migrate="source ~/.bash_functions && run_migration"
alias sync-context="source ~/.bash_functions && sync_context"
alias check-markers="source ~/.bash_functions && check_markers"
alias update-from-markers="source ~/.bash_functions && update_from_markers"
alias check-health="source ~/.bash_functions && check_health"
alias view-context="cat $AISPORTSEDGE_ROOT/memory-bank/activeContext.md | less"
alias add-context="$SCRIPTS_DIR/tag-context.sh add-context"
alias add-task="$SCRIPTS_DIR/tag-context.sh add-task"
alias mark-migrated="$SCRIPTS_DIR/tag-context.sh mark-migrated"
alias mark-cleaned="$SCRIPTS_DIR/tag-context.sh mark-cleaned"
alias scan-tags="$SCRIPTS_DIR/tag-context.sh scan"

# Task Management Aliases
alias tasks="$SCRIPTS_DIR/manage-tasks.sh list"
alias task-add="$SCRIPTS_DIR/manage-tasks.sh add"
alias task-update="$SCRIPTS_DIR/manage-tasks.sh update"
alias task-complete="$SCRIPTS_DIR/manage-tasks.sh complete"
alias task-search="$SCRIPTS_DIR/manage-tasks.sh search"
alias task-pending="$SCRIPTS_DIR/manage-tasks.sh list pending"
alias task-progress="$SCRIPTS_DIR/manage-tasks.sh list in-progress"
alias task-done="$SCRIPTS_DIR/manage-tasks.sh list completed"

# Navigation Aliases
alias cdroot="cd $AISPORTSEDGE_ROOT"
alias cdscripts="cd $AISPORTSEDGE_ROOT/scripts"
alias cdtools="cd $AISPORTSEDGE_ROOT/tools"
alias cdmem="cd $AISPORTSEDGE_ROOT/memory-bank"
alias cdatomic="cd $AISPORTSEDGE_ROOT/atomic"
alias cdcomponents="cd $AISPORTSEDGE_ROOT/components"
alias cdservices="cd $AISPORTSEDGE_ROOT/services"
alias cdhooks="cd $AISPORTSEDGE_ROOT/hooks"
alias cddocs="cd $AISPORTSEDGE_ROOT/docs"
alias cdlogs="cd $AISPORTSEDGE_ROOT/logs"

# Git Aliases
alias gs="git status"
alias ga="git add"
alias gc="git commit -m"
alias gp="git push"
alias gl="git pull"
alias gd="git diff"
alias gb="git branch"
alias gco="git checkout"
alias glog="git log --oneline --graph --decorate"
alias gsync="git pull && git push"

# Project-specific Aliases
alias update-context="$SCRIPTS_DIR/maintain-context.sh update"
alias checkpoint="$SCRIPTS_DIR/maintain-context.sh checkpoint"
alias find-candidates="$SCRIPTS_DIR/consolidate-files.sh find-candidates"
alias deploy-firebase="$SCRIPTS_DIR/deploy-firebase.sh"
alias deploy-godaddy="$SCRIPTS_DIR/deploy-to-godaddy-sftp.sh"
alias test-app="cd $AISPORTSEDGE_ROOT && npm test"
alias start-app="cd $AISPORTSEDGE_ROOT && npm start"
alias build-app="cd $AISPORTSEDGE_ROOT && npm run build"

# Logging Aliases
alias view-logs="cat $AISPORTSEDGE_ROOT/logs/roo-context-sync.log | less"
alias tail-logs="tail -f $AISPORTSEDGE_ROOT/logs/roo-context-sync.log"
alias clear-logs="echo '' > $AISPORTSEDGE_ROOT/logs/roo-context-sync.log"

# Utility Aliases
alias commands="source ~/.bash_functions && list_commands"
alias list-commands="source ~/.bash_functions && list_commands"
alias create-component="source ~/.bash_functions && create_component"
alias find-files="source ~/.bash_functions && find_files"
alias search-content="source ~/.bash_functions && search_content"

# Shorthand Aliases
alias ff="source ~/.bash_functions && find_files"
alias sc="source ~/.bash_functions && search_content"
alias cc="source ~/.bash_functions && create_component"
alias cm="check-markers"
alias vc="view-context"
alias vl="view-logs"
alias tl="tail-logs"