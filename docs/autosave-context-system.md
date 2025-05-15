# Automated Context Saving System

This document describes the automated context saving system that runs every 3 minutes to ensure continuous preservation of development context.

## System Components

1. **Cron Service**: Installed in the dev container to schedule regular context saves
2. **Node.js**: Required for the primary context saving mechanism
3. **Autosave Script**: Executes the memory bank update script
4. **Fallback Script**: Provides a bash-only alternative when Node.js is unavailable
5. **Logging System**: Maintains a record of all autosave operations

## How It Works

The system uses cron to run the `save-context.sh` script every 3 minutes. This script:

1. Logs the start time
2. Attempts to find the Node.js binary (checking multiple possible locations)
3. Runs the `update-memory-bank.js` script with the `--force` flag
4. Falls back to the bash-only solution if Node.js is unavailable or fails
5. Logs the completion time
6. Maintains a log file at `/workspaces/ai-sports-edge/logs/autosave.log`

## Fallback Mechanism

If Node.js is unavailable or the Node.js script fails, the system will automatically use a fallback bash-only solution:

1. The fallback script (`fallback-context-save.sh`) is a pure bash implementation
2. It updates timestamps in memory bank files
3. It maintains the `.last-update` file
4. It provides basic migration status updates
5. It logs all operations to the same log file
6. It creates a notification file at `/workspaces/ai-sports-edge/logs/fallback-notification.log`
7. It tracks usage statistics in `/workspaces/ai-sports-edge/logs/fallback-usage.json`

## System Verification

The system includes a verification script (`verify-context-systems.sh`) that checks the health of both primary and fallback systems:

1. It verifies the availability of Node.js and the primary update script
2. It checks if the fallback script exists and is executable
3. It confirms that the cron service is running
4. It creates a status report at `/workspaces/ai-sports-edge/logs/context-systems-status.json`
5. It automatically runs the fallback system if the primary system is unavailable

To run the verification script manually:

```bash
/workspaces/ai-sports-edge/scripts/verify-context-systems.sh
```

This is useful for troubleshooting or to check the current status of the context saving systems.

## Rebuild Instructions

After making changes to the automated context saving system, you need to rebuild the dev container for the changes to take effect:

### Option 1: Using VS Code Command Palette

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the command palette
2. Type "Dev Containers: Rebuild Container" and select it
3. Wait for the container to rebuild (this may take a few minutes)
4. Once the container is rebuilt, the automated context saving system will be active

### Option 2: Using Terminal

1. Open a terminal in VS Code
2. Run the following command:
   ```bash
   devcontainer rebuild
   ```
3. Wait for the container to rebuild
4. Once the container is rebuilt, the automated context saving system will be active

## Verification

To verify that the automated context saving system is working correctly:

1. Check if cron is running:
   ```bash
   ps aux | grep cron
   ```

2. Check if the crontab is installed:
   ```bash
   crontab -l
   ```
   You should see the following line:
   ```
   */3 * * * * /bin/bash /workspaces/ai-sports-edge/scripts/save-context.sh >> /workspaces/ai-sports-edge/logs/autosave.log 2>&1
   ```

3. Check if Node.js is installed:
   ```bash
   which node || which nodejs
   ```

4. Check the log file after a few minutes:
   ```bash
   cat /workspaces/ai-sports-edge/logs/autosave.log
   ```
   You should see entries indicating that the context save has run.

## Troubleshooting

If the automated context saving system is not working:

1. Run the verification script to check system status:
   ```bash
   /workspaces/ai-sports-edge/scripts/verify-context-systems.sh
   ```

2. Check the status report:
   ```bash
   cat /workspaces/ai-sports-edge/logs/context-systems-status.json
   ```

3. Check if fallback notifications exist:
   ```bash
   cat /workspaces/ai-sports-edge/logs/fallback-notification.log
   ```

4. Review fallback usage statistics:
   ```bash
   cat /workspaces/ai-sports-edge/logs/fallback-usage.json
   ```

5. Ensure cron is running:
   ```bash
   sudo service cron start
   ```

6. Manually install the crontab:
   ```bash
   crontab /workspaces/ai-sports-edge/.devcontainer/autosave-cron
   ```

7. Check the script permissions:
   ```bash
   chmod +x /workspaces/ai-sports-edge/scripts/save-context.sh
   chmod +x /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
   chmod +x /workspaces/ai-sports-edge/scripts/verify-context-systems.sh
   ```

8. Test the fallback script:
   ```bash
   /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
   ```

9. Manually run the main script to check for errors:
   ```bash
   /workspaces/ai-sports-edge/scripts/save-context.sh
   ```

## Using Without Container Rebuild

If you need to use the system without rebuilding the container, you can:

1. Install Node.js manually:
   ```bash
   sudo apt-get update && sudo apt-get install -y nodejs npm
   ```

2. Or rely on the fallback mechanism:
   ```bash
   /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
   ```

3. Set up a manual cron job:
   ```bash
   (crontab -l 2>/dev/null; echo "*/3 * * * * /bin/bash /workspaces/ai-sports-edge/scripts/save-context.sh >> /workspaces/ai-sports-edge/logs/autosave.log 2>&1") | crontab -
   ```

## Periodic System Verification

To ensure both primary and fallback systems remain operational, you can set up periodic verification checks:

1. Add a daily verification check to crontab:
   ```bash
   (crontab -l 2>/dev/null; echo "0 */6 * * * /bin/bash /workspaces/ai-sports-edge/scripts/verify-context-systems.sh") | crontab -
   ```
   This will run the verification script every 6 hours.

2. Check verification results:
   ```bash
   cat /workspaces/ai-sports-edge/logs/context-systems-status.json
   ```

3. Monitor fallback system usage:
   ```bash
   cat /workspaces/ai-sports-edge/logs/fallback-usage.json
   ```

If the verification script detects that the primary system is unavailable but the fallback system is working, it will automatically run the fallback system to ensure context is preserved.