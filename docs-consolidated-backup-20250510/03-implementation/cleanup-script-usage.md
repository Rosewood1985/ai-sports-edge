# AI Sports Edge Cleanup Script Usage Guide

This document provides instructions for using the enhanced cleanup script to organize and improve the AI Sports Edge project structure.

## Overview

The `cleanup_project.sh` script automates the process of cleaning up the project structure by:

1. Checking Git status and creating a cleanup branch
2. Moving backup files to an archive directory
3. Organizing log files
4. Updating .gitignore
5. Staging, committing, and optionally pushing changes

## Prerequisites

- Git installed and configured
- Bash shell environment
- Execute permissions on the script

## Basic Usage

```bash
# Make the script executable (if not already)
chmod +x scripts/cleanup_project.sh

# Run the script without pushing changes
./scripts/cleanup_project.sh

# Run the script and push changes to remote
./scripts/cleanup_project.sh -p
```

## Features

### Git Integration

The script includes comprehensive Git integration:

1. **Git Status Check**: Verifies the current Git status and warns about uncommitted changes
2. **Cleanup Branch**: Creates a dedicated cleanup branch or uses an existing one
3. **Backup Branch**: Creates a backup branch before making any changes
4. **Automatic Staging**: Stages all changes made during cleanup
5. **Commit Prompt**: Prompts for a commit message with a meaningful default
6. **Push Option**: Optionally pushes changes to the remote repository
7. **Verification**: Verifies that changes were successfully committed

### File Organization

The script organizes files by:

1. **Archive Structure**: Creates an organized archive directory structure
2. **Backup Files**: Moves `.bak` and `.backup` files to the archive
3. **Log Files**: Moves log files to a dedicated logs directory
4. **Timestamped Files**: Identifies and moves files with timestamp suffixes
5. **Configuration Files**: Archives old webpack configurations
6. **Firebase Files**: Archives deprecated Firebase implementations

### Reporting

The script generates detailed reports:

1. **Cleanup Log**: Records all actions taken during the cleanup process
2. **Status Report**: Creates a markdown report with statistics and next steps
3. **Console Output**: Provides color-coded console output for better readability

## Command Line Options

| Option | Description |
|--------|-------------|
| `-p` | Automatically push changes to the remote repository after committing |

## Workflow

When you run the script, it follows this workflow:

1. **Check Environment**: Verifies Git status and current branch
2. **Create Branches**: Creates cleanup and backup branches
3. **Organize Files**: Moves files to the appropriate archive directories
4. **Update Configuration**: Updates .gitignore with improved patterns
5. **Generate Reports**: Creates detailed logs and reports
6. **Stage Changes**: Automatically stages all changes
7. **Commit Changes**: Prompts for a commit message and commits changes
8. **Push Changes**: Optionally pushes changes to the remote repository

## Example Output

```
[12:34:56] Checking Git status...
[12:34:56] Current branch: main
[12:34:56] Creating cleanup branch: cleanup-project-20250509_123456
[12:34:57] Creating archive directory structure...
[12:34:57] Starting project cleanup...
[12:34:57] Creating Git backup branch...
[12:34:58] Found 15 .bak files
[12:34:58] Found 23 .log files
[12:34:58] Found 7 timestamped log files
[12:34:59] Moving backup files to archive...
[12:35:00] Moving log files to archive...
[12:35:01] Moving timestamped files to archive...
[12:35:02] Moving old webpack configs to archive...
[12:35:03] Moving deprecated Firebase implementations to archive...
[12:35:04] Updating .gitignore...
[12:35:05] Cleanup completed successfully!
[12:35:05] Staging changes...
[12:35:06] Changes ready to commit.
[12:35:06] Default commit message: Project cleanup: Organize files and improve structure
[12:35:10] Committing changes...
[12:35:11] Changes committed successfully!
[12:35:11] To push changes to remote, run: git push origin cleanup-project-20250509_123456
[12:35:11] Cleanup process completed!
```

## Troubleshooting

If you encounter issues:

1. **Script Fails to Run**: Ensure the script has execute permissions with `chmod +x scripts/cleanup_project.sh`
2. **Git Errors**: Verify that you have Git installed and configured correctly
3. **Permission Errors**: Ensure you have write permissions to the directories being modified
4. **Commit Failures**: Check Git configuration for user.name and user.email settings

## Restoring from Backup

If you need to revert the changes:

```bash
# Switch to the backup branch
git checkout backup-before-cleanup-TIMESTAMP

# Create a new branch from the backup
git checkout -b restore-from-backup

# Push the restored branch
git push origin restore-from-backup
```

## Integration with Scheduled Cleanup

The cleanup script can be scheduled to run automatically using the `schedule_cleanup.sh` script:

```bash
# Set up scheduled cleanup
./scripts/schedule_cleanup.sh
```

This will create a cron job and GitHub Actions workflow to run the cleanup script on a regular schedule.

## Conclusion

The cleanup script provides a comprehensive solution for maintaining a clean and organized project structure. By running it regularly, you can ensure that the project remains free of clutter and follows best practices for file organization.