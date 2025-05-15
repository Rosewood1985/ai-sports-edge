# Context Checkpoint System

## Overview

The Context Checkpoint System is a robust framework designed to enforce consistent behavior across development sessions. It provides a centralized configuration mechanism that defines the current operational mode, behavior flags, and runtime expectations.

This system ensures that all development activities adhere to the specified constraints and configurations, preventing accidental violations of project guidelines and maintaining consistency across sessions.

## Key Components

### 1. Context Checkpoint File

The core of the system is the `/context/latest-checkpoint.md` file, which serves as a required boot context file. This file defines:

- **Primary Mode**: The main operational mode (e.g., cleaning-only, generation-allowed, read-only)
- **Behavior Flags**: Optional flags that modify behavior (e.g., no new file creation, format with Prettier)
- **Restrictions**: Specific limitations on operations
- **Active Tracking**: References to important tracking files
- **Runtime Expectations**: Specific behaviors expected during runtime
- **Daily Recap Reminder**: Configuration for daily status recaps

### 2. Update Mechanism

The checkpoint file is automatically updated when:
- The current mode changes
- A file is marked complete or added in `/status/status-log.md`
- A memory-bank file is modified, consolidated, or archived
- A milestone is added in `/memory-bank/progress.md`

### 3. Enforcement System

At the beginning of every new session or context reload:
- The system pauses and reads the checkpoint file
- It enforces the selected primary mode and behavior flags
- If the checkpoint file is missing or corrupt, it notifies: "❗ Checkpoint missing. Awaiting reinitialization."

### 4. Daily Recap

The system generates a daily recap at 9 AM, combining information from:
- The batch review file (`/batch-review.md`)
- The status log (`/status/status-log.md`)

## Scripts

The system includes several scripts:

1. **`update-context-checkpoint.js/sh`**: Updates the checkpoint file based on triggers
2. **`enforce-context-checkpoint.js/sh`**: Enforces the behavior specified in the checkpoint
3. **`start-session-with-checkpoint.sh`**: Initializes a session with the checkpoint
4. **`generate-daily-recap.js/sh`**: Generates the daily recap
5. **`setup-daily-recap-cron.sh`**: Sets up a cron job for the daily recap
6. **`make-checkpoint-scripts-executable.sh`**: Makes all scripts executable

## NPM Scripts

The following npm scripts are available:

```bash
# Update the checkpoint file
npm run checkpoint:update

# Enforce the checkpoint behavior
npm run checkpoint:enforce

# Start a new session with the checkpoint
npm run checkpoint:start-session

# Generate a daily recap
npm run checkpoint:daily-recap

# Set up the daily recap cron job
npm run checkpoint:setup-cron

# Make all checkpoint scripts executable
npm run checkpoint:make-executable
```

## Primary Modes

The system supports the following primary modes:

- **cleaning-only**: Only code cleanup and refactoring allowed
- **generation-allowed**: Code generation is permitted
- **read-only**: No file modifications allowed
- **consolidation-mode**: Focus on memory bank consolidation
- **formatting-mode**: Focus on code formatting
- **deployment-mode**: Focus on deployment tasks
- **review-mode**: Focus on code review
- **test-mode**: Focus on testing

## Behavior Flags

Optional behavior flags include:

- **no new file creation allowed**: Prevents creation of new files
- **memory-bank consolidation active**: Enables memory bank consolidation
- **format with Prettier after each save**: Automatically formats files with Prettier
- **allow code generation for missing modules**: Permits generation of missing modules
- **auto-run test suite after file edits**: Runs tests automatically after edits
- **auto-trigger deploy after checkpoint update**: Triggers deployment after checkpoint updates
- **read-only for audit: no saves or formatting**: Enables read-only mode for audits

## Integration with Memory Bank

The Context Checkpoint System is tightly integrated with the Memory Bank system:
- It tracks changes to memory bank files
- It enforces memory bank consolidation when the appropriate flag is set
- It includes memory bank status in daily recaps

## Usage

### Initial Setup

1. Make all scripts executable:
   ```bash
   npm run checkpoint:make-executable
   ```

2. Set up the daily recap cron job:
   ```bash
   npm run checkpoint:setup-cron
   ```

### Starting a Session

To start a new session with the checkpoint system:
```bash
npm run checkpoint:start-session
```

### Updating the Checkpoint

To manually update the checkpoint file:
```bash
npm run checkpoint:update
```

### Generating a Daily Recap

To manually generate a daily recap:
```bash
npm run checkpoint:daily-recap
```

## Best Practices

1. **Always start sessions** with the checkpoint system to ensure consistent behavior
2. **Review the checkpoint file** before making significant changes
3. **Update the primary mode** when switching between different types of tasks
4. **Check daily recaps** to stay informed about project status
5. **Don't bypass the enforcement** mechanism, as it ensures project consistency

## Troubleshooting

If you encounter issues with the checkpoint system:

1. Check if the checkpoint file exists and is properly formatted
2. Ensure all scripts are executable
3. Check the logs in the `/logs` directory
4. Run the enforcement script manually to see any error messages
5. If the checkpoint file is corrupted, recreate it with the default structure