#!/bin/bash
#
# start-cronrc.sh
#
# Starts the cronrc-runner.js script to execute recurring tasks defined in .cronrc
#
# Usage: ./scripts/start-cronrc.sh [--restart] [--status]
#

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRONRC_RUNNER="$PROJECT_DIR/scripts/cronrc-runner.js"
PID_FILE="$PROJECT_DIR/logs/cronrc/cronrc-runner.pid"
LOG_DIR="$PROJECT_DIR/logs/cronrc"
LOG_FILE="$LOG_DIR/cronrc-runner.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to check if cronrc-runner is already running
check_running() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      return 0 # Running
    else
      # PID file exists but process is not running
      rm -f "$PID_FILE"
    fi
  fi
  return 1 # Not running
}

# Function to start cronrc-runner
start_cronrc_runner() {
  echo -e "${BLUE}Starting cronrc-runner...${NC}"
  
  # Make sure the script is executable
  chmod +x "$CRONRC_RUNNER"
  
  # Check if .cronrc file exists
  if [ ! -f "$PROJECT_DIR/.cronrc" ]; then
    echo -e "${RED}Error: .cronrc file not found at $PROJECT_DIR/.cronrc${NC}"
    exit 1
  fi
  
  # Start the cronrc-runner in the background with nohup
  cd "$PROJECT_DIR" && nohup node "$CRONRC_RUNNER" > "$LOG_FILE" 2>&1 &
  
  # Save the PID
  echo $! > "$PID_FILE"
  
  # Verify it's running
  sleep 1
  if check_running; then
    echo -e "${GREEN}cronrc-runner started successfully with PID $(cat "$PID_FILE")${NC}"
    echo -e "${BLUE}Log file: $LOG_FILE${NC}"
  else
    echo -e "${RED}Failed to start cronrc-runner${NC}"
    exit 1
  fi
}

# Function to stop cronrc-runner
stop_cronrc_runner() {
  echo -e "${BLUE}Stopping cronrc-runner...${NC}"
  
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      kill "$PID"
      sleep 1
      if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Process did not terminate gracefully, forcing...${NC}"
        kill -9 "$PID" 2>/dev/null
      fi
      rm -f "$PID_FILE"
      echo -e "${GREEN}cronrc-runner stopped${NC}"
    else
      echo -e "${YELLOW}PID file exists but process is not running${NC}"
      rm -f "$PID_FILE"
    fi
  else
    echo -e "${YELLOW}cronrc-runner is not running${NC}"
  fi
}

# Function to show status
show_status() {
  if check_running; then
    PID=$(cat "$PID_FILE")
    UPTIME=$(ps -o etime= -p "$PID")
    echo -e "${GREEN}cronrc-runner is running with PID $PID${NC}"
    echo -e "${BLUE}Uptime: $UPTIME${NC}"
    echo -e "${BLUE}Log file: $LOG_FILE${NC}"
    
    # Show the last 5 lines of the log file
    if [ -f "$LOG_FILE" ]; then
      echo -e "${BLUE}Recent logs:${NC}"
      tail -n 5 "$LOG_FILE"
    fi
    
    # Show active tasks
    echo -e "${BLUE}Active tasks from .cronrc:${NC}"
    grep -v "^#" "$PROJECT_DIR/.cronrc" | grep -v "^$" | while read -r line; do
      echo -e "  ${YELLOW}$line${NC}"
    done
  else
    echo -e "${YELLOW}cronrc-runner is not running${NC}"
  fi
}

# Parse command line arguments
RESTART=false
SHOW_STATUS=false

for arg in "$@"; do
  case $arg in
    --restart)
      RESTART=true
      ;;
    --status)
      SHOW_STATUS=true
      ;;
    --help)
      echo "Usage: $0 [--restart] [--status]"
      echo ""
      echo "Options:"
      echo "  --restart    Restart the cronrc-runner if it's already running"
      echo "  --status     Show the status of the cronrc-runner"
      echo "  --help       Show this help message"
      exit 0
      ;;
  esac
done

# Main logic
if [ "$SHOW_STATUS" = true ]; then
  show_status
  exit 0
fi

if check_running; then
  if [ "$RESTART" = true ]; then
    echo -e "${YELLOW}cronrc-runner is already running, restarting...${NC}"
    stop_cronrc_runner
    start_cronrc_runner
  else
    echo -e "${YELLOW}cronrc-runner is already running with PID $(cat "$PID_FILE")${NC}"
    echo -e "${YELLOW}Use --restart to restart it or --status to see more details${NC}"
    exit 0
  fi
else
  start_cronrc_runner
fi

# Final message
cat << EOF

${GREEN}========================================================${NC}
${GREEN}  cronrc-runner Setup Complete!                         ${NC}
${GREEN}========================================================${NC}

${BLUE}The cronrc-runner is now running in the background and will execute${NC}
${BLUE}tasks defined in .cronrc at their specified intervals.${NC}

${YELLOW}To check status:${NC}
./scripts/start-cronrc.sh --status

${YELLOW}To restart:${NC}
./scripts/start-cronrc.sh --restart

${YELLOW}To stop:${NC}
kill $(cat "$PID_FILE" 2>/dev/null)

${YELLOW}To view logs:${NC}
tail -f $LOG_FILE

EOF

# Add to .bashrc to start on container startup if not already added
if ! grep -q "start-cronrc.sh" ~/.bashrc; then
  echo -e "${BLUE}Adding cronrc-runner startup to .bashrc...${NC}"
  echo "" >> ~/.bashrc
  echo "# Start cronrc-runner on container startup" >> ~/.bashrc
  echo "if [ -f \"$PROJECT_DIR/scripts/start-cronrc.sh\" ]; then" >> ~/.bashrc
  echo "  $PROJECT_DIR/scripts/start-cronrc.sh > /dev/null 2>&1" >> ~/.bashrc
  echo "fi" >> ~/.bashrc
  echo -e "${GREEN}Added cronrc-runner startup to .bashrc${NC}"
fi