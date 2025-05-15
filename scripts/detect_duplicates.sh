#!/bin/bash
# detect_duplicates.sh - Find and report code duplication

set -e

REPORT_FILE="./reports/code_duplication.md"

# Ensure report directory exists
mkdir -p "./reports"

# Initialize report file
initialize_report() {
  cat > "$REPORT_FILE" << END
# Code Duplication Report

Generated on $(date)

This report identifies potential code duplications that should be addressed according to memory bank principles.

## Duplicate React Components

END
}

# Find similar React components
find_similar_components() {
  echo "Finding similar React components..."
  
  # Find all component files
  component_files=$(find ./src -type f -name "*.jsx" -o -name "*.tsx")
  
  # Extract component names and their files
  echo -e "\n### Similar Component Names\n" >> "$REPORT_FILE"
  
  # Create a temporary file for component names
  component_names=$(mktemp)
  
  # Extract component names
  for file in $component_files; do
    grep -E "function\s+([A-Z][a-zA-Z0-9]*)|class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+React" "$file" |
    sed -E 's/.*function\s+([A-Z][a-zA-Z0-9]*).*/\1/;s/.*class\s+([A-Z][a-zA-Z0-9]*).*/\1/' |
    while read -r name; do
      if [ -n "$name" ]; then
        echo "$name|$file" >> "$component_names"
      fi
    done
  done

  # Find similar component names
  if [ -s "$component_names" ]; then
    # Sort component names for processing
    sort "$component_names" > "${component_names}.sorted"
    mv "${component_names}.sorted" "$component_names"

    # Process components to find similarities
    prev_name=""
    prev_file=""
    
    while IFS="|" read -r name file; do
      if [ -n "$prev_name" ]; then
        # Use similarity algorithm
        similarity=$(python3 -c "
import difflib
similarity = difflib.SequenceMatcher(None, '$prev_name', '$name').ratio()
print(f'{similarity:.2f}')
" 2>/dev/null || echo "0.0")
        
        # If similarity is high enough, report it
        if (( $(echo "$similarity > 0.7" | bc -l) )); then
          echo "* **Similar components**: $prev_name ($prev_file) and $name ($file) - Similarity: ${similarity}" >> "$REPORT_FILE"
        fi
      fi
      prev_name="$name"
      prev_file="$file"
    done < "$component_names"
  fi
  
  # Clean up
  rm -f "$component_names"
  
  # Find functionally similar components
  echo -e "\n### Functionally Similar Components\n" >> "$REPORT_FILE"
  
  # Define common component patterns to search for
  patterns=(
    "Button"
    "Modal"
    "Card"
    "Input"
    "Form"
    "Table"
    "List"
    "Avatar"
    "Nav"
  )
  
  for pattern in "${patterns[@]}"; do
    echo "Checking for $pattern components..."
    matches=$(grep -r --include="*.jsx" --include="*.tsx" -l "$pattern" ./src | sort)
    
    if [ -n "$matches" ]; then
      count=$(echo "$matches" | wc -l)
      if [ "$count" -gt 1 ]; then
        echo -e "* **$pattern-like components** ($count instances):\n" >> "$REPORT_FILE"
        echo "$matches" | sed 's/^/  - /' >> "$REPORT_FILE"
        echo -e "\n" >> "$REPORT_FILE"
      fi
    fi
  done
}

# Find duplicate utility functions
find_duplicate_utils() {
  echo "Finding duplicate utility functions..."
  
  echo -e "\n## Duplicate Utility Functions\n" >> "$REPORT_FILE"
  
  # Define common utility categories
  categories=(
    "format|formatter|formatting"
    "validate|validator|validation"
    "calculate|calculator|calculation"
    "convert|converter|conversion"
    "parse|parser|parsing"
    "transform|transformer|transformation"
    "fetch|request|http"
    "auth|authenticate|authentication"
  )
  
  for category in "${categories[@]}"; do
    echo "Checking for $category functions..."
    matches=$(grep -r --include="*.js" --include="*.ts" -E "function\s+\w*($category)\w*|const\s+\w*($category)\w*\s+=\s+\(" ./src | sort)
    
    if [ -n "$matches" ]; then
      count=$(echo "$matches" | wc -l)
      if [ "$count" -gt 1 ]; then
        echo -e "* **$category functions** ($count instances):\n" >> "$REPORT_FILE"
        echo "$matches" | sed 's/^/  - /' >> "$REPORT_FILE"
        echo -e "\n" >> "$REPORT_FILE"
      fi
    fi
  done
}

# Find duplicate Firebase implementations
find_duplicate_firebase() {
  echo "Finding duplicate Firebase implementations..."
  
  echo -e "\n## Multiple Firebase Implementations\n" >> "$REPORT_FILE"
  
  # Find Firebase imports
  firebase_imports=$(grep -r --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" "import.*from.*firebase" . | sort)
  if [ -n "$firebase_imports" ]; then
    echo "* Firebase imports:" >> "$REPORT_FILE"
    echo "$firebase_imports" | sed 's/^/  - /' >> "$REPORT_FILE"
    echo -e "\n" >> "$REPORT_FILE"
  fi

  # Find Firebase initializations
  firebase_inits=$(grep -r --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" -E "initializeApp|firebase.initializeApp" . | sort)
  if [ -n "$firebase_inits" ]; then
    echo "* Firebase initializations:" >> "$REPORT_FILE"
    echo "$firebase_inits" | sed 's/^/  - /' >> "$REPORT_FILE"
    echo -e "\n" >> "$REPORT_FILE"
  fi
}

# Generate action recommendations
generate_recommendations() {
  echo "Generating recommendations..."
  
  echo -e "\n## Recommended Actions\n" >> "$REPORT_FILE"
  echo "Based on the memory bank principles, consider the following actions:" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Recommendations for components
  echo "### Component Consolidation" >> "$REPORT_FILE"
  echo "1. Review similar components and consider creating shared base components" >> "$REPORT_FILE"
  echo "2. Standardize on a single implementation for common UI elements (buttons, modals, etc.)" >> "$REPORT_FILE"
  echo "3. Move duplicated styling to shared CSS/styled-components files" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Recommendations for utilities
  echo "### Utility Function Consolidation" >> "$REPORT_FILE"
  echo "1. Merge similar utility functions into single, parameterized versions" >> "$REPORT_FILE"
  echo "2. Create a proper utils directory structure with categories" >> "$REPORT_FILE"
  echo "3. Document utility functions with JSDoc comments" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Recommendations for Firebase
  echo "### Firebase Consolidation" >> "$REPORT_FILE"
  echo "1. Use only the consolidated Firebase implementation in src/config/firebase.ts" >> "$REPORT_FILE"
  echo "2. Update all imports to reference the consolidated version" >> "$REPORT_FILE"
  echo "3. Remove duplicate implementations" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Memory bank reminder
  echo "### Memory Bank Integration" >> "$REPORT_FILE"
  echo "1. Update the memory bank with any newly discovered patterns" >> "$REPORT_FILE"
  echo "2. Document consolidated components and utilities in the memory bank" >> "$REPORT_FILE"
  echo "3. Add specific guidance for each type of duplication found" >> "$REPORT_FILE"
}

# Main function
main() {
  echo "Starting code duplication detection..."
  
  # Initialize report
  initialize_report
  
  # Run detection functions
  find_similar_components
  find_duplicate_utils
  find_duplicate_firebase
  
  # Generate recommendations
  generate_recommendations
  
  echo "Duplication detection complete. Report generated at $REPORT_FILE"
}

# Run main function
main