# Deployment Process Documentation

This document outlines the deployment process for AI Sports Edge, including the CI/CD pipeline, manual deployment, and rollback procedures.

## Overview

AI Sports Edge uses a robust deployment process that includes:

1. **Continuous Integration**: Automated testing on every code change
2. **Continuous Deployment**: Automated deployment to staging and production environments
3. **Manual Deployment**: Scripts for manual deployment when needed
4. **Rollback Procedures**: Process for rolling back to previous versions

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and is defined in `.github/workflows/firebase-deployment.yml`.

### Workflow Triggers

The pipeline is triggered by:

- **Push to main branch**: Automatically deploys to production
- **Pull requests to main branch**: Deploys to staging for testing
- **Manual trigger**: Can be manually triggered for either staging or production

### Pipeline Stages

The pipeline consists of the following stages:

#### 1. Test Stage

```yaml
test:
  name: Test
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Set up Node.js
    - Install dependencies
    - Run linting
    - Run unit tests
    - Run type checking
```

This stage runs all tests to ensure code quality before deployment.

#### 2. Staging Deployment Stage

```yaml
deploy-staging:
  name: Deploy to Staging
  needs: test
  if: github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'staging')
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - Checkout code
    - Set up Node.js
    - Install dependencies
    - Build
    - Install Firebase CLI
    - Check API Keys
    - Deploy to Firebase Staging
    - Test Staging Deployment
    - Upload Test Results
```

This stage deploys to the staging environment and runs tests to verify the deployment.

#### 3. Production Deployment Stage

```yaml
deploy-production:
  name: Deploy to Production
  needs: [test, deploy-staging]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main' || (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production')
  runs-on: ubuntu-latest
  environment: production
  steps:
    - Checkout code
    - Set up Node.js
    - Install dependencies
    - Build
    - Install Firebase CLI
    - Check API Keys
    - Deploy to Firebase Production
    - Set up Custom Domains and SSL
    - Configure Webhooks
    - Test Web App Functionality
    - Upload Test Results
```

This stage deploys to the production environment, sets up custom domains and SSL certificates, configures webhooks, and tests the web app functionality.

#### 4. Notification Stage

```yaml
notify:
  name: Notify
  needs: [deploy-production]
  if: always()
  runs-on: ubuntu-latest
  steps:
    - Notify Success (if successful)
    - Notify Failure (if failed)
```

This stage sends notifications about the deployment status.

### Environment Variables and Secrets

The pipeline uses the following environment variables and secrets:

- **FIREBASE_API_KEY**: Firebase API key
- **STRIPE_API_KEY**: Stripe API key
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook secret
- **GOOGLE_MAPS_API_KEY**: Google Maps API key
- **OPENWEATHER_API_KEY**: OpenWeather API key
- **FIREBASE_TOKEN**: Firebase CLI authentication token
- **SLACK_WEBHOOK_URL**: Slack webhook URL for notifications

These secrets should be configured in the GitHub repository settings.

## Manual Deployment

For manual deployment, you can either use the full deployment process script or individual scripts:

### Full Deployment Process

The full deployment process script automates all steps of the deployment process:

```bash
# Make the script executable
chmod +x scripts/deploy-full-process.sh

# Run the full deployment process
./scripts/deploy-full-process.sh
```

This script will guide you through the entire deployment process, including:
1. Making all scripts executable
2. Checking API keys
3. Building the application
4. Testing in staging environment
5. Deploying to production
6. Setting up custom domains and SSL
7. Fixing domain settings for aisportsedge.app
8. Configuring webhooks
9. Testing web app functionality
10. Setting up CI/CD pipeline

### Individual Scripts

If you prefer to run individual steps manually, use the following scripts:

#### 1. Prepare the Environment

```bash
# Make all scripts executable
chmod +x scripts/*.sh
```

#### 2. Check API Keys

```bash
# Ensure all necessary API keys are available
./scripts/check-api-keys.sh
```

#### 3. Test in Staging

```bash
# Test the deployment in a staging environment
./scripts/test-staging-deployment.sh
```

#### 4. Deploy to Production

```bash
# Run the deployment process
./scripts/deploy-firebase-production.sh
```

#### 5. Fix Domain Settings

```bash
# Fix domain settings for aisportsedge.app
./scripts/fix-domain-settings.sh
```

#### 6. Test Web App Functionality

```bash
# Test the web app's functionality
./scripts/test-webapp-functionality.sh
```

## Deployment Scripts

The deployment process uses the following scripts:

### 1. `scripts/deploy-full-process.sh`

This script implements the complete deployment process for AI Sports Edge.

```bash
# Usage
./scripts/deploy-full-process.sh
```

### 2. `scripts/check-api-keys.sh`

This script checks if all necessary API keys are available in the environment.

```bash
# Usage
./scripts/check-api-keys.sh
```

