# API Connection Verification Guide

This guide explains how to use the API connection verification system to ensure that all API connections are properly configured and working correctly.

## Table of Contents

- [Overview](#overview)
- [API Key Management](#api-key-management)
- [Verifying API Connections](#verifying-api-connections)
- [Detecting Placeholder Credentials](#detecting-placeholder-credentials)
- [Scanning for Hardcoded API Keys](#scanning-for-hardcoded-api-keys)
- [Best Practices](#best-practices)

## Overview

The API connection verification system consists of several components:

1. **API Key Management**: A centralized system for managing API keys and other sensitive credentials
2. **API Connection Verification**: A script to verify that API connections are working correctly
3. **Placeholder Credential Detection**: A system to detect placeholder credentials that need to be replaced
4. **Hardcoded API Key Detection**: A system to scan for hardcoded API keys in the codebase

These components work together to ensure that all API connections are properly configured and working correctly, and that no sensitive credentials are exposed in the codebase.

## API Key Management

The API key management system is implemented in `utils/apiKeys.js`. It provides a centralized way to manage API keys and other sensitive credentials, loading them from environment variables or secure storage and providing them to services.

### Key Features

- **Centralized Management**: All API keys are managed in one place
- **Secure Storage**: API keys are stored securely in AsyncStorage
- **Environment Variable Support**: API keys can be loaded from environment variables
- **Caching**: API keys are cached to avoid repeated storage lookups
- **Verification**: API keys can be verified to ensure they are valid

### Usage

```javascript
// Import the API key management system
import apiKeys from '../utils/apiKeys';

// Get an API key
const weatherApiKey = apiKeys.getWeatherApiKey();

// Use the API key
fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${weatherApiKey}`);
```

### Available API Keys

The following API keys are available:

- **Weather API**: `getWeatherApiKey()`
- **Odds API**: `getOddsApiKey()`
- **Firebase API**: `getFirebaseApiKey()`
- **Stripe API**: `getStripeApiKey()`
- **Stripe Publishable Key**: `getStripePublishableKey()`
- **Google Maps API**: `getGoogleMapsApiKey()`

### Setting API Keys

API keys can be set in the following ways:

1. **Environment Variables**: Set the appropriate environment variable (e.g., `WEATHER_API_KEY`)
2. **Expo Constants**: Set the appropriate value in `app.json` under `expo.extra`
3. **Secure Storage**: Use the `setApiKey` function to store the API key securely

```javascript
// Set an API key in secure storage
await apiKeys.setApiKey('WEATHER', apiKeys.API_KEY_STORAGE_KEYS.WEATHER, 'your-api-key');
```

## Verifying API Connections

The API connection verification script is implemented in `scripts/verify-api-connections.js`. It verifies that all API connections are working correctly, checks for placeholder credentials, and scans for hardcoded API keys in the codebase.

### Usage

```bash
# Basic usage
node scripts/verify-api-connections.js

# With options
node scripts/verify-api-connections.js --fix --env .env.production --output api-verification-results.json --verbose
```

### Options

- `--fix`: Attempt to fix issues automatically
- `--env <file>`: Path to .env file to load (default: .env)
- `--output <file>`: Output file for results (default: api-verification-results.json)
- `--verbose`: Show detailed output
- `--help`: Show help

### Output

The script outputs a JSON file with the following structure:

```json
{
  "placeholderCredentials": {
    "WEATHER_API_KEY": "YOUR_WEATHER_API_KEY"
  },
  "apiConnections": {
    "weather": false,
    "odds": true,
    "stripe": true
  },
  "hardcodedKeys": {
    "critical": 0,
    "high": 2,
    "total": 2,
    "details": [
      {
        "file": "services/weatherService.ts",
        "line": 86,
        "lineContent": "        appid: WEATHER_API_KEY,",
        "match": "WEATHER_API_KEY",
        "type": "Generic API Key",
        "severity": "high",
        "description": "Generic API key pattern detected",
        "allowlisted": false
      }
    ]
  },
  "timestamp": "2025-05-19T17:30:00.000Z"
}
```

## Detecting Placeholder Credentials

The API connection verification script checks for placeholder credentials in environment variables. It looks for patterns like:

- `YOUR_API_KEY`
- `PLACEHOLDER`
- `REPLACE_ME`
- `XXXX`
- Empty strings

If any placeholder credentials are found, they are reported in the output.

## Scanning for Hardcoded API Keys

The API connection verification script scans for hardcoded API keys in the codebase using the security utilities from the atomic architecture. It looks for patterns like:

- Generic API keys: `api_key = "abcdef1234567890"`
- Firebase API keys: `AIza...`
- AWS access keys: `AKIA...`
- Stripe API keys: `sk_live_...` or `sk_test_...`
- And many more

If any hardcoded API keys are found, they are reported in the output.

## Best Practices

### API Key Management

1. **Never hardcode API keys**: Always use the API key management system
2. **Use environment variables**: Store API keys in environment variables
3. **Use secure storage**: Store API keys in secure storage
4. **Verify API connections**: Regularly verify that API connections are working correctly
5. **Scan for hardcoded API keys**: Regularly scan for hardcoded API keys in the codebase

### Environment Variables

1. **Use .env files**: Store environment variables in .env files
2. **Don't commit .env files**: Add .env files to .gitignore
3. **Use .env.example files**: Provide example .env files with placeholder values
4. **Document environment variables**: Document all environment variables in the README

### Security

1. **Restrict API keys**: Restrict API keys to specific domains or IP addresses
2. **Rotate API keys**: Regularly rotate API keys
3. **Monitor API usage**: Monitor API usage for unusual patterns
4. **Use API key verification**: Verify API keys before using them
5. **Implement rate limiting**: Implement rate limiting to prevent abuse

## Related Resources

- [API Key Management](../api-reference/api-key-management.md)
- [Security Features](./security-features.md)
- [Environment Configuration](./environment-configuration.md)
