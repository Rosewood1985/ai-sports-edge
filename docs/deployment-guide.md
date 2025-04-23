# AI Sports Edge Deployment Guide

This guide outlines the deployment process for the AI Sports Edge application to the GoDaddy hosting environment.

## Deployment Options

There are three ways to deploy the application:

1. **GitHub Actions (Recommended)** - Automated CI/CD pipeline triggered on push to main
2. **Automated Script** - Local script that handles validation, upload, and verification
3. **Manual Fallback** - Step-by-step process for manual deployment via GoDaddy control panel

## 1. GitHub Actions Deployment

The GitHub Actions workflow automatically deploys the application when changes are pushed to the main branch.

### Setup

1. In your GitHub repo, go to: Settings → Secrets and variables → Actions → Secrets
2. Add a new secret:
   - Name: `SFTP_PASS`
   - Value: `hTQ3LQ]#P(b,`

### How It Works

The workflow:
1. Uploads the build folder via SFTP
2. SSHs into the server and runs the fix script
3. Verifies the deployment with a health check

### Monitoring

You can monitor the deployment status in the "Actions" tab of your GitHub repository.

## 2. Automated Script Deployment

The automated script provides a local way to deploy the application with validation and verification.

### Prerequisites

- Install dependencies: `sshpass` and `lftp`
  ```bash
  # macOS
  brew install sshpass lftp
  
  # Ubuntu/Debian
  sudo apt-get install -y sshpass lftp
  ```

### Deployment Steps

1. Run the validation script to ensure all prerequisites are met:
   ```bash
   ./scripts/validate-deployment-config.sh
   ```

2. Run the automated deployment script:
   ```bash
   ./scripts/automated-deploy-and-verify.sh
   ```

3. The script will:
   - Validate deployment configuration
   - Upload build folder via SFTP
   - SSH into server and run fix script
   - Verify deployment with health check

## 3. Manual Fallback Deployment

If automated methods fail, you can use the manual fallback process.

### Steps

1. Run the manual fallback script to create a zip file:
   ```bash
   ./scripts/manual-fallback-deploy.sh
   ```

2. Log in to GoDaddy hosting control panel
3. Navigate to File Manager
4. Go to `/home/q15133yvmhnq/public_html/aisportsedge.app`
5. Upload `aisportsedge-deploy.zip`
6. Extract the zip file
7. Run the following commands in the terminal:
   ```bash
   cd /home/q15133yvmhnq/public_html/aisportsedge.app
   chmod -R 755 .
   find . -type f -exec chmod 644 {} \;
   find . -name "*.sh" -exec chmod +x {} \;
   ```

8. Verify the deployment at https://aisportsedge.app

## Troubleshooting

If deployment issues occur:

1. Run the detailed deployment check:
   ```bash
   ./scripts/detailed-deployment-check.sh
   ```

2. Check for common issues:
   - SFTP credentials incorrect
   - File permissions not set correctly
   - .htaccess file missing or incorrect
   - Build files not in the correct location

3. If needed, SSH into the server and run the fix script manually:
   ```bash
   ssh deploy@aisportsedge.app
   cd /home/q15133yvmhnq/public_html/aisportsedge.app
   chmod +x fix-permissions-and-build.sh
   ./fix-permissions-and-build.sh
   ```

## Deployment Configuration

The deployment configuration is stored in:
- `.vscode/sftp.json` (symlink to `vscode-sftp-deploy/.vscode/sftp.json`)

Key configuration values:
- Host: `aisportsedge.app`
- Username: `deploy@aisportsedge.app`
- Remote Path: `/home/q15133yvmhnq/public_html/aisportsedge.app`