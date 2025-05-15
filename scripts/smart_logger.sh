#!/bin/bash
# smart_logger.sh - Script to log activities and implementations

set -e

LOG_DIR=".roocode/activity_logs"
IMPLEMENTATION_LOG="$LOG_DIR/implementations.md"
ACTIVITY_LOG="$LOG_DIR/activities.md"

# Ensure log directories exist
mkdir -p "$LOG_DIR"

# Initialize logs if they don't exist
if [ ! -f "$IMPLEMENTATION_LOG" ]; then
  cat > "$IMPLEMENTATION_LOG" << END
# Implementation Log

This file logs implementations in the AI Sports Edge project.

| Date | Topic | Description | Status | Files |
|------|-------|-------------|--------|-------|
END
fi

if [ ! -f "$ACTIVITY_LOG" ]; then
  cat > "$ACTIVITY_LOG" << END
# Activity Log

This file logs activities in the AI Sports Edge project.

| Date | Topic | Description | Details | Tags |
|------|-------|-------------|---------|------|
END
fi

# Log an implementation
log_implementation() {
  local topic="$1"
  local description="$2"
  local status="$3"
  local files="$4"
  local date=$(date "+%Y-%m-%d %H:%M")
  
  # Add to implementation log
  echo "| $date | $topic | $description | $status | $files |" >> "$IMPLEMENTATION_LOG"
  
  echo "Implementation logged: $topic - $description"
}

# Log an activity
log_activity() {
  local topic="$1"
  local description="$2"
  local details="$3"
  local tags="$4"
  local date=$(date "+%Y-%m-%d %H:%M")
  
  # Add to activity log
  echo "| $date | $topic | $description | $details | $tags |" >> "$ACTIVITY_LOG"
  
  echo "Activity logged: $topic - $description"
}

# Show help message
show_help() {
  echo "Smart Logger"
  echo "Usage: $0 <command> [arguments]"
  echo ""
  echo "Commands:"
  echo "  log_implementation <topic> <description> <status> <files>  Log an implementation"
  echo "  log_activity <topic> <description> <details> <tags>        Log an activity"
  echo "  help                                                       Show this help message"
}

# Main command handler
case "$1" in
  log_implementation)
    log_implementation "$2" "$3" "$4" "$5"
    ;;
  log_activity)
    log_activity "$2" "$3" "$4" "$5"
    ;;
  help|*)
    show_help
    ;;
esac