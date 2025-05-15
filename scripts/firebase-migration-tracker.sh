#!/bin/bash
#
# AI Sports Edge - Firebase Migration Tracker
# This script helps track the migration of files to Firebase services.
# It maintains a database of files being migrated, their status, and notes.

# Exit on error
set -e

# Configuration
MIGRATION_DB="status/firebase-migration-db.json"
MIGRATION_LOG="status/firebase-migration-log.md"
TEMP_DIR="temp-migration"

# Ensure directories exist
mkdir -p status
mkdir -p $TEMP_DIR

# Initialize migration database if it doesn't exist
if [ ! -f "$MIGRATION_DB" ]; then
  echo "Initializing migration database..."
  cat > "$MIGRATION_DB" << EOF
{
  "metadata": {
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "phases": {
      "critical_components": {
        "status": "not_started",
        "startDate": null,
        "endDate": null,
        "completionPercentage": 0
      },
      "auth_services": {
        "status": "not_started",
        "startDate": null,
        "endDate": null,
        "completionPercentage": 0
      },
      "data_services": {
        "status": "not_started",
        "startDate": null,
        "endDate": null,
        "completionPercentage": 0
      },
      "storage_services": {
        "status": "not_started",
        "startDate": null,
        "endDate": null,
        "completionPercentage": 0
      },
      "analytics_services": {
        "status": "not_started",
        "startDate": null,
        "endDate": null,
        "completionPercentage": 0
      }
    }
  },
  "files": {}
}
EOF

  # Initialize migration log
  cat > "$MIGRATION_LOG" << EOF
# Firebase Migration Log

## Overview
This log tracks the migration of files to Firebase services.

## Phases
- Critical Components
- Auth Services
- Data Services
- Storage Services
- Analytics Services

## Migration History

EOF
  echo "Migration database and log initialized."
fi

# Function to update the last updated timestamp
update_timestamp() {
  local temp_file="${TEMP_DIR}/migration_db_temp.json"
  jq '.metadata.lastUpdated = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
  mv "$temp_file" "$MIGRATION_DB"
}

# Function to add a log entry
add_log_entry() {
  local action="$1"
  local file="$2"
  local details="$3"
  local timestamp="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  
  echo -e "\n### $timestamp - $action: $file\n$details\n" >> "$MIGRATION_LOG"
}

# Function to start a migration phase
start_phase() {
  local phase="$1"
  
  # Check if phase exists
  if ! jq -e ".metadata.phases.$phase" "$MIGRATION_DB" > /dev/null; then
    echo "Error: Phase '$phase' does not exist."
    return 1
  fi
  
  # Check if phase is already started
  local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
  if [ "$status" != "not_started" ]; then
    echo "Phase '$phase' is already $status."
    return 0
  fi
  
  # Update phase status
  local temp_file="${TEMP_DIR}/migration_db_temp.json"
  jq '.metadata.phases.'"$phase"'.status = "in_progress" | 
      .metadata.phases.'"$phase"'.startDate = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
  mv "$temp_file" "$MIGRATION_DB"
  
  # Add log entry
  add_log_entry "Started Phase" "$phase" "Migration phase '$phase' has been started."
  
  # Update timestamp
  update_timestamp
  
  echo "Phase '$phase' has been started."
  
  # List files to migrate in this phase
  echo "Files to migrate in this phase:"
  case "$phase" in
    critical_components)
      find src/firebase -type f -name "*.js" | grep -v "examples" | sort
      ;;
    auth_services)
      find src -type f -name "*.js" | grep -E "auth|login|signup|user" | sort
      ;;
    data_services)
      find src -type f -name "*.js" | grep -E "data|firestore|database" | sort
      ;;
    storage_services)
      find src -type f -name "*.js" | grep -E "storage|file|upload" | sort
      ;;
    analytics_services)
      find src -type f -name "*.js" | grep -E "analytics|tracking|event" | sort
      ;;
    *)
      echo "No specific files identified for this phase."
      ;;
  esac
}

