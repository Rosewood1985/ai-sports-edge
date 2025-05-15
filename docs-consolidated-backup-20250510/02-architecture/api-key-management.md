# API Key Management

This document explains the API key management system implemented in the AI Sports Edge app.

## Overview

The app uses a centralized API key management system to:

1. Securely access API keys from environment variables
2. Provide proper error handling for missing keys
3. Prevent hardcoded API keys in the codebase
4. Validate required environment variables at startup

## Key Components

### 1. Centralized API Key Management (`utils/apiKeys.ts`)

This module provides:
- Type-safe access to API keys
- Consistent error handling
- Logging for missing keys
- Clear identification of which service requires which key

```typescript
// Example usage
import apiKeys from '../utils/apiKeys';

// Get API key with proper error handling
const stripeKey = apiKeys.getStripeSecretKey();
```

### 2. Environment Validation (`utils/envCheck.js`)

This module:
- Validates required environment variables at startup
- Groups variables by category (firebase, api, app)
- Provides clear error messages for missing variables
- Can be configured to exit the process or continue with warnings

```javascript
// Example usage
import { validateEnvironment } from './utils/envCheck';

// Validate environment variables
const envValid = validateEnvironment({ exitOnError: false });
```

### 3. Environment Template (`.env.example`)

This file:
- Documents all required and optional environment variables
- Provides a template for developers to create their own `.env` file
- Groups variables by category with explanatory comments

## How to Use

### Setting Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required API keys in the `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ODDS_API_KEY=your_odds_api_key
   ```

### Accessing API Keys in Code

```typescript
// TypeScript
import apiKeys from '../utils/apiKeys';

const stripeKey = apiKeys.getStripeSecretKey();
const oddsApiKey = apiKeys.getOddsApiKey();
```

```javascript
// JavaScript
const apiKeys = require('../utils/apiKeys');

const stripeKey = apiKeys.getStripeSecretKey();
const oddsApiKey = apiKeys.getOddsApiKey();
```

### Adding a New API Key

1. Add the key to `.env.example`:
   ```
   NEW_SERVICE_API_KEY=your-new-service-api-key
   ```

2. Add the key configuration to `utils/apiKeys.ts`:
   ```typescript
   const API_KEYS = {
     // ... existing keys
     NEW_SERVICE_API_KEY: {
       key: 'NEW_SERVICE_API_KEY',
       isRequired: true,
       serviceName: 'New Service'
     }
   };
   
   // Add getter function
   export const getNewServiceApiKey = () => getApiKey(
     API_KEYS.NEW_SERVICE_API_KEY.key, 
     API_KEYS.NEW_SERVICE_API_KEY.isRequired, 
     API_KEYS.NEW_SERVICE_API_KEY.serviceName
   );
   
   // Add to default export
   export default {
     // ... existing getters
     getNewServiceApiKey
   };
   ```

3. Add to environment validation in `utils/envCheck.js` if required:
   ```javascript
   const REQUIRED_ENV_VARS = {
     api: [
       // ... existing keys
       'NEW_SERVICE_API_KEY'
     ]
   };
   ```

## Best Practices

1. **Never hardcode API keys** in the codebase
2. **Always use the centralized system** to access keys
3. **Add proper error handling** for API calls that might fail due to missing keys
4. **Document new API keys** in `.env.example`
5. **Use non-sensitive keys** for development and testing
6. **Rotate API keys** periodically for security

## Troubleshooting

If you encounter errors related to missing API keys:

1. Check that all required keys are set in your `.env` file
2. Verify that the `.env` file is in the correct location
3. Restart the app after making changes to environment variables
4. Check the logs for specific error messages about which keys are missing