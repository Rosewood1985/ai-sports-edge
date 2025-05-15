# SFTP Configuration Fix

## 🔧 Issue Fixed

The VS Code SFTP extension was failing with "Config Not Found" error because:

1. Multiple `sftp.json` files existed in different locations
2. The extension was looking for its configuration in the wrong location

## ✅ Actions Taken

1. Removed duplicate `sftp.json` file from `.vscode/` directory using the `check-sftp-configs.sh` script
2. Created a symbolic link from `.vscode/sftp.json` to `vscode-sftp-deploy/.vscode/sftp.json`
3. Ensured the configuration uses `"context": "build"` instead of `"context": "./build"`

## 🚀 How to Test

1. Restart VS Code:
   ```bash
   code /Users/lisadario/Desktop/ai-sports-edge
   ```

2. Use the VS Code command palette (Cmd+Shift+P) and type "SFTP: Upload Folder"

3. Select the build folder to upload

## 🧠 Why This Fix Works

The SFTP extension was confused by multiple configuration files and the leading `./` in the context path. By:

1. Ensuring only one configuration file exists (in `vscode-sftp-deploy/.vscode/sftp.json`)
2. Creating a symbolic link in the expected location (`.vscode/sftp.json`)
3. Using a clean path format (`"context": "build"`)

The extension can now correctly find its configuration and upload files from the build directory.