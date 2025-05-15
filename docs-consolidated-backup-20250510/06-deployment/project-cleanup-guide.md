# AI Sports Edge Project Cleanup Guide

This guide provides instructions for using the project cleanup tools and understanding the project structure analysis.

## Overview

The AI Sports Edge project has evolved over time, resulting in a complex structure with duplicate files, multiple implementations of core functionality, and inconsistent patterns. This guide will help you understand the project structure and use the cleanup tools to improve maintainability.

## Understanding the Analysis

We've created several analysis documents to help understand the project structure:

1. **[Project Structure Analysis](./project-structure-analysis.md)** - Detailed analysis of the project file structure
2. **[Codebase Quality Analysis](./codebase-quality-analysis.md)** - In-depth analysis of code quality and patterns
3. **[Component Dependency Graph](./component-dependency-graph.md)** - Visual representation of component dependencies
4. **[Project Analysis Summary](./project-analysis-summary.md)** - High-level summary of all findings

These documents provide insights into the current state of the project and recommendations for improvement.

## Cleanup Tools

We've created two main scripts to help with the cleanup process:

1. **`scripts/cleanup_project.sh`** - Performs the actual cleanup tasks
2. **`scripts/schedule_cleanup.sh`** - Sets up automated cleanup on a regular schedule

### Using the Cleanup Script

The cleanup script performs the following tasks:

- Creates an archive directory structure
- Creates a Git backup branch
- Moves backup files to the archive
- Moves log files to the archive
- Updates .gitignore
- Generates a detailed report

To run the cleanup script:

```bash
# Make the script executable
chmod +x scripts/cleanup_project.sh

# Run the script
./scripts/cleanup_project.sh
```

After running the script, you'll find:

- An archive directory with backup files and logs
- A backup Git branch
- A detailed report in the status directory

### Setting Up Automated Cleanup

The scheduling script sets up a cron job to run the cleanup script on a regular basis. It also creates a GitHub Actions workflow for redundancy.

To set up automated cleanup:

```bash
# Make the script executable
chmod +x scripts/schedule_cleanup.sh

# Run the script
./scripts/schedule_cleanup.sh
```

The script will prompt you to select a schedule:

1. Weekly (Sunday at 1:00 AM)
2. Monthly (1st day of the month at 2:00 AM)
3. Daily (Every day at 3:00 AM)
4. Custom schedule

After selecting a schedule, the script will:

- Create a cron job
- Create a GitHub Actions workflow
- Generate a schedule record in the status directory

## Cleanup Phases

The cleanup process is divided into several phases:

### Phase 1: File Organization

- Create archive structure
- Move backup files to archive
- Update .gitignore

This phase is handled by the `cleanup_project.sh` script.

### Phase 2: Firebase Configuration Consolidation

- Standardize on the `/config/firebase.ts` implementation
- Update all imports to use the consolidated version
- Remove hardcoded credentials

This phase requires manual intervention after running the cleanup script.

### Phase 3: Component Organization

- Complete the migration to atomic design
- Standardize styling approaches
- Consolidate duplicate components

This phase requires manual intervention and should be done gradually.

### Phase 4: Code Quality Improvements

- Standardize error handling
- Update deprecated patterns
- Improve documentation

This phase should be done as part of ongoing development.

## Best Practices

To maintain a clean project structure going forward:

1. **Use Git for Backups**: Instead of creating backup files with `.bak` extensions, use Git branches for backups.

2. **Follow Atomic Design**: Organize components according to atomic design principles:
   - Atoms: Basic UI elements (Button, Input, Text)
   - Molecules: Combinations of atoms (Form, Card, Menu)
   - Organisms: Complex UI components (Header, Footer, Sidebar)
   - Templates: Page layouts

3. **Standardize Error Handling**: Use a consistent error handling pattern across the codebase.

4. **Use Environment Variables**: Store configuration values in environment variables instead of hardcoding them.

5. **Document Code**: Add clear documentation for core services, authentication flow, and API endpoints.

## Monitoring Cleanup Progress

After running the cleanup script, you can monitor progress by:

1. Checking the cleanup report in the status directory
2. Reviewing the Git diff to see what files were moved
3. Verifying that the application still works correctly

For automated cleanup, you can:

1. Check the cron logs in the status/cron-logs directory
2. Review GitHub Actions runs in the repository

## Troubleshooting

If you encounter issues during the cleanup process:

1. **Restore from Backup**: The cleanup script creates a Git backup branch before making changes. You can restore from this branch if needed:

   ```bash
   git checkout backup-before-cleanup-TIMESTAMP
   ```

2. **Manual Cleanup**: If the automated cleanup fails, you can perform the tasks manually:

   ```bash
   # Create archive directory
   mkdir -p archive/backup-files archive/logs archive/deprecated-code archive/old-configs

   # Move backup files
   find . -name "*.bak" -exec mv {} archive/backup-files/ \;

   # Move log files
   find . -name "*.log" -exec mv {} archive/logs/ \;
   ```

3. **Check Logs**: Review the cleanup logs for error messages:

   ```bash
   cat archive/logs/cleanup_TIMESTAMP.log
   ```

## Conclusion

By following this guide and using the provided tools, you can improve the maintainability of the AI Sports Edge project. The cleanup process is designed to be gradual and non-disruptive, allowing you to continue development while improving the codebase.

Remember that cleanup is an ongoing process, not a one-time task. Regularly review the project structure and make improvements as needed.

## Additional Resources

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Firebase Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [React Native Best Practices](https://reactnative.dev/docs/performance)