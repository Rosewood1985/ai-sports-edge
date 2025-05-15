#!/bin/bash
echo "🔄 Syncing project to GitHub..."

git add .
git commit -m "🔄 Sync checkpoint: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin master

echo "✅ Sync complete."