# Function to mark a file as migrated
mark_migrated() {
  local file="$1"
  
  # Check if file exists in the database
  if ! jq -e '.files["'"$file"'"]' "$MIGRATION_DB" > /dev/null 2>&1; then
    # Add file to database
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"] = {
      "status": "migrated",
      "migratedAt": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "notes": []
    }' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  else
    # Update file status
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"].status = "migrated" | 
        .files["'"$file"'"].migratedAt = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  fi
  
  # Add log entry
  add_log_entry "Migrated" "$file" "File has been successfully migrated."
  
  # Update timestamp
  update_timestamp
  
  # Update phase completion percentage
  update_phase_completion
  
  echo "File '$file' marked as migrated."
}

# Function to mark a file as deleted
mark_deleted() {
  local file="$1"
  local reason="$2"
  
  # Check if file exists in the database
  if ! jq -e '.files["'"$file"'"]' "$MIGRATION_DB" > /dev/null 2>&1; then
    # Add file to database
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"] = {
      "status": "deleted",
      "deletedAt": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "reason": "'"$reason"'",
      "notes": []
    }' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  else
    # Update file status
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"].status = "deleted" | 
        .files["'"$file"'"].deletedAt = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'" |
        .files["'"$file"'"].reason = "'"$reason"'"' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  fi
  
  # Add log entry
  add_log_entry "Deleted" "$file" "File has been deleted. Reason: $reason"
  
  # Update timestamp
  update_timestamp
  
  # Update phase completion percentage
  update_phase_completion
  
  echo "File '$file' marked as deleted. Reason: $reason"
}

# Function to add a note to a file
add_note() {
  local file="$1"
  local note="$2"
  
  # Check if file exists in the database
  if ! jq -e '.files["'"$file"'"]' "$MIGRATION_DB" > /dev/null 2>&1; then
    # Add file to database with note
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"] = {
      "status": "pending",
      "notes": ["'"$note"'"]
    }' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  else
    # Add note to existing file
    local temp_file="${TEMP_DIR}/migration_db_temp.json"
    jq '.files["'"$file"'"].notes += ["'"$note"'"]' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
  fi
  
  # Add log entry
  add_log_entry "Note Added" "$file" "Note: $note"
  
  # Update timestamp
  update_timestamp
  
  echo "Note added to file '$file': $note"
}

# Function to update phase completion percentage
update_phase_completion() {
  # Get current active phase
  local active_phase=""
  for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
    if [ "$status" = "in_progress" ]; then
      active_phase="$phase"
      break
    fi
  done
  
  if [ -z "$active_phase" ]; then
    return 0
  fi
  
  # Count total files and migrated/deleted files
  local total_files=0
  local completed_files=0
  
  case "$active_phase" in
    critical_components)
      total_files=$(find src/firebase -type f -name "*.js" | grep -v "examples" | wc -l)
      ;;
    auth_services)
      total_files=$(find src -type f -name "*.js" | grep -E "auth|login|signup|user" | wc -l)
      ;;
    data_services)
      total_files=$(find src -type f -name "*.js" | grep -E "data|firestore|database" | wc -l)
      ;;
    storage_services)
      total_files=$(find src -type f -name "*.js" | grep -E "storage|file|upload" | wc -l)
      ;;
    analytics_services)
      total_files=$(find src -type f -name "*.js" | grep -E "analytics|tracking|event" | wc -l)
      ;;
    *)
      total_files=0
      ;;
  esac
  
  # Count completed files
  completed_files=$(jq -r '.files | to_entries[] | select(.value.status == "migrated" or .value.status == "deleted") | .key' "$MIGRATION_DB" | wc -l)
  
  # Calculate percentage
  local percentage=0
  if [ $total_files -gt 0 ]; then
    percentage=$(( (completed_files * 100) / total_files ))
  fi
  
  # Update phase completion percentage
  local temp_file="${TEMP_DIR}/migration_db_temp.json"
  jq '.metadata.phases.'"$active_phase"'.completionPercentage = '"$percentage"'' "$MIGRATION_DB" > "$temp_file"
  mv "$temp_file" "$MIGRATION_DB"
  
  # Check if phase is complete
  if [ $percentage -eq 100 ]; then
    # Mark phase as complete
    jq '.metadata.phases.'"$active_phase"'.status = "completed" | 
        .metadata.phases.'"$active_phase"'.endDate = "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"' "$MIGRATION_DB" > "$temp_file"
    mv "$temp_file" "$MIGRATION_DB"
    
    # Add log entry
    add_log_entry "Completed Phase" "$active_phase" "Migration phase '$active_phase' has been completed."
    
    echo "Phase '$active_phase' has been completed!"
  fi
}

