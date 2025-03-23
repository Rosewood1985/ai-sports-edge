# AI Sports Edge Deployment Guide

This document provides instructions for deploying the AI Sports Edge application to both web and iOS platforms.

## Prerequisites

Before deploying, ensure you have the following:

1. **Firebase CLI** installed (`npm install -g firebase-tools`)
2. **Expo CLI** installed (`npm install -g expo-cli`)
3. **EAS CLI** installed (`npm install -g eas-cli`)
4. Access to the Firebase project
5. Access to the Expo account
6. Access to the GitHub repository

## Deployment Scripts

We've created three deployment scripts to simplify the deployment process:

1. `scripts/deploy-web.sh` - Deploys the web app to Firebase hosting
2. `scripts/deploy-ios.sh` - Builds and submits the iOS app to the App Store
3. `scripts/push-to-github.sh` - Commits and pushes changes to GitHub

## Web Deployment Process

The web deployment process involves the following steps:

1. Build the web app
2. Verify Firebase configuration
3. Check for Spanish version
4. Deploy to Firebase hosting

### Running the Web Deployment Script

```bash
./scripts/deploy-web.sh
```

This script will:
- Check if Firebase CLI is installed and you're logged in
- Build the web app
- Verify Firebase configuration
- Check for Spanish version
- Deploy to Firebase hosting
- Verify deployment

### Firebase Hosting Configuration

The web app is deployed to two Firebase hosting sites:
- Default site: `ai-sports-edge.web.app`
- Custom domain: `aisportsedge-app.web.app`

The configuration for these sites is in `firebase.json` and `.firebaserc`.

## iOS Deployment Process

The iOS deployment process involves the following steps:

1. Update app version
2. Check for Spanish localization
3. Build the app using EAS
4. Submit to App Store Connect (for TestFlight or Production)

### Running the iOS Deployment Script

```bash
./scripts/deploy-ios.sh
```

This script will:
- Check if Expo CLI and EAS CLI are installed and you're logged in
- Prompt for a new version number
- Check for Spanish localization
- Prompt for build type (Preview, Internal, TestFlight, or Production)
- Build the app using EAS
- Submit to App Store Connect (for TestFlight or Production)

### EAS Build Profiles

The EAS build profiles are defined in `eas.json`:
- `preview` - For development testing
- `internal` - For internal testing
- `testflight` - For TestFlight distribution
- `production` - For App Store distribution

## GitHub Workflow

To push changes to GitHub:

```bash
./scripts/push-to-github.sh
```

This script will:
- Show changes to be committed
- Prompt for a commit message
- Add and commit changes
- Push to the remote repository

## Internationalization

The app supports both English and Spanish languages:

- Web: Spanish version is available at `/es/` path
- iOS: Spanish localization is in `ios/AISportsEdge/Supporting/es.lproj/`

## Troubleshooting

### Web Deployment Issues

1. **Firebase Configuration Missing**
   - Check if `public/firebase-config.js` exists
   - Ensure environment variables are set correctly

2. **Spanish Version Missing**
   - Check if `public/es/index.html` exists
   - Ensure language tag is set to `es`

### iOS Deployment Issues

1. **EAS Build Fails**
   - Check EAS build logs
   - Ensure all dependencies are installed
   - Verify app.json configuration

2. **Spanish Localization Missing**
   - Check if `ios/AISportsEdge/Supporting/es.lproj/` exists
   - Ensure InfoPlist.strings is properly translated

## Post-Deployment Verification

After deployment, verify the following:

1. **Web App**
   - Visit both hosting sites
   - Test Spanish version
   - Verify Firebase authentication
   - Test core functionality

2. **iOS App**
   - Install from TestFlight or App Store
   - Test Spanish localization
   - Verify push notifications
   - Test core functionality

## Rollback Procedure

If issues are found after deployment:

1. **Web App**
   - Use Firebase hosting rollback: `firebase hosting:rollback`

2. **iOS App**
   - For TestFlight: Stop testing the current build
   - For Production: Submit a new build with fixes