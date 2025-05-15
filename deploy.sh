#!/bin/bash
set -e

echo "Deploying to Firebase..."
firebase use ai-sports-edge
firebase deploy --only hosting:aisportsedge-app

echo "Deployment completed successfully!"
