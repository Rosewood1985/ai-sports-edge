# .roocode Directory

This directory contains configuration, logs, and checkpoints for the Roocode utility suite.

## Structure

```
.roocode/
├── checkpoints/           # Active operation checkpoints
│   ├── completed/        # Archived completed operations
│   └── corrupted/        # Corrupted checkpoints for debugging
├── logs/                 # Operation logs
│   ├── *.log             # Detailed operation logs
│   ├── *.progress.json   # Final progress state
│   └── *.summary.json    # Operation summaries
└── tool_usage.log        # Tool usage tracking
```

## Checkpoints

Checkpoints are used by the Progress Backfilling System to save the state of long-running operations. Each checkpoint is a JSON file containing:

- Operation ID
- Start time
- Total files
- Processed files
- State
- Checkpoints
- Operations

Checkpoints are automatically created during operations and can be used to resume interrupted operations.

## Logs

Logs contain detailed information about operations, including:

- File operations
- Group operations
- Checkpoints
- Errors
- Completion status

Logs are used for debugging, auditing, and generating reports.

## Tool Usage

The `tool_usage.log` file tracks the usage of Roocode tools, including:

- Tool name
- Start time
- End time
- Duration
- Success/failure status
- Command-line arguments

This information is used for monitoring and improving the tools.

## Maintenance

To clean up old checkpoints and logs:

```bash
# Clean up checkpoints older than 30 days
./scripts/roo-duplicates.js clean --older-than 30

# Clean up historical analysis operations older than 30 days
./scripts/roo-history-analyze.js clean --older-than 30

# Clean up complete analysis operations older than 30 days
./scripts/roo-complete-analysis.js clean --older-than 30