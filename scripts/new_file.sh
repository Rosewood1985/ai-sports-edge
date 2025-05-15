#!/bin/bash
# new_file.sh - Create new files following memory bank principles

set -e

# Check if a file already exists
check_existing_file() {
  local file_path="$1"
  
  if [ -f "$file_path" ]; then
    echo "WARNING: File already exists at $file_path"
    echo "Consider modifying the existing file instead of creating a new one"
    read -p "Open existing file? [y/N] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      ${EDITOR:-nano} "$file_path"
      exit 0
    fi

    read -p "Continue creating a new file? [y/N] " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
}

# Check for similar files
check_similar_files() {
  local file_name="$1"
  local file_type="$2"
  
  # Extract the base name without extension
  base_name=$(basename "$file_name" | sed 's/\.[^.]*$//')

  echo "Checking for similar files to '$base_name'..."
  
  # Define search directories based on file type
  search_dirs=(".")
  case "$file_type" in
    component)
      search_dirs=("./src/atoms" "./src/molecules" "./src/organisms" "./src/templates" "./src/components")
      ;;
    hook)
      search_dirs=("./src/hooks")
      ;;
    util)
      search_dirs=("./src/utils")
      ;;
    service)
      search_dirs=("./src/services")
      ;;
    doc)
      search_dirs=("./docs")
      ;;
  esac
  
  # Search for similar file names
  similar_files=""
  for dir in "${search_dirs[@]}"; do
    if [ -d "$dir" ]; then
      found=$(find "$dir" -type f -name "*${base_name}*" 2>/dev/null || true)
      if [ -n "$found" ]; then
        similar_files="${similar_files}${found}\n"
      fi
    fi
  done

  # Search for similar content if file type is known
  if [ -n "$file_type" ]; then
    case "$file_type" in
      component)
        content_search=$(grep -r --include="*.jsx" --include="*.tsx" "function.*$base_name" . 2>/dev/null || true)
        if [ -n "$content_search" ]; then
          similar_files="${similar_files}${content_search}\n"
        fi
        ;;
      hook)
        content_search=$(grep -r --include="*.js" --include="*.ts" "function use$base_name" . 2>/dev/null || true)
        if [ -n "$content_search" ]; then
          similar_files="${similar_files}${content_search}\n"
        fi
        ;;
      util)
        content_search=$(grep -r --include="*.js" --include="*.ts" "function $base_name" . 2>/dev/null || true)
        if [ -n "$content_search" ]; then
          similar_files="${similar_files}${content_search}\n"
        fi
        ;;
    esac
  fi

  # Report findings
  if [ -n "$similar_files" ]; then
    echo "Found potentially similar files:"
    echo -e "$similar_files"
    read -p "Review a specific file? (Enter path or press Enter to skip) " file_to_review
    if [ -n "$file_to_review" ] && [ -f "$file_to_review" ]; then
      ${EDITOR:-nano} "$file_to_review"
    fi

    read -p "Continue creating a new file? [y/N] " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    echo "No similar files found."
  fi
}

# Create a new component file
create_component() {
  local component_name="$1"
  local component_type="$2"
  
  # Default to molecule if no type specified
  if [ -z "$component_type" ]; then
    component_type="molecule"
  fi
  
  # Validate component type
  case "$component_type" in
    atom|molecule|organism|template)
      directory="./src/${component_type}s"
      ;;
    *)
      echo "Invalid component type. Use atom, molecule, organism, or template."
      exit 1
      ;;
  esac
  
  # Ensure directory exists
  mkdir -p "$directory"
  
  # Define file path
  file_path="${directory}/${component_name}.tsx"

  # Check if file exists
  check_existing_file "$file_path"
  
  # Check for similar files
  check_similar_files "$component_name" "component"
  
  # Create the component file
  cat > "$file_path" << END
import React from 'react';

/**
 * ${component_name} - ${component_type} component
 * 
 * MEMORY BANK: Created after verifying no similar components exist
 */
export const ${component_name}: React.FC = () => {
  return (
    <div>
      ${component_name} Component
    </div>
  );
};

export default ${component_name};
END

  echo "Created component at $file_path"
  
  # Open the file in the editor
  ${EDITOR:-nano} "$file_path"
}

