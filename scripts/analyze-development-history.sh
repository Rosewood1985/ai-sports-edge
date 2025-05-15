#!/bin/bash
# analyze-development-history.sh
# Script to analyze the development history of the AI Sports Edge project
# Created: May 11, 2025

# Set up output directory
OUTPUT_DIR="docs/project-analysis"
mkdir -p "$OUTPUT_DIR"

echo "Analyzing AI Sports Edge development history..."

# Function to extract git commit history
extract_git_history() {
  echo "# Development History" > "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## Commit Timeline" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot extract commit history." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # Get commit history
  echo "| Date | Author | Commit Message | Hash |" >> "$OUTPUT_DIR/development-history.md"
  echo "|------|--------|----------------|------|" >> "$OUTPUT_DIR/development-history.md"
  
  git log --pretty=format:"|%ad|%an|%s|%h|" --date=short | head -100 >> "$OUTPUT_DIR/development-history.md"
  
  # Add note about truncated history
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "*Note: This is a truncated history showing only the 100 most recent commits.*" >> "$OUTPUT_DIR/development-history.md"
}

# Function to analyze feature development
analyze_feature_development() {
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## Feature Development Timeline" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot analyze feature development." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # Define key features to track
  features=(
    "atomic"
    "subscription"
    "payment"
    "firebase"
    "stripe"
    "notification"
    "analytics"
    "spanish"
    "localization"
    "authentication"
    "deployment"
    "referral"
    "odds"
    "betting"
    "microtransaction"
  )
  
  echo "| Feature | First Commit | Latest Commit | Commit Count |" >> "$OUTPUT_DIR/development-history.md"
  echo "|---------|-------------|---------------|--------------|" >> "$OUTPUT_DIR/development-history.md"
  
  for feature in "${features[@]}"; do
    # Get first commit for feature
    first_commit=$(git log --pretty=format:"%h|%ad|%s" --date=short --grep="$feature" | tail -1)
    first_hash=$(echo "$first_commit" | cut -d'|' -f1)
    first_date=$(echo "$first_commit" | cut -d'|' -f2)
    
    # Get latest commit for feature
    latest_commit=$(git log --pretty=format:"%h|%ad|%s" --date=short --grep="$feature" | head -1)
    latest_hash=$(echo "$latest_commit" | cut -d'|' -f1)
    latest_date=$(echo "$latest_commit" | cut -d'|' -f2)
    
    # Count commits for feature
    commit_count=$(git log --pretty=format:"%h" --grep="$feature" | wc -l)
    
    # Skip if no commits found
    if [ -z "$first_hash" ]; then
      continue
    fi
    
    echo "| $feature | $first_date ($first_hash) | $latest_date ($latest_hash) | $commit_count |" >> "$OUTPUT_DIR/development-history.md"
  done
}

