#!/bin/bash

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
export SENTRY_ORG="ai-sports-edge"
export SENTRY_PROJECT="cloud-functions"

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
