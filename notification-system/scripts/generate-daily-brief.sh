#!/bin/bash
# Generate comprehensive daily brief including the Founder's Executive Brief

DATE=$(date +"%Y-%m-%d")
REPORT_FILE="/Users/lisadario/Desktop/ai-sports-edge/notification-system/reports/daily-brief-$DATE.md"
LOG_DIR="/Users/lisadario/Desktop/ai-sports-edge/logs"

# Ensure Executive Brief is up to date
/Users/lisadario/Desktop/ai-sports-edge/scripts/generate-executive-brief.sh

# Start building the daily brief
cat << BRIEF > "$REPORT_FILE"
# AI Sports Edge Daily Brief - $DATE

## Founder's Executive Brief
$(cat /Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/05-business/FOUNDER_EXECUTIVE_BRIEF.md)

## System Status Overview

### Overnight Operations
$(tail -20 "$LOG_DIR/overnight-sync-late-night.log" 2>/dev/null || echo "No overnight sync logs")

### Cron Job Results
$(cat "$LOG_DIR/cron-summary.log" 2>/dev/null || echo "No cron job summary available")

### Error Monitoring
$(grep -i "error\|fail\|critical" "$LOG_DIR"/*.log 2>/dev/null | tail -5 || echo "No critical errors detected")

## Today's Schedule
$(cat /Users/lisadario/Desktop/ai-sports-edge/start-my-day.command 2>/dev/null | head -20)

## Project Status

### Documentation Health
- Total files: $(find /Users/lisadario/Desktop/ai-sports-edge/docs-consolidated -name "*.md" | wc -l)
- Last consolidation: $(ls -lt /Users/lisadario/Desktop/ai-sports-edge/logs/docs-consolidation.log 2>/dev/null | head -1 || echo "No consolidation log found")

### GPT System
- Active instructions: $(find /Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas/consolidated -name "*.md" | wc -l)
- Recent usage: $(tail -5 /Users/lisadario/Desktop/ai-sports-edge/logs/gpt-usage.log 2>/dev/null || echo "No GPT usage logs found")

### Pending Reviews
$(ls -la /Users/lisadario/Desktop/ai-sports-edge/roo-workspace/pending-approval/ 2>/dev/null | wc -l || echo "0") files awaiting approval

## Quick Actions Needed
$(cat /Users/lisadario/Desktop/ai-sports-edge/notification-system/reports/action-items.md 2>/dev/null || echo "No immediate actions")

---
*Generated at $(date +"%Y-%m-%d %H:%M")*
BRIEF

# Log the generation
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Daily brief with Executive Brief generated: $REPORT_FILE" >> "$LOG_DIR/daily-brief.log"