# Function to analyze file changes over time
analyze_file_changes() {
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## File Changes Over Time" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot analyze file changes." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # Get file change statistics
  echo "| File Type | Files Added | Files Modified | Files Deleted |" >> "$OUTPUT_DIR/development-history.md"
  echo "|-----------|-------------|----------------|---------------|" >> "$OUTPUT_DIR/development-history.md"
  
  # JavaScript files
  js_added=$(git log --diff-filter=A --name-only --pretty=format: | grep "\.js$" | wc -l)
  js_modified=$(git log --diff-filter=M --name-only --pretty=format: | grep "\.js$" | wc -l)
  js_deleted=$(git log --diff-filter=D --name-only --pretty=format: | grep "\.js$" | wc -l)
  echo "| JavaScript (.js) | $js_added | $js_modified | $js_deleted |" >> "$OUTPUT_DIR/development-history.md"
  
  # TypeScript files
  ts_added=$(git log --diff-filter=A --name-only --pretty=format: | grep "\.ts$" | wc -l)
  ts_modified=$(git log --diff-filter=M --name-only --pretty=format: | grep "\.ts$" | wc -l)
  ts_deleted=$(git log --diff-filter=D --name-only --pretty=format: | grep "\.ts$" | wc -l)
  echo "| TypeScript (.ts) | $ts_added | $ts_modified | $ts_deleted |" >> "$OUTPUT_DIR/development-history.md"
  
  # React component files
  tsx_added=$(git log --diff-filter=A --name-only --pretty=format: | grep "\.tsx$" | wc -l)
  tsx_modified=$(git log --diff-filter=M --name-only --pretty=format: | grep "\.tsx$" | wc -l)
  tsx_deleted=$(git log --diff-filter=D --name-only --pretty=format: | grep "\.tsx$" | wc -l)
  echo "| React Components (.tsx) | $tsx_added | $tsx_modified | $tsx_deleted |" >> "$OUTPUT_DIR/development-history.md"
  
  # Documentation files
  md_added=$(git log --diff-filter=A --name-only --pretty=format: | grep "\.md$" | wc -l)
  md_modified=$(git log --diff-filter=M --name-only --pretty=format: | grep "\.md$" | wc -l)
  md_deleted=$(git log --diff-filter=D --name-only --pretty=format: | grep "\.md$" | wc -l)
  echo "| Documentation (.md) | $md_added | $md_modified | $md_deleted |" >> "$OUTPUT_DIR/development-history.md"
  
  # Configuration files
  config_added=$(git log --diff-filter=A --name-only --pretty=format: | grep -E "\.(json|yml|yaml|config)$" | wc -l)
  config_modified=$(git log --diff-filter=M --name-only --pretty=format: | grep -E "\.(json|yml|yaml|config)$" | wc -l)
  config_deleted=$(git log --diff-filter=D --name-only --pretty=format: | grep -E "\.(json|yml|yaml|config)$" | wc -l)
  echo "| Configuration | $config_added | $config_modified | $config_deleted |" >> "$OUTPUT_DIR/development-history.md"
}

# Function to analyze code migration patterns
analyze_migration_patterns() {
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## Code Migration Patterns" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot analyze migration patterns." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # JavaScript to TypeScript migration
  echo "### JavaScript to TypeScript Migration" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Count JavaScript and TypeScript files over time
  js_files_current=$(find . -name "*.js" | grep -v "node_modules" | wc -l)
  ts_files_current=$(find . -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | wc -l)
  
  echo "Current JavaScript files: $js_files_current" >> "$OUTPUT_DIR/development-history.md"
  echo "Current TypeScript files: $ts_files_current" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Look for commits mentioning migration
  echo "#### Migration Commits" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "| Date | Commit | Message |" >> "$OUTPUT_DIR/development-history.md"
  echo "|------|--------|---------|" >> "$OUTPUT_DIR/development-history.md"
  
  git log --pretty=format:"|%ad|%h|%s|" --date=short --grep="migrat\|convert\|typescript\|refactor" | grep -i "js\|typescript" | head -10 >> "$OUTPUT_DIR/development-history.md"
  
  # Atomic architecture migration
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "### Atomic Architecture Migration" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Count atomic files
  atomic_files=$(find ./atomic -type f | wc -l)
  echo "Current atomic architecture files: $atomic_files" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Look for commits mentioning atomic architecture
  echo "#### Atomic Architecture Commits" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "| Date | Commit | Message |" >> "$OUTPUT_DIR/development-history.md"
  echo "|------|--------|---------|" >> "$OUTPUT_DIR/development-history.md"
  
  git log --pretty=format:"|%ad|%h|%s|" --date=short --grep="atomic" | head -10 >> "$OUTPUT_DIR/development-history.md"
}

# Function to identify development milestones
identify_milestones() {
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## Development Milestones" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot identify milestones." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # Look for milestone-related commits
  milestone_keywords=(
    "release"
    "version"
    "milestone"
    "launch"
    "deploy"
    "complete"
    "finish"
    "implement"
    "phase"
  )
  
  echo "| Date | Milestone | Commit |" >> "$OUTPUT_DIR/development-history.md"
  echo "|------|-----------|--------|" >> "$OUTPUT_DIR/development-history.md"
  
  for keyword in "${milestone_keywords[@]}"; do
    git log --pretty=format:"|%ad|%s|%h|" --date=short --grep="$keyword" | grep -i -E "$keyword" | head -5 >> "$OUTPUT_DIR/development-history.md"
  done
  
  # Add note about milestone selection
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "*Note: Milestones are identified based on commit messages containing keywords like 'release', 'version', 'milestone', etc.*" >> "$OUTPUT_DIR/development-history.md"
}