# Function to show migration status
show_status() {
  echo "Firebase Migration Status:"
  echo "=========================="
  
  # Show phases status
  echo "Phases:"
  for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
    local percentage=$(jq -r ".metadata.phases.$phase.completionPercentage" "$MIGRATION_DB")
    echo "  - $phase: $status ($percentage%)"
  done
  
  # Show file counts
  local total_files=$(jq -r '.files | keys | length' "$MIGRATION_DB")
  local migrated_files=$(jq -r '.files | to_entries[] | select(.value.status == "migrated") | .key' "$MIGRATION_DB" | wc -l)
  local deleted_files=$(jq -r '.files | to_entries[] | select(.value.status == "deleted") | .key' "$MIGRATION_DB" | wc -l)
  local pending_files=$(jq -r '.files | to_entries[] | select(.value.status == "pending") | .key' "$MIGRATION_DB" | wc -l)
  
  echo ""
  echo "Files:"
  echo "  - Total: $total_files"
  echo "  - Migrated: $migrated_files"
  echo "  - Deleted: $deleted_files"
  echo "  - Pending: $pending_files"
  
  # Show active phase files
  local active_phase=""
  for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
    if [ "$status" = "in_progress" ]; then
      active_phase="$phase"
      break
    fi
  done
  
  if [ -n "$active_phase" ]; then
    echo ""
    echo "Active Phase: $active_phase"
    echo "Files remaining in this phase:"
    
    case "$active_phase" in
      critical_components)
        find src/firebase -type f -name "*.js" | grep -v "examples" | sort | while read file; do
          if ! jq -e '.files["'"$file"'"] | select(.status == "migrated" or .status == "deleted")' "$MIGRATION_DB" > /dev/null 2>&1; then
            echo "  - $file"
          fi
        done
        ;;
      auth_services)
        find src -type f -name "*.js" | grep -E "auth|login|signup|user" | sort | while read file; do
          if ! jq -e '.files["'"$file"'"] | select(.status == "migrated" or .status == "deleted")' "$MIGRATION_DB" > /dev/null 2>&1; then
            echo "  - $file"
          fi
        done
        ;;
      data_services)
        find src -type f -name "*.js" | grep -E "data|firestore|database" | sort | while read file; do
          if ! jq -e '.files["'"$file"'"] | select(.status == "migrated" or .status == "deleted")' "$MIGRATION_DB" > /dev/null 2>&1; then
            echo "  - $file"
          fi
        done
        ;;
      storage_services)
        find src -type f -name "*.js" | grep -E "storage|file|upload" | sort | while read file; do
          if ! jq -e '.files["'"$file"'"] | select(.status == "migrated" or .status == "deleted")' "$MIGRATION_DB" > /dev/null 2>&1; then
            echo "  - $file"
          fi
        done
        ;;
      analytics_services)
        find src -type f -name "*.js" | grep -E "analytics|tracking|event" | sort | while read file; do
          if ! jq -e '.files["'"$file"'"] | select(.status == "migrated" or .status == "deleted")' "$MIGRATION_DB" > /dev/null 2>&1; then
            echo "  - $file"
          fi
        done
        ;;
    esac
  fi
}

