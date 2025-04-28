# Environment Variables Setup

This document explains how to set up and use environment variables in the AI Sports Edge application.

## Overview

AI Sports Edge uses environment variables to manage configuration settings and sensitive credentials. This approach:

- Keeps sensitive data out of version control
- Allows different configurations for development, testing, and production
- Makes deployment to different environments easier

## Setup Instructions

### 1. Create Environment Files

Copy the template file to create your environment file:

```bash
cp .env.example .env
```

For different environments, you can create:
- `.env.development` - For development environment
- `.env.production` - For production environment
- `.env.test` - For testing environment

### 2. Fill in Your Values

Edit the `.env` file and fill in your actual values for each variable. Make sure to:

- Get Firebase credentials from your Firebase console
- Get Stripe API keys from your Stripe dashboard
- Get sports data API keys from respective providers
- Set FanDuel affiliate links for betting features

### 3. Environment Variables in Development

When running the app in development mode, the environment variables will be loaded automatically from the `.env` file.

```bash
npm start
```

### 4. Environment Variables in Production

For production builds, environment variables are bundled during the build process:

```bash
npm run build
```

## Using Environment Variables in Code

### Accessing Environment Variables

Use the `envConfig.js` utility to access environment variables:

```javascript
import { getEnvVar } from './utils/envConfig';

// Get a variable with a fallback
const apiKey = getEnvVar('API_KEY', 'default-value');
```

### Pre-configured Environment Objects

The `envConfig.js` utility exports pre-configured objects for common services:

```javascript
import { firebaseConfig, stripeConfig } from './utils/envConfig';

// Use the Firebase config
const app = initializeApp(firebaseConfig);
```

## Affiliate Link Configuration

The application uses affiliate links for betting features. Configure these variables:

```
# FanDuel Affiliate Configuration
FANDUEL_AFFILIATE_ID=your-fanduel-affiliate-id
FANDUEL_AFFILIATE_LINK=https://fndl.co/your-affiliate-code
```

These variables are used in the `config/affiliateConfig.ts` file to configure affiliate links throughout the application.

## Adding New Environment Variables

When adding new environment variables:

1. Add the variable to `.env.example` with a placeholder value
2. Document the variable in this file
3. Update `utils/envConfig.js` if needed
4. Use the variable in your code with proper fallbacks

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that your `.env` file exists and has the required variables
2. Ensure the variable names match exactly (they are case-sensitive)
3. Restart your development server after changing environment variables

### Environment Variables Not Loading

If environment variables aren't loading:

1. Make sure you're using the `getEnvVar` function from `utils/envConfig.js`
2. Check that your `.env` file is in the project root directory
3. Verify that the build process is correctly including the variables

## Security Considerations

- Never commit `.env` files to version control
- Use different API keys for development and production
- Limit access to production environment variables
- Regularly rotate API keys and secrets