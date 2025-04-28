#!/bin/bash

echo "🔨 Exporting web build with Expo..."
npx expo export:web

echo "🧹 Cleaning old remote files..."
# (Optional) Manual cleanup recommended via VS Code SFTP explorer if needed

echo "🚀 Uploading new build to GoDaddy..."
npx sftp-deploy --config .vscode/sftp.json --local-dir dist

echo "✅ Deployment complete. Visit https://aisportsedge.app and hard refresh."
