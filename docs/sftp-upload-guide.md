# SFTP Upload Guide for AI Sports Edge

This guide walks you through uploading the optimized files to GoDaddy using VS Code's SFTP extension.

## Prerequisites
- VS Code with SFTP extension installed (maintained by @Natizyskunk)
- Configured SFTP settings in `.vscode-sftp-deploy/.vscode/sftp.json`
- Completed build process with `./scripts/deploy-without-htaccess.sh`

## Installing the SFTP Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "SFTP"
4. Install the extension by @Natizyskunk (Look for "SFTP - maintained by @Natizyskunk")
5. Restart VS Code after installation

Alternatively, run the installation script:
```bash
./scripts/install-sftp-extension.sh
```

## Step-by-Step Upload Process

### 1. Save All Files and Restart VS Code
- Press `Ctrl+K S` (Windows/Linux) or `Cmd+K S` (Mac) to save all files
- Restart VS Code to ensure all configuration changes are applied
- This step is crucial as it refreshes the SFTP configuration

### 2. Open VS Code Explorer View
- Press `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac) to open the Explorer view
- Navigate to the `dist` folder in your project

### 3. Upload the Folder
- Right-click on the `dist` folder
- From the context menu, select `SFTP: Upload Folder`
- A confirmation dialog will appear showing the remote path: `/home/q15133yvmhnq/public_html/aisportsedge.app`
- Click `Upload` to start the transfer

### 4. Monitor Upload Progress
- The VS Code status bar will show the upload progress
- Wait for the "Upload complete" notification

### 5. Verify the Deployment
- Open a new incognito/private browser window
- Visit https://aisportsedge.app
- Check for the following:
  - No reload loops
  - No integrity, MIME, or CSP errors in the browser console (F12 > Console)
  - Firebase authentication works correctly
  - Routing between pages works as expected
  - Spanish language toggle appears and works correctly

### 6. Test Spanish Language Support
- Click the language toggle button in the navigation
- Verify that text changes to Spanish
- Test navigation and functionality in Spanish mode

## Alternative Deployment Methods

If you encounter issues with the VS Code SFTP extension, you can try these alternative methods:

### Using Native SFTP Command
```bash
./scripts/native-sftp-deploy.sh
```

### Using SFTP-Deploy NPM Package
```bash
./scripts/sftp-deploy.sh
```

## Troubleshooting

### If SFTP Extension is Not Found
- Make sure you've installed the correct extension (by @Natizyskunk)
- Run `./scripts/install-sftp-extension.sh` to install it
- Restart VS Code after installation

### If Files Are Not Uploading
- Check the SFTP configuration in `.vscode-sftp-deploy/.vscode/sftp.json`
- Verify server credentials and connection settings
- Try restarting VS Code

### If X-Frame-Options or Integrity Issues Persist
- Run the cleanup script again: `./scripts/deploy-without-htaccess.sh`
- Check the HTML files manually for any remaining problematic tags

### If Language Toggle Doesn't Appear
- Verify that `language-switcher.js` is included in the HTML
- Check browser console for any JavaScript errors

## Next Steps
- Consider setting up a GitHub Action for automated deployment
- Document the deployment process in your team wiki
- Schedule regular checks for CSP and security headers