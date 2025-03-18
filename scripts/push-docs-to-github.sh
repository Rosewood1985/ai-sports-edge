#!/bin/bash
# Script to push all documentation to GitHub

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Ensure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Add all documentation files
git add docs/espn-api-ml-integration-plan.md
git add docs/espn-api-ml-business-impact.md
git add docs/bet365-api-integration-plan.md
git add docs/bet365-api-business-impact.md
git add docs/bet365-api-implementation-guide.md
git add docs/ml-sports-api-integration-summary.md
git add docs/sports-api-ml-implementation-roadmap.md
git add docs/sports-api-ml-business-impact.md
git add docs/sports-api-ml-integration-summary.md
git add docs/push-docs-to-github.md
git add docs/update-instructions.md
git add docs/update-summary.md
git add docs/ml-sports-edge-implementation-summary.md

# Add script files
git add scripts/push-docs-to-github.sh
git add scripts/update-web-app.sh
git add scripts/update-mobile-app.sh
git add scripts/update-all.sh
git add scripts/README.md

# Commit the changes
git commit -m "Add comprehensive documentation and update scripts for ESPN API and Bet365 API integration"

# Push to GitHub
git push origin main

echo "Documentation and scripts successfully pushed to GitHub!"