# VS Code Workspace Fix Guide

This document explains how to fix the "Custom storage path is unusable" error in VS Code for the AI Sports Edge project.

## Problem

VS Code may show an error message: "Custom storage path is unusable" for `/Users/lisadario/Desktop/ai-sports-edge`. This can happen due to:

1. Permission issues on the project directory
2. Missing or corrupted `.vscode` directory
3. Incorrect configuration in workspace files
4. VS Code workspace storage corruption

## Solution

We've created a script that fixes these issues automatically:

```bash
./scripts/reset-vscode-workspace.sh
```

The script:

1. Ensures the `.vscode` directory exists with proper permissions
2. Sets correct permissions on the project directory
3. Creates or fixes `settings.json` and `sftp.json` in the `.vscode` directory
4. Verifies the code-workspace file points to the correct root
5. Provides guidance on clearing VS Code's workspace storage if needed

## Manual Fix Steps

If the script doesn't resolve the issue, follow these manual steps:

1. Close VS Code completely
2. Delete the workspace storage folder:
   ```
   rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*/workspace.json
   ```
3. Reopen VS Code with:
   ```
   code /Users/lisadario/Desktop/ai-sports-edge
   ```

## SFTP Integration

The project uses VS Code's SFTP extension for deployment. The configuration is stored in:

1. `.vscode/sftp.json` (main configuration)
2. `vscode-sftp-deploy/.vscode/sftp.json` (backup configuration)

Both files should be identical. If you experience SFTP issues, run the reset script to ensure the configurations are in sync.

## Preventing Future Issues

To prevent this issue from recurring:

1. Always use the project's root directory as your workspace
2. Don't delete or modify the `.vscode` directory manually
3. Use the provided deployment scripts instead of manual SFTP operations
4. If you need to reset VS Code's state, use the provided script

## Troubleshooting

If you still experience issues:

1. Check VS Code's Developer Tools (Help > Toggle Developer Tools)
2. Look for errors related to workspace storage
3. Verify file permissions with: `ls -la /Users/lisadario/Desktop/ai-sports-edge`
4. Ensure the user has write access to the project directory
5. Try reinstalling the SFTP extension if deployment issues persist

## Related Files

- `.vscode/settings.json`: VS Code editor settings
- `.vscode/sftp.json`: SFTP deployment configuration
- `ai-sports-edge.code-workspace`: Workspace definition
- `scripts/reset-vscode-workspace.sh`: Automated fix script