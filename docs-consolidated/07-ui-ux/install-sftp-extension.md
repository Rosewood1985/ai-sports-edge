# Installing the SFTP Extension for VS Code

The SFTP extension is required to upload files to the server using VS Code. This guide provides instructions for installing the correct SFTP extension.

## Important Note

The original SFTP extension by liximomo is no longer maintained. You should use the maintained version by @Natizyskunk instead.

## Installation Steps

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "SFTP"
4. Look for "SFTP - maintained by @Natizyskunk"
5. Click the Install button
6. Restart VS Code after installation

![VS Code Extensions view with SFTP extension by @Natizyskunk](https://marketplace.visualstudio.com/items?itemName=Natizyskunk.sftp)

## Verifying Installation

After installing the extension and restarting VS Code, you should be able to:

1. Right-click on a folder in the Explorer view
2. See "SFTP: Upload Folder" in the context menu

If you don't see this option, try the following:

- Make sure you've installed the correct extension (by @Natizyskunk)
- Restart VS Code completely
- Check if the extension is enabled in the Extensions view

## Configuring SFTP

The SFTP extension is already configured in the project. The configuration file is located at:

```
.vscode-sftp-deploy/.vscode/sftp.json
```

This configuration includes:

- Host: sftp.aisportsedge.app
- Username: deploy@aisportsedge.app
- Remote path: /home/q15133yvmhnq/public_html/aisportsedge.app
- Ignore list: [".vscode", ".git", ".DS_Store", "node_modules", ".htaccess"]

## Next Steps

After installing the extension, you can follow the deployment guide:

```bash
open docs/sftp-visual-guide.html
```

Or read the text-based guide:

```bash
open docs/sftp-upload-guide.md