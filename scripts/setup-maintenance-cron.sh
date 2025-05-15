#!/bin/bash
# AI Sports Edge - Setup Maintenance Cron Jobs
# This script sets up cron jobs for automated maintenance tasks

BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
TEMP_CRON="/tmp/maintenance-cron.txt"

# Create temporary crontab file
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# AI Sports Edge Cron Jobs" > "$TEMP_CRON"

# Check if maintenance cron jobs already exist
if grep -q "automated-maintenance.sh daily" "$TEMP_CRON"; then
    echo "Maintenance cron jobs already exist. Updating..."
    # Remove existing maintenance cron jobs
    grep -v "automated-maintenance.sh" "$TEMP_CRON" > "${TEMP_CRON}.new"
    mv "${TEMP_CRON}.new" "$TEMP_CRON"
else
    echo "Setting up new maintenance cron jobs..."
    # Add header if not exists
    if ! grep -q "# AI Sports Edge Automated Maintenance" "$TEMP_CRON"; then
        echo -e "\n# AI Sports Edge Automated Maintenance" >> "$TEMP_CRON"
    fi
fi

# Add daily maintenance job - runs at 6:00 AM
echo "0 6 * * * ${BASE_DIR}/scripts/automated-maintenance.sh daily >> ${BASE_DIR}/logs/daily-maintenance.log 2>&1 # daily-maintenance" >> "$TEMP_CRON"

# Add weekly maintenance job - runs at 4:00 AM on Mondays
echo "0 4 * * 1 ${BASE_DIR}/scripts/automated-maintenance.sh weekly >> ${BASE_DIR}/logs/weekly-maintenance.log 2>&1 # weekly-maintenance" >> "$TEMP_CRON"

# Add monthly maintenance job - runs at 3:00 AM on the 1st of each month
echo "0 3 1 * * ${BASE_DIR}/scripts/automated-maintenance.sh monthly >> ${BASE_DIR}/logs/monthly-maintenance.log 2>&1 # monthly-maintenance" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "Maintenance cron jobs have been set up successfully:"
echo "- Daily maintenance: 6:00 AM every day"
echo "- Weekly maintenance: 4:00 AM every Monday"
echo "- Monthly maintenance: 3:00 AM on the 1st of each month"
echo ""
echo "To verify, run: crontab -l | grep 'maintenance'"