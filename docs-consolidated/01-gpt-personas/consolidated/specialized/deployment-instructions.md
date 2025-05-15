# AI Sports Edge Deployment Instructions

## Overview

This guide provides step-by-step instructions for deploying the updated index.html file to the AI Sports Edge production server and running the necessary server-side scripts.

## Prerequisites

1. VS Code with SFTP extension installed
2. SSH access to the server

## Step 1: Deploy Using VS Code SFTP Extension

1. Open VS Code and navigate to the project directory
2. Open the `vscode-sftp-deploy` directory
3. Right-click on `index.html` in the Explorer panel
4. Select "SFTP: Upload" from the context menu
5. Wait for the upload to complete (check the Output panel for SFTP logs)

## Step 2: Run Server-Side Scripts via SSH

After uploading the file, connect to the server via SSH and run the following commands:

```bash
ssh deploy@p3plzcpnl508920.prod.phx3.secureserver.net

# Once connected, run:
cd /home/q15133yvmhnq/public_html/aisportsedge.app
chmod +x fix-permissions-and-build.sh
./fix-permissions-and-build.sh
./scripts/detailed-deployment-check.sh
```

### What the Scripts Do

1. `fix-permissions-and-build.sh`:
   - Sets proper directory permissions (755)
   - Sets proper file permissions (644)
   - Moves files from build/ to the root directory
   - Makes scripts executable
   - Lists important files to confirm success

2. `detailed-deployment-check.sh`:
   - Checks server connectivity
   - Verifies file existence
   - Tests website accessibility
   - Checks DNS resolution

## Step 3: Verify Deployment

After running the scripts, verify the deployment by:

1. Visiting https://aisportsedge.app in an incognito browser window
2. Checking that the Firebase initialization works correctly
3. Confirming no console errors

## Troubleshooting

If you encounter any issues:

- Check the server logs for errors
- Verify file permissions (should be 644 for HTML files)
- Ensure the scripts are executable (chmod +x)
- Check for any firewall or CDN issues