#!/bin/bash
#
# AI Sports Edge - Test Migrated Files
# This script runs tests for migrated Firebase files.
# It can test individual files or all files in a migration phase.

# Exit on error
set -e

# Configuration
MIGRATION_DB="status/firebase-migration-db.json"
TEST_LOG="status/firebase-test-log.md"
TEMP_DIR="temp-migration"

# Ensure directories exist
mkdir -p status
mkdir -p $TEMP_DIR

# Check if migration database exists
if [ ! -f "$MIGRATION_DB" ]; then
  echo "Error: Migration database not found. Run firebase-migration-tracker.sh first."
  exit 1
fi

# Initialize test log if it doesn't exist
if [ ! -f "$TEST_LOG" ]; then
  echo "Initializing test log..."
  cat > "$TEST_LOG" << EOF
# Firebase Migration Test Log

## Overview
This log tracks the testing of migrated Firebase files.

## Test History

EOF
  echo "Test log initialized."
fi

# Function to add a log entry
add_log_entry() {
  local action="$1"
  local file="$2"
  local result="$3"
  local details="$4"
  local timestamp="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  
  echo -e "\n### $timestamp - $action: $file\n**Result**: $result\n\n$details\n" >> "$TEST_LOG"
}

# Function to run tests for a specific file
run_file_test() {
  local file="$1"
  local test_file=""
  
  # Determine test file path
  if [[ "$file" == *".test."* ]]; then
    # File is already a test file
    test_file="$file"
  else
    # Convert source file path to test file path
    local base_name=$(basename "$file")
    local dir_name=$(dirname "$file")
    local test_name="${base_name%.*}.test.${base_name##*.}"
    
    # Check for test file in various locations
    if [ -f "$dir_name/$test_name" ]; then
      test_file="$dir_name/$test_name"
    elif [ -f "$dir_name/__tests__/$test_name" ]; then
      test_file="$dir_name/__tests__/$test_name"
    elif [ -f "$(dirname "$dir_name")/__tests__/$test_name" ]; then
      test_file="$(dirname "$dir_name")/__tests__/$test_name"
    elif [ -f "__tests__/$test_name" ]; then
      test_file="__tests__/$test_name"
    else
      echo "Error: Test file for '$file' not found."
      add_log_entry "Test Not Found" "$file" "SKIPPED" "No test file found for this source file."
      return 1
    fi
  fi
  
  echo "Running test for '$file' using test file '$test_file'..."
  
  # Run the test
  if [ -f "node_modules/.bin/jest" ]; then
    node_modules/.bin/jest "$test_file" --no-cache
    local test_result=$?
    
    if [ $test_result -eq 0 ]; then
      echo "Test passed!"
      add_log_entry "Test" "$file" "PASSED" "All tests passed successfully."
      
      # Update migration database to mark test as passed
      local temp_file="${TEMP_DIR}/migration_db_temp.json"
      jq '.files["'"$file"'"].testStatus = "passed" | 
          .files["'"$file"'"].testedAt = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
      mv "$temp_file" "$MIGRATION_DB"
      
      return 0
    else
      echo "Test failed!"
      add_log_entry "Test" "$file" "FAILED" "Tests failed. See Jest output for details."
      
      # Update migration database to mark test as failed
      local temp_file="${TEMP_DIR}/migration_db_temp.json"
      jq '.files["'"$file"'"].testStatus = "failed" | 
          .files["'"$file"'"].testedAt = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
      mv "$temp_file" "$MIGRATION_DB"
      
      return 1
    fi
  else
    echo "Error: Jest not found. Make sure you have Jest installed."
    add_log_entry "Test" "$file" "ERROR" "Jest not found. Make sure you have Jest installed."
    return 1
  fi
}

# Function to run tests for all files in a phase
run_phase_tests() {
  local phase="$1"
  
  echo "Running tests for all files in phase '$phase'..."
  
  # Get current active phase
  local active_phase=""
  for p in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$p.status" "$MIGRATION_DB")
    if [ "$status" = "in_progress" ] && [ "$p" = "$phase" ]; then
      active_phase="$p"
      break
    fi
  done
  
  if [ -z "$active_phase" ]; then
    echo "Error: Phase '$phase' is not active."
    return 1
  fi
  
  # Get all migrated files in this phase
  local migrated_files=$(jq -r '.files | to_entries[] | select(.value.status == "migrated") | .key' "$MIGRATION_DB")
  
  if [ -z "$migrated_files" ]; then
    echo "No migrated files found in phase '$phase'."
    return 0
  fi
  
  local passed=0
  local failed=0
  local skipped=0
  
  echo "$migrated_files" | while read -r file; do
    echo "Testing file: $file"
    if run_file_test "$file"; then
      passed=$((passed + 1))
    else
      if [ $? -eq 1 ]; then
        failed=$((failed + 1))
      else
        skipped=$((skipped + 1))
      fi
    fi
  done
  
  echo "Phase test results:"
  echo "  - Passed: $passed"
  echo "  - Failed: $failed"
  echo "  - Skipped: $skipped"
  
  add_log_entry "Phase Test" "$phase" "COMPLETED" "Passed: $passed, Failed: $failed, Skipped: $skipped"
  
  if [ $failed -eq 0 ]; then
    return 0
  else
    return 1
  fi
}

# Main script logic
case "$1" in
  run-file)
    if [ -z "$2" ]; then
      echo "Error: File path is required."
      echo "Usage: $0 run-file <file_path>"
      exit 1
    fi
    run_file_test "$2"
    ;;
  run-phase)
    if [ -z "$2" ]; then
      echo "Error: Phase name is required."
      echo "Usage: $0 run-phase <phase_name>"
      exit 1
    fi
    run_phase_tests "$2"
    ;;
  *)
    echo "Firebase Migration Test Runner"
    echo "Usage:"
    echo "  $0 run-file <file_path>  - Run tests for a specific file"
    echo "  $0 run-phase <phase_name> - Run tests for all files in a phase"
    exit 1
    ;;
esac

exit 0