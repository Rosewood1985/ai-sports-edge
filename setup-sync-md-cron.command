#!/bin/bash

(
crontab -l 2>/dev/null | grep -v "ai-sports-edge-sync-md"
echo "# ai-sports-edge-sync-md"
echo "0 7 * * * ~/Desktop/ai-sports-edge/sync-md-updates.command # ai-sports-edge-sync-md"
echo "0 11 * * * ~/Desktop/ai-sports-edge/sync-md-updates.command # ai-sports-edge-sync-md"
echo "0 15 * * * ~/Desktop/ai-sports-edge/sync-md-updates.command # ai-sports-edge-sync-md"
echo "0 19 * * * ~/Desktop/ai-sports-edge/sync-md-updates.command # ai-sports-edge-sync-md"
echo "0 23 * * * ~/Desktop/ai-sports-edge/sync-md-updates.command # ai-sports-edge-sync-md"
) | crontab -

echo "✅ Markdown sync scheduled for 7AM, 11AM, 3PM, 7PM, and 11PM EST."
