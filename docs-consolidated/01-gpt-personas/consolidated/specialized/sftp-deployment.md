# SFTP Deployment Configuration

## Overview

This document outlines the standardized SFTP deployment configuration for AI Sports Edge. We've established a single source of truth for SFTP settings to ensure consistent deployments.

## Configuration Details

The canonical SFTP configuration is located at:
```
vscode-sftp-deploy/.vscode/sftp.json
```

This configuration includes:
- Host: sftp.aisportsedge.app
- Protocol: SFTP (port 22)
- Remote path: /home/q15133yvmhnq/public_html/aisportsedge.app
- Local path: ./dist (only production assets are deployed)
- Upload on save: Enabled by default

## Maintenance Scripts

### Guided Deployment

The `scripts/deployment-checklist.sh` script provides an interactive guided deployment:

```bash
./scripts/deployment-checklist.sh
```

This script:
- Checks for duplicate SFTP configs
- Verifies SFTP config content
- Validates local `/dist/` contents
- Checks for correct path references in HTML files
- **Offers interactive guided deployment with confirmation at each step:**
  - Remote cleanup (removes old files while preserving assets)
  - File upload from local `/dist/` to remote server
  - Deployment verification with hash comparison
- Provides manual instructions if guided deployment is declined

### Pre-Deployment Checks

The `scripts/pre-deploy-checks.sh` script runs all SFTP checks before deployment:

```bash
./scripts/pre-deploy-checks.sh
```

This script:
- Runs all SFTP configuration and sync checks in sequence
- Provides clear pass/fail status for each check
- Exits with error if any check fails
- Offers to proceed with deployment if all checks pass
- Runs the deployment with cleanup and verification if confirmed
- Should be run before every deployment

### Quick Deploy

The `scripts/quick-deploy.sh` script provides a faster deployment option:

```bash
./scripts/quick-deploy.sh
```

This script:
- Skips the configuration and sync checks
- Directly runs the cleanup and deployment process
- Useful for rapid iterations when you're confident in your changes
- Still performs cleanup and verification

### SFTP Deploy with Cleanup

The `scripts/sftp-deploy-cleanup.sh` script handles the deployment process:

```bash
./scripts/sftp-deploy-cleanup.sh
```

This script:
- Cleans up the remote directory before deployment
  - Removes all `.html`, `.js`, `.css`, `.map`, `.json` files
  - Preserves folders: `assets/`, `images/`, `locales/`
- Uploads files from the local `./dist` directory
- Verifies that `index.html` exists on the remote server
- Confirms the remote `index.html` matches the local version using MD5 hash

### Check SFTP Configs

The `scripts/check-sftp-configs.sh` script detects and removes duplicate sftp.json files:

```bash
./scripts/check-sftp-configs.sh
```

Run this script periodically to ensure no duplicate configurations exist. It will:
- Find any sftp.json files outside the canonical location
- Prompt to delete them to maintain a single source of truth
- Exit with status code 1 if duplicates are found

### Check SFTP Sync

The `scripts/check-sftp-sync.sh` script verifies that local and remote files are in sync:

```bash
./scripts/check-sftp-sync.sh
```

This script:
- Compares local `/dist` with remote `/public_html/aisportsedge.app/`
- Identifies mismatched files
- Offers to force overwrite remote files if differences are found

## Best Practices

1. **Never create additional sftp.json files** - Use only the canonical configuration
2. **Run pre-deployment checks before every deploy** - Use `./scripts/pre-deploy-checks.sh`
3. **Keep credentials secure** - Don't commit the sftp.json file with credentials to public repositories
4. **Test uploads** - Verify file integrity after deployment
5. **Integrate checks into CI/CD** - Add the pre-deployment checks to your CI/CD pipeline

## Troubleshooting

If you encounter SFTP connection issues:
- Verify credentials in the canonical sftp.json file
- Check network connectivity to sftp.aisportsedge.app
- Ensure the remote path exists on the server
- Verify you have proper permissions on the remote server