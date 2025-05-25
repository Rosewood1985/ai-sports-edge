# Sentry Source Maps Setup Instructions

## Environment Variables Required

Add these environment variables to your deployment environment:

```bash
export SENTRY_ORG="ai-sports-edge"
export SENTRY_PROJECT="cloud-functions"
export SENTRY_AUTH_TOKEN="<your-sentry-auth-token>"
```

## Getting Your Sentry Auth Token

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Give it a name like "AI Sports Edge Cloud Functions"
4. Select these scopes:
   - `project:read`
   - `project:releases`
   - `org:read`

## Deployment Commands

### Manual Source Map Upload
```bash
./upload-sourcemaps.sh
```

### Deploy with Source Maps
```bash
npm run deploy:sentry
```

### Just Upload Source Maps (after build)
```bash
npm run sentry:sourcemaps
```

## Testing Source Maps

After uploading source maps and deploying, trigger an error in your Cloud Functions:

1. Call the `sentryErrorTest` function
2. Check Sentry dashboard for the error
3. Verify that stack traces show original source code (not compiled JavaScript)

## Troubleshooting

### Source Maps Not Working
- Verify SENTRY_AUTH_TOKEN is set correctly
- Check that the release version matches between upload and runtime
- Ensure TypeScript source maps are enabled (sourceMap: true)

### Upload Fails
- Check network connectivity
- Verify Sentry organization and project names
- Ensure auth token has correct permissions

## File Structure

After setup, your functions directory should contain:
- `.sentryclirc` - Sentry CLI configuration
- `upload-sourcemaps.sh` - Manual upload script
- Updated `package.json` with Sentry scripts
- Updated `tsconfig.json` (if using TypeScript)
