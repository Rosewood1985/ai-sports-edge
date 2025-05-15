#!/bin/bash
# consolidate_project_history.sh
# Searches all existing markdown files and consolidates historical information

set -e

HISTORY_FILE="docs/PROJECT_HISTORY.md"
TEMP_FILE=$(mktemp)
SEARCH_DIRS=("docs" "src" "scripts" ".github")

# Initialize the consolidated history file
initialize_history_file() {
  mkdir -p "$(dirname "$HISTORY_FILE")"
  
  cat > "$HISTORY_FILE" << END
# AI Sports Edge Project History

This consolidated document tracks all significant developments, features, and milestones for the AI Sports Edge project. It serves as the definitive project changelog and progress tracker.

## Project Timeline

END
}

# Find all markdown files that might contain historical info
find_history_files() {
  echo "Searching for existing project history documentation..." >&2
  find "${SEARCH_DIRS[@]}" -type f -name "*.md" | sort
}

# Extract sections from files based on key indicators
extract_sections() {
  local file="$1"
  local output_file="$2"
  
  echo "Processing $file..."
  
  # Extract file title
  title=$(head -n 1 "$file" | sed 's/^# //')
  echo -e "\n### From: $file\n" >> "$output_file"
  echo -e "**Source**: $title\n" >> "$output_file"
  
  # Key section headers to extract
  section_headers=(
    "Implementation" "Progress" "Status" "Timeline" "Milestone" 
    "Feature" "Version" "Changelog" "History" "Completed" 
    "Added" "Fixed" "Updated" "Integration" "Analysis"
  )
  
  # Extract sections with headers matching key terms
  for header in "${section_headers[@]}"; do
    if grep -q "^##.*$header" "$file"; then
      echo "Found '$header' section in $file"
      # Extract the section (from header to next header or EOF)
      sed -n "/^##.*$header/,/^##/p" "$file" | sed '$d' >> "$output_file"
      echo -e "\n" >> "$output_file"
    fi
  done
  
  # Extract specific lines with key indicators
  grep -n -E "progress|milestone|feature|version|implemented|completed|added|fixed|updated|integration" "$file" | 
  while IFS=: read -r line_num line_content; do
    # Get context (3 lines before and after)
    start=$((line_num - 3))
    end=$((line_num + 3))
    if [ $start -lt 1 ]; then start=1; fi
    
    # Extract the context block
    sed -n "${start},${end}p" "$file" >> "$output_file"
    echo -e "\n" >> "$output_file"
  done
}

# Extract dates from content
extract_dates() {
  local content="$1"
  grep -o -E "[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}" <<< "$content" || true
}

# Organize entries chronologically
organize_chronologically() {
  local input_file="$1"
  local output_file="$2"
  
  echo "Organizing entries chronologically..."
  
  # Create temporary files to hold entries with dates
  dated_entries=$(mktemp)
  undated_entries=$(mktemp)
  
  # Initialize files with empty content
  > "$dated_entries"
  > "$undated_entries"
  
  # Use a simpler approach to split the file into sections
  csplit -f "/tmp/section_" -b "%d.txt" "$input_file" '/^### From:/' '{*}' 2>/dev/null || true
  
  # Process each section
  shopt -s nullglob
  for section in /tmp/section_*.txt; do
    if [ ! -f "$section" ]; then
      echo "No sections found to process" >&2
      break
    fi
    
    section_content=$(cat "$section")
    dates=$(extract_dates "$section_content")
    
    if [ -n "$dates" ]; then
      # Take the earliest date in the section
      earliest_date=$(echo "$dates" | sort | head -n 1)
      # Add date prefix for sorting
      echo "${earliest_date}||${section_content}" >> "$dated_entries"
    else
      # Keep undated entries separately
      echo "$section_content" >> "$undated_entries"
    fi
  done
  
  # Sort entries by date and remove date prefix
  if [ -s "$dated_entries" ]; then
    sort -r "$dated_entries" | sed 's/^[0-9-/]*||//' > "$output_file"
  fi
  
  # Append undated entries at the end
  if [ -s "$undated_entries" ]; then
    cat "$undated_entries" >> "$output_file"
  fi
  
  # If no content was added, add a placeholder
  if [ ! -s "$output_file" ]; then
    echo -e "\n### No dated entries found\n\nNo chronological entries were found in the project documentation.\n" > "$output_file"
  fi
  
  # Clean up temporary files
  rm -f /tmp/section_*.txt "$dated_entries" "$undated_entries"
}

