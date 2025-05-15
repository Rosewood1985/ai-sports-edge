# AI Sports Edge Deployment Summary

## Current Deployment Structure

### Primary Source Directory
- **Location**: `vscode-sftp-deploy/.vscode/`
- **Files**:
  - index.html
  - login.html
  - signup.html
  - .htaccess
  - sftp.json

### Deployment Target
- **Server**: p3plzcpnl508920.prod.phx3.secureserver.net
- **Protocol**: FTP
- **Remote Path**: /home/q15133yvmhnq/public_html
- **Credentials**: Username: q15133yvmhnq

### Conflicting Directories
- **aisportsedge-deploy/**: Contains multiple versions of key files (index.html, login.html, signup.html)
- **build/**: No conflicting HTML files found
- **deploy/**: No conflicting HTML files found
- **dist/**: No conflicting HTML files found

### Deployment Scripts
The following scripts currently reference the `aisportsedge-deploy` directory:
- deploy-to-godaddy-ftp.sh
- deploy-to-godaddy-sftp.sh
- deploy-vscode-sftp.sh
- deploy-to-godaddy.sh

## Planned Changes

### 1. Update Deployment Scripts
All deployment scripts will be updated to reference `vscode-sftp-deploy/.vscode/` as the source directory instead of `aisportsedge-deploy/`.

### 2. Archive aisportsedge-deploy
The `aisportsedge-deploy` directory will be archived but not deleted, as it contains additional files that might be needed in the future.

### 3. Clean Other Directories
No action needed for build/, deploy/, and dist/ directories as they don't contain conflicting HTML files.

### 4. Deployment Verification
After deployment, the following URLs will be tested:
- https://aisportsedge.app/ (should load index.html)
- https://aisportsedge.app/login (should load login.html)
- https://aisportsedge.app/signup (should load signup.html)
- https://aisportsedge.app/deploy (should redirect to root)

## Last Deployment
- **Date**: April 18, 2025
- **Time**: 1:27 PM EDT
- **Method**: VS Code SFTP Extension
- **Deployed Files**:
  - index.html
  - login.html
  - signup.html
  - .htaccess