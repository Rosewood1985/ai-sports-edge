# 📊 AI Sports Edge — Executive Brief System

This document provides an overview of the Executive Brief System for AI Sports Edge, which generates daily executive summaries with key metrics, priorities, and action items.

## System Overview

The Executive Brief System consists of:

1. **Executive Brief Template**: A standardized format for daily executive summaries
2. **Generation Script**: Automated script to create the daily brief
3. **Scheduling System**: Cron job or launchd plist for daily generation
4. **Command Files**: Easy-to-use command files for manual operations

## File Structure

```
/docs-consolidated/05-business/
└── FOUNDER_EXECUTIVE_BRIEF.md     # The daily executive brief

/scripts/
├── generate-executive-brief.sh     # Script to generate the brief
└── setup-executive-brief-cron.sh   # Script to set up scheduling

/
├── generate-executive-brief.command    # Command file for manual generation
└── setup-executive-brief-cron.command  # Command file for scheduling setup
```

## Executive Brief Content

The executive brief includes the following sections:

1. **Key Metrics Dashboard**: Current metrics with trends and status indicators
2. **Sprint Status**: Progress on current sprint goals
3. **Focus Areas**: Immediate priorities, strategic opportunities, and risk factors
4. **Decision Log**: Recent decisions and their impact
5. **Upcoming Milestones**: Key dates and deliverables
6. **Recommendations**: Actionable recommendations for the founder
7. **Communication Needs**: External, internal, and partner communication requirements

## Usage

### Automatic Generation

The executive brief is automatically generated each morning at 8:00 AM. The generated brief is saved to:

```
/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/05-business/FOUNDER_EXECUTIVE_BRIEF.md
```

### Manual Generation

To manually generate the executive brief:

1. Double-click `generate-executive-brief.command` in the project root directory
2. The script will generate the brief and display a summary
3. The brief will be saved to the location specified above

### Setting Up Scheduling

To set up or update the scheduling:

1. Double-click `setup-executive-brief-cron.command` in the project root directory
2. The script will set up a cron job (Linux/Unix) or launchd agent (macOS)
3. The brief will be automatically generated daily at 8:00 AM

## Data Sources

The executive brief pulls data from the following sources:

1. **Daily Metrics**: `/data/daily-metrics.json`
2. **Sprint Information**: Current kickoff file in `/kickoffs/`
3. **Task Board**: `/task-board.md`

If these files don't exist or are incomplete, the script will use placeholder values.

## Customization

To customize the executive brief:

1. Edit the template in `/scripts/generate-executive-brief.sh`
2. Update the sections, metrics, or formatting as needed
3. Run the script to generate a new brief with your changes

To change the scheduling:

1. Edit the cron time in `/scripts/setup-executive-brief-cron.sh`
2. Run the script to update the scheduling

## Logs

Logs for the executive brief system are stored in:

1. **Generation Log**: `/logs/executive-brief.log`
2. **Cron Setup Log**: `/status/cron-setup.log`

## Troubleshooting

If the executive brief is not being generated:

1. Check the log files for errors
2. Verify that the cron job or launchd agent is set up correctly
3. Ensure the data source files exist and are accessible
4. Run the generation script manually to see if there are any errors

## Last Updated

May 10, 2025