# Remove duplicate or near-duplicate content
remove_duplicates() {
  local input_file="$1"
  local output_file="$2"
  
  echo "Removing duplicate content..."
  
  # Create a temporary file for unique content
  unique_content=$(mktemp)
  > "$unique_content"
  
  # Read input file line by line
  while IFS= read -r line; do
    # Skip empty lines
    if [ -z "$line" ]; then
      echo "" >> "$unique_content"
      continue
    fi
    
    # Check if similar line already exists
    is_duplicate=0
    while IFS= read -r existing_line; do
      # Skip comparison with empty lines
      if [ -z "$existing_line" ]; then
        continue
      fi
      
      # Calculate similarity using Levenshtein distance
      similarity=$(echo -e "$line\n$existing_line" | awk '
        function min(a, b) { return a < b ? a : b }
        { 
          if (NR == 1) { s1 = $0; len1 = length($0) }
          if (NR == 2) { s2 = $0; len2 = length($0) }
        }
        END {
          if (len1 > 3 * len2 || len2 > 3 * len1) { print "0"; exit }
          split(s1, a, "")
          split(s2, b, "")
          for (i = 0; i <= len1; i++) d[i, 0] = i
          for (j = 0; j <= len2; j++) d[0, j] = j
          for (i = 1; i <= len1; i++)
            for (j = 1; j <= len2; j++)
              d[i, j] = min(min(d[i-1, j] + 1, d[i, j-1] + 1), d[i-1, j-1] + (a[i] != b[j]))
          sim = 1 - d[len1, len2] / (len1 > len2 ? len1 : len2)
          print sim
        }
      ')
      
      # If similarity is high enough, mark as duplicate
      if (( $(echo "$similarity > 0.8" | bc -l) )); then
        is_duplicate=1
        break
      fi
    done < "$unique_content"
    
    # If not a duplicate, add to unique content
    if [ $is_duplicate -eq 0 ]; then
      echo "$line" >> "$unique_content"
    fi
  done < "$input_file"
  
  # Copy unique content to output file
  cat "$unique_content" > "$output_file"
  
  # Clean up
  rm -f "$unique_content"
}

# Add development milestones from Git history
add_git_milestones() {
  local output_file="$1"
  
  echo "Adding development milestones from Git history..."
  
  echo -e "\n## Development Milestones from Git History\n" >> "$output_file"
  
  # Find significant commits
  git log --reverse --format="### %ad - %s%n%n%b%n" --date=short |
  grep -A 5 -B 1 -E "feature|milestone|implement|release|version|launch|deploy|major|initial" >> "$output_file"
}

# Identify migration to Firebase
identify_firebase_migration() {
  local output_file="$1"
  
  echo "Identifying Firebase migration..."
  
  # Look for Firebase-related commits
  if git log --grep="firebase" --format="%ad - %s" --date=short | grep -q "firebase"; then
    echo -e "\n## Firebase Migration\n" >> "$output_file"
    echo "Firebase integration history:" >> "$output_file"
    git log --grep="firebase" --format="- **%ad**: %s" --date=short >> "$output_file"
  fi
}

# Main function to consolidate project history
consolidate_history() {
  echo "Starting project history consolidation..."
  
  # Initialize history file
  initialize_history_file
  
  # Find all markdown files
  md_files=$(find_history_files)
  
  # Process each file
  raw_content=$(mktemp)
  chronological_content=$(mktemp)
  unique_content=$(mktemp)
  
  # Initialize files with empty content
  > "$raw_content"
  > "$chronological_content"
  > "$unique_content"
  
  for file in $md_files; do
    extract_sections "$file" "$raw_content"
  done
  
  # Organize entries chronologically
  organize_chronologically "$raw_content" "$chronological_content"
  
  # Remove duplicates
  remove_duplicates "$chronological_content" "$unique_content"
  
  # Check if unique content exists and has content
  if [ -s "$unique_content" ]; then
    # Finalize the history file
    cat "$unique_content" >> "$HISTORY_FILE"
  else
    echo "No unique content found to add to history file."
    # Add a placeholder message
    echo -e "\nNo historical content found in markdown files. This file will be updated as project progresses.\n" >> "$HISTORY_FILE"
  fi
  
  # Add Git milestones
  add_git_milestones "$HISTORY_FILE"
  
  # Identify Firebase migration
  identify_firebase_migration "$HISTORY_FILE"
  
  # Add a timestamp
  echo -e "\n---\nLast consolidated: $(date)" >> "$HISTORY_FILE"
  
  # Clean up
  rm -f "$raw_content" "$chronological_content" "$unique_content"
  
  echo "Project history consolidation complete. See $HISTORY_FILE"
}

# Add to existing history without full reprocessing
update_history() {
  echo "Updating project history with recent changes..."
  
  # Backup existing history file
  if [ -f "$HISTORY_FILE" ]; then
    cp "$HISTORY_FILE" "$HISTORY_FILE.bak"
  else
    consolidate_history
    return
  fi
  
  # Get recent commits
  recent_commits=$(mktemp)
  echo -e "\n## Recent Updates ($(date +%Y-%m-%d))\n" > "$recent_commits"
  git log --since="7 days ago" --format="- **%ad**: %s" --date=short >> "$recent_commits"
  
  # Prepend to history file (after the header)
  sed -i "4r $recent_commits" "$HISTORY_FILE"
  
  # Clean up
  rm -f "$recent_commits"
  
  echo "Project history updated with recent changes."
}

# Set up automatic updates
setup_auto_updates() {
  # Create a Git hook to update history on significant commits
  mkdir -p .git/hooks
  
  cat > .git/hooks/post-commit << 'HOOK'
#!/bin/bash
# Update project history after significant commits
commit_msg=$(git log -1 --pretty=%B)
if echo "$commit_msg" | grep -q -E "feature|milestone|implement|add|fix|update|improve|enhance|major|release"; then
  echo "Significant commit detected. Updating project history..."
  ./scripts/consolidate_project_history.sh update
fi
HOOK
  
  chmod +x .git/hooks/post-commit
  
  # Set up weekly cron job
  (crontab -l 2>/dev/null || true; echo "0 9 * * 1 cd $(pwd) && ./scripts/consolidate_project_history.sh update") | crontab -
  
  echo "Automatic history updates configured:"
  echo "- Git hook will update history on significant commits"
  echo "- Weekly cron job will update history every Monday at 9 AM"
}

# Show help
show_help() {
  echo "Project History Consolidation"
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  consolidate      Perform full consolidation of all project history"
  echo "  update           Update existing history with recent changes"
  echo "  setup            Set up automatic history updates"
  echo "  help             Show this help message"
}

# Main command handler
case "${1:-consolidate}" in
  consolidate)
    consolidate_history
    ;;
  update)
    update_history
    ;;
  setup)
    setup_auto_updates
    ;;
  help|*)
    show_help
    ;;
esac