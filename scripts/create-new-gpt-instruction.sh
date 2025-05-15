#!/bin/bash
# Script to create a new GPT instruction file from template

# Set variables
DATE=$(date '+%Y-%m-%d')
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
GPT_DIR="$BASE_DIR/docs-consolidated/01-gpt-personas/consolidated"
LOG_FILE="$BASE_DIR/status/gpt-instructions-creation.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_message "Created directory: $1"
    fi
}

# Function to select template
select_template() {
    echo "Select template type:"
    echo "1) Claude Instruction"
    echo "2) ChatGPT Instruction"
    echo "3) Specialized Instruction"
    read -p "Enter selection (1-3): " template_choice
    
    case $template_choice in
        1)
            TEMPLATE="$GPT_DIR/templates/claude-instruction-template.md"
            TARGET_DIR="$GPT_DIR/claude"
            ;;
        2)
            TEMPLATE="$GPT_DIR/templates/chatgpt-instruction-template.md"
            TARGET_DIR="$GPT_DIR/chatgpt"
            ;;
        3)
            TEMPLATE="$GPT_DIR/templates/specialized-instruction-template.md"
            TARGET_DIR="$GPT_DIR/specialized"
            ;;
        *)
            log_message "Invalid selection. Exiting."
            exit 1
            ;;
    esac
    
    ensure_directory "$TARGET_DIR"
}

# Function to get instruction details
get_instruction_details() {
    read -p "Enter instruction name: " instruction_name
    read -p "Enter brief purpose: " instruction_purpose
    
    # Convert instruction name to filename (lowercase, hyphens)
    filename=$(echo "$instruction_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    
    # Add .md extension if not present
    if [[ "$filename" != *".md" ]]; then
        filename="$filename.md"
    fi
    
    TARGET_FILE="$TARGET_DIR/$filename"
    
    # Check if file already exists
    if [ -f "$TARGET_FILE" ]; then
        read -p "File already exists. Overwrite? (y/n): " overwrite
        if [[ "$overwrite" != "y" ]]; then
            log_message "Operation cancelled. File already exists: $TARGET_FILE"
            exit 1
        fi
    fi
}

# Function to create instruction file
create_instruction_file() {
    log_message "Creating new instruction file: $TARGET_FILE"
    
    # Copy template to target file
    cp "$TEMPLATE" "$TARGET_FILE"
    
    # Replace placeholders
    sed -i '' "s/\[Name of the instruction set\]/$instruction_name/g" "$TARGET_FILE"
    sed -i '' "s/\[Date created\]/$DATE/g" "$TARGET_FILE"
    sed -i '' "s/\[Brief description of what this.*\]/$instruction_purpose/g" "$TARGET_FILE"
    sed -i '' "s/\[Date of last update\]/$DATE/g" "$TARGET_FILE"
    
    log_message "Instruction file created successfully."
    
    # Update master index
    update_master_index
}

# Function to update master index
update_master_index() {
    log_message "Updating master index..."
    
    # Get relative path for linking
    rel_path=$(echo "$TARGET_FILE" | sed "s|$GPT_DIR/||")
    
    # Update the master index with the new file
    # This is a simplified approach - in a real implementation, you would want to
    # parse the markdown and insert in the appropriate section
    echo "Added new instruction: [$instruction_name](./$rel_path) - $DATE" >> "$GPT_DIR/00-MASTER-GPT-INSTRUCTIONS.md"
    
    log_message "Master index updated."
}

# Function to track usage
track_usage() {
    log_message "Tracking creation in usage log..."
    
    # Use the tracking script to log the creation
    "$BASE_DIR/scripts/track-gpt-usage.sh" "Created: $TARGET_FILE"
    
    log_message "Usage tracked."
}

# Main execution
main() {
    log_message "Starting GPT instruction creation process..."
    
    select_template
    get_instruction_details
    create_instruction_file
    track_usage
    
    log_message "GPT instruction creation complete."
    
    # Print summary
    echo ""
    echo "=== GPT Instruction Creation Summary ==="
    echo "Instruction Name: $instruction_name"
    echo "File Created: $TARGET_FILE"
    echo "Template Used: $TEMPLATE"
    echo "Date Created: $DATE"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "1. Open the file and complete the instruction details"
    echo "2. Commit the changes to the repository"
    echo "3. Share the instruction with the team"
}

# Create log directory if it doesn't exist
ensure_directory "$(dirname "$LOG_FILE")"

# Run the main function
main