/**
 * Sentry Source Maps Configuration for Cloud Functions
 * 
 * This script configures source map uploading for Firebase Cloud Functions
 * to enable better debugging in Sentry error tracking.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Sentry configuration
const SENTRY_ORG = process.env.SENTRY_ORG || 'ai-sports-edge';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'cloud-functions';
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_DSN = 'https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336';

/**
 * Configure source map uploading for Cloud Functions
 */
function configureSentrySourceMaps() {
  console.log('Configuring Sentry source maps for Cloud Functions...');

  // Create .sentryclirc file for configuration
  const sentryConfig = `
[defaults]
url=https://sentry.io/
org=${SENTRY_ORG}
project=${SENTRY_PROJECT}

[auth]
token=${SENTRY_AUTH_TOKEN || 'YOUR_SENTRY_AUTH_TOKEN_HERE'}
`;

  fs.writeFileSync(path.join(__dirname, '.sentryclirc'), sentryConfig.trim());
  console.log('Created .sentryclirc configuration file');

  // Update package.json with Sentry CLI and source map scripts
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add Sentry CLI as dev dependency
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@sentry/cli'] = '^2.21.0';

  // Add source map scripts
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts = {
    ...packageJson.scripts,
    'sentry:sourcemaps': 'sentry-cli sourcemaps inject --org $SENTRY_ORG --project $SENTRY_PROJECT ./lib && sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT ./lib',
    'build:sentry': 'npm run build && npm run sentry:sourcemaps',
    'deploy:sentry': 'npm run build:sentry && firebase deploy --only functions',
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with Sentry CLI and source map scripts');

  // Create source map configuration for TypeScript (if using TypeScript)
  const tsConfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    // Enable source maps in TypeScript compilation
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    tsConfig.compilerOptions.sourceMap = true;
    tsConfig.compilerOptions.inlineSourceMap = false;
    tsConfig.compilerOptions.sourceRoot = '/';

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log('Updated tsconfig.json to enable source maps');
  }

  console.log('Sentry source maps configuration completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set SENTRY_AUTH_TOKEN environment variable');
  console.log('2. Run: npm install (to install @sentry/cli)');
  console.log('3. Use "npm run deploy:sentry" to deploy with source maps');
  console.log('');
  console.log('Environment variables needed:');
  console.log('- SENTRY_ORG=' + SENTRY_ORG);
  console.log('- SENTRY_PROJECT=' + SENTRY_PROJECT);
  console.log('- SENTRY_AUTH_TOKEN=<your-sentry-auth-token>');
}

/**
 * Create a source map upload script for manual usage
 */
function createSourceMapUploadScript() {
  const uploadScript = `#!/bin/bash

# Source Map Upload Script for Sentry Cloud Functions
# This script uploads source maps to Sentry for better error debugging

echo "Uploading source maps to Sentry..."

# Check if Sentry CLI is installed
if ! command -v sentry-cli &> /dev/null; then
    echo "Sentry CLI not found. Installing..."
    npm install -g @sentry/cli
fi

# Check for required environment variables
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
    echo "Error: SENTRY_AUTH_TOKEN environment variable not set"
    echo "Get your token from: https://sentry.io/settings/account/api/auth-tokens/"
    exit 1
fi

# Set organization and project
export SENTRY_ORG="${SENTRY_ORG}"
export SENTRY_PROJECT="${SENTRY_PROJECT}"

# Create a release
RELEASE_VERSION="cloud-functions@$(date +%Y%m%d-%H%M%S)"
echo "Creating release: $RELEASE_VERSION"

sentry-cli releases new "$RELEASE_VERSION"

# Upload source maps
echo "Uploading source maps..."
sentry-cli sourcemaps inject --org $SENTRY_ORG --project $SENTRY_PROJECT ./lib
sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT ./lib

# Finalize the release
sentry-cli releases finalize "$RELEASE_VERSION"

echo "Source maps uploaded successfully!"
echo "Release: $RELEASE_VERSION"
`;

  fs.writeFileSync(path.join(__dirname, 'upload-sourcemaps.sh'), uploadScript);
  fs.chmodSync(path.join(__dirname, 'upload-sourcemaps.sh'), '755');
  console.log('Created upload-sourcemaps.sh script');
}

/**
 * Create environment configuration instructions
 */
function createEnvironmentInstructions() {
  const instructions = `# Sentry Source Maps Setup Instructions

## Environment Variables Required

Add these environment variables to your deployment environment:

\`\`\`bash
export SENTRY_ORG="${SENTRY_ORG}"
export SENTRY_PROJECT="${SENTRY_PROJECT}"
export SENTRY_AUTH_TOKEN="<your-sentry-auth-token>"
\`\`\`

## Getting Your Sentry Auth Token

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Give it a name like "AI Sports Edge Cloud Functions"
4. Select these scopes:
   - \`project:read\`
   - \`project:releases\`
   - \`org:read\`

## Deployment Commands

### Manual Source Map Upload
\`\`\`bash
./upload-sourcemaps.sh
\`\`\`

### Deploy with Source Maps
\`\`\`bash
npm run deploy:sentry
\`\`\`

### Just Upload Source Maps (after build)
\`\`\`bash
npm run sentry:sourcemaps
\`\`\`

## Testing Source Maps

After uploading source maps and deploying, trigger an error in your Cloud Functions:

1. Call the \`sentryErrorTest\` function
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
- \`.sentryclirc\` - Sentry CLI configuration
- \`upload-sourcemaps.sh\` - Manual upload script
- Updated \`package.json\` with Sentry scripts
- Updated \`tsconfig.json\` (if using TypeScript)
`;

  fs.writeFileSync(path.join(__dirname, 'SENTRY_SOURCE_MAPS.md'), instructions);
  console.log('Created SENTRY_SOURCE_MAPS.md instructions');
}

// Main execution
if (require.main === module) {
  configureSentrySourceMaps();
  createSourceMapUploadScript();
  createEnvironmentInstructions();
}

module.exports = {
  configureSentrySourceMaps,
  createSourceMapUploadScript,
  createEnvironmentInstructions,
};