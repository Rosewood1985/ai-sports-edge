#!/bin/bash

# Sentry Cloud Functions Deployment Test Script
# This script tests the Sentry integration in a live environment

echo "🧪 Testing Sentry Cloud Functions Integration"
echo "============================================="

# Deploy functions to Firebase
echo "📤 Deploying Cloud Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Wait for functions to be ready
echo "⏳ Waiting for functions to be ready..."
sleep 10

# Test the Sentry test function
echo "🧪 Testing Sentry error tracking..."

# Get the project ID
PROJECT_ID=$(firebase projects:list --json | jq -r '.[0].projectId')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not determine Firebase project ID"
    exit 1
fi

echo "Using project: $PROJECT_ID"

# Test endpoints
BASE_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net"

echo "Testing Sentry integration endpoints:"
echo "1. Basic Sentry test..."
curl -s "$BASE_URL/sentryTest" > /dev/null && echo "✅ sentryTest endpoint accessible" || echo "❌ sentryTest endpoint failed"

echo "2. Error tracking test..."
curl -s "$BASE_URL/sentryErrorTest" > /dev/null && echo "✅ sentryErrorTest endpoint accessible" || echo "❌ sentryErrorTest endpoint failed"

echo "3. Racing tracking test..."
curl -s "$BASE_URL/sentryRacingTest" > /dev/null && echo "✅ sentryRacingTest endpoint accessible" || echo "❌ sentryRacingTest endpoint failed"

echo "4. ML tracking test..."
curl -s "$BASE_URL/sentryMLTest" > /dev/null && echo "✅ sentryMLTest endpoint accessible" || echo "❌ sentryMLTest endpoint failed"

echo "5. Performance tracking test..."
curl -s "$BASE_URL/sentryPerformanceTest" > /dev/null && echo "✅ sentryPerformanceTest endpoint accessible" || echo "❌ sentryPerformanceTest endpoint failed"

echo ""
echo "🎉 Deployment test completed!"
echo ""
echo "Next steps:"
echo "1. Check Sentry dashboard for errors and events"
echo "2. Verify source maps are working (stack traces show original code)"
echo "3. Remove test functions when verification is complete"
echo ""
echo "Sentry Dashboard: https://sentry.io/organizations/ai-sports-edge/projects/cloud-functions/"
