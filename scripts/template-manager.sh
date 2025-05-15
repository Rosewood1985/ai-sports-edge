#!/bin/bash
# AI Sports Edge - Template Manager
# This script manages GPT templates and integrates them with the automation system

BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
TEMPLATES_DIR="${BASE_DIR}/gpt-templates"
LOG_DIR="${BASE_DIR}/logs"
STATUS_DIR="${BASE_DIR}/status"
TASK_LOG="${BASE_DIR}/.roo-todo.md"
TEMPLATE_LOG="${STATUS_DIR}/template-usage.log"

# Create directories if they don't exist
mkdir -p "${LOG_DIR}" "${STATUS_DIR}"

# Log function
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "${LOG_DIR}/template-manager.log"
    echo "$1"
}

# List available templates
list_templates() {
    log_message "Listing available templates..."
    echo "Available GPT Templates:"
    echo "------------------------"
    
    # Find all template files
    find "${TEMPLATES_DIR}" -name "*.md" | while read template; do
        template_name=$(basename "$template" .md)
        echo "- ${template_name}"
        
        # Extract first line of TASK section for description
        description=$(sed -n '/^TASK:/,/^[A-Z]/{/^TASK:/d; /^[A-Z]/d; p}' "$template" | head -1 | sed 's/^[0-9]\. //')
        if [ -n "$description" ]; then
            echo "  Description: $description"
        fi
    done
}

# View template content
view_template() {
    local template_name="$1"
    local template_path="${TEMPLATES_DIR}/${template_name}.md"
    
    if [ -f "$template_path" ]; then
        log_message "Viewing template: ${template_name}"
        echo "Template: ${template_name}"
        echo "------------------------"
        cat "$template_path"
    else
        log_message "Error: Template not found: ${template_name}"
        echo "Error: Template not found: ${template_name}"
        echo "Available templates:"
        list_templates
    fi
}

# Create a new template
create_template() {
    local template_name="$1"
    local template_path="${TEMPLATES_DIR}/${template_name}.md"
    
    if [ -f "$template_path" ]; then
        log_message "Error: Template already exists: ${template_name}"
        echo "Error: Template already exists: ${template_name}"
        return 1
    fi
    
    log_message "Creating new template: ${template_name}"
    echo "Creating new template: ${template_name}"
    echo "Enter template content (press Ctrl+D when finished):"
    
    cat > "$template_path"
    
    echo "Template created: ${template_path}"
    update_task_log "Created GPT template: ${template_name}" "completed"
}

# Use a template
use_template() {
    local template_name="$1"
    local template_path="${TEMPLATES_DIR}/${template_name}.md"
    
    if [ ! -f "$template_path" ]; then
        log_message "Error: Template not found: ${template_name}"
        echo "Error: Template not found: ${template_name}"
        echo "Available templates:"
        list_templates
        return 1
    fi
    
    log_message "Using template: ${template_name}"
    echo "Using template: ${template_name}"
    echo "------------------------"
    cat "$template_path"
    
    # Log template usage
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Used template: ${template_name}" >> "$TEMPLATE_LOG"
    
    # Update task log
    update_task_log "Used GPT template: ${template_name}" "completed"
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
        local section="📄 Documentation"
        
        # Check if task already exists
        if ! grep -q "- \[ \] $task" "$TASK_LOG"; then
            # Add to appropriate section
            sed -i '' "/^## $section/a\\
- [ ] $task" "$TASK_LOG"
            log_message "Added in-progress task to task log: $task"
        fi
    fi
}

# Main execution based on arguments
case "$1" in
    list)
        list_templates
        ;;
    view)
        if [ -z "$2" ]; then
            echo "Usage: $0 view <template_name>"
            exit 1
        fi
        view_template "$2"
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: $0 create <template_name>"
            exit 1
        fi
        create_template "$2"
        ;;
    use)
        if [ -z "$2" ]; then
            echo "Usage: $0 use <template_name>"
            exit 1
        fi
        use_template "$2"
        ;;
    *)
        echo "AI Sports Edge - Template Manager"
        echo "Usage: $0 {list|view|create|use} [template_name]"
        echo "  list                - List all available templates"
        echo "  view <template>     - View a specific template"
        echo "  create <template>   - Create a new template"
        echo "  use <template>      - Use a specific template"
        exit 1
        ;;
esac

exit 0