# Create a new hook file
create_hook() {
  local hook_name="$1"
  
  # Ensure hook name starts with 'use'
  if [[ ! "$hook_name" =~ ^use ]]; then
    hook_name="use${hook_name^}"
  fi
  
  # Ensure directory exists
  mkdir -p "./src/hooks"
  
  # Define file path
  file_path="./src/hooks/${hook_name}.ts"
  
  # Check if file exists
  check_existing_file "$file_path"
  
  # Check for similar files
  check_similar_files "$hook_name" "hook"
  
  # Create the hook file
  cat > "$file_path" << END
import { useState, useEffect } from 'react';

/**
 * ${hook_name} - Custom React hook
 * 
 * MEMORY BANK: Created after verifying no similar hooks exist
 */
export const ${hook_name} = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic here
  }, []);
  
  return state;
};

export default ${hook_name};
END

  echo "Created hook at $file_path"
  
  # Open the file in the editor
  ${EDITOR:-nano} "$file_path"
}

# Create a new utility file
create_util() {
  local util_name="$1"
  
  # Ensure directory exists
  mkdir -p "./src/utils"
  
  # Define file path
  file_path="./src/utils/${util_name}.ts"
  
  # Check if file exists
  check_existing_file "$file_path"
  
  # Check for similar files
  check_similar_files "$util_name" "util"
  
  # Create the utility file
  cat > "$file_path" << END
/**
 * ${util_name} - Utility functions
 * 
 * MEMORY BANK: Created after verifying no similar utilities exist
 */

/**
 * Main utility function
 */
export const ${util_name} = () => {
  // Utility logic here
};

export default ${util_name};
END

  echo "Created utility at $file_path"
  
  # Open the file in the editor
  ${EDITOR:-nano} "$file_path"
}

# Create a new service file
create_service() {
  local service_name="$1"
  
  # Ensure directory exists
  mkdir -p "./src/services"
  
  # Define file path
  file_path="./src/services/${service_name}.ts"
  
  # Check if file exists
  check_existing_file "$file_path"
  
  # Check for similar files
  check_similar_files "$service_name" "service"
  
  # Create the service file
  cat > "$file_path" << END
import { auth, firestore } from '../config/firebase';

/**
 * ${service_name} - Service for interacting with external APIs or Firebase
 * 
 * MEMORY BANK: Created after verifying no similar services exist
 */

/**
 * Main service function
 */
export const ${service_name}Service = {
  // Service methods here
};

export default ${service_name}Service;
END

  echo "Created service at $file_path"
  
  # Open the file in the editor
  ${EDITOR:-nano} "$file_path"
}

# Create a new documentation file
create_doc() {
  local doc_name="$1"
  
  # Ensure directory exists
  mkdir -p "./docs"
  
  # Define file path
  file_path="./docs/${doc_name}.md"
  
  # Check if file exists
  check_existing_file "$file_path"
  
  # Check for similar files
  check_similar_files "$doc_name" "doc"
  
  # Create the documentation file
  cat > "$file_path" << END
# ${doc_name}

*MEMORY BANK: Created after verifying no similar documentation exists*

## Overview

## Details

## Usage Examples

## References

END

  echo "Created documentation at $file_path"
  
  # Open the file in the editor
  ${EDITOR:-nano} "$file_path"
}

# Show help
show_help() {
  echo "RooCode New File Creator"
  echo "Usage: $0 [type] [name] [options]"
  echo ""
  echo "File Types:"
  echo "  component [name] [type]   Create a new React component (atom, molecule, organism, template)"
  echo "  hook [name]               Create a new React hook"
  echo "  util [name]               Create a new utility file"
  echo "  service [name]            Create a new service file"
  echo "  doc [name]                Create a new documentation file"
  echo "  help                      Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 component Button atom"
  echo "  $0 hook useAuth"
  echo "  $0 util dateFormatter"
  echo "  $0 service api"
  echo "  $0 doc firebase-integration"
}

# Main command handler
case "${1:-help}" in
  component)
    create_component "$2" "$3"
    ;;
  hook)
    create_hook "$2"
    ;;
  util)
    create_util "$2"
    ;;
  service)
    create_service "$2"
    ;;
  doc)
    create_doc "$2"
    ;;
  help|*)
    show_help
    ;;
esac