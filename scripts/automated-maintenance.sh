#!/bin/bash
# AI Sports Edge - Automated Maintenance Script
# This script automates various maintenance tasks that would otherwise be performed manually
# It updates the task log to maintain continuity between sessions

# Base directory
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
LOG_DIR="${BASE_DIR}/logs"
STATUS_DIR="${BASE_DIR}/status"
TASK_LOG="${BASE_DIR}/.roo-todo.md"
PROGRESS_LOG="${STATUS_DIR}/maintenance-progress.md"
TODAY=$(date +"%Y-%m-%d")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Create directories if they don't exist
mkdir -p "${LOG_DIR}" "${STATUS_DIR}"

# Log function
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "${LOG_DIR}/automated-maintenance.log"
    echo "$1"
}

# Update task log function
update_task_log() {
    local task="$1"
    local status="$2" # "completed" or "in-progress"
    
    if [ "$status" == "completed" ]; then
        # Check if task already exists in completed section
        if ! grep -q "- \[x\] $task" "$TASK_LOG"; then
            # Add to completed section
            sed -i '' "/^## ✅ Completed/a\\
- [x] $task" "$TASK_LOG"
            log_message "Added completed task to task log: $task"
        fi
    else
        # Find appropriate section for in-progress task
        local section
        if [[ "$task" == *"Refactor"* ]]; then
            section="🔧 Refactor Tasks"
        elif [[ "$task" == *"Clean"* ]]; then
            section="🧼 Cleanup Tasks"
        elif [[ "$task" == *"Optim"* ]]; then
            section="🧠 Optimization Suggestions"
        elif [[ "$task" == *"Test"* || "$task" == *"Valid"* ]]; then
            section="🧪 Testing and Validation"
        elif [[ "$task" == *"Doc"* ]]; then
            section="📄 Documentation"
        elif [[ "$task" == *"Deploy"* ]]; then
            section="🚀 Deployment"
        else
            section="🔧 Refactor Tasks" # Default section
        fi
        
        # Check if task already exists
        if ! grep -q "- \[ \] $task" "$TASK_LOG"; then
            # Add to appropriate section
            sed -i '' "/^## $section/a\\
- [ ] $task" "$TASK_LOG"
            log_message "Added in-progress task to task log: $task"
        fi
    fi
}

# Update progress log
update_progress_log() {
    local category="$1"
    local message="$2"
    
    # Create progress log if it doesn't exist
    if [ ! -f "$PROGRESS_LOG" ]; then
        echo "# AI Sports Edge - Maintenance Progress Log" > "$PROGRESS_LOG"
        echo "" >> "$PROGRESS_LOG"
    fi
    
    # Check if today's entry exists
    if ! grep -q "^## $TODAY" "$PROGRESS_LOG"; then
        echo -e "\n## $TODAY\n" >> "$PROGRESS_LOG"
    fi
    
    # Check if category exists for today
    if ! grep -q "^### $category" "$PROGRESS_LOG"; then
        echo -e "### $category\n" >> "$PROGRESS_LOG"
    fi
    
    # Add message
    echo "- $TIMESTAMP: $message" >> "$PROGRESS_LOG"
    log_message "Updated progress log: [$category] $message"
}

# Run file structure monitoring
run_file_monitoring() {
    log_message "Running file structure monitoring..."
    
    if [ -f "${BASE_DIR}/scripts/monitor-file-structure.sh" ]; then
        "${BASE_DIR}/scripts/monitor-file-structure.sh"
        update_task_log "Monitored file structure for changes" "completed"
        update_progress_log "File Structure" "Monitored file structure for changes"
    else
        log_message "Error: File structure monitoring script not found"
    fi
}

# Run file structure protection
run_file_protection() {
    log_message "Running file structure protection..."
    
    if [ -f "${BASE_DIR}/scripts/protect-file-structure.sh" ]; then
        "${BASE_DIR}/scripts/protect-file-structure.sh"
        update_task_log "Protected file structure from unauthorized changes" "completed"
        update_progress_log "File Structure" "Protected file structure from unauthorized changes"
    else
        log_message "Error: File structure protection script not found"
    fi
}

# Generate GPT usage statistics
generate_gpt_stats() {
    log_message "Generating GPT usage statistics..."
    
    if [ -f "${BASE_DIR}/scripts/track-gpt-usage.sh" ]; then
        "${BASE_DIR}/scripts/track-gpt-usage.sh" --stats
        update_task_log "Generated GPT usage statistics" "completed"
        update_progress_log "GPT Instructions" "Generated usage statistics"
    else
        log_message "Error: GPT usage tracking script not found"
    fi
}

