#!/bin/bash
# scripts/update-task-log.sh
# Consolidates all rolling task logs across the project into a single file

OUTPUT_FILE="memory-bank/task-rolling-log.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SEARCH_DIRS=("scripts/" "docs/" "memory-bank/" "status/" "notes/" "tasks/" "archive/" "docs-consolidated/" "docs-consolidated-backup-20250510/")
SEARCH_PATTERNS=("completed" "queue" "task-log" "rolling-log" "tasks-complete" "todo-list" "task-tracker" "tasks.md" "taskQueue" "done.md" "inProgress.md")
HEADER_PATTERNS=("## Completed Tasks" "## Task Queue" "### In Progress")

# Ensure output directory exists
mkdir -p memory-bank

# Initialize output file with header
cat > "$OUTPUT_FILE" << EOL
# Task Rolling Log

This document consolidates all rolling task logs across the project. It is automatically updated by the \`scripts/update-task-log.sh\` script.

Last updated: $TIMESTAMP

## 🔄 Task Queue

EOL

# Function to extract tasks from files
extract_tasks() {
  local file=$1
  local source_file=$(basename "$file")
  local content=$(cat "$file")
  
  echo "Processing $file..."
  
  # Extract pending/queued tasks
  if grep -q -E "TODO|pending|queue|in progress|in-progress|queued|planned" "$file"; then
    echo "Found pending tasks in $file"
    grep -n -E "TODO|pending|queue|in progress|in-progress|queued|planned" "$file" | while read -r line; do
      line_num=$(echo "$line" | cut -d: -f1)
      task_line=$(echo "$line" | cut -d: -f2-)
      
      # Skip if line is a comment about the structure
      if [[ "$task_line" =~ "# Task Queue" || "$task_line" =~ "# Pending Tasks" ]]; then
        continue
      fi
      
      # Extract the actual task description
      task_desc=$(echo "$task_line" | sed -E 's/.*TODO:?|.*pending:?|.*queue:?|.*in progress:?|.*in-progress:?|.*queued:?|.*planned:?//i' | sed -E 's/^\s+|\s+$//g')
      
      if [[ -n "$task_desc" && ${#task_desc} -gt 5 ]]; then
        # Check if this task is already in the output file to avoid duplication
        if ! grep -q "$task_desc" "$OUTPUT_FILE"; then
          echo "- [ ] $task_desc (Source: $source_file)" >> "$OUTPUT_FILE"
        fi
      fi
    done
  fi
}

# Function to extract completed tasks
extract_completed_tasks() {
  local file=$1
  local source_file=$(basename "$file")
  local content=$(cat "$file")
  
  # Extract completed tasks
  if grep -q -E "completed|done|finished|implemented" "$file"; then
    echo "Found completed tasks in $file"
    grep -n -E "completed|done|finished|implemented" "$file" | while read -r line; do
      line_num=$(echo "$line" | cut -d: -f1)
      task_line=$(echo "$line" | cut -d: -f2-)
      
      # Skip if line is a comment about the structure
      if [[ "$task_line" =~ "# Completed Tasks" || "$task_line" =~ "# Done" ]]; then
        continue
      fi
      
      # Extract the actual task description
      task_desc=$(echo "$task_line" | sed -E 's/.*completed:?|.*done:?|.*finished:?|.*implemented:?//i' | sed -E 's/^\s+|\s+$//g')
      
      if [[ -n "$task_desc" && ${#task_desc} -gt 5 ]]; then
        # Check if this task is already in the completed section to avoid duplication
        if ! grep -q "$task_desc" "$OUTPUT_FILE"; then
          # Store for later addition to completed section
          completed_tasks+=("- [x] $task_desc (Source: $source_file)")
        fi
      fi
    done
  fi
}

# Find all potential task log files
echo "Searching for task log files..."
declare -a task_files
declare -a completed_tasks

for dir in "${SEARCH_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "Searching in $dir..."
    
    # Search for files with task-related names
    for pattern in "${SEARCH_PATTERNS[@]}"; do
      found_files=$(find "$dir" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.json" \) -exec grep -l "$pattern" {} \; 2>/dev/null)
      if [ -n "$found_files" ]; then
        while IFS= read -r file; do
          task_files+=("$file")
        done <<< "$found_files"
      fi
    done
    
    # Also search for files with task-related headers
    for pattern in "${HEADER_PATTERNS[@]}"; do
      found_files=$(find "$dir" -type f \( -name "*.md" -o -name "*.txt" \) -exec grep -l "$pattern" {} \; 2>/dev/null)
      if [ -n "$found_files" ]; then
        while IFS= read -r file; do
          task_files+=("$file")
        done <<< "$found_files"
      fi
    done
  fi
done

# Remove duplicates
task_files=($(printf "%s\n" "${task_files[@]}" | sort -u))

echo "Found ${#task_files[@]} potential task log files"

# Process each file to extract tasks
for file in "${task_files[@]}"; do
  extract_tasks "$file"
  extract_completed_tasks "$file"
done

# Add completed tasks section
echo -e "\n## ✅ Completed Tasks\n" >> "$OUTPUT_FILE"

# Sort completed tasks and add to file
for task in "${completed_tasks[@]}"; do
  echo "$task" >> "$OUTPUT_FILE"
done

# Add information about ongoing logging
cat >> "$OUTPUT_FILE" << EOL

## Automated Updates

This file is automatically updated by the \`scripts/update-task-log.sh\` script, which runs on a scheduled basis via the following cron job:

\`\`\`
30m rolling-log ./scripts/update-task-log.sh
\`\`\`

## Usage Guidelines

1. **Manual Entries**: While most entries are automatically generated, you can manually add entries for tasks that might not be captured by the automated process.

2. **Entry Format**: Each entry should follow this format:
   \`\`\`
   - [ ] Task description (Source: source_file.md)
   - [x] Completed task description (Source: source_file.md)
   \`\`\`

3. **Maintenance**: Periodically review this file to ensure accuracy and remove any duplicate or irrelevant entries.

4. **Integration**: Use this log as a reference when planning new features or tracking progress.
EOL

echo "✅ Task rolling log updated in $OUTPUT_FILE"