# Function to analyze contributor statistics
analyze_contributors() {
  echo "" >> "$OUTPUT_DIR/development-history.md"
  echo "## Contributor Statistics" >> "$OUTPUT_DIR/development-history.md"
  echo "" >> "$OUTPUT_DIR/development-history.md"
  
  # Check if git is available and this is a git repository
  if ! command -v git &> /dev/null || ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Git is not available or this is not a git repository. Cannot analyze contributors." >> "$OUTPUT_DIR/development-history.md"
    return
  fi
  
  # Get contributor statistics
  echo "| Author | Commits | First Contribution | Latest Contribution |" >> "$OUTPUT_DIR/development-history.md"
  echo "|--------|---------|-------------------|---------------------|" >> "$OUTPUT_DIR/development-history.md"
  
  git shortlog -sn --no-merges | while read count author; do
    # Get first contribution
    first_commit=$(git log --author="$author" --pretty=format:"%ad" --date=short | tail -1)
    
    # Get latest contribution
    latest_commit=$(git log --author="$author" --pretty=format:"%ad" --date=short | head -1)
    
    echo "| $author | $count | $first_commit | $latest_commit |" >> "$OUTPUT_DIR/development-history.md"
  done
}

# Function to create architectural overview
create_architectural_overview() {
  echo "# Architectural Overview" > "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## System Architecture" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "AI Sports Edge follows a modern mobile application architecture with the following key components:" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "1. **Frontend**: React Native (Expo) application with TypeScript" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "2. **Backend**: Firebase Cloud Functions and Firestore" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "3. **Authentication**: Firebase Authentication" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "4. **Payment Processing**: Stripe integration" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "5. **Push Notifications**: OneSignal integration" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "6. **Analytics**: Firebase Analytics" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## Atomic Design Architecture" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "The frontend follows the Atomic Design methodology with components organized into:" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- **Atoms**: Basic building blocks (buttons, inputs, icons)" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- **Molecules**: Groups of atoms functioning together (form fields, search bars)" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- **Organisms**: Complex UI components (headers, forms, cards)" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- **Templates**: Page layouts without specific content" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- **Pages**: Specific instances of templates with real content" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## Data Flow" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "The application follows a unidirectional data flow pattern:" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "1. User interactions trigger events" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "2. Events are handled by service modules" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "3. Services communicate with Firebase/external APIs" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "4. Data is returned to the UI components" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "5. UI is updated to reflect the new state" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## Key Subsystems" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "### Authentication System" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Firebase Authentication for user management" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Custom authentication hooks for React components" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Role-based access control" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "### Payment System" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Stripe integration for payment processing" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Subscription management" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- One-time purchases" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Microtransactions" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "### Notification System" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- OneSignal for push notifications" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- In-app notifications" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Scheduled notifications" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "### Analytics System" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- User behavior tracking" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Conversion tracking" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- A/B testing" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "### Localization System" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Multi-language support (English/Spanish)" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Region-specific content" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## Deployment Architecture" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Mobile app deployed through app stores" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Web version deployed to GoDaddy via SFTP" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Firebase Functions deployed to Google Cloud" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Continuous integration with GitHub Actions" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  
  echo "## Future Architecture Considerations" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Complete migration to TypeScript" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Further adoption of atomic design principles" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Enhanced offline capabilities" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Performance optimizations" >> "$OUTPUT_DIR/architectural-overview.md"
  echo "- Improved test coverage" >> "$OUTPUT_DIR/architectural-overview.md"
}

# Run all analysis functions
extract_git_history
analyze_feature_development
analyze_file_changes
analyze_migration_patterns
identify_milestones
analyze_contributors
create_architectural_overview

echo "Development history analysis complete. Reports generated in $OUTPUT_DIR"