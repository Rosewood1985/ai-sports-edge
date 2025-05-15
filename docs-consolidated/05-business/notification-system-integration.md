# 📧 AI Sports Edge — Notification System Integration

This document describes the integration between the Executive Brief system and the email notification system for AI Sports Edge.

## Overview

The integration combines the Executive Brief with other daily information to create a comprehensive daily brief that is sent via email. This ensures that key metrics, priorities, and action items are delivered to stakeholders every morning.

## Components

1. **Executive Brief System**: Generates a standardized daily executive summary
2. **Daily Brief Generator**: Combines the Executive Brief with other system information
3. **Email Notification System**: Sends the combined brief via email
4. **Scheduling System**: Automates the generation and delivery process
5. **Testing Tools**: Allows for manual testing of the system

## File Structure

```
/notification-system/
├── scripts/
│   ├── generate-daily-brief.sh     # Combines Executive Brief with other info
│   ├── send-daily-brief.sh         # Sends the combined brief via email
│   ├── send-gmail-secure.sh        # Handles secure email delivery
│   └── setup-unified-schedule.sh   # Sets up the unified cron schedule
├── reports/
│   ├── daily-brief-YYYY-MM-DD.md   # Generated daily briefs
│   └── action-items.md             # Current action items
└── test-daily-email.command        # Test command for manual testing
```

## Process Flow

1. **Executive Brief Generation** (6:50 AM):
   - The Executive Brief is generated using `/scripts/generate-executive-brief.sh`
   - The brief is saved to `/docs-consolidated/05-business/FOUNDER_EXECUTIVE_BRIEF.md`

2. **Daily Brief Generation** (7:00 AM):
   - The Daily Brief is generated using `/notification-system/scripts/generate-daily-brief.sh`
   - This script includes the Executive Brief and adds:
     - System status overview
     - Cron job results
     - Error monitoring
     - Today's schedule
     - Documentation health
     - GPT system status
     - Pending reviews
     - Quick actions needed
   - The combined brief is saved to `/notification-system/reports/daily-brief-YYYY-MM-DD.md`

3. **Email Delivery** (7:00 AM):
   - The Daily Brief is sent via email using `/notification-system/scripts/send-daily-brief.sh`
   - The email is sent to `ai.sportsedgeapp@gmail.com`

## Scheduling

The system is scheduled to run automatically using cron:

```
# Executive Brief Generation - 6:50 AM (before email send)
50 6 * * * /Users/lisadario/Desktop/ai-sports-edge/scripts/generate-executive-brief.sh >> /Users/lisadario/Desktop/ai-sports-edge/logs/executive-brief.log 2>&1 # executive-brief-gen

# Daily Brief with Executive Brief - 7:00 AM
0 7 * * * /Users/lisadario/Desktop/ai-sports-edge/notification-system/scripts/send-daily-brief.sh >> /Users/lisadario/Desktop/ai-sports-edge/logs/daily-email.log 2>&1 # daily-brief-email
```

## Manual Testing

To test the system manually:

1. Run `./notification-system/test-daily-email.command`
2. This will:
   - Generate the Executive Brief
   - Generate the Daily Brief
   - Send the email
3. Check `ai.sportsedgeapp@gmail.com` for the email
4. Check the logs in `/logs/` for any issues

## Logs

Logs for the notification system are stored in:

1. **Executive Brief Log**: `/logs/executive-brief.log`
2. **Daily Email Log**: `/logs/daily-email.log`
3. **Email Notifications Log**: `/logs/email-notifications.log`

## Customization

To customize the daily brief:

1. Edit the template in `/notification-system/scripts/generate-daily-brief.sh`
2. Update the sections, formatting, or data sources as needed
3. Run the test command to verify your changes

To change the scheduling:

1. Edit the cron times in `/notification-system/scripts/setup-unified-schedule.sh`
2. Run the script to update the scheduling

## Troubleshooting

If the daily brief is not being generated or sent:

1. Check the log files for errors
2. Verify that the cron jobs are set up correctly
3. Ensure the Executive Brief is being generated properly
4. Run the test command to see if there are any issues
5. Check that the email credentials are correct

## Last Updated

May 10, 2025