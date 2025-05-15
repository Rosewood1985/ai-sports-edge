# Installing VS Code SFTP Extension

## Overview
The VS Code SFTP extension by Natizyskunk allows you to easily upload files to your remote server directly from VS Code. This guide will walk you through the installation and setup process.

## Installation Steps

### 1. Open VS Code Extensions Panel
- Click on the Extensions icon in the Activity Bar on the side of the window
- Or use the keyboard shortcut:
  - Windows/Linux: `Ctrl+Shift+X`
  - macOS: `Cmd+Shift+X`

### 2. Search for SFTP
- Type "SFTP" in the search box
- Look for "SFTP" by Natizyskunk (not the older one by liximomo which is deprecated)

### 3. Install the Extension
- Click the "Install" button next to the SFTP extension

![VS Code SFTP Extension](https://raw.githubusercontent.com/Natizyskunk/vscode-sftp/master/assets/logo.png)

### 4. Reload VS Code
- After installation, you may need to reload VS Code
- Click the "Reload" button if prompted

## Configuration
The `.vscode/sftp.json` file has already been created with your SFTP credentials:

```json
{
  "host": "sftp.aisportsedge.app",
  "port": 22,
  "username": "deploy@aisportsedge.app",
  "password": "hTQ3LQ]#P(b,",
  "remotePath": "/home/q15133yvmhnq/public_html/aisportsedge.app/deploy",
  "protocol": "sftp",
  "uploadOnSave": true
}
```

## Using the Extension

### Uploading Files
1. Right-click on a file in the Explorer panel
2. Select "SFTP: Upload" from the context menu
3. The file will be uploaded to the remote path specified in your configuration

### Keyboard Shortcuts
- Upload current file: `Ctrl+Alt+U` (Windows/Linux) or `Cmd+Alt+U` (macOS)
- Upload selected files: Select multiple files, right-click, and choose "SFTP: Upload"

### Automatic Upload
With `"uploadOnSave": true` in your configuration, files will automatically be uploaded whenever you save them.

## Troubleshooting

### Connection Issues
- Verify your SFTP credentials are correct
- Check if the server is accessible from your network
- Ensure the remote path exists on the server

### Permission Issues
- Check if your user has write permissions to the remote directory
- Try changing the permissions of the remote directory if needed

### Extension Not Working
- Check the Output panel in VS Code for SFTP logs
- Select "SFTP" from the dropdown in the Output panel
- Look for error messages that might indicate the issue

## Additional Resources
- [VS Code SFTP Extension Documentation](https://github.com/Natizyskunk/vscode-sftp)
- [VS Code Extensions Guide](https://code.visualstudio.com/docs/editor/extension-marketplace)