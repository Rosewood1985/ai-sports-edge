#!/bin/bash

# Update the run-full-consolidation.sh script to properly substitute the date
echo "Updating run-full-consolidation.sh script..."

# Create a backup of the original script
cp ~/.roocode/scripts/run-full-consolidation.sh ~/.roocode/scripts/run-full-consolidation.sh.bak

# Update the script to use the actual date instead of the placeholder
sed -i.bak 's/\$(date)/$(date +"%B %d, %Y")/g' ~/.roocode/scripts/run-full-consolidation.sh

# Remove the backup file
rm ~/.roocode/scripts/run-full-consolidation.sh.bak

echo "Script updated successfully!"