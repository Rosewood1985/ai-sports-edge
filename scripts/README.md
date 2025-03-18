# Scripts Directory

This directory contains utility scripts for managing the AI Sports Edge project.

## Update Scripts

These scripts help automate the process of updating the project's documentation, web app, and mobile app.

### `update-all.sh`

Master script that runs all update scripts in sequence.

**Usage:**
```bash
./scripts/update-all.sh
```

This script will:
1. Push documentation to GitHub
2. Update and deploy the web app
3. Build and submit updates for the mobile app

### `push-docs-to-github.sh`

Pushes all documentation files to GitHub.

**Usage:**
```bash
./scripts/push-docs-to-github.sh
```

This script adds all documentation files in the `docs/` directory to git, commits them with a descriptive message, and pushes them to the main branch.

### `update-web-app.sh`

Builds and deploys the web app.

**Usage:**
```bash
./scripts/update-web-app.sh
```

This script:
1. Installs dependencies (if needed)
2. Builds the web app using the custom build script
3. Deploys the web app to Firebase

### `update-mobile-app.sh`

Builds and submits updates for the mobile app using Expo Application Services (EAS).

**Usage:**
```bash
./scripts/update-mobile-app.sh
```

This script:
1. Installs dependencies (if needed)
2. Checks for and installs EAS CLI if necessary
3. Builds and submits the iOS app
4. Builds and submits the Android app
5. Pushes an update to existing apps

**Note:** The mobile app builds will continue on EAS servers after the script completes. You can check their status with `eas build:list`.

## Other Scripts

### `build-web.js`

Custom script for building the web app. Used by `npm run build-web`.

### `build-web-with-login.js`

Custom script for building the web app with login functionality.

### `reset-project.js`

Resets the project to a clean state.

## Running Scripts

All scripts should be made executable before running:

```bash
chmod +x scripts/script-name.sh
```

Then you can run them directly:

```bash
./scripts/script-name.sh
```

Or from any directory:

```bash
/path/to/ai-sports-edge/scripts/script-name.sh