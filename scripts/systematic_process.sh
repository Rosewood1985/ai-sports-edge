#!/bin/bash
# systematic_process.sh
# Guides through all project phases systematically

PHASES_FILE=".project_phases"

# Initialize phases if they don't exist
if [ ! -f "$PHASES_FILE" ]; then
  cat > "$PHASES_FILE" << END
1|File Organization|Completed
2|Firebase Consolidation|In Progress
3|Component Organization|Not Started
4|Code Quality Improvements|Not Started
5|Testing & Validation|Not Started
END
fi

# Show phases and status
show_phases() {
  echo "========== AI Sports Edge Project Phases =========="
  while IFS='|' read -r num name status; do
    printf "Phase %s: %s - %s\n" "$num" "$name" "$status"
  done < "$PHASES_FILE"
}

# Update phase status
update_phase() {
  phase_num="$1"
  status="$2"
  
  temp_file=$(mktemp)
  while IFS='|' read -r num name current_status; do
    if [ "$num" == "$phase_num" ]; then
      echo "$num|$name|$status" >> "$temp_file"
    else
      echo "$num|$name|$current_status" >> "$temp_file"
    fi
  done < "$PHASES_FILE"
  
  mv "$temp_file" "$PHASES_FILE"
  echo "Updated Phase $phase_num to: $status"
}

# Run specific phase
run_phase() {
  phase_num="$1"
  
  case $phase_num in
    1) echo "Running File Organization phase..."
       ./scripts/cleanup_project.sh -p
       update_phase 1 "Completed"
       update_phase 2 "In Progress"
       ;;
    2) echo "Running Firebase Consolidation phase..."
       ./scripts/firebase_consolidation.sh
       update_phase 2 "Completed"
       update_phase 3 "In Progress"
       ;;
    3) echo "Running Component Organization phase..."
       # Add component organization script execution here
       echo "Component organization not yet implemented"
       ;;
    4) echo "Running Code Quality Improvements phase..."
       # Add code quality script execution here
       echo "Code quality improvements not yet implemented"
       ;;
    5) echo "Running Testing & Validation phase..."
       # Add testing script execution here
       echo "Testing and validation not yet implemented"
       ;;
    *) echo "Invalid phase number" ;;
  esac
}

# Show current phase details
current_phase() {
  current=$(grep "In Progress" "$PHASES_FILE" | cut -d'|' -f1)
  if [ -z "$current" ]; then
    echo "No phase currently in progress"
    return
  fi
  
  echo "Current phase: $current"
  
  case $current in
    1) echo "File Organization:"
       echo "- Organize project files"
       echo "- Remove duplicates"
       echo "- Set up project structure"
       ;;
    2) echo "Firebase Consolidation:"
       echo "- Standardize Firebase implementation"
       echo "- Update imports"
       echo "- Test Firebase functionality"
       ;;
    3) echo "Component Organization:"
       echo "- Implement atomic design"
       echo "- Consolidate duplicate components"
       echo "- Improve component hierarchy"
       ;;
    4) echo "Code Quality Improvements:"
       echo "- Standardize error handling"
       echo "- Update deprecated patterns"
       echo "- Improve performance"
       ;;
    5) echo "Testing & Validation:"
       echo "- Run unit tests"
       echo "- Validate functionality"
       echo "- Fix issues"
       ;;
  esac
}

# Main menu
show_menu() {
  echo "========== AI Sports Edge Systematic Process =========="
  show_phases
  echo ""
  current_phase
  echo ""
  echo "Options:"
  echo "1. Run current phase"
  echo "2. Update phase status"
  echo "3. Show phase details"
  echo "4. Run Git workflow helper"
  echo "5. Exit"
  echo "6. Consolidate Project History"
  echo ""
  read -r choice
  
  case $choice in
    1) current=$(grep "In Progress" "$PHASES_FILE" | cut -d'|' -f1)
       if [ -n "$current" ]; then
         run_phase "$current"
       else
         echo "No phase currently in progress"
       fi
       ;;
    2) echo "Enter phase number to update:"
       read -r phase_num
       echo "Enter new status (Completed/In Progress/Not Started):"
       read -r status
       update_phase "$phase_num" "$status"
       ;;
    3) echo "Enter phase number for details:"
       read -r phase_num
       case $phase_num in
         1) echo "File Organization phase details..." ;;
         2) echo "Firebase Consolidation phase details..." ;;
         3) echo "Component Organization phase details..." ;;
         4) echo "Code Quality Improvements phase details..." ;;
         5) echo "Testing & Validation phase details..." ;;
         *) echo "Invalid phase number" ;;
       esac
       ;;
    4) ./scripts/git_workflow_helper.sh ;;
    5) exit 0 ;;
    6) ./scripts/consolidate_project_history.sh ;;
    *) echo "Invalid choice" ;;
  esac
  
  echo ""
  show_menu
}

show_menu