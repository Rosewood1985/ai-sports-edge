#!/bin/bash

# Sentry Setup Script for AI Sports Edge
# Run this script after creating your Sentry project

set -e

echo "🚀 Setting up Sentry for AI Sports Edge..."

# Check if Sentry DSN is provided
if [ -z "$1" ]; then
    echo ""
    echo "❌ Error: Sentry DSN is required"
    echo ""
    echo "Usage: ./scripts/setup-sentry.sh <SENTRY_DSN>"
    echo ""
    echo "Example:"
    echo "  ./scripts/setup-sentry.sh https://examplePublicKey@o0.ingest.sentry.io/0"
    echo ""
    echo "To get your DSN:"
    echo "  1. Go to https://sentry.io/"
    echo "  2. Create or select your 'ai-sports-edge' organization"
    echo "  3. Create a 'react-native' project"
    echo "  4. Copy the DSN from the project settings"
    echo ""
    exit 1
fi

SENTRY_DSN="$1"

echo "📝 Updating app.json with Sentry DSN..."

# Update app.json with the provided DSN
sed -i.bak "s|\"dsn\": \"SENTRY_DSN\"|\"dsn\": \"$SENTRY_DSN\"|g" app.json

# Verify the update
if grep -q "$SENTRY_DSN" app.json; then
    echo "✅ Successfully updated app.json with Sentry DSN"
else
    echo "❌ Failed to update app.json"
    exit 1
fi

echo "🔧 Updating sentry.properties..."

# Update sentry.properties if it exists
if [ -f "sentry.properties" ]; then
    # Extract organization and project from DSN
    # DSN format: https://key@oORG_ID.ingest.sentry.io/PROJECT_ID
    if [[ $SENTRY_DSN =~ https://[^@]+@o([0-9]+)\.ingest\.sentry\.io/([0-9]+) ]]; then
        ORG_ID="${BASH_REMATCH[1]}"
        PROJECT_ID="${BASH_REMATCH[2]}"
        
        echo "defaults.url=https://sentry.io/" > sentry.properties
        echo "defaults.org=ai-sports-edge" >> sentry.properties
        echo "defaults.project=react-native" >> sentry.properties
        echo "cli.executable=node_modules/@sentry/cli/bin/sentry-cli" >> sentry.properties
        
        echo "✅ Updated sentry.properties"
    else
        echo "⚠️  Warning: Could not parse DSN format, keeping existing sentry.properties"
    fi
fi

echo ""
echo "🎉 Sentry setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create a Sentry auth token at: https://sentry.io/settings/account/api/auth-tokens/"
echo "  2. Set environment variable: export SENTRY_AUTH_TOKEN=your_token_here"
echo "  3. Test the integration with: npm run test:sentry"
echo ""
echo "Your app is now configured with:"
echo "  - Organization: ai-sports-edge"
echo "  - Project: react-native"
echo "  - DSN: $SENTRY_DSN"
echo ""
echo "🔍 To verify setup:"
echo "  - Check app.json for updated DSN"
echo "  - Run the app and check console for Sentry initialization"
echo "  - Trigger a test error to verify error reporting"
echo ""