# Function to generate a report
generate_report() {
  local report_file="status/firebase-migration-report.md"
  local timestamp="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  
  echo "Generating migration report..."
  
  # Create report header
  cat > "$report_file" << EOF
# Firebase Migration Report
Generated: $timestamp

## Overview

This report provides a summary of the Firebase migration progress.

## Phase Status

| Phase | Status | Completion |
|-------|--------|------------|
EOF
  
  # Add phase status
  for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
    local percentage=$(jq -r ".metadata.phases.$phase.completionPercentage" "$MIGRATION_DB")
    echo "| $phase | $status | $percentage% |" >> "$report_file"
  done
  
  # Add file statistics
  local total_files=$(jq -r '.files | keys | length' "$MIGRATION_DB")
  local migrated_files=$(jq -r '.files | to_entries[] | select(.value.status == "migrated") | .key' "$MIGRATION_DB" | wc -l)
  local deleted_files=$(jq -r '.files | to_entries[] | select(.value.status == "deleted") | .key' "$MIGRATION_DB" | wc -l)
  local pending_files=$(jq -r '.files | to_entries[] | select(.value.status == "pending") | .key' "$MIGRATION_DB" | wc -l)
  
  cat >> "$report_file" << EOF

## File Statistics

- **Total Files**: $total_files
- **Migrated**: $migrated_files
- **Deleted**: $deleted_files
- **Pending**: $pending_files

## Recently Migrated Files

| File | Date | Notes |
|------|------|-------|
EOF
  
  # Add recently migrated files
  jq -r '.files | to_entries[] | select(.value.status == "migrated") | [.key, .value.migratedAt] | @tsv' "$MIGRATION_DB" | sort -k2 -r | head -10 | while read -r file date; do
    local notes=$(jq -r '.files["'"$file"'"].notes | join(", ")' "$MIGRATION_DB")
    echo "| $file | $date | $notes |" >> "$report_file"
  done
  
  cat >> "$report_file" << EOF

## Recently Deleted Files

| File | Date | Reason |
|------|------|--------|
EOF
  
  # Add recently deleted files
  jq -r '.files | to_entries[] | select(.value.status == "deleted") | [.key, .value.deletedAt, .value.reason] | @tsv' "$MIGRATION_DB" | sort -k2 -r | head -10 | while read -r file date reason; do
    echo "| $file | $date | $reason |" >> "$report_file"
  done
  
  cat >> "$report_file" << EOF

## Next Steps

EOF
  
  # Add next steps based on current status
  local active_phase=""
  for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
    local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
    if [ "$status" = "in_progress" ]; then
      active_phase="$phase"
      break
    fi
  done
  
  if [ -n "$active_phase" ]; then
    cat >> "$report_file" << EOF
1. Continue migration of files in the **$active_phase** phase
2. Run tests for each migrated file
3. Update documentation as needed
EOF
  else
    local next_phase=""
    for phase in $(jq -r '.metadata.phases | keys[]' "$MIGRATION_DB"); do
      local status=$(jq -r ".metadata.phases.$phase.status" "$MIGRATION_DB")
      if [ "$status" = "not_started" ]; then
        next_phase="$phase"
        break
      fi
    done
    
    if [ -n "$next_phase" ]; then
      cat >> "$report_file" << EOF
1. Start the **$next_phase** phase
2. Identify files to migrate in this phase
3. Create migration plan for each file
EOF
    else
      cat >> "$report_file" << EOF
1. All phases are complete!
2. Perform final testing of the migrated system
3. Update documentation and clean up any remaining issues
EOF
    fi
  fi
  
  echo "Report generated: $report_file"
}

# Main script logic
case "$1" in
  start-phase)
    if [ -z "$2" ]; then
      echo "Error: Phase name is required."
      echo "Usage: $0 start-phase <phase_name>"
      exit 1
    fi
    start_phase "$2"
    ;;
  mark-migrated)
    if [ -z "$2" ]; then
      echo "Error: File path is required."
      echo "Usage: $0 mark-migrated <file_path>"
      exit 1
    fi
    mark_migrated "$2"
    ;;
  mark-deleted)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Error: File path and reason are required."
      echo "Usage: $0 mark-deleted <file_path> \"<reason>\""
      exit 1
    fi
    mark_deleted "$2" "$3"
    ;;
  add-note)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Error: File path and note are required."
      echo "Usage: $0 add-note <file_path> \"<note>\""
      exit 1
    fi
    add_note "$2" "$3"
    ;;
  status)
    show_status
    ;;
  generate-report)
    generate_report
    ;;
  *)
    echo "Firebase Migration Tracker"
    echo "Usage:"
    echo "  $0 start-phase <phase_name>       - Start a migration phase"
    echo "  $0 mark-migrated <file_path>      - Mark a file as migrated"
    echo "  $0 mark-deleted <file_path> <reason> - Mark a file as deleted"
    echo "  $0 add-note <file_path> <note>    - Add a note to a file"
    echo "  $0 status                         - Show migration status"
    echo "  $0 generate-report                - Generate a migration report"
    exit 1
    ;;
esac

exit 0