### 3. `scripts/test-staging-deployment.sh`

This script tests the deployment in a staging environment.

```bash
# Usage
./scripts/test-staging-deployment.sh
```

### 4. `scripts/deploy-firebase-production.sh`

This script handles the full deployment process to production.

```bash
# Usage
./scripts/deploy-firebase-production.sh
```

### 5. `scripts/fix-domain-settings.sh`

This script fixes domain settings for aisportsedge.app.

```bash
# Usage
./scripts/fix-domain-settings.sh
```

### 6. `scripts/setup-firebase-domains.sh`

This script sets up custom domains and SSL certificates.

```bash
# Usage
./scripts/setup-firebase-domains.sh
```

### 7. `scripts/configure-webhooks.sh`

This script configures webhooks for the production environment.

```bash
# Usage
./scripts/configure-webhooks.sh
```

### 8. `scripts/test-webapp-functionality.sh`

This script tests the web app's functionality.

```bash
# Usage
./scripts/test-webapp-functionality.sh
```

### 9. `scripts/setup-cicd-pipeline.sh`

This script sets up the CI/CD pipeline for Firebase deployment.

```bash
# Usage
./scripts/setup-cicd-pipeline.sh
```

## Deployment Environments

AI Sports Edge uses the following deployment environments:

### 1. Local Development

- **Project ID**: N/A (uses Firebase Emulator)
- **URL**: http://localhost:5000
- **Purpose**: Local development and testing

### 2. Development

- **Project ID**: ai-sports-edge-dev
- **URL**: https://ai-sports-edge-dev.web.app
- **Purpose**: Feature development and testing

### 3. Staging

- **Project ID**: ai-sports-edge-staging
- **URL**: https://ai-sports-edge-staging.web.app
- **Purpose**: Pre-production testing

### 4. Production

- **Project ID**: ai-sports-edge-prod
- **URL**: https://ai-sports-edge.com
- **Purpose**: Production environment

## Deployment Configuration

The deployment configuration is defined in the following files:

### 1. `.env`

This file contains all the environment variables and API keys needed for the application. It is not committed to version control for security reasons. A template file `.env.example` is provided as a reference.

To set up the environment variables:

```bash
# Using the provided script
npm run setup-env

# Or manually
cp .env.example .env

# Edit the .env file with your actual API keys
nano .env
```

The environment variables are validated using the check-env script:

```bash
# Validate environment variables
npm run check-env
```

The environment variables are loaded using the centralized utility in `utils/envConfig.js`:

```javascript
// Import the utility
import { getEnvVar, firebaseConfig } from './utils/envConfig';

// Access individual environment variables with fallbacks
const apiKey = getEnvVar('FIREBASE_API_KEY', 'default-value');

// Use pre-configured objects
const app = initializeApp(firebaseConfig);
```

### Environment Variable Deployment

For deploying environment variable changes, use the dedicated deployment script:

```bash
# Deploy environment variable changes
npm run deploy:env-changes
```

This script will:
1. Validate environment variables
2. Build the application with the environment variables
3. Deploy to Firebase or GoDaddy based on your selection

For more details on environment variable setup and usage, see the [Environment Setup Documentation](../docs/environment-setup.md).

### 2. `firebase.json`

This file defines the Firebase configuration, including hosting, Firestore, storage, and functions.

### 3. `config/firebase-production.json`

This file defines the production-grade Firebase configuration with appropriate scaling.

### 4. `config/custom-domains.json`

This file defines the custom domains configuration.

### 5. `config/ssl-certificates.json`

This file defines the SSL certificates configuration.

### 6. `config/redirects-routing.json`

This file defines the redirects and routing configuration.

### 7. `config/webhooks.json`

This file defines the webhooks configuration.

## Rollback Procedure

In case of issues with a deployment, follow these steps to roll back:

### 1. Identify the Version to Roll Back To

```bash
# List previous deployments
firebase hosting:versions:list --project ai-sports-edge-prod
```

### 2. Roll Back to a Previous Version

```bash
# Roll back to a specific version
firebase hosting:clone <version> production --project ai-sports-edge-prod
```

### 3. Verify the Rollback

```bash
# Test the web app's functionality after rollback
./scripts/test-webapp-functionality.sh
```

### 4. Investigate and Fix the Issue

After rolling back, investigate the issue that caused the deployment to fail and fix it before attempting another deployment.

## Monitoring and Alerting

After deployment, monitor the application using:

1. **Firebase Console**: For monitoring Firebase services
2. **Google Cloud Console**: For monitoring Google Cloud services
3. **Slack Notifications**: For deployment status notifications
4. **Custom Monitoring**: For application-specific monitoring

## Conclusion

This deployment process ensures that AI Sports Edge is deployed reliably and consistently to all environments. By following this process, we can maintain high quality, reliability, and security for our application.