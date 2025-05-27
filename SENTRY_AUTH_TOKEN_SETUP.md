# Sentry Auth Token Setup Guide

## Overview

This guide explains how to set up the Sentry auth token for source map uploads in the AI Sports Edge project.

## Why You Need This

The Sentry auth token enables:
- ✅ Automatic source map uploads
- ✅ Proper error symbolication 
- ✅ Readable stack traces in production
- ✅ Better debugging of React Native crashes

## Getting Your Sentry Auth Token

1. **Login to Sentry**: Go to [sentry.io](https://sentry.io) and login to your account

2. **Navigate to Auth Tokens**: 
   - Click on your profile picture (top right)
   - Select "Account Settings"
   - Go to "Developer Settings" → "Auth Tokens"

3. **Create New Token**:
   - Click "Create New Token"
   - Name: `AI Sports Edge Source Maps`
   - Scopes: Select:
     - `project:write` (for uploading source maps)
     - `project:releases` (for release management)
   - Organization: `ai-sports-edge`
   - Project: `react-native`

4. **Copy the Token**: It will look like `sntrys_1234567890abcdef...`

## Setting Up the Token

### Method 1: Environment Variable (Recommended)

Set the environment variable in your system:

```bash
export SENTRY_AUTH_TOKEN="your_actual_token_here"
```

### Method 2: Update .env File (Development Only)

⚠️ **Security Warning**: Only for local development. Never commit real tokens to git.

```env
SENTRY_AUTH_TOKEN=sntrys_your_actual_token_here
SENTRY_ORG=ai-sports-edge
SENTRY_PROJECT=react-native
```

### Method 3: CI/CD Setup

For production builds:

**GitHub Actions:**
```yaml
env:
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

**EAS (Expo Application Services):**
```bash
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your_token"
```

## Verification

Test your setup:

```bash
npm run test:sentry
```

Expected output:
```
✅ Sentry configuration looks good!
✅ Auth token configured
✅ Source maps can be uploaded
```

## Security Best Practices

1. **Never Commit Tokens**: Add real tokens to `.gitignore` patterns
2. **Use Secrets Management**: Store in CI/CD secrets or environment variables
3. **Rotate Regularly**: Generate new tokens periodically
4. **Limit Scope**: Only grant necessary permissions
5. **Monitor Usage**: Check Sentry logs for unauthorized access

## Troubleshooting

### Common Issues:

**"Auth token not found":**
- Verify `SENTRY_AUTH_TOKEN` is set
- Check token format starts with `sntrys_`
- Ensure token has correct scopes

**"Source maps not uploading":**
- Check internet connection
- Verify organization/project names
- Ensure token has `project:write` scope

**"Build failing":**
- Token might be expired
- Check Sentry service status
- Verify project configuration

### Getting Help:

1. Check [Sentry Documentation](https://docs.sentry.io/platforms/react-native/sourcemaps/)
2. Review project logs: `npm run test:sentry`
3. Contact team if issues persist

## Current Status

- ✅ Sentry DSN configured
- ✅ Error tracking active
- ⚠️ Auth token needs to be set with real value
- ⚠️ Source map uploads disabled until token configured

Replace `sntrys_YOUR_AUTH_TOKEN_HERE_REPLACE_WITH_ACTUAL_TOKEN` in `.env` with your actual token to enable source map uploads.