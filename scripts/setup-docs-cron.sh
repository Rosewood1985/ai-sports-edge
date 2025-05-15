#!/bin/bash

# Setup cron jobs for automatic documentation consolidation
echo "Setting up cron jobs for automatic documentation consolidation..."

# Create a temporary file with the cron entries
cat > /tmp/docs-cron << 'CRON'
# ai-sports-edge-docs-consolidation
0 3 * * 1 ~/.roocode/scripts/run-full-consolidation.sh # ai-sports-edge-docs-weekly
0 2 1 * * ~/.roocode/scripts/run-full-consolidation.sh # ai-sports-edge-docs-monthly
CRON

# Check if the cron entries already exist
if crontab -l | grep -q "ai-sports-edge-docs-consolidation"; then
    echo "Cron jobs already exist. Updating..."
    # Update existing cron jobs
    (crontab -l | grep -v "ai-sports-edge-docs") > /tmp/current-crontab
    cat /tmp/current-crontab /tmp/docs-cron > /tmp/new-crontab
    crontab /tmp/new-crontab
else
    echo "Adding new cron jobs..."
    # Add new cron jobs
    (crontab -l 2>/dev/null; cat /tmp/docs-cron) | crontab -
fi

# Clean up temporary files
rm -f /tmp/docs-cron /tmp/current-crontab /tmp/new-crontab

echo "Cron jobs set up successfully!"
echo "Documentation will be consolidated automatically:"
echo "  - Weekly: Every Monday at 3:00 AM"
echo "  - Monthly: On the 1st of each month at 2:00 AM"