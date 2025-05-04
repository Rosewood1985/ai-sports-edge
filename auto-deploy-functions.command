#!/bin/zsh
cd ~/Desktop/ai-sports-edge/functions
git add .
git commit -m "auto: deploy referral and reward functions"
git push origin main
firebase deploy --only functions:generateReferralCode,functions:rewardReferrer

# Add status logging
echo "Updating status log..."
cd ~/Desktop/ai-sports-edge
mkdir -p status
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
echo "- [x] Firebase functions (generateReferralCode, rewardReferrer) deployed on $TIMESTAMP" >> status/status-log.md

# Commit and push status log update
git add status/status-log.md
git commit -m "auto: update status log with function deployment"
git push origin main

echo "✅ Functions deployed and status log updated."