#!/bin/bash

# detect-new-session.sh
# Checks if this is a new session and loads context if needed

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Detecting AI Sports Edge session status...${NC}"

# Create session tracking directory if it doesn't exist
if [ ! -d ".context/sessions" ]; then
  mkdir -p .context/sessions
  echo -e "${YELLOW}Created .context/sessions directory${NC}"
fi

# Get current date and time
CURRENT_DATE=$(date "+%Y-%m-%d")
CURRENT_TIME=$(date "+%H:%M:%S")
TIMESTAMP="$CURRENT_DATE $CURRENT_TIME"

# Check for today's session file
SESSION_FILE=".context/sessions/session_${CURRENT_DATE}.log"

# Function to load context
load_context() {
  echo -e "${YELLOW}Loading context for new session...${NC}"
  
  # Run the load-context script if it exists
  if [ -f "./load-context.sh" ]; then
    ./load-context.sh
  else
    echo -e "${RED}Error: load-context.sh not found.${NC}"
    return 1
  fi
  
  return 0
}

# Check if this is the first session of the day
if [ ! -f "$SESSION_FILE" ]; then
  echo -e "${GREEN}First session of the day detected.${NC}"
  
  # Create new session file
  echo "Session started: $TIMESTAMP" > "$SESSION_FILE"
  echo "Sessions today: 1" >> "$SESSION_FILE"
  
  # Take a snapshot of the context if it exists
  if [ -f ".context/master-context.md" ] && [ -f "./snapshot-context.sh" ]; then
    echo -e "${YELLOW}Creating session start snapshot...${NC}"
    ./snapshot-context.sh
  fi
  
  # Load context
  load_context
else
  # Read the number of sessions today
  SESSIONS_TODAY=$(grep "Sessions today:" "$SESSION_FILE" | awk '{print $3}')
  
  # Increment session count
  SESSIONS_TODAY=$((SESSIONS_TODAY + 1))
  
  # Update session file
  sed -i "s/Sessions today: [0-9]*/Sessions today: $SESSIONS_TODAY/" "$SESSION_FILE"
  echo "Session $SESSIONS_TODAY started: $TIMESTAMP" >> "$SESSION_FILE"
  
  echo -e "${GREEN}Session $SESSIONS_TODAY of the day detected.${NC}"
  
  # Check time since last session
  LAST_SESSION_TIME=$(grep "Session .* started:" "$SESSION_FILE" | tail -n 2 | head -n 1 | sed 's/.*started: [0-9-]* //' | sed 's/:.*//')
  CURRENT_HOUR=$(date "+%H")
  
  # If more than 2 hours have passed since the last session, load context
  if [ $((CURRENT_HOUR - LAST_SESSION_TIME)) -ge 2 ] || [ $((CURRENT_HOUR - LAST_SESSION_TIME)) -le -22 ]; then
    echo -e "${YELLOW}More than 2 hours since last session. Loading context...${NC}"
    load_context
  else
    echo -e "${GREEN}Recent session detected. Context loading skipped.${NC}"
  fi
fi

echo -e "${BLUE}Session detection complete${NC}"