#!/bin/bash

echo "🔨 Exporting web build with new Expo CLI..."
npx expo export --platform web

echo "🚀 Uploading new build to GoDaddy via SFTP..."
npx sftp-deploy --config .vscode/sftp.json --local-dir dist

echo "✅ Deployment complete. Visit https://aisportsedge.app and hard refresh."
