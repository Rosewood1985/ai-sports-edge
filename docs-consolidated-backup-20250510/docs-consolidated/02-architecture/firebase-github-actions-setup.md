# Setting Up GitHub Actions for Firebase Deployment

This guide provides instructions for configuring GitHub Actions to automatically deploy your AI Sports Edge project to Firebase Hosting.

## Prerequisites

- GitHub repository for your project
- Firebase project with Hosting enabled
- Firebase CLI installed locally

## Step 1: Generate Firebase Service Account Key

First, you need to generate a Firebase service account key that GitHub Actions will use for authentication:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to open Project settings
4. Navigate to the "Service accounts" tab
5. Click "Generate new private key" for the Firebase Admin SDK
6. Save the JSON file securely (you'll need it in the next step)

## Step 2: Add Firebase Service Account Secret to GitHub

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Name: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Paste the entire contents of the JSON file you downloaded in Step 1
7. Click "Add secret"

## Step 3: Verify Workflow File

The GitHub Actions workflow file (`.github/workflows/firebase-deploy.yml`) has already been created for you. It's configured to:

- Trigger on pushes to the main branch
- Run the integration script to consolidate your design files
- Update the Firebase configuration
- Deploy to Firebase Hosting

Review the workflow file to ensure it meets your needs:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration script
        run: node scripts/integrate_existing_design.js

      - name: Update Firebase config
        run: node scripts/update_firebase_config.js

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ai-sports-edge-final
          target: aisportsedge-app
        env:
          FIREBASE_CLI_PREVIEWS: hostingchannels
```

> **Important**: Make sure the `projectId` and `target` values match your Firebase project ID and hosting target.

## Step 4: Test the Workflow

You can manually trigger the workflow to test it:

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Select the "Deploy to Firebase Hosting" workflow
4. Click "Run workflow"
5. Select the branch (usually "main") and click "Run workflow"

Monitor the workflow execution to ensure it completes successfully.

## Step 5: Verify Deployment

After the workflow completes:

1. Check the workflow logs for any errors
2. Visit your Firebase Hosting URL to verify the deployment
3. If you've set up a custom domain, check that as well

## Troubleshooting

### Authentication Issues

If you see authentication errors:

1. Verify the `FIREBASE_SERVICE_ACCOUNT` secret is correctly set
2. Ensure the service account has the necessary permissions
3. Regenerate the service account key if needed

### Build Failures

If the build step fails:

1. Check the workflow logs for specific error messages
2. Verify that all dependencies are correctly installed
3. Test the build process locally to identify issues

### Deployment Failures

If deployment fails:

1. Check that your Firebase project ID is correct in the workflow file
2. Verify that the hosting target exists in your Firebase project
3. Ensure the Firebase configuration is correct

## Additional Configuration

### Preview Channels

You can set up preview deployments for pull requests by adding this to your workflow:

```yaml
- name: Deploy PR Preview
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
    projectId: ai-sports-edge-final
    target: aisportsedge-app
  env:
    FIREBASE_CLI_PREVIEWS: hostingchannels
```

### Environment-Specific Deployments

For different environments (staging, production), you can create separate workflows:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy_to_staging:
    # Similar configuration but with different target
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)