#!/bin/bash
# AI Sports Edge - Daily Progress Logger
# Logs Git commits from the last 24 hours into /docs/DAILY_PROGRESS_LOG.md

LOG_FILE="../docs/DAILY_PROGRESS_LOG.md"
TODAY=$(date +"%B %d, %Y")

echo -e "\n\n## $TODAY\n" >> $LOG_FILE
git log --since="24 hours ago" --pretty=format:"- %s" >> $LOG_FILE

echo -e "\n---" >> $LOG_FILE