# Consolidate GPT instructions
consolidate_gpt_instructions() {
    log_message "Consolidating GPT instructions..."
    
    if [ -f "${BASE_DIR}/scripts/consolidate-gpt-instructions.sh" ]; then
        "${BASE_DIR}/scripts/consolidate-gpt-instructions.sh"
        update_task_log "Consolidated GPT instruction files" "completed"
        update_progress_log "GPT Instructions" "Consolidated instruction files"
    else
        log_message "Error: GPT instructions consolidation script not found"
    fi
}

# Test email system
test_email_system() {
    log_message "Testing email notification system..."
    
    if [ -f "${BASE_DIR}/notification-system/test-daily-email.command" ]; then
        "${BASE_DIR}/notification-system/test-daily-email.command"
        update_task_log "Tested email notification system" "completed"
        update_progress_log "Email System" "Tested daily email notification system"
    else
        log_message "Error: Email test script not found"
    fi
}

# Generate executive brief
generate_executive_brief() {
    log_message "Generating executive brief..."
    
    if [ -f "${BASE_DIR}/scripts/generate-executive-brief.sh" ]; then
        "${BASE_DIR}/scripts/generate-executive-brief.sh"
        update_task_log "Generated executive brief" "completed"
        update_progress_log "Executive Brief" "Generated executive brief"
    else
        log_message "Error: Executive brief generation script not found"
    fi
}

# Review GPT instructions
review_gpt_instructions() {
    log_message "Reviewing GPT instructions..."
    
    if [ -f "${BASE_DIR}/scripts/review-gpt-instructions.sh" ]; then
        "${BASE_DIR}/scripts/review-gpt-instructions.sh"
        update_task_log "Reviewed GPT instructions" "completed"
        update_progress_log "GPT Instructions" "Performed monthly review"
    else
        log_message "Error: GPT instructions review script not found"
    fi
}

# Backup consolidated documentation
backup_docs() {
    log_message "Backing up consolidated documentation..."
    
    if [ -f "${BASE_DIR}/scripts/backup-docs-consolidated.sh" ]; then
        "${BASE_DIR}/scripts/backup-docs-consolidated.sh"
        update_task_log "Backed up consolidated documentation" "completed"
        update_progress_log "Documentation" "Created backup of consolidated documentation"
    else
        log_message "Error: Documentation backup script not found"
    fi
}

# Update daily progress log
update_daily_progress() {
    log_message "Updating daily progress log..."
    
    if [ -f "${BASE_DIR}/scripts/daily_progress_logger.sh" ]; then
        "${BASE_DIR}/scripts/daily_progress_logger.sh"
        update_task_log "Updated daily progress log" "completed"
        update_progress_log "Documentation" "Updated daily progress log with Git commits"
    else
        log_message "Error: Daily progress logger script not found"
    fi
}

# Main execution based on arguments
case "$1" in
    daily)
        log_message "Running daily maintenance tasks..."
        run_file_monitoring
        update_daily_progress
        generate_executive_brief
        update_progress_log "Maintenance" "Completed daily maintenance tasks"
        ;;
    weekly)
        log_message "Running weekly maintenance tasks..."
        run_file_protection
        consolidate_gpt_instructions
        generate_gpt_stats
        update_progress_log "Maintenance" "Completed weekly maintenance tasks"
        ;;
    monthly)
        log_message "Running monthly maintenance tasks..."
        review_gpt_instructions
        backup_docs
        update_progress_log "Maintenance" "Completed monthly maintenance tasks"
        ;;
    test-email)
        test_email_system
        ;;
    all)
        log_message "Running all maintenance tasks..."
        run_file_monitoring
        run_file_protection
        generate_gpt_stats
        consolidate_gpt_instructions
        generate_executive_brief
        review_gpt_instructions
        backup_docs
        update_daily_progress
        update_progress_log "Maintenance" "Completed all maintenance tasks"
        ;;
    *)
        echo "Usage: $0 {daily|weekly|monthly|test-email|all}"
        echo "  daily     - Run daily maintenance tasks"
        echo "  weekly    - Run weekly maintenance tasks"
        echo "  monthly   - Run monthly maintenance tasks"
        echo "  test-email - Test email notification system"
        echo "  all       - Run all maintenance tasks"
        exit 1
        ;;
esac

log_message "Maintenance script completed successfully"
exit 0