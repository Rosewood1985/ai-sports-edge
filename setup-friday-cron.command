#!/bin/bash

(
crontab -l 2>/dev/null | grep -v "ai-sports-edge-friday"
echo "# ai-sports-edge-friday"
echo "30 16 * * 5 ~/Desktop/ai-sports-edge/friday-sprint-review.command # ai-sports-edge-friday"
) | crontab -

echo "✅ Weekly Friday sprint reminder installed for 4:30 PM."
