# Database Consistency Triggers Guide

## Overview

This document provides information about the database consistency triggers implemented for AI Sports Edge. These triggers maintain data consistency between duplicated fields in the Firestore database, particularly between the `users` collection and the `subscriptions` subcollection.

## Implemented Triggers

Three Firebase Cloud Functions have been implemented to maintain data consistency:

1. **syncSubscriptionStatus**: Syncs subscription status from subscriptions subcollection to users collection

   - Trigger: When a subscription document is updated
   - Source of truth: `subscriptions.status`
   - Target: `users.subscriptionStatus`
   - Note: Standardizes "canceled" to "cancelled" in the user document

2. **syncCustomerId**: Syncs customer ID changes from users collection to subscriptions subcollection

   - Trigger: When a user document is updated
   - Source of truth: `users.stripeCustomerId`
   - Target: `subscriptions.customerId`

3. **standardizeStatusSpelling**: Standardizes "canceled"/"cancelled" spelling across collections
   - Trigger: When a subscription document is updated
   - Action: Converts "cancelled" to "canceled" in subscription documents
   - Note: This ensures consistent spelling in the database while maintaining UI preferences

## Deployment

To deploy these triggers to Firebase, follow these steps:

1. Ensure you have Firebase CLI installed:

   ```bash
   npm install -g firebase-tools
   ```

2. Choose an authentication method:

   **Option A: Interactive Login**

   ```bash
   firebase login
   ./deploy-database-consistency-triggers.sh
   ```

   **Option B: Service Account Key (Recommended for CI/CD)**

   ```bash
   ./deploy-database-consistency-triggers.sh --key ./path/to/serviceAccountKey.json
   ```

   The default service account key path is `./firebase-config/service-account.json`

The deployment script will:

- Verify Firebase CLI installation
- Authenticate using the provided method
- Ensure the correct project is selected
- Build the functions
- Deploy only the database consistency triggers
- Verify the deployment

## Testing

After deployment, you can verify the triggers are working correctly using the test script:

```bash
# Using Firebase CLI authentication
node test-triggers.js

# Using service account key authentication
GOOGLE_APPLICATION_CREDENTIALS=./firebase-config/service-account.json node test-triggers.js
```

This script will:

1. Create test data in Firestore (a test user and subscription)
2. Test each trigger by making changes that should trigger the functions
3. Verify the expected changes were made
4. Clean up the test data

### Manual Testing

You can also manually test the triggers by:

1. Creating a test user in the Firebase console
2. Creating a subscription for that user
3. Updating the subscription status and verifying it syncs to the user document
4. Updating the user's customer ID and verifying it syncs to the subscription document
5. Setting a subscription status to "cancelled" and verifying it changes to "canceled"

## Monitoring

Monitor the performance and execution of these triggers through:

1. Firebase Console > Functions > Logs
2. Firebase Console > Functions > Dashboard (for execution metrics)

## Troubleshooting

Common issues:

1. **Functions not triggering**: Verify the deployment was successful and the functions are enabled
2. **Permission errors**: Check Firestore security rules to ensure the functions have write access
3. **Timeout errors**: If functions time out, consider optimizing the code or increasing the timeout limit
4. **Authentication errors**: Ensure your service account key has the necessary permissions

## Implementation Details

The triggers are implemented in `functions/database-consistency-triggers.js` and exported in `functions/index.js`.

Each trigger uses Firestore transactions to ensure atomic updates, preventing race conditions and data inconsistencies.

## Data Flow

```
User updates subscription status
↓
syncSubscriptionStatus trigger fires
↓
User document is updated with new status (with standardized spelling)

User's customer ID is updated
↓
syncCustomerId trigger fires
↓
All subscription documents for that user are updated with new customer ID

Subscription status is set to "cancelled"
↓
standardizeStatusSpelling trigger fires
↓
Subscription status is standardized to "canceled"
```

## CI/CD Integration

For CI/CD pipelines, use the service account key authentication method:

1. Store your service account key securely in your CI/CD environment
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable or use the `--key` option
3. Run the deployment script as part of your pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Database Consistency Triggers

on:
  push:
    branches: [main]
    paths:
      - 'functions/database-consistency-triggers.js'
      - 'functions/index.js'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      - name: Create Service Account Key File
        run: echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > service-account.json
      - name: Deploy Functions
        run: ./deploy-database-consistency-triggers.sh --key service-account.json
```
