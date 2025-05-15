# AI Sports Edge Project Tools Guide

This guide provides an overview of all the tools created for the AI Sports Edge project, including Firebase integration, project analysis, workflow automation, file organization, team velocity tracking, and implementation status checks.

## Table of Contents

1. [Firebase Hosting Integration](#firebase-hosting-integration)
2. [Firebase Migration Tracking](#firebase-migration-tracking)
3. [Project Analysis Tools](#project-analysis-tools)
4. [Admin Dashboard Finder](#admin-dashboard-finder)
5. [File Organization Tools](#file-organization-tools)
6. [Workflow Tools](#workflow-tools)
7. [Team Velocity Tracking](#team-velocity-tracking)
8. [Implementation Status Checks](#implementation-status-checks)
9. [Session Management](#session-management)
10. [File Duplication Prevention](#file-duplication-prevention)

## Firebase Hosting Integration

Tools for deploying the AI Sports Edge app to Firebase Hosting with custom domain support.

### Scripts

- `scripts/integrate_existing_design.js`: Consolidates web assets for Firebase hosting
- `scripts/update_firebase_config.js`: Configures Firebase with security headers and custom domains
- `scripts/deploy-to-firebase.sh`: One-command deployment script
- `.github/workflows/firebase-deploy.yml`: GitHub Actions automated deployment

### Documentation

- `docs/firebase-custom-domain-setup.md`: Instructions for setting up DNS records for custom domain
- `docs/firebase-github-actions-setup.md`: Guide for configuring GitHub Actions with Firebase
- `docs/firebase-hosting-integration.md`: Overview of the Firebase hosting integration architecture

### Usage

```bash
# Deploy to production
./scripts/deploy-to-firebase.sh

# Deploy to preview channel
./scripts/test-deployment.sh --preview
```

## Firebase Migration Tracking

Tools for tracking and managing the migration of Firebase code to the atomic architecture pattern.

### Scripts

- `scripts/firebase-migration-tracker.sh`: Tracks migration status and generates reports
- `scripts/migrate-to-firebase-service.js`: Analyzes files for Firebase usage
- `scripts/create-migration-example.js`: Creates migration examples
- `scripts/migrate-firebase-file.js`: Automatically migrates simple files
- `scripts/test-migrated-files.sh`: Tests migrated files

### Documentation

- `docs/firebase-migration-process.md`: Comprehensive guide for the Firebase migration process

### Usage

```bash
# Start migration phase
./scripts/firebase-migration-tracker.sh start-phase critical_components

# Analyze a file
node scripts/migrate-to-firebase-service.js --analyze src/path/to/file.js

# Create migration example
node scripts/create-migration-example.js src/path/to/file.js

# Migrate a file
node scripts/migrate-firebase-file.js src/path/to/file.js

# Test migrated file
./scripts/test-migrated-files.sh run-file src/path/to/file.test.js

# Check migration status
./scripts/firebase-migration-tracker.sh status
```

## Project Analysis Tools

Tools for analyzing the codebase and tracking project progress.

### Scripts

- `scripts/generate-implementation-status.js`: Analyzes codebase to determine implementation status
- `scripts/find-recent-files.sh`: Finds recently created/modified files

### Usage

```bash
# Generate implementation status report
./scripts/generate-implementation-status.js > status/current-status.md

# Find recently modified files (last 7 days)
./scripts/find-recent-files.sh

# Find files modified in the last 30 days
./scripts/find-recent-files.sh --days 30
```

## Admin Dashboard Finder

Tools for locating and analyzing admin dashboard components.

### Scripts

- `scripts/find-admin-dashboard.sh`: Searches for admin dashboard files and generates a report
- `.roocode/dashboard_finder.js`: Helper script to display dashboard search results

### Usage

```bash
# Find admin dashboard components
./scripts/find-admin-dashboard.sh

# Display dashboard search results
node .roocode/dashboard_finder.js
```

## File Organization Tools

Tools for organizing and maintaining a clean file structure.

### Scripts

- `scripts/auto-organize.sh`: Automatically organizes orphaned files into appropriate directories
- Integration with `scripts/find-admin-dashboard.sh` to detect orphaned files during searches

### Usage

```bash
# Organize specific files
./scripts/auto-organize.sh path/to/file1.js path/to/file2.css

# Find and organize orphaned files
./scripts/find-admin-dashboard.sh
```

## Workflow Tools

Tools for streamlining development workflows and tracking project status.

### Scripts

- `.vscode/tasks.json`: VSCode tasks for common operations
- `scripts/generate-weekly-status.sh`: Generates comprehensive weekly status reports
- `scripts/test-deployment.sh`: Deploys to Firebase preview channels for testing
- `.roocode/tool_usage.log`: Tracks usage of scripts and tools

### Usage

```bash
# Generate weekly status report
./scripts/generate-weekly-status.sh

# Test deployment to preview channel
./scripts/test-deployment.sh --preview
```

## Team Velocity Tracking

Tools for tracking and visualizing team velocity metrics.

### Scripts

- `src/components/VelocityChart.jsx`: React Native component for visualizing team velocity metrics
- `scripts/generate-velocity-data.js`: Analyzes git commits, migration logs, and project data to generate velocity metrics

### Usage

```bash
# Generate velocity data
./scripts/generate-velocity-data.js
```

### Integration in Dashboard

```jsx
// Import the VelocityChart component
import VelocityChart from '../components/VelocityChart';

// Add to your dashboard component
function Dashboard() {
  return (
    <View>
      {/* Other dashboard components */}
      <VelocityChart timespan={8} />
    </View>
  );
}
```

## Implementation Status Checks

Tools for analyzing the implementation status of key user-facing components.

### Scripts

- `scripts/dashboard-status-check.sh`: Analyzes the user dashboard implementation status
- `scripts/onboarding-status-check.sh`: Analyzes the user onboarding implementation status

### Usage

```bash
# Check dashboard implementation status
./scripts/dashboard-status-check.sh

# Check onboarding implementation status
./scripts/onboarding-status-check.sh
```

## VSCode Tasks

All tools are available as VSCode tasks. To run a task:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select from the available tasks:
   - Deploy to Firebase
   - Check Implementation Status
   - Find Admin Dashboard
   - Check Firebase Migration Status
   - Generate Weekly Status Report
   - Test Deployment to Preview Channel
   - Organize Orphaned Files
   - Generate Velocity Data
   - Check Dashboard Status
   - Check Onboarding Status

## Session Management

Tools for managing daily work sessions with Roo, providing continuity between sessions and tracking project progress.

### Scripts

- `scripts/start-session.sh`: Generates a beginning-of-day session template with project status and focus areas
- `scripts/close-session.sh`: Generates an end-of-day session summary with project status and progress

### Features

- Automatically collects status information from various project components
- Extracts information from previous sessions to maintain context
- Identifies recently modified files and open tasks
- Includes recommendations from dashboard and onboarding status checks
- Maintains a record of all sessions in `.roocode/sessions/` directory

### Usage

```bash
# Start a new session (beginning of day)
./scripts/start-session.sh

# Close the current session (end of day)
./scripts/close-session.sh
```

The scripts will generate templates that you can copy and paste to Roo to start or end a session. These templates include:

- Current project status
- Recently modified files
- Open tasks
- Focus areas for the day
- Recommendations for dashboard and onboarding improvements

## File Duplication Prevention

Tools for detecting and preventing file duplication in the codebase, helping maintain a clean and efficient project structure.

### Scripts

- `scripts/prevent-duplicates.js`: Main script to detect potential file duplicates
- `scripts/libs/file-similarity.js`: Library for calculating file similarity

### Features

- Filename similarity detection using Levenshtein distance algorithm
- Configurable similarity threshold (currently 70%)
- Actionable recommendations for handling duplicates
- Decision logging prompts for documenting decisions

### Usage

```bash
# Check for duplicate files
./scripts/prevent-duplicates.js
```

This script will:
1. Scan files in the project
2. Calculate similarity scores between filenames
3. Report potential duplicates with similarity scores
4. Provide recommendations for handling duplicates

### Future Enhancements

The current implementation focuses on filename similarity. Future enhancements will include:
- Content similarity detection using tokenization
- TF-IDF algorithm for more accurate content comparison
- Pre-commit Git hook for automatic checking
- Decision logger component for tracking decisions
- Comprehensive reporting capabilities

## Logging

All script executions are logged to `.roocode/tool_usage.log` for tracking and auditing purposes.