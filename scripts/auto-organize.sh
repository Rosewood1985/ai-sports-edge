#!/bin/bash
# auto-organize.sh - Automatically organize orphaned files found during searches

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

# Define target directories for different file types
DESIGN_DIR="src/assets/design"
COMMAND_DIR="scripts"
COMPONENT_DIR="src/components"
PAGE_DIR="src/pages"
UTIL_DIR="src/utils"
SERVICE_DIR="src/services"
STYLE_DIR="src/styles"
DOC_DIR="docs"

# Create directories if they don't exist
mkdir -p "$DESIGN_DIR" "$COMMAND_DIR" "$COMPONENT_DIR" "$PAGE_DIR" "$UTIL_DIR" "$SERVICE_DIR" "$STYLE_DIR" "$DOC_DIR"

# Function to determine the appropriate directory for a file
get_target_dir() {
  local file="$1"
  local filename=$(basename "$file")
  local extension="${filename##*.}"
  local filepath=$(dirname "$file")
  
  # Skip if file is already in an appropriate directory
  if [[ "$filepath" == *"/src/assets"* || "$filepath" == *"/src/components"* || 
        "$filepath" == *"/src/pages"* || "$filepath" == *"/src/utils"* || 
        "$filepath" == *"/src/services"* || "$filepath" == *"/src/styles"* || 
        "$filepath" == *"/scripts"* || "$filepath" == *"/docs"* ]]; then
    echo ""
    return
  fi
  
  # Check file extension and content to determine type
  case "$extension" in
    svg|png|jpg|jpeg|gif|webp)
      echo "$DESIGN_DIR"
      ;;
    sh|bash)
      echo "$COMMAND_DIR"
      ;;
    js|jsx|ts|tsx)
      # Check content to determine if it's a component, page, util, or service
      if grep -q "React.Component\|function.*(\|const.*=.*=>\|class.*extends" "$file"; then
        if grep -q "export default" "$file"; then
          # Check if it's likely a page or a component
          if [[ "$filename" == *"Page"* || "$filename" == *"page"* || 
                "$filename" == *"Screen"* || "$filename" == *"screen"* ]]; then
            echo "$PAGE_DIR"
          else
            echo "$COMPONENT_DIR"
          fi
        elif grep -q "firebase\|axios\|fetch\|api\|service" "$file"; then
          echo "$SERVICE_DIR"
        else
          echo "$UTIL_DIR"
        fi
      elif grep -q "firebase\|axios\|fetch\|api\|service" "$file"; then
        echo "$SERVICE_DIR"
      else
        echo "$UTIL_DIR"
      fi
      ;;
    css|scss|less|sass)
      echo "$STYLE_DIR"
      ;;
    md|markdown|txt)
      echo "$DOC_DIR"
      ;;
    *)
      # If can't determine automatically, return empty to prompt for user input
      echo ""
      ;;
  esac
}

# Function to organize a single file
organize_file() {
  local file="$1"
  local target_dir=$(get_target_dir "$file")
  
  # If target directory couldn't be determined, ask user
  if [[ -z "$target_dir" ]]; then
    echo "Cannot automatically determine target directory for: $file"
    echo "Please select a target directory:"
    echo "1) Design assets (src/assets/design)"
    echo "2) Command scripts (scripts)"
    echo "3) React components (src/components)"
    echo "4) Pages/Screens (src/pages)"
    echo "5) Utilities (src/utils)"
    echo "6) Services (src/services)"
    echo "7) Styles (src/styles)"
    echo "8) Documentation (docs)"
    echo "9) Skip this file"
    read -p "Enter selection (1-9): " selection
    
    case "$selection" in
      1) target_dir="$DESIGN_DIR" ;;
      2) target_dir="$COMMAND_DIR" ;;
      3) target_dir="$COMPONENT_DIR" ;;
      4) target_dir="$PAGE_DIR" ;;
      5) target_dir="$UTIL_DIR" ;;
      6) target_dir="$SERVICE_DIR" ;;
      7) target_dir="$STYLE_DIR" ;;
      8) target_dir="$DOC_DIR" ;;
      9) return ;;
      *) echo "Invalid selection, skipping file"; return ;;
    esac
  fi
  
  # Create target directory if it doesn't exist
  mkdir -p "$target_dir"
  
  # Move the file
  local filename=$(basename "$file")
  if [[ -f "$target_dir/$filename" ]]; then
    # File with same name exists in target directory
    echo "File with same name already exists in target directory: $target_dir/$filename"
    echo "1) Overwrite existing file"
    echo "2) Rename new file"
    echo "3) Skip this file"
    read -p "Enter selection (1-3): " collision_selection
    
    case "$collision_selection" in
      1) mv -f "$file" "$target_dir/" ;;
      2) 
        read -p "Enter new filename: " new_filename
        mv "$file" "$target_dir/$new_filename"
        ;;
      3) return ;;
      *) echo "Invalid selection, skipping file"; return ;;
    esac
  else
    # No collision, just move the file
    mv "$file" "$target_dir/"
  fi
  
  echo "Moved $file to $target_dir/$filename"
}

# Process orphaned files found during a search
process_orphaned_files() {
  local search_results="$1"
  
  # Display the orphaned files
  echo "Found the following orphaned files:"
  cat "$search_results"
  echo ""
  
  # Ask if user wants to organize them
  read -p "Would you like to organize these files? (y/n): " answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    echo "Skipping organization."
    return
  fi
  
  # Process each file
  while IFS= read -r file; do
    if [[ -f "$file" ]]; then
      organize_file "$file"
    fi
  done < "$search_results"
  
  echo "Organization complete!"
}

# This function will be called by other Roo scripts when orphaned files are found
roo_organize_orphaned_files() {
  local temp_file=$(mktemp)
  
  # The orphaned files should be passed via stdin
  cat > "$temp_file"
  
  # Process the orphaned files
  process_orphaned_files "$temp_file"
  
  # Clean up
  rm -f "$temp_file"
}

# Main function when script is run directly
main() {
  if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <file_path> [file_path2 ...]"
    echo "Automatically organizes the specified files."
    exit 1
  fi
  
  for file in "$@"; do
    if [[ -f "$file" ]]; then
      organize_file "$file"
    else
      echo "File not found: $file"
    fi
  done
}

# If script is sourced from another script, export the function
# Otherwise, run the main function
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  export -f roo_organize_orphaned_files
else
  main "$@"
fi