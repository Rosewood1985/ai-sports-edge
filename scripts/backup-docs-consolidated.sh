#!/bin/bash

# Create a backup of the consolidated documentation with date stamp
echo "Creating backup of consolidated documentation..."

# Get current date in YYYYMMDD format
DATE=$(date +%Y%m%d)

# Define backup directory
BACKUP_DIR=~/Desktop/ai-sports-edge/docs-consolidated-backup-$DATE

# Check if backup already exists
if [ -d "$BACKUP_DIR" ]; then
    echo "Backup already exists at $BACKUP_DIR"
    echo "Do you want to overwrite it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Overwriting existing backup..."
        rm -rf "$BACKUP_DIR"
    else
        echo "Backup operation cancelled."
        exit 0
    fi
fi

# Create backup
cp -r ~/Desktop/ai-sports-edge/docs-consolidated "$BACKUP_DIR"

# Check if backup was successful
if [ -d "$BACKUP_DIR" ]; then
    echo "Backup created successfully at: $BACKUP_DIR"
    
    # Count files in backup
    FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
    echo "Total files backed up: $FILE_COUNT"
    
    # Log backup in status directory
    echo "$(date): Created backup with $FILE_COUNT files at $BACKUP_DIR" >> ~/Desktop/ai-sports-edge/status/docs-backup-log.md
else
    echo "Error: Backup failed!"
    exit 1
fi

echo "Backup process completed."