#!/bin/bash

# update-context.sh
# Updates the master context file with current session information

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Updating AI Sports Edge context...${NC}"

# Create .context directory if it doesn't exist
if [ ! -d ".context" ]; then
  mkdir -p .context
  echo -e "${YELLOW}Created .context directory${NC}"
fi

# Get current date and time
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Update timestamp in master context
if [ -f ".context/master-context.md" ]; then
  # Check if the timestamp line exists and update it, otherwise add it
  if grep -q "^## Last Updated:" ".context/master-context.md"; then
    sed -i "s/^## Last Updated:.*$/## Last Updated: $TIMESTAMP/" ".context/master-context.md"
  else
    # Add timestamp after the title
    sed -i "1a\\\n## Last Updated: $TIMESTAMP" ".context/master-context.md"
  fi
  
  # Update migration progress
  TOTAL_FILES=438
  MIGRATED_FILES=$(find . -name "*.atomic.ts" | wc -l)
  PERCENT_COMPLETE=$(( (MIGRATED_FILES * 100) / TOTAL_FILES ))
  
  if grep -q "^- Firebase atomic architecture migration:" ".context/master-context.md"; then
    sed -i "s/^- Firebase atomic architecture migration:.*$/- Firebase atomic architecture migration: $PERCENT_COMPLETE% complete ($MIGRATED_FILES\/$TOTAL_FILES files)/" ".context/master-context.md"
  fi
  
  # Update active files section based on open VSCode tabs
  # This is a placeholder - in a real implementation, you would need to get this information from VSCode
  
  echo -e "${GREEN}Master context updated successfully${NC}"
else
  echo -e "${YELLOW}Master context file not found. Creating a new one...${NC}"
  
  # Create a basic master context file
  cat > .context/master-context.md << EOF
# AI Sports Edge - Master Context

## Last Updated: $TIMESTAMP

## Project Overview
- React Native (Expo) app using atomic architecture
- Firebase and Stripe integration
- Deployed via SFTP to GoDaddy (aisportsedge.app)

## Current Migration Status
- Firebase atomic architecture migration: 10% complete (45/438 files)
- Currently migrating service files

## Active Tasks
- Firebase atomic architecture migration
- Continuous context system implementation

## Key Files
- services/firebaseService.ts
- services/firebaseSubscriptionService.ts
- services/firebaseMonitoringService.ts
- services/bettingAnalyticsService.ts

## Migration Progress Tracking
- Total files: 438
- Migrated: 45
- Remaining: 393

## Recent Changes
- Implemented atomic architecture for core Firebase services
- Created migration scripts for automated conversion
- Added monitoring services for Firebase operations

## Next Steps
- Continue Firebase service migration
- Implement additional atomic components
- Update documentation with new architecture patterns

## Notes
- Maintain backward compatibility during migration
- Follow atomic design principles (atoms, molecules, organisms)
- Preserve existing business logic while refactoring
EOF

  echo -e "${GREEN}New master context created successfully${NC}"
fi

echo -e "${BLUE}Context update complete${NC}"