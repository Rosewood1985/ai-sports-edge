#!/bin/bash
# Test the daily email system

cd /Users/lisadario/Desktop/ai-sports-edge

echo "Testing Daily Brief Email System..."
echo "1. Generating Executive Brief..."
./scripts/generate-executive-brief.sh

echo "2. Generating Daily Brief..."
./notification-system/scripts/generate-daily-brief.sh

echo "3. Sending Email..."
./notification-system/scripts/send-daily-brief.sh

echo ""
echo "Test complete! Check ai.sportsedgeapp@gmail.com for the email."
echo "Also check logs at: /Users/lisadario/Desktop/ai-sports-edge/logs/"