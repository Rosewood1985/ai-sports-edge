# `.cronrc` System Documentation

## Overview

The `.cronrc` system provides a declarative approach to recurring tasks using a simple configuration file. It allows you to define tasks with their intervals, labels, and commands, which are then executed automatically at the specified intervals.

## How It Works

The system consists of three main components:

1. **`.cronrc` File**: A configuration file in the project root that defines recurring tasks
2. **`cronrc-runner.js`**: A Node.js script that reads the `.cronrc` file and executes tasks
3. **`start-cronrc.sh`**: A shell script that starts the runner in the background

When the system starts, it reads the `.cronrc` file, parses each task definition, and sets up timers to execute each task at its specified interval. Task execution is logged to files in the `logs/cronrc` directory.

## `.cronrc` File Format

The `.cronrc` file uses a simple format:

```
<interval> <label> <command>
```

Where:
- **interval**: The time interval between executions (e.g., `3m` for 3 minutes, `1h` for 1 hour)
- **label**: A unique identifier for the task (used in logs and status reports)
- **command**: The command to execute (can include arguments)

Example:
```
3m save-context ./scripts/save-context.sh "[AUTO] Recurring context save"
10m tag-scan ./scripts/tag-context.sh --auto
15m update-progress ./scripts/clean-and-sort-progress.sh
1h checkpoint ./scripts/update-memory-bank.js --checkpoint
```

### Supported Intervals

- Minutes: `3m`, `5m`, `10m`, etc.
- Hours: `1h`, `2h`, etc.

## Managing the `.cronrc` System

### Starting the System

To start the `.cronrc` system:

```bash
./scripts/start-cronrc.sh
```

This will start the `cronrc-runner.js` script in the background and ensure it continues running even after the terminal is closed.

### Checking Status

To check the status of the `.cronrc` system:

```bash
./scripts/start-cronrc.sh --status
```

This will show:
- Whether the system is running
- The process ID (PID)
- Uptime
- Recent log entries
- Active tasks from the `.cronrc` file

### Restarting the System

To restart the `.cronrc` system:

```bash
./scripts/start-cronrc.sh --restart
```

This will stop the current instance (if running) and start a new one.

### Stopping the System

To stop the `.cronrc` system:

```bash
kill $(cat logs/cronrc/cronrc-runner.pid)
```

## Adding New Tasks

To add a new task:

1. Edit the `.cronrc` file in the project root
2. Add a new line in the format: `<interval> <label> <command>`
3. Restart the `.cronrc` system to apply the changes

Example:
```
# Add a new task to run every 30 minutes
30m backup-data ./scripts/backup-data.sh --incremental
```

## Monitoring and Troubleshooting

### Log Files

The `.cronrc` system creates log files in the `logs/cronrc` directory:

- **`cronrc-runner.log`**: Main log file for the runner
- **`<label>-<timestamp>.log`**: Individual log files for each task execution

To view the main log:

```bash
tail -f logs/cronrc/cronrc-runner.log
```

### Common Issues

#### Task Not Running

If a task is not running as expected:

1. Check the status: `./scripts/start-cronrc.sh --status`
2. Verify the task is defined correctly in `.cronrc`
3. Check the log files for errors
4. Ensure the command being executed exists and is executable

#### Runner Not Starting

If the runner fails to start:

1. Check if it's already running: `ps aux | grep cronrc-runner`
2. Verify the `.cronrc` file exists and is formatted correctly
3. Check the log file for startup errors
4. Ensure Node.js is installed and available

## Automatic Startup

The `.cronrc` system is configured to start automatically when the container starts. This is done by adding an entry to the user's `.bashrc` file.

To disable automatic startup, remove the following lines from `.bashrc`:

```bash
# Start cronrc-runner on container startup
if [ -f "/workspaces/ai-sports-edge/scripts/start-cronrc.sh" ]; then
  /workspaces/ai-sports-edge/scripts/start-cronrc.sh > /dev/null 2>&1
fi
```

## Implementation Details

### Task Execution

Tasks are executed using Node.js's `child_process.spawn` function, which allows for non-blocking execution. Each task runs in its own process, and output is captured and logged to a file.

### Log Rotation

The system automatically rotates log files to prevent disk space issues. By default, log files older than 7 days are deleted.

### Error Handling

If a task fails (exits with a non-zero status code), the error is logged, but the task will continue to be scheduled for future executions. This ensures that temporary failures don't permanently disable a task.

## Best Practices

1. **Use Descriptive Labels**: Choose task labels that clearly indicate what the task does
2. **Keep Commands Simple**: For complex operations, create a script and call it from `.cronrc`
3. **Avoid Overlapping Executions**: Set intervals that give tasks enough time to complete
4. **Monitor Logs**: Regularly check the logs to ensure tasks are running as expected
5. **Backup Before Editing**: Make a backup of `.cronrc` before making changes

## Security Considerations

The `.cronrc` system executes commands with the same permissions as the user who started it. Ensure that:

1. Only trusted commands are added to `.cronrc`
2. Scripts called from `.cronrc` have appropriate permissions
3. Sensitive operations are properly authenticated

## Extending the System

The `.cronrc` system can be extended in several ways:

1. **Web Dashboard**: Create a web interface to monitor and manage tasks
2. **Notifications**: Add support for notifications when tasks fail
3. **Dependencies**: Implement task dependencies (e.g., Task B runs only after Task A completes)
4. **Conditional Execution**: Add support for conditions that determine whether a task should run