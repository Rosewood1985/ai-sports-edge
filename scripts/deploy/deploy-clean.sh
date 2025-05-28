#!/bin/bash

echo "🧼 Cleaning old .html files and regenerating dist/ folder..."

# Remove the old dist folder
rm -rf dist

# Re-export using new Expo CLI
npx expo export --platform web --output-dir dist

# Remove unwanted legacy .html files from new dist
cd dist
rm -f *.html
rm -f *.php
rm -f *login*.*
rm -f enhanced-*.*
rm -f homepage-preview.html
rm -f test-*.*
rm -f register-service-worker.js
rm -f firebase-*

echo "✅ Clean build